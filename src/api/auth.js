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

/**
 * 单位集下拉列表
 * @param {import('@/utils/request.js').RequestOptions} [options]
 */
export function fetchOrgSetList(options = {}) {
  return requestData("/org/setList", {}, "GET", undefined, {
    ...authRequestOptions,
    ...options,
  });
}

/**
 * 单位树（需传当前选择的单位集合 id）
 * @param {{ id?: string|number, setId?: string|number, region?: string|number }} params
 * @param {import('@/utils/request.js').RequestOptions} [options]
 */
export function fetchOrgTree(params = {}, options = {}) {
  const id = params.id ?? params.orgSetId ?? params.setId ?? params.region;
  if (id == null || id === "") {
    return Promise.resolve([]);
  }
  return requestData(
    "/org/orgTree",
    { params: { id, orgSetId: id } },
    "GET",
    undefined,
    {
      ...authRequestOptions,
      ...options,
    },
  );
}

/**
 * 单位管理分页列表
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
  return requestData("/org/pageQuery", { params: query }, "GET", undefined, {
    ...authRequestOptions,
    ...options,
  });
}

/**
 * 单位详情
 * @param {{ id?: string|number }} params
 * @param {import('@/utils/request.js').RequestOptions} [options]
 */
export function fetchOrgDetail(params = {}, options = {}) {
  return requestData("/org/detail", { params }, "GET", undefined, {
    ...authRequestOptions,
    ...options,
  });
}

/**
 * 新增单位
 * @param {Record<string, unknown>} data
 * @param {import('@/utils/request.js').RequestOptions} [options]
 */
export function createOrg(data, options = {}) {
  return requestData("/org/add", data, "POST", undefined, {
    ...authRequestOptions,
    ...options,
  });
}

/**
 * 编辑单位
 * @param {Record<string, unknown>} data
 * @param {import('@/utils/request.js').RequestOptions} [options]
 */
export function updateOrg(data, options = {}) {
  return requestData("/org/update", data, "POST", undefined, {
    ...authRequestOptions,
    ...options,
  });
}

/**
 * 删除单位
 * @param {{ id?: string|number }} data
 * @param {import('@/utils/request.js').RequestOptions} [options]
 */
export function deleteOrg(data, options = {}) {
  return requestData("/org/delete", data, "POST", undefined, {
    ...authRequestOptions,
    ...options,
  });
}
