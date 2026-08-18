import { defineConfig, loadEnv } from "vite";
import vue from "@vitejs/plugin-vue";
import cesium from "vite-plugin-cesium";
import { resolve } from "path";
import AutoImport from "unplugin-auto-import/vite";
import Components from "unplugin-vue-components/vite";
import { ElementPlusResolver } from "unplugin-vue-components/resolvers";

function appVersionPlugin(version) {
  return {
    name: "app-version",
    generateBundle() {
      this.emitFile({
        type: "asset",
        fileName: "version.json",
        source: `${JSON.stringify({ version }, null, 2)}\n`,
      });
    },
  };
}

export default defineConfig(({ mode, command }) => {
  const env = loadEnv(mode, process.cwd(), "VITE_");
  const apiBase = env.VITE_API_BASE_URL || "";
  const proxyTarget = /^https?:\/\//i.test(apiBase)
    ? new URL(apiBase).origin
    : "http://220.185.228.104:19949";

  const isBuild = command === "build";
  const appVersion = env.VITE_APP_VERSION || new Date().toISOString();

  return {
    esbuild: {
      // 仅 vite build 时移除 console；dev / preview 源里仍可正常打日志
      drop: isBuild ? ["console", "debugger"] : [],
    },
    plugins: [
      vue(),
      cesium(),
      appVersionPlugin(appVersion),
      AutoImport({
        resolvers: [ElementPlusResolver()],
        imports: ["vue", "vue-router", "pinia"],
        dts: false,
      }),
      Components({
        resolvers: [ElementPlusResolver()],
        dts: false,
      }),
    ],
    define: {
      // 解决 mqtt.js 在浏览器端报错 "process is not defined"
      "process.env": {},
      __APP_VERSION__: JSON.stringify(appVersion),
    },
    resolve: {
      alias: {
        "@": resolve(__dirname, "./src"),
        "@backend": resolve(__dirname, "./src/backend-admin"),
        "@zip.js/zip.js/lib/zip-no-worker.js": resolve(__dirname, "node_modules/@zip.js/zip.js/dist/zip.js"),
        "@zip.js/zip.js": resolve(__dirname, "node_modules/@zip.js/zip.js"),
      },
    },
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: (source, filename) => {
            if (filename.includes("/src/backend-admin/") || filename.includes("\\src\\backend-admin\\")) {
              return `@use "@backend/styles/variables.scss" as *;\n${source}`;
            }
            return source;
          },
        },
      },
    },
    optimizeDeps: {
      exclude: ["@zip.js/zip.js"],
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            "vue-vendor": ["vue", "vue-router", "pinia", "pinia-plugin-persistedstate"],
            "element-plus": ["element-plus", "@element-plus/icons-vue"],
            "map-maplibre": ["maplibre-gl"],
            "mqtt": ["mqtt"],
            "utils": ["axios", "axios-retry", "lodash-es", "crypto-js"],
          },
        },
      },
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
        "/robot-video-api": {
          target: "https://api.xingshu-tech.com",
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/robot-video-api/, "/v1"),
        },
      },
    },
  };
});
