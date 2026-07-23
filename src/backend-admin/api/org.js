import {
  createOrg as createAuthOrg,  deleteOrg as deleteAuthOrg,
  fetchOrgDetail as fetchAuthOrgDetail,
  fetchOrgPage as fetchAuthOrgPage,
  fetchOrgTree as fetchAuthOrgTree,
  updateOrg as updateAuthOrg,
} from "@/api/auth.js";
import { normalizeOrgTree } from "@backend/utils/org-set.js";

/**
 * 单位管理分页列表（需传单位集合 id）
 * @param {{ id?: string|number, current?: number, pageSize?: number, isAsc?: boolean }} params
 */
export function fetchOrgPage(params) {
  return fetchAuthOrgPage(params);
}

export function fetchOrgDetail(params) {
  return fetchAuthOrgDetail(params);
}

export function createOrg(data) {
  return createAuthOrg(data);
}

export function updateOrg(data) {
  return updateAuthOrg(data);
}
export function deleteOrg(data) {
  return deleteAuthOrg(data);
}
/**
 * 单位树（需传当前选择的单位集合 id）
 * @param {string|number} id
 * @param {import('@/utils/request.js').RequestOptions} [options]
 */
export async function fetchOrgTree(id, options = {}) {
  const data = await fetchAuthOrgTree({ id }, options);
  return normalizeOrgTree(data);
}