import { authRequestData } from "@backend/utils/auth-request.js";
import { normalizeOrgTree } from "@backend/utils/org-set.js";

/**
 * 单位集下拉列表
 * @param {import('@/utils/request.js').RequestOptions} [options]
 */
export function fetchOrgSetList(options = {}) {
  return authRequestData("/org/setList", {}, "GET", undefined, options);
}

/**
 * 当前账户可见单位树（选择单位场景，auth：GET /auth/orgList）
 * @param {import('@/utils/request.js').RequestOptions} [options]
 */
export async function fetchOrgList(options = {}) {
  const data = await authRequestData("/orgList", {}, "GET", undefined, options);
  return normalizeOrgTree(data);
}

/**
 * 单位树（单位管理：需传当前选择的单位集合 id，auth：GET /auth/org/orgTree）
 * @param {string|number} id
 * @param {import('@/utils/request.js').RequestOptions} [options]
 */
export async function fetchOrgTree(id, options = {}) {
  if (id == null || id === "") {
    return [];
  }
  const data = await authRequestData(
    "/org/orgTree",
    { params: { id, orgSetId: id } },
    "GET",
    undefined,
    options,
  );
  return normalizeOrgTree(data);
}

/**
 * 单位管理分页列表（需传单位集合 id）
 * @param {{ id?: string|number, current?: number, pageSize?: number, isAsc?: boolean }} params
 * @param {import('@/utils/request.js').RequestOptions} [options]
 */
export function fetchOrgPage(params = {}, options = {}) {
  const { id, current, pageSize, isAsc, ...rest } = params;
  const query = {
    current,
    pageSize,
    isAsc,
    ...rest,
  };
  if (id != null && id !== "") {
    query.id = id;
  }
  return authRequestData("/org/pageQuery", { params: query }, "GET", undefined, options);
}

/**
 * 单位详情
 * @param {{ id?: string|number }} params
 * @param {import('@/utils/request.js').RequestOptions} [options]
 */
export function fetchOrgDetail(params = {}, options = {}) {
  return authRequestData("/org/detail", { params }, "GET", undefined, options);
}

/**
 * 新增单位
 * @param {Record<string, unknown>} data
 * @param {import('@/utils/request.js').RequestOptions} [options]
 */
export function createOrg(data, options = {}) {
  return authRequestData("/org/add", data, "POST", undefined, options);
}

/**
 * 编辑单位
 * @param {Record<string, unknown>} data
 * @param {import('@/utils/request.js').RequestOptions} [options]
 */
export function updateOrg(data, options = {}) {
  return authRequestData("/org/update", data, "POST", undefined, options);
}

/**
 * 删除单位
 * @param {{ id?: string|number }} data
 * @param {import('@/utils/request.js').RequestOptions} [options]
 */
export function deleteOrg(data, options = {}) {
  return authRequestData("/org/delete", data, "POST", undefined, options);
}
