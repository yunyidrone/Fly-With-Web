import { defineStore } from "pinia";

export const useAppStore = defineStore("backend-admin-app", {
  state: () => ({
    sidebarCollapsed: false,
  }),

  actions: {
    toggleSidebar() {
      this.sidebarCollapsed = !this.sidebarCollapsed;
    },
  },

  persist: {
    key: "backend-admin-app",
    paths: ["sidebarCollapsed"],
  },
});
