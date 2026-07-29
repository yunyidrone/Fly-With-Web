import { defineStore } from "pinia";
import * as authApi from "@/api/auth.js";
import { networkConfig } from "@/config/network.js";
import { ROLES } from "@/config/constants.js";
import { isSuperAdmin } from "@/utils/permission.js";
import { setToken, clearToken, getToken } from "@/utils/auth-token.js";
import { extractLoginPayload, normalizeAuthUser } from "@/utils/auth-user.js";
import { encryptLoginPassword } from "@/utils/login-crypto.js";

/** 强制改密独立页（不进入业务界面） */
export const FORCE_CHANGE_PASSWORD_PATH = "/force-change-password";

export const useAuthStore = defineStore("auth", {
  state: () => ({
    token: getToken(),
    user: null,
    /** 超管视角切换：'all' 表示全所 */
    currentOrgId: "all",
    /**
     * 登录后若需强制改密，临时保存明文原密码（仅内存，不持久化）
     * 用于改密接口 oldPassword，避免用户再次输入
     */
    pendingOldPassword: "",
  }),

  getters: {
    isLoggedIn: (state) => Boolean(state.token),
    role: (state) => state.user?.role || "",
    orgId: (state) => state.user?.orgId ?? null,
    orgName: (state) => state.user?.orgName || "",
    displayName: (state) =>
      state.user?.userName ||
      state.user?.username ||
      state.user?.displayName ||
      "",
    /** firstLogin：0 首次登录需强制改密；1 非首次登录 */
    mustChangePassword: (state) => Number(state.user?.firstLogin) === 0,
    isSuperAdmin: (state) => isSuperAdmin(state.user?.role),
    effectiveOrgId: (state) => {
      if (isSuperAdmin(state.user?.role)) {
        return state.currentOrgId === "all" ? null : state.currentOrgId;
      }
      return state.user?.orgId ?? null;
    },
  },

  actions: {
    async login(form) {
      if (networkConfig.useMock) {
        await this.loginWithMock(form);
        return;
      }

      const userName = String(form?.username ?? form?.userName ?? "").trim();
      const password = String(form?.password ?? "");
      const encryptedPassword = encryptLoginPassword(password, networkConfig.loginAesSecret, {
        keyFormat: networkConfig.loginAesKeyFormat,
        mode: networkConfig.loginAesMode,
        padding: networkConfig.loginAesPadding,
        iv: networkConfig.loginAesIv,
        ivFormat: networkConfig.loginAesIvFormat,
        outputFormat: networkConfig.loginAesOutputFormat,
        keySource: networkConfig.loginAesKeySource,
      });
      const data = await authApi.login({ userName, password: encryptedPassword });
      const { token, user } = extractLoginPayload(data);

      if (!token) {
        const shape = data && typeof data === "object" ? Object.keys(data).join(",") : typeof data;
        throw new Error(`登录响应缺少 token（响应字段：${shape || "unknown"}）`);
      }

      this.token = token;
      setToken(token);
      this.pendingOldPassword = "";

      // 登录换人后强制失效旧菜单，确保进后台会重新拉 /menu/list
      try {
        const { useMenuStore } = await import("@backend/stores/menu.js");
        useMenuStore().resetMenu();
      } catch {
        // ignore
      }

      const fallbackUser = {
        username: userName,
        userName,
        displayName: userName || "用户",
        role: ROLES.ORG_VIEWER,
        orgName: "",
        firstLogin: null,
      };

      this.user = user || fallbackUser;

      try {
        await this.fetchProfile({ force: true });
      } catch {
        // /auth/info 失败时保留登录兜底用户，避免登录后无法跳转
        if (!this.user) this.user = fallbackUser;
      }

      if (this.mustChangePassword) {
        this.pendingOldPassword = password;
      }

      if (this.isSuperAdmin) {
        this.currentOrgId = "all";
      } else if (this.user?.orgId != null) {
        this.currentOrgId = this.user.orgId;
      }
    },

    async loginWithMock(form) {
      const username = String(form?.username ?? "").trim();
      const password = String(form?.password ?? "");
      const token = `local-${username || "user"}-${Date.now()}`;
      const user = {
        username,
        userName: username,
        displayName: username,
        role: ROLES.SUPER_ADMIN,
        orgName: "演示单位",
        firstLogin: 1,
      };
      this.token = token;
      this.user = user;
      this.pendingOldPassword = "";
      setToken(token);
      this.currentOrgId = "all";
      if (this.mustChangePassword) {
        this.pendingOldPassword = password;
      }
    },

    async fetchProfile(options = {}) {
      if (!this.token) return;
      if (!options.force && this.user?.userName && this.user?.firstLogin != null) {
        return this.user;
      }

      if (networkConfig.useMock) {
        this.user = {
          username: "用户",
          userName: "用户",
          displayName: "用户",
          role: ROLES.SUPER_ADMIN,
          orgName: "演示单位",
          firstLogin: 1,
        };
        return this.user;
      }

      const data = await authApi.fetchUserInfo(options);
      const normalized = normalizeAuthUser(data);
      if (normalized) {
        this.user = {
          ...(this.user || {}),
          ...normalized,
        };
      } else if (!this.user) {
        this.user = {
          username: "用户",
          userName: "用户",
          displayName: "用户",
          role: ROLES.ORG_VIEWER,
          orgName: "",
          firstLogin: null,
        };
      }
      return this.user;
    },

    markPasswordReset() {
      if (!this.user) return;
      this.user = {
        ...this.user,
        firstLogin: 1,
      };
    },

    clearPendingOldPassword() {
      this.pendingOldPassword = "";
    },

    async logout() {
      if (!networkConfig.useMock && this.token) {
        try {
          await authApi.logout({ silent: true });
        } catch {
          // 退出登录失败时仍清理本地会话
        }
      }
      this.resetAuth();
    },

    resetAuth() {
      this.token = "";
      this.user = null;
      this.currentOrgId = "all";
      this.pendingOldPassword = "";
      clearToken();
      // 清会话时同步清菜单缓存，避免换账号沿用上一用户 loaded 状态而不再请求 /menu/list
      import("@backend/stores/menu.js")
        .then(({ useMenuStore }) => {
          useMenuStore().resetMenu();
        })
        .catch(() => {});
    },

    setCurrentOrgId(orgId) {
      if (!this.isSuperAdmin) return;
      this.currentOrgId = orgId ?? "all";
    },
  },

  persist: {
    key: "admin-auth",
    // 仅持久化 token 与超管单位视角；用户信息每次刷新后由路由守卫重新拉取 /auth/info
    paths: ["token", "currentOrgId"],
  },
});

export { ROLES };
