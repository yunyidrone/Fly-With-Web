/*
 * @Author: ml
 * @Date: 2026-03-13 10:03:41
 * @LastEditTime: 2026-03-13 13:58:44
 * @FilePath: /accompanying-fly-project/src/config/network.js
 * @Description: 网络配置
 */
export const networkConfig = {
  baseURL: "/api",
  contentType: "application/json;charset=utf-8",
  requestTimeout: 300000, // 最长请求时间
  successCode: 200, // 正常code
  noPermissionCode: -1, // 无权限code
  throttleTime: 1000, // 节流时长
};
