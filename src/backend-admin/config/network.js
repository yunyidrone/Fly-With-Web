/** @returns {string} */
function resolveApiBaseURL() {
  const backendRaw = import.meta.env.VITE_BACKEND_API_BASE_URL?.trim?.();
  if (backendRaw) {
    if (/^https?:\/\//i.test(backendRaw)) return backendRaw;
    return `http://${backendRaw}`;
  }

  if (import.meta.env.DEV && import.meta.env.VITE_BACKEND_USE_MOCK === "true") {
    return "/api/fly";
  }
  if (import.meta.env.DEV) return "/api/fly";
  const raw = import.meta.env.VITE_API_BASE_URL?.trim?.();
  if (!raw) return "/api/fly";
  if (/^https?:\/\//i.test(raw)) return raw;
  return `http://${raw}`;
}

export const networkConfig = {
  baseURL: resolveApiBaseURL(),
  contentType: "application/json;charset=utf-8",
  requestTimeout: 60000,
  successCode: 2000,
  unauthorizedCode: 4010,
  noPermissionCode: 4030,
  throttleTime: 1000,
};

export const appConfig = {
  title: import.meta.env.VITE_BACKEND_APP_TITLE || "伴飞后台管理",
  useMock: import.meta.env.VITE_BACKEND_USE_MOCK === "true",
  skipAuth: import.meta.env.VITE_BACKEND_SKIP_AUTH === "true",
};
