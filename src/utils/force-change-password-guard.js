import { FORCE_CHANGE_PASSWORD_PATH } from "@/stores/auth.js";

const LOGIN_PATH = "/login";
const BACKEND_LOGIN_PATH = "/backend/login";

/**
 * 强制改密期间仅允许停留在登录页 / 强制改密页
 * @param {string} path
 */
export function isForceChangePasswordAllowed(path) {
  return (
    path === LOGIN_PATH ||
    path === BACKEND_LOGIN_PATH ||
    path === FORCE_CHANGE_PASSWORD_PATH
  );
}

/**
 * @param {import('pinia').Store} authStore
 * @param {import('vue-router').RouteLocationNormalized} to
 * @param {import('vue-router').NavigationGuardNext} next
 * @returns {boolean} true 表示已处理跳转
 */
export function redirectIfMustChangePassword(authStore, to, next) {
  if (!authStore?.mustChangePassword) return false;
  if (isForceChangePasswordAllowed(to.path)) return false;

  next({ path: FORCE_CHANGE_PASSWORD_PATH });
  return true;
}
