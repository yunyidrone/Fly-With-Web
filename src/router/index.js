/*
 * @Author: ml
 * @Date: 2026-01-12 14:42:21
 * @LastEditTime: 2026-01-12 14:52:42
 * @FilePath: /accompanying-fly-project/src/router/index.js
 * @Description:route config
 */
import { createWebHashHistory, createRouter } from "vue-router";
import { backendRoutes } from "@backend/router/routes.js";
import { setupBackendRouterGuards } from "@backend/router/guards.js";

import HomeView from "../views/home-view/index.vue";
import LoginView from "../views/login/index.vue";

const routes = [
  { path: "/", component: HomeView },
  { path: "/login", component: LoginView },
  ...backendRoutes,
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

setupBackendRouterGuards(router);

export default router;
