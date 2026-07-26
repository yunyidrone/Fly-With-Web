import { defineStore } from "pinia";
import { fetchMenuList } from "@backend/api/menu.js";
import { normalizeMenuTree } from "@backend/utils/menu.js";
import { useAuthStore } from "@/stores/auth.js";
import { appConfig } from "@backend/config/network.js";
import { getMenuTree } from "@backend/router/routes.js";
import { canAccessMenuRoute } from "@/utils/permission.js";
import { ROLES } from "@/config/constants.js";

const demoUser = { orgIsGrassroots: false };

/** @returns {import('@backend/api/menu.js').BackendMenuNode[]} */
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

function resolveMenuUserKey(authStore) {
  return String(
    authStore.user?.id ??
      authStore.user?.userName ??
      authStore.user?.username ??
      (authStore.token ? authStore.token.slice(0, 24) : "") ??
      "",
  );
}

export const useMenuStore = defineStore("backend-menu", {
  state: () => ({
    /** @type {import('@backend/api/menu.js').BackendMenuNode[]} */
    tree: [],
    loading: false,
    loaded: false,
    /** 菜单归属用户，切换账号时强制重拉 */
    loadedForUserKey: "",
    /** @type {Promise<void>|null} */
    loadPromise: null,
  }),

  actions: {
    async loadMenu(force = false) {
      const authStore = useAuthStore();
      const userKey = resolveMenuUserKey(authStore);

      if (!authStore.isLoggedIn && !appConfig.skipAuth) {
        this.resetMenu();
        return;
      }

      const sameUser = this.loadedForUserKey === userKey;
      if (this.loaded && sameUser && !force) return;
      if (this.loadPromise && sameUser && !force) return this.loadPromise;

      this.loadPromise = this._doLoadMenu(userKey);
      try {
        await this.loadPromise;
      } finally {
        this.loadPromise = null;
      }
    },

    async _doLoadMenu(userKey) {
      this.loading = true;
      try {
        if (appConfig.useMock) {
          this.tree = normalizeMenuTree(buildMockMenuTree());
          this.loaded = true;
          this.loadedForUserKey = userKey;
          return;
        }

        const authStore = useAuthStore();
        const data = await fetchMenuList({
          orgId: authStore.effectiveOrgId,
        });
        this.tree = normalizeMenuTree(data);
        this.loaded = true;
        this.loadedForUserKey = userKey;
      } finally {
        this.loading = false;
      }
    },

    resetMenu() {
      this.tree = [];
      this.loaded = false;
      this.loading = false;
      this.loadedForUserKey = "";
      this.loadPromise = null;
    },
  },
});
