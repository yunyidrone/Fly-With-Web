/*
 * @Author: ml
 * @Date: 2026-01-12 14:42:21
 * @LastEditTime: 2026-01-12 14:52:42
 * @FilePath: /accompanying-fly-project/src/router/index.js
 * @Description:route config
 */
import { createWebHashHistory, createRouter } from "vue-router";

import HomeView from "../views/home-view/index.vue";

const routes = [{ path: "/", component: HomeView }];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

export default router;
