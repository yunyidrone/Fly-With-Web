import { networkConfig } from "@/config/network.js";
import { requestData, requestOk } from "@/utils/request.js";

/** auth 与业务 API 分离，单独指定 baseURL 避免拼成 /api/fly/api/auth/... */
const authRequestOptions = { baseURL: networkConfig.authBaseURL };

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
