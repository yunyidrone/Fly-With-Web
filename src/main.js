import { createApp } from "vue";
import "./style.css";
import App from "./App.vue";
import router from "./router";
import ElementPlus from "element-plus";
import "element-plus/dist/index.css";
import "@/styles/element-plus-scale.css";
import "@/styles/video-fullscreen.scss";
import "@backend/styles/integration.scss";
import "@/styles/element-plus-switch.css";
import * as ElementPlusIconsVue from "@element-plus/icons-vue";
import zhCn from "element-plus/es/locale/lang/zh-cn";
import "remixicon/fonts/remixicon.css";
import { createPinia } from "pinia";

// 引入pinia插件
import piniaPluginPersistedstate from "pinia-plugin-persistedstate";
import { setupPermissionDirective } from "@/directives/permission.js";
import { startAppVersionChecker } from "@/utils/app-version.js";
import { syncAppRemRoot } from "@/utils/app-rem-root.js";

const app = createApp(App);

const pinia = createPinia();
pinia.use(piniaPluginPersistedstate);

app.use(pinia);
app.use(router);

router.afterEach((to) => {
  syncAppRemRoot(to.path);
});

router.isReady().then(() => {
  syncAppRemRoot(router.currentRoute.value.path);
});
app.use(ElementPlus, {
  locale: zhCn,
});
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component);
}

setupPermissionDirective(app);

app.mount("#app");
startAppVersionChecker();
