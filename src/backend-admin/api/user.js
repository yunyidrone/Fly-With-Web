import { authRequestData } from "@backend/utils/auth-request.js";

/**
 * 账户分页（auth：GET /auth/user/pageQuery）
 * 返回字段：id、userName、superFlag、status、loginTime、roleName
 * @param {{
 *   orgId?: string|number,
 *   keyword?: string,
 *   current?: number,
 *   pageSize?: number,
 * }} params
 * @param {import('@/utils/request.js').RequestOptions} [options]
 */
export function fetchUserPage(params, options = {}) {
  return authRequestData("/user/pageQuery", { params }, "GET", undefined, options);
}

/**
 * 账户详情（auth：GET /auth/user/detail）
 * @param {{ userId: string|number }} params
 * @param {import('@/utils/request.js').RequestOptions} [options]
 */
export function fetchUserDetail(params, options = {}) {
  return authRequestData("/user/detail", { params }, "GET", undefined, options);
}

/**
 * 新增账户（auth：POST /auth/user/add）
 * @param {{
 *   orgId: string|number,
 *   rootOrgId: string|number,
 *   roleId: string|number,
 *   authPlatform: string,
 *   userName: string,
 *   email?: string,
 *   phone?: string,
 * }} data
 * @param {import('@/utils/request.js').RequestOptions} [options]
 */
export function createUser(data, options = {}) {
  return authRequestData("/user/add", data, "POST", undefined, options);
}

/**
 * 编辑账户（auth：POST /auth/user/update）
 * @param {{
 *   userId: string|number,
 *   orgId?: string|number,
 *   rootOrgId?: string|number,
 *   roleId?: string|number,
 *   authPlatform?: string,
 *   userName?: string,
 *   email?: string,
 *   phone?: string,
 * }} data
 * @param {import('@/utils/request.js').RequestOptions} [options]
 */
export function updateUser(data, options = {}) {
  return authRequestData("/user/update", data, "POST", undefined, options);
}

/**
 * 删除账户（auth：POST /auth/user/delete）
 * @param {{ userId: string|number }} data
 * @param {import('@/utils/request.js').RequestOptions} [options]
 */
export function deleteUser(data, options = {}) {
  return authRequestData("/user/delete", data, "POST", undefined, options);
}

/**
 * 角色列表（auth：GET /auth/role/list）
 * @param {{ orgId?: string|number, rootOrgId?: string|number }} [params]
 * @param {import('@/utils/request.js').RequestOptions} [options]
 */
export function fetchRoleList(params = {}, options = {}) {
  return authRequestData("/role/list", { params }, "GET", undefined, options);
}

/**
 * 查询用户密码（auth：POST /auth/user/pwd）
 * @param {{ userId: string|number }} data
 * @param {import('@/utils/request.js').RequestOptions} [options]
 * @returns {Promise<{ password?: string, userName?: string, userId?: string|number }>}
 */
export function fetchUserPassword(data, options = {}) {
  return authRequestData("/user/pwd", data, "POST", undefined, options);
}

/**
 * 重置密码（auth：POST /auth/user/resetPwd）
 * @param {{ userId: string|number }} data
 * @param {import('@/utils/request.js').RequestOptions} [options]
 * @returns {Promise<{ userName?: string, password?: string }>}
 */
export function resetUserPassword(data, options = {}) {
  return authRequestData("/user/resetPwd", data, "POST", undefined, options);
}

/**
 * 启停用账户（auth：POST /auth/user/switch）
 * @param {{ userId: string|number, status: 0|1 }} data status：0启用 1禁用
 * @param {import('@/utils/request.js').RequestOptions} [options]
 */
export function updateUserStatus(data, options = {}) {
  return authRequestData("/user/switch", data, "POST", undefined, options);
}
