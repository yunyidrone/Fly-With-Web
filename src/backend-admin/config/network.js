import { resolveApiBaseURL } from "@/config/resolve-api-base-url.js";

export const networkConfig = {
  baseURL: resolveApiBaseURL({ preferBackendEnv: true }),
  contentType: "application/json;charset=utf-8",
  requestTimeout: 60000,
  successCode: 2000,
  unauthorizedCode: 5001,
  noPermissionCode: 4030,
  throttleTime: 300,
};

export const appConfig = {
  title: import.meta.env.VITE_BACKEND_APP_TITLE || "伴飞后台管理",
  useMock: import.meta.env.VITE_BACKEND_USE_MOCK === "true",
  skipAuth: import.meta.env.VITE_BACKEND_SKIP_AUTH === "true",
};
