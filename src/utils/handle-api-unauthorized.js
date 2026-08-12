import { ElMessage } from "element-plus";
import appRouter from "@/router";
import { clearToken } from "@/utils/auth-token.js";
import { useAuthStore } from "@/stores/auth.js";

export const LOGIN_PATH = "/login";

/** 登录过期默认提示（与后端 code 5001 约定一致） */
export const LOGIN_EXPIRED_MESSAGE = "登录过期";

let redirectingToLogin = false;
let authSessionExpired = false;

/**
 * 标记当前会话已失效（供路由守卫优先跳登录，避免误进 403）
 */
export function markAuthSessionExpired() {
  authSessionExpired = true;
}

export function isAuthSessionExpired() {
  return authSessionExpired;
}

export function clearAuthSessionExpired() {
  authSessionExpired = false;
}

/**
 * 规范化接口 body（兼容字符串 JSON）
 * @param {unknown} data
 * @returns {Record<string, unknown> | null}
 */
export function normalizeApiPayload(data) {
  if (data == null) return null;

  if (typeof data === "string") {
    const trimmed = data.trim();
    if (!trimmed) return null;
    try {
      return normalizeApiPayload(JSON.parse(trimmed));
    } catch {
      return null;
    }
  }

  if (typeof data !== "object" || Array.isArray(data)) {
    return null;
  }

  return /** @type {Record<string, unknown>} */ (data);
}

/**
 * 判断是否为登录失效类业务响应
 * @param {unknown} payload
 * @param {number} unauthorizedCode
 */
export function isApiUnauthorized(payload, unauthorizedCode) {
  const body = normalizeApiPayload(payload);
  if (!body) return false;
  return Number(body.code) === Number(unauthorizedCode);
}

/**
 * @param {Record<string, unknown>} payload
 */
export function getApiErrorMessage(payload) {
  const msg = payload.msg ?? payload.message;
  return typeof msg === "string" && msg.trim() ? msg.trim() : LOGIN_EXPIRED_MESSAGE;
}

function buildLoginHash(loginPath, redirectFullPath) {
  const query = redirectFullPath ? `?redirect=${encodeURIComponent(redirectFullPath)}` : "";
  return `#${loginPath}${query}`;
}

function redirectToLogin(loginPath, redirectFullPath) {
  if (redirectingToLogin) return;

  const currentPath = appRouter?.currentRoute?.value?.path ?? "";
  if (currentPath === loginPath) return;

  redirectingToLogin = true;
  markAuthSessionExpired();

  const loginHash = buildLoginHash(loginPath, redirectFullPath);
  const loginUrl = `${window.location.pathname}${window.location.search}${loginHash}`;

  // 后台路由守卫可能与 router.push 竞态并落到 /backend/403，会话失效时强制整页跳转
  if (currentPath.startsWith("/backend")) {
    window.location.replace(loginUrl);
    return;
  }

  const query = redirectFullPath ? { redirect: redirectFullPath } : {};
  try {
    if (appRouter?.replace) {
      appRouter
        .replace({ path: loginPath, query })
        .catch(() => {
          window.location.replace(loginUrl);
        })
        .finally(() => {
          redirectingToLogin = false;
        });
      return;
    }
  } catch {
    // 循环依赖等导致 router 不可用时走 hash 兜底
  }

  window.location.replace(loginUrl);
}

/**
 * 统一处理登录失效：清 token、重置登录态、跳转登录页
 * @param {unknown} payload
 * @param {{ silent?: boolean, skipAuth?: boolean, loginPath?: string, unauthorizedCode?: number }} [options]
 * @returns {boolean} 是否已按登录失效处理
 */
export function handleApiUnauthorized(payload, options = {}) {
  const {
    silent = false,
    skipAuth = false,
    loginPath = LOGIN_PATH,
    unauthorizedCode,
  } = options;

  const body = normalizeApiPayload(payload);
  if (skipAuth || !body || !isApiUnauthorized(body, unauthorizedCode)) {
    return false;
  }

  const errorMsg = getApiErrorMessage(body);

  clearToken();
  try {
    useAuthStore().resetAuth();
  } catch {
    // pinia 未初始化时忽略
  }

  const redirectFullPath = appRouter?.currentRoute?.value?.fullPath;
  redirectToLogin(loginPath, redirectFullPath);

  if (!silent) {
    ElMessage.warning(errorMsg);
  }

  return true;
}

/**
 * 从 axios 成功响应中尝试处理登录失效
 * @param {import('axios').AxiosResponse} response
 * @param {Parameters<typeof handleApiUnauthorized>[1]} [options]
 */
export function handleApiUnauthorizedFromResponse(response, options = {}) {
  const payload = normalizeApiPayload(response?.data);
  if (!payload) return { handled: false, payload: null, errorMsg: "" };

  const handled = handleApiUnauthorized(payload, options);
  return {
    handled,
    payload,
    errorMsg: getApiErrorMessage(payload),
  };
}

/**
 * 从 axios 错误响应中尝试处理登录失效（HTTP 401/403 等非 2xx 场景）
 * @param {import('axios').AxiosError} error
 * @param {Parameters<typeof handleApiUnauthorized>[1]} [options]
 */
export function handleApiUnauthorizedFromError(error, options = {}) {
  const payload = normalizeApiPayload(error?.response?.data);
  if (!payload) return { handled: false, payload: null, errorMsg: "" };

  const handled = handleApiUnauthorized(payload, options);
  return {
    handled,
    payload,
    errorMsg: getApiErrorMessage(payload),
  };
}

/**
 * 路由守卫：未登录或会话已失效时应去登录页，而不是 403
 * @param {import('vue-router').RouteLocationNormalized} to
 * @param {import('vue-router').NavigationGuardNext} next
 * @param {string} [loginPath]
 * @returns {boolean} 是否已处理导航
 */
export function redirectToLoginIfSessionExpired(to, next, loginPath = LOGIN_PATH) {
  const authStore = useAuthStore();
  if (!isAuthSessionExpired() && authStore.isLoggedIn) {
    return false;
  }

  clearAuthSessionExpired();
  if (authStore.isLoggedIn) {
    try {
      authStore.resetAuth();
    } catch {
      // pinia 未初始化时忽略
    }
  }

  next({
    path: loginPath,
    query: to.fullPath && to.fullPath !== loginPath ? { redirect: to.fullPath } : {},
    replace: true,
  });
  return true;
}
