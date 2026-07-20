import { createRouter, createWebHistory } from "vue-router";
import { backendRoutes } from "@backend/router/routes.js";
import { setupBackendRouterGuards } from "@backend/router/guards.js";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: backendRoutes,
  scrollBehavior: () => ({ top: 0 }),
});

setupBackendRouterGuards(router);

export default router;
