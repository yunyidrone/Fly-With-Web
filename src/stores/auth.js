import { defineStore } from "pinia";
import { login as loginApi, logout as logoutApi, fetchMe } from "@/api/auth.js";
import { setToken, clearToken, getToken } from "@/utils/auth-token.js";
import { ROLES } from "@/config/constants.js";
import { isSuperAdmin } from "@/utils/permission.js";

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
      const data = await loginApi(form);
      this.token = data.token;
      this.user = data.user;
      setToken(data.token);
      if (!isSuperAdmin(data.user?.role)) {
        this.currentOrgId = data.user.orgId;
      } else {
        this.currentOrgId = "all";
      }
    },

    async fetchProfile() {
      if (!this.token) return;
      this.user = await fetchMe();
    },

    async logout() {
      try {
        await logoutApi();
      } catch {
        // 登出接口失败也清理本地态
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
