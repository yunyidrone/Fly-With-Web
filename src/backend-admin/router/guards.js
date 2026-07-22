import { useAuthStore } from "@/stores/auth.js";
import { useMenuStore } from "@backend/stores/menu.js";
import { hasRole, isGrassrootsOrgUser } from "@/utils/permission.js";
import { appConfig } from "@backend/config/network.js";
import { BACKEND_BASE } from "@backend/router/routes.js";
import { buildMenuTitleRoutePathMap, resolveMenuPath } from "@backend/utils/menu.js";

const BACKEND_LOGIN_PATH = `${BACKEND_BASE}/login`;
const BACKEND_FORBIDDEN_PATH = `${BACKEND_BASE}/403`;
const BACKEND_MONITOR_PATH = `${BACKEND_BASE}/monitor`;
const SHARED_LOGIN_PATH = "/login";

const whiteList = [BACKEND_LOGIN_PATH, BACKEND_FORBIDDEN_PATH];

export function setupBackendRouterGuards(router) {
  function canAccessByBackendMenu(menuTree, fullPath) {
    const titleRoutePathMap = buildMenuTitleRoutePathMap(router.getRoutes());
    const targetPath = String(fullPath || "");

    /** @param {Array<any>} nodes */
    function walk(nodes) {
      for (const node of nodes || []) {
        const menuPath = resolveMenuPath(node, titleRoutePathMap);
        if (
          menuPath === targetPath ||
          (menuPath !== BACKEND_BASE && targetPath.startsWith(`${menuPath}/`))
        ) {
          return true;
        }
        if (Array.isArray(node?.children) && node.children.length) {
          if (walk(node.children)) return true;
        }
      }
      return false;
    }

    return walk(menuTree);
  }

  router.beforeEach(async (to, from, next) => {
    const isBackendRoute = to.path.startsWith(BACKEND_BASE);
    if (!isBackendRoute) {
      next();
      return;
    }

    document.title = to.meta?.title
      ? `${to.meta.title} - ${appConfig.title}`
      : appConfig.title;

    const authStore = useAuthStore();
    const menuStore = useMenuStore();
    const requiresAuth = to.meta?.requiresAuth !== false;

    if (appConfig.skipAuth) {
      next();
      return;
    }

    if (!requiresAuth) {
      if ((to.path === BACKEND_LOGIN_PATH || to.path === "/login2") && authStore.isLoggedIn) {
        next({ path: BACKEND_MONITOR_PATH });
        return;
      }
      next();
      return;
    }

    if (!authStore.isLoggedIn) {
      next({ path: SHARED_LOGIN_PATH, query: { redirect: to.fullPath } });
      return;
    }

    if (!authStore.user) {
      try {
        await authStore.fetchProfile();
      } catch {
        authStore.resetAuth();
        next({ path: SHARED_LOGIN_PATH, query: { redirect: to.fullPath } });
        return;
      }
    }

    // 联调阶段：优先以后端菜单树作为访问授权依据
    if (!menuStore.loaded) {
      try {
        await menuStore.loadMenu();
      } catch {
        // 忽略菜单拉取失败，继续走静态角色守卫
      }
    }

    const roles = to.meta?.roles;
    if (roles && !hasRole(roles, authStore.role)) {
      if (canAccessByBackendMenu(menuStore.tree, to.path)) {
        next();
        return;
      }
      next({ path: BACKEND_FORBIDDEN_PATH });
      return;
    }

    if (to.meta?.hideForGrassroots && isGrassrootsOrgUser(authStore.user)) {
      next({ path: BACKEND_FORBIDDEN_PATH });
      return;
    }

    next();
  });
}

export { whiteList };
