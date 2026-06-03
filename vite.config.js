import { defineConfig, loadEnv } from "vite";
import vue from "@vitejs/plugin-vue";
import cesium from "vite-plugin-cesium";
import { resolve } from "path";
import AutoImport from "unplugin-auto-import/vite";
import Components from "unplugin-vue-components/vite";
import { ElementPlusResolver } from "unplugin-vue-components/resolvers";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "VITE_");
  const apiBase = env.VITE_API_BASE_URL || "";
  const proxyTarget = /^https?:\/\//i.test(apiBase)
    ? new URL(apiBase).origin
    : "http://220.185.228.104:19949";

  return {
    plugins: [
      vue(),
      cesium(),
      AutoImport({
        resolvers: [ElementPlusResolver()],
      }),
      Components({
        resolvers: [ElementPlusResolver()],
      }),
    ],
    define: {
      // 解决 mqtt.js 在浏览器端报错 "process is not defined"
      "process.env": {},
    },
    resolve: {
      alias: {
        "@": resolve(__dirname, "./src"),
        "@zip.js/zip.js/lib/zip-no-worker.js": resolve(__dirname, "node_modules/@zip.js/zip.js/dist/zip.js"),
        "@zip.js/zip.js": resolve(__dirname, "node_modules/@zip.js/zip.js"),
      },
    },
    optimizeDeps: {
      exclude: ["@zip.js/zip.js"],
    },
    server: {
      host: "0.0.0.0",
      port: 5177,
      open: false,
      proxy: {
        "/api": {
          target: proxyTarget,
          changeOrigin: true,
        },
      },
    },
  };
});
