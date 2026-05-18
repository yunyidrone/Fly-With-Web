/*
 * @Author: ml
 * @Date: 2026-03-13 10:03:41
 * @LastEditTime: 2026-03-13 14:00:44
 * @FilePath: /accompanying-fly-project/src/config/network.js
 * @Description: 网络配置（axios baseURL：优先环境变量直连后端；未配置时为 /api）
 */

/** @returns {string} */
function resolveApiBaseURL() {
  const raw = import.meta.env.VITE_API_BASE_URL?.trim?.();
  if (!raw) return "/api";
  if (/^https?:\/\//i.test(raw)) return raw;
  return `http://${raw}`;
}

export const networkConfig = {
  baseURL: resolveApiBaseURL(),
  contentType: "application/json;charset=utf-8",
  requestTimeout: 300000, // 最长请求时间
  successCode: 2000, // 正常code
  noPermissionCode: -1, // 无权限code
  throttleTime: 1000, // 节流时长
};
