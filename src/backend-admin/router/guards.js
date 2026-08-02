import { useAuthStore } from "@/stores/auth.js";
import { useMenuStore } from "@backend/stores/menu.js";
import { hasRole, isGrassrootsOrgUser } from "@/utils/permission.js";
import { appConfig } from "@backend/config/network.js";
import { BACKEND_BASE } from "@backend/router/routes.js";
import {
  buildMenuTitleRoutePathMap,
  findFirstAccessibleMenuPath,
  resolveMenuPath,
} from "@backend/utils/menu.js";
import { redirectIfMustChangePassword } from "@/utils/force-change-password-guard.js";

const BACKEND_LOGIN_PATH = `${BACKEND_BASE}/login`;
const BACKEND_FORBIDDEN_PATH = `${BACKEND_BASE}/403`;
const BACKEND_MONITOR_PATH = `${BACKEND_BASE}/monitor`;
const BACKEND_ACCOUNT_PATH = `${BACKEND_BASE}/account`;
const SHARED_LOGIN_PATH = "/login";

/** 无需登录即可访问 */
const whiteList = [BACKEND_LOGIN_PATH, BACKEND_FORBIDDEN_PATH];

/** 登录即可访问，跳过菜单 / 角色校验 */
const authPassList = [BACKEND_ACCOUNT_PATH];

function isBackendLandingPath(path) {
  return (
    path === BACKEND_BASE ||
    path === `${BACKEND_BASE}/` ||
    path === BACKEND_MONITOR_PATH
  );
}

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

  function canAccessByActiveMenu(menuTree, to) {
    const activeMenu = String(to.meta?.activeMenu || "").trim();
    if (!activeMenu) return false;
    return canAccessByBackendMenu(menuTree, activeMenu);
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
      if (to.path === BACKEND_LOGIN_PATH && authStore.isLoggedIn) {
        if (redirectIfMustChangePassword(authStore, to, next)) {
          return;
        }
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

    if (!authStore.user || authStore.user.firstLogin == null) {
      try {
        await authStore.fetchProfile({ force: true });
      } catch {
        authStore.resetAuth();
        next({ path: SHARED_LOGIN_PATH, query: { redirect: to.fullPath } });
        return;
      }
    }

    // 未改初始密码时，手动改地址栏进后台也会被拦回
    if (redirectIfMustChangePassword(authStore, to, next)) {
      return;
    }

    // 个人中心等：登录即可进，不校验菜单 / 角色
    if (authPassList.includes(to.path)) {
      next();
      return;
    }

    try {
      await menuStore.loadMenu();
    } catch {
      // 菜单拉取失败时继续走静态角色守卫
    }

    const titleRoutePathMap = buildMenuTitleRoutePathMap(router.getRoutes());
    const hasMenuTree = Array.isArray(menuStore.tree) && menuStore.tree.length > 0;
    const menuGranted =
      hasMenuTree &&
      (canAccessByBackendMenu(menuStore.tree, to.path) || canAccessByActiveMenu(menuStore.tree, to));

    // 联调约定：有后端菜单时优先按菜单授权，不再死磕前端 meta.roles
    if (hasMenuTree) {
      if (menuGranted) {
        if (to.meta?.hideForGrassroots && isGrassrootsOrgUser(authStore.user)) {
          next({ path: BACKEND_FORBIDDEN_PATH });
          return;
        }
        next();
        return;
      }

      // 默认进监控中心但菜单里没有该项 → 落到第一个有权限的菜单
      if (isBackendLandingPath(to.path)) {
        const firstPath = findFirstAccessibleMenuPath(menuStore.tree, titleRoutePathMap);
        if (firstPath && firstPath !== to.path) {
          next({ path: firstPath, replace: true });
          return;
        }
      }

      next({ path: BACKEND_FORBIDDEN_PATH });
      return;
    }

    const roles = to.meta?.roles;
    if (roles && !hasRole(roles, authStore.role)) {
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
