import { defineStore } from "pinia";
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

    async fetchProfile() {
      if (!this.token) return;
      if (this.user) return;
      this.user = {
        username: "用户",
        displayName: "用户",
        role: ROLES.SUPER_ADMIN,
      };
    },

    async logout() {
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
