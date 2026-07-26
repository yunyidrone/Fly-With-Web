import { networkConfig } from "@/config/network.js";
import { requestData, requestOk } from "@/utils/request.js";

/** 后台管理调用鉴权服务时统一带 authBaseURL */
const authRequestOptions = { baseURL: networkConfig.authBaseURL };

/**
 * @param {string} url
 * @param {unknown} [data]
 * @param {string} [method]
 * @param {string} [contentType]
 * @param {import('@/utils/request.js').RequestOptions} [options]
 */
export function authRequestData(url, data, method = "POST", contentType, options = {}) {
  return requestData(url, data, method, contentType, {
    ...authRequestOptions,
    ...options,
  });
}

/**
 * @param {string} url
 * @param {unknown} [data]
 * @param {string} [method]
 * @param {string} [contentType]
 * @param {import('@/utils/request.js').RequestOptions} [options]
 */
export function authRequestOk(url, data, method = "POST", contentType, options = {}) {
  return requestOk(url, data, method, contentType, {
    ...authRequestOptions,
    ...options,
  });
}
