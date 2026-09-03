import { authRequestData } from "@backend/utils/auth-request.js";

/**
 * 登录日志分页（auth：GET /auth/loginLog/pageQuery）
 * @param {{
 *   userName?: string,
 *   ipAddress?: string,
 *   current?: number,
 *   pageSize?: number,
 *   startTime?: string,
 *   endTime?: string,
 *   isAsc?: boolean,
 * }} params
 * @param {import('@/utils/request.js').RequestOptions} [options]
 */
export function fetchLoginLogPage(params, options = {}) {
  const { userName, ipAddress, current, pageSize, startTime, endTime, isAsc, ...rest } = params || {};
  const query = {
    current,
    pageSize,
    ...rest,
  };
  const name = String(userName ?? "").trim();
  if (name) query.userName = name;
  const ip = String(ipAddress ?? "").trim();
  if (ip) query.ipAddress = ip;
  if (startTime) query.startTime = startTime;
  if (endTime) query.endTime = endTime;
  if (isAsc != null) query.isAsc = isAsc;
  return authRequestData("/loginLog/pageQuery", { params: query }, "GET", undefined, options);
}

/**
 * 删除登录日志（auth：POST /auth/loginLog/delete）
 * @param {{ id: string|number }} data
 * @param {import('@/utils/request.js').RequestOptions} [options]
 */
export function deleteLoginLog(data, options = {}) {
  return authRequestData("/loginLog/delete", data, "POST", undefined, options);
}
