import { defineConfig, loadEnv } from "vite";
import vue from "@vitejs/plugin-vue";
import cesium from "vite-plugin-cesium";
import { resolve } from "path";
import AutoImport from "unplugin-auto-import/vite";
import Components from "unplugin-vue-components/vite";
import { ElementPlusResolver } from "unplugin-vue-components/resolvers";

export default defineConfig(({ mode }) => {
  // 加载环境变量
  const env = loadEnv(mode, process.cwd(), "");
  
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
        target: env.VITE_API_BASE_URL || "http://localhost:8080/api",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
        ws: false,
        secure: false,
      },
    },
  },
  };
});
