import { defineStore } from "pinia";
import * as authApi from "@/api/auth.js";
import { networkConfig } from "@/config/network.js";
import { ROLES } from "@/config/constants.js";
import { isSuperAdmin } from "@/utils/permission.js";
import { setToken, clearToken, getToken } from "@/utils/auth-token.js";
import { extractLoginPayload } from "@/utils/auth-user.js";
import { encryptLoginPassword } from "@/utils/login-crypto.js";

export const useAuthStore = defineStore("auth", {
  state: () => ({
    token: getToken(),
    user: null,
    /** 超管视角切换：'all' 表示全所 */
    currentOrgId: "all",
  }),

  getters: {
    isLoggedIn: (state) => Boolean(state.token),
    role: (state) => state.user?.role || "",
    orgId: (state) => state.user?.orgId ?? null,
    displayName: (state) => state.user?.displayName || state.user?.username || "",
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

      const fallbackUser = {
        username: userName,
        displayName: userName || "用户",
        role: ROLES.ORG_VIEWER,
      };

      if (user?.username || user?.role) {
        this.user = user;
      } else {
        this.user = fallbackUser;
        try {
          await this.fetchProfile({ force: true });
        } catch {
          // /auth/me 失败时保留兜底用户，避免登录后路由守卫阻塞跳转
        }
      }

      if (this.isSuperAdmin) {
        this.currentOrgId = "all";
      } else if (this.user?.orgId != null) {
        this.currentOrgId = this.user.orgId;
      }
    },

    async loginWithMock(form) {
      const username = String(form?.username ?? "").trim();
      const token = `local-${username || "user"}-${Date.now()}`;
      const user = {
        username,
        displayName: username,
        role: ROLES.SUPER_ADMIN,
      };
      this.token = token;
      this.user = user;
      setToken(token);
      this.currentOrgId = "all";
    },

    async fetchProfile(options = {}) {
      if (!this.token) return;
      if (!options.force && this.user) return this.user;

      if (networkConfig.useMock) {
        this.user = {
          username: "用户",
          displayName: "用户",
          role: ROLES.SUPER_ADMIN,
        };
        return this.user;
      }

      // 当前后端未提供 /auth/me，先使用本地兜底用户以保证登录态与路由可用。
      if (!this.user) {
        this.user = {
          username: "用户",
          displayName: "用户",
          role: ROLES.ORG_VIEWER,
        };
      }
      return this.user;
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
      clearToken();
    },

    setCurrentOrgId(orgId) {
      if (!this.isSuperAdmin) return;
      this.currentOrgId = orgId ?? "all";
    },
  },

  persist: {
    key: "admin-auth",
    paths: ["token", "user", "currentOrgId"],
  },
});

export { ROLES };
