import { useAuthStore } from "@/stores/auth.js";

const LOGIN_PATH = "/login";
const whiteList = [LOGIN_PATH];

export function setupFrontendRouterGuards(router) {
  router.beforeEach(async (to, from, next) => {
    const isBackendRoute = to.path.startsWith("/backend");
    if (isBackendRoute) {
      next();
      return;
    }

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
      await authStore.fetchProfile();
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
