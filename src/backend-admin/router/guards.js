import { useAuthStore } from "@backend/stores/auth.js";
import { hasRole, isGrassrootsOrgUser } from "@backend/utils/permission.js";
import { appConfig } from "@backend/config/network.js";
import { BACKEND_BASE } from "@backend/router/routes.js";

const BACKEND_LOGIN_PATH = `${BACKEND_BASE}/login`;
const BACKEND_FORBIDDEN_PATH = `${BACKEND_BASE}/403`;
const BACKEND_MONITOR_PATH = `${BACKEND_BASE}/monitor`;
const SHARED_LOGIN_PATH = "/login";

const whiteList = [BACKEND_LOGIN_PATH, BACKEND_FORBIDDEN_PATH];

export function setupBackendRouterGuards(router) {
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
