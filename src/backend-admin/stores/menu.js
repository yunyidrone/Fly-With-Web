import { defineStore } from "pinia";
import { fetchMenuList } from "@/api/auth.js";
import { normalizeMenuTree } from "@backend/utils/menu.js";
import { useAuthStore } from "@/stores/auth.js";
import { appConfig } from "@backend/config/network.js";
import { getMenuTree } from "@backend/router/routes.js";
import { canAccessMenuRoute } from "@/utils/permission.js";
import { ROLES } from "@/config/constants.js";

const demoUser = { orgIsGrassroots: false };

/** @returns {import('@/api/auth.js').BackendMenuNode[]} */
function buildMockMenuTree() {
  const staticTree = getMenuTree(
    appConfig.skipAuth ? ROLES.SUPER_ADMIN : ROLES.SUPER_ADMIN,
    demoUser,
    (item, role, user) => canAccessMenuRoute(item, role, user),
  );

  return staticTree.map((entry) => {
    if (entry.type === "group") {
      return {
        id: entry.key,
        menuName: entry.title,
        icon: entry.icon,
        menuType: 1,
        children: (entry.children || []).map((child) => ({
          id: child.route.path,
          menuName: child.route.meta?.title || child.route.path,
          path: child.route.path,
          menuType: 2,
          children: [],
        })),
      };
    }

    return {
      id: entry.route.path,
      menuName: entry.title || entry.route.meta?.title || entry.route.path,
      icon: entry.icon,
      path: entry.route.path,
      menuType: 2,
      children: [],
    };
  });
}

export const useMenuStore = defineStore("backend-menu", {
  state: () => ({
    /** @type {import('@/api/auth.js').BackendMenuNode[]} */
    tree: [],
    loading: false,
    loaded: false,
  }),

  actions: {
    async loadMenu(force = false) {
      if (this.loading) return;
      if (this.loaded && !force) return;

      const authStore = useAuthStore();
      if (!authStore.isLoggedIn && !appConfig.skipAuth) {
        this.resetMenu();
        return;
      }

      if (appConfig.useMock) {
        this.tree = normalizeMenuTree(buildMockMenuTree());
        this.loaded = true;
        return;
      }

      this.loading = true;
      try {
        const data = await fetchMenuList({
          orgId: authStore.effectiveOrgId,
        });
        // data.splice(1, 1)
        this.tree = normalizeMenuTree(data);
        this.loaded = true;
      } finally {
        this.loading = false;
      }
    },

    resetMenu() {
      this.tree = [];
      this.loaded = false;
      this.loading = false;
    },
  },
});
