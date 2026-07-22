import { networkConfig } from "@/config/network.js";
import { requestData, requestOk } from "@/utils/request.js";

/** auth 与业务 API 分离，单独指定 baseURL 避免拼成 /api/fly/api/auth/... */
const authRequestOptions = { baseURL: networkConfig.authBaseURL };

/**
 * @typedef {Object} BackendMenuNode
 * @property {string|number} id
 * @property {string} menuName
 * @property {number|string} menuType
 * @property {string} [icon]
 * @property {string|number|null} [parentId]
 * @property {string} [frontPermission]
 * @property {string} [permission]
 * @property {string} [basicPermission]
 * @property {string} [path]
 * @property {string} [component]
 * @property {number|string} [platformType]
 * @property {string} [remark]
 * @property {BackendMenuNode[]} [children]
 */

export function login(data) {
  return requestOk("/login", data, "POST", undefined, authRequestOptions);
}

export function logout(options = {}) {
  return requestData("/logout", {}, "POST", undefined, { ...authRequestOptions, ...options });
}

export function changePassword(data) {
  return requestData("/changePassword", data, "POST", undefined, authRequestOptions);
}

export function fetchMe(options = {}) {
  // 后端暂未提供 /auth/me，先禁用该请求
  return Promise.resolve(null);
}

/** 后台管理端 platformType 固定为 2 */
export const BACKEND_PLATFORM_TYPE = 2;

/**
 * 后台菜单树
 * @param {{ orgId?: string|number|null }} params
 * @param {import('@/utils/request.js').RequestOptions} [options]
 */
export function fetchMenuList(params = {}, options = {}) {
  const query = {
    platformType: BACKEND_PLATFORM_TYPE,
  };
  const orgId = params.orgId;
  if (orgId != null && orgId !== "" && orgId !== "all") {
    query.orgId = orgId;
  }
  return requestData("/menu/list", { params: query }, "GET", undefined, {
    ...authRequestOptions,
    ...options,
  });
}
