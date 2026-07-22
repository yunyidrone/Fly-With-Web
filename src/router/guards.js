import { useAuthStore } from "@/stores/auth.js";

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
    const isBackendRoute = to.path.startsWith("/backend");
    if (isBackendRoute) {
      next();
      return;
    }

    updateFrontendDocumentTitle(to);

    const authStore = useAuthStore();

    if (whiteList.includes(to.path)) {
      if (authStore.isLoggedIn) {
        next({ path: "/" });
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
        await authStore.fetchProfile();
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
