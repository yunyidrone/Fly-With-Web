/**
 * 解析业务 API baseURL（前后台共用逻辑，差异通过 options 控制）
 * @param {{ devPath?: string, prodDefault?: string, preferBackendEnv?: boolean }} [options]
 * @returns {string}
 */
export function resolveApiBaseURL(options = {}) {
  const {
    devPath = "/api/fly",
    prodDefault = "/api/fly",
    preferBackendEnv = false,
  } = options;

  if (import.meta.env.DEV) return devPath;

  if (preferBackendEnv) {
    const backendRaw = import.meta.env.VITE_BACKEND_API_BASE_URL?.trim?.();
    if (backendRaw) {
      if (/^https?:\/\//i.test(backendRaw)) return backendRaw;
      return `http://${backendRaw}`;
    }
  }

  const raw = import.meta.env.VITE_API_BASE_URL?.trim?.();
  if (!raw) return prodDefault;
  if (/^https?:\/\//i.test(raw)) return raw;
  return `http://${raw}`;
}
