import Axios from "axios";
import axiosRetry from "axios-retry";
import { ElMessage } from "element-plus";
import appRouter from "@/router";
import { networkConfig, appConfig } from "@backend/config/network.js";
import { getToken, clearToken } from "@/utils/auth-token.js";
import { useAuthStore } from "@/stores/auth.js";

const { baseURL, contentType, requestTimeout, successCode, throttleTime } = networkConfig;

export const API_SUCCESS_CODE = successCode;

export class ApiBusinessError extends Error {
  constructor(message, code, response) {
    super(message || "请求失败");
    this.name = "ApiBusinessError";
    this.code = code;
    this.response = response;
  }
}

export function isApiSuccess(payload) {
  if (payload == null || typeof payload !== "object") return false;
  return Number(payload.code) === Number(API_SUCCESS_CODE);
}

export function isApiBusinessError(err) {
  return err instanceof ApiBusinessError;
}

export function unwrapApiList(payload) {
  if (payload == null) return [];
  if (Array.isArray(payload)) return payload;
  if (typeof payload !== "object") return [];

  const obj = payload;
  if (Array.isArray(obj.records)) return obj.records;
  if (Array.isArray(obj.list)) return obj.list;

  if (obj.data != null && obj.data !== payload) {
    return unwrapApiList(obj.data);
  }

  return [];
}

const client = Axios.create({
  baseURL,
  timeout: requestTimeout,
  headers: {
    "Content-Type": contentType,
  },
});

const lastRequestTime = new Map();
axiosRetry(client, { retries: 2 });

function readAuthPersist() {
  try {
    const raw = localStorage.getItem("admin-auth");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

client.interceptors.request.use(
  (config) => {
    const method = String(config.method || "").toLowerCase();

    if (method === "get") {
      config.headers["Cache-Control"] = "no-store";
      config.headers.Pragma = "no-cache";
      config.headers.Expires = "0";
    }

    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    const authPersist = readAuthPersist();
    const orgId = authPersist?.currentOrgId;
    if (orgId != null && orgId !== "" && orgId !== "all") {
      config.headers["X-Org-Id"] = String(orgId);
    }

    const requestKey = `${config.method}_${config.url}_${JSON.stringify(config.params || {})}_${JSON.stringify(config.data || {})}`;
    const now = Date.now();
    const lastTime = lastRequestTime.get(requestKey);

    // 仅对写操作做短节流；GET 列表查询/刷新不受限
    if (method !== "get") {
      if (lastTime && now - lastTime < throttleTime) {
        return Promise.reject(new Axios.CanceledError("REQUEST_THROTTLED"));
      }

      lastRequestTime.set(requestKey, now);
      setTimeout(() => lastRequestTime.delete(requestKey), throttleTime);
    }

    return config;
  },
  (error) => Promise.reject(error),
);

client.interceptors.response.use(
  (response) => {
    const { status } = response;
    const payload = response.data;

    if (status === 304 || payload === "" || payload == null) {
      ElMessage.warning("接口响应为空，请检查网络或缓存配置");
      return Promise.reject(new Error("EMPTY_OR_NOT_MODIFIED"));
    }

    const silent = response.config?.meta?.silent === true;
    const { msg, message } = payload;
    const errorMsg = msg || message;

    if (Number(payload.code) === Number(networkConfig.unauthorizedCode)) {
      if (appConfig.skipAuth) {
        return payload;
      }
      clearToken();
      try {
        useAuthStore().resetAuth();
      } catch {
        // pinia 未初始化时忽略
      }
      const loginPath = "/login";
      if (appRouter.currentRoute.value.path !== loginPath) {
        appRouter.push({ path: loginPath, query: { redirect: appRouter.currentRoute.value.fullPath } });
      }
      if (!silent) ElMessage.warning(errorMsg || "登录已失效，请重新登录");
      return Promise.reject(new ApiBusinessError(errorMsg, payload.code, payload));
    }

    if (!isApiSuccess(payload) && !silent) {
      ElMessage.warning(errorMsg || "请求失败");
    }

    return payload;
  },
  (error) => {
    if (Axios.isCancel(error) || error.name === "CanceledError") {
      return Promise.reject(error);
    }
    const bodyMsg = error.response?.data?.msg || error.response?.data?.message;
    const errorMessage = bodyMsg || error.message || "网络请求错误";
    ElMessage.error(errorMessage);
    return Promise.reject(error);
  },
);

export async function request(url, data, method = "POST", contentType, options = {}) {
  const m = String(method || "POST").toLowerCase();
  const config =
    m === "get" ? { url, ...(data || {}), method: m } : { url, data, method: m };

  if (contentType) {
    config.headers = { "Content-Type": contentType };
  }
  if (options.silent) {
    config.meta = { ...(config.meta || {}), silent: true };
  }

  return client.request(config);
}

export async function requestOk(url, data, method = "POST", contentType, options = {}) {
  const body = await request(url, data, method, contentType, options);
  if (!isApiSuccess(body)) {
    throw new ApiBusinessError(body?.msg || body?.message, body?.code, body);
  }
  return body;
}

export async function requestData(url, data, method = "POST", contentType, options = {}) {
  const body = await requestOk(url, data, method, contentType, options);
  return body?.data;
}

export default client;
