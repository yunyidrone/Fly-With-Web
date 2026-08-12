import { useAuthStore, FORCE_CHANGE_PASSWORD_PATH } from "@/stores/auth.js";
import { redirectIfMustChangePassword } from "@/utils/force-change-password-guard.js";
import {
  clearAuthSessionExpired,
  isAuthSessionExpired,
} from "@/utils/handle-api-unauthorized.js";

const LOGIN_PATH = "/login";
const FRONTEND_APP_TITLE = "伴飞";
const whiteList = [LOGIN_PATH];

function updateFrontendDocumentTitle(to) {
  document.title = to.meta?.title
    ? `${to.meta.title} - ${FRONTEND_APP_TITLE}`
    : FRONTEND_APP_TITLE;
}

export function setupFrontendRouterGuards(router) {
  router.beforeEach(async (to, from, next) => {
    const authStore = useAuthStore();

    // 未改初始密码时，任意手动改地址都拦回强制改密页（含 /backend）
    // 刷新页面时 token 仍在 localStorage，但 user 不持久化，需重新拉取 /auth/info
    if (authStore.isLoggedIn) {
      if (!authStore.user || authStore.user.firstLogin == null) {
        try {
          await authStore.fetchProfile({ force: true });
        } catch {
          // 信息拉取失败时，后续按现有登录校验处理
        }
      }
      if (redirectIfMustChangePassword(authStore, to, next)) {
        return;
      }
    }

    const isBackendRoute = to.path.startsWith("/backend");
    if (isBackendRoute) {
      next();
      return;
    }

    updateFrontendDocumentTitle(to);

    if (whiteList.includes(to.path)) {
      if (authStore.isLoggedIn && !isAuthSessionExpired()) {
        next({ path: "/" });
        return;
      }
      clearAuthSessionExpired();
      next();
      return;
    }

    if (to.path === FORCE_CHANGE_PASSWORD_PATH) {
      if (!authStore.isLoggedIn) {
        next({ path: LOGIN_PATH });
        return;
      }
      next();
      return;
    }

    if (!authStore.isLoggedIn) {
      next({ path: LOGIN_PATH, query: { redirect: to.fullPath } });
      return;
    }

    if (!authStore.user) {
      try {
        await authStore.fetchProfile({ force: true });
      } catch {
        authStore.resetAuth();
        next({ path: LOGIN_PATH, query: { redirect: to.fullPath } });
        return;
      }
      if (!authStore.user) {
        authStore.resetAuth();
        next({ path: LOGIN_PATH, query: { redirect: to.fullPath } });
        return;
      }
    }

    next();
  });
}

export { whiteList };
