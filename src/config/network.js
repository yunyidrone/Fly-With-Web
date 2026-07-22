/*
 * @Author: ml
 * @Date: 2026-03-13 10:03:41
 * @LastEditTime: 2026-03-13 14:00:44
 * @FilePath: /accompanying-fly-project/src/config/network.js
 * @Description: 网络配置（axios baseURL：优先环境变量直连后端；未配置时为 /api）
 */

/** @returns {string} */
function resolveApiBaseURL() {
  // 本地 dev server 走 Vite 代理，避免跨域
  if (import.meta.env.DEV) return "/api/fly";
  const raw = import.meta.env.VITE_API_BASE_URL?.trim?.();
  if (!raw) return "/api";
  if (/^https?:\/\//i.test(raw)) return raw;
  return `http://${raw}`;
}

/** 账号权限服务前缀：/api/auth（与业务 /api/fly 分离） */
function resolveAuthBaseURL() {
  const raw = import.meta.env.VITE_AUTH_BASE_URL?.trim?.();
  if (raw) {
    if (/^https?:\/\//i.test(raw)) return raw.replace(/\/$/, "");
    return `http://${raw.replace(/\/$/, "")}`;
  }
  if (import.meta.env.DEV) return "/api/auth";
  const apiBase = resolveApiBaseURL();
  if (/\/api\/fly\/?$/i.test(apiBase)) return apiBase.replace(/\/api\/fly\/?$/i, "/api/auth");
  if (/\/api\/?$/i.test(apiBase)) return `${apiBase.replace(/\/$/, "")}/auth`;
  return "/api/auth";
}

export const networkConfig = {
  baseURL: resolveApiBaseURL(),
  authBaseURL: resolveAuthBaseURL(),
  loginAesSecret: import.meta.env.VITE_LOGIN_AES_SECRET || "hyG/mAukdHOEBWPH3SFNfg==",
  loginAesKeyFormat: import.meta.env.VITE_LOGIN_AES_KEY_FORMAT || "base64",
  loginAesMode: import.meta.env.VITE_LOGIN_AES_MODE || "ECB",
  loginAesPadding: import.meta.env.VITE_LOGIN_AES_PADDING || "Pkcs7",
  loginAesIv: import.meta.env.VITE_LOGIN_AES_IV || "",
  loginAesIvFormat: import.meta.env.VITE_LOGIN_AES_IV_FORMAT || "utf8",
  loginAesOutputFormat: import.meta.env.VITE_LOGIN_AES_OUTPUT_FORMAT || "hex",
  loginAesKeySource: import.meta.env.VITE_LOGIN_AES_KEY_SOURCE || "raw",
  contentType: "application/json;charset=utf-8",
  requestTimeout: 300000, // 最长请求时间
  successCode: 2000, // 正常code
  unauthorizedCode: 4010,
  noPermissionCode: -1, // 无权限code
  throttleTime: 1000, // 节流时长
  useMock:
    import.meta.env.VITE_USE_MOCK === "true" || import.meta.env.VITE_BACKEND_USE_MOCK === "true",
};
