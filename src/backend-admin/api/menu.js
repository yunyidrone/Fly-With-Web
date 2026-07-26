import { authRequestData } from "@backend/utils/auth-request.js";

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
  return authRequestData("/menu/list", { params: query }, "GET", undefined, options);
}
