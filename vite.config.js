import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import cesium from "vite-plugin-cesium";
import { resolve } from "path";
import AutoImport from "unplugin-auto-import/vite";
import Components from "unplugin-vue-components/vite";
import { ElementPlusResolver } from "unplugin-vue-components/resolvers";

export default defineConfig({
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
  },
});
