/*
 * @Author: ml
 * @Date: 2026-03-13 09:58:11
 * @LastEditTime: 2026-03-13 14:00:16
 * @FilePath: /accompanying-fly-project/src/utils/request.js
 * @Description: 封装 axios 请求
 */
import Axios from "axios";
import axiosRetry from "axios-retry";
import { networkConfig } from "@/config/network.js";
import { isEmpty, cloneDeep } from "lodash-es";
import { ElMessage } from "element-plus";
import { getToken } from "@/utils/auth-token.js";
import {
  handleApiUnauthorizedFromError,
  handleApiUnauthorizedFromResponse,
} from "@/utils/handle-api-unauthorized.js";

const { baseURL, contentType, requestTimeout, successCode, throttleTime, unauthorizedCode } =
  networkConfig;

/** 与 network.js 中 successCode 一致，业务层勿再写死 2000 */
export const API_SUCCESS_CODE = successCode;

/** @typedef {{ silent?: boolean, baseURL?: string }} RequestOptions */

export class ApiBusinessError extends Error {
  /**
   * @param {string} [message]
   * @param {number|string} [code]
   * @param {Record<string, unknown>} [response]
   */
  constructor(message, code, response) {
    super(message || "请求失败");
    this.name = "ApiBusinessError";
    this.code = code;
    this.response = response;
  }
}

/**
 * 判断接口业务是否成功（仅看 body.code，与 HTTP 状态无关）
 * @param {unknown} payload
 */
export function isApiSuccess(payload) {
  if (payload == null || typeof payload !== "object") return false;
  return Number(payload.code) === Number(API_SUCCESS_CODE);
}

/**
 * @param {unknown} err
 */
export function isApiBusinessError(err) {
  return err instanceof ApiBusinessError;
}

/**
 * 从 requestData 返回值（或仍带一层 data 的 body）中解析列表
 * 兼容：数组 | records | list | 嵌套 data
 * @param {unknown} payload
 * @returns {unknown[]}
 */
export function unwrapApiList(payload) {
  if (payload == null) return [];
  if (Array.isArray(payload)) return payload;
  if (typeof payload !== "object") return [];

  const obj = /** @type {Record<string, unknown>} */ (payload);
  if (Array.isArray(obj.records)) return obj.records;
  if (Array.isArray(obj.list)) return obj.list;

  if (obj.data != null && obj.data !== payload) {
    return unwrapApiList(obj.data);
  }

  return [];
}

// 配置项
const client = Axios.create({
  baseURL,
  timeout: requestTimeout,
  headers: {
    "Content-Type": contentType,
  },
});

const lastRequestTime = new Map();
const REASON_API_NEED_ORGID = [];

// 不限制超时的接口
const UNLIMIT_TIMEOUT_API = [];

// 不限制节流的接口
const UNLIMIT_THROTTLE_API = [];

const CancelToken = Axios.CancelToken;

// 请求失败后，自动重新请求，3次后才真正失败
axiosRetry(client, { retries: 3 });

/**
 * 请求拦截器
 */
client.interceptors.request.use(
  (config) => {
    const method = String(config.method || "").toLowerCase();

    /** 避免静态资源式缓存：Chrome 对部分 GET JSON 返回 304 且 body 为空，解构 response.data 会异常 */
    if (method === "get") {
      config.headers["Cache-Control"] = "no-store";
      config.headers.Pragma = "no-cache";
      config.headers.Expires = "0";
      config.params = {
        ...(config.params || {}),
        // _t: Date.now(),
      };
    }

    const token = getToken();
    if (token && config?.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // 检查当前请求的URL是否需要添加参数
    const needAddParams = REASON_API_NEED_ORGID.some((api) => config.url.includes(api));
    const userStore = JSON.parse(localStorage.getItem("user"));
    if (needAddParams && !isEmpty(userStore?.currentOrgId) && userStore.currentOrgId !== -1) {
      const commonParam = {
        orgId: userStore.currentOrgId,
      };
      if (config.method === "get") {
        config.params = {
          ...config.params,
          ...commonParam,
        };
      } else if (config.method === "post") {
        // POST请求：根据数据类型处理
        if (config.data instanceof FormData) {
          // FormData类型，直接追加
          Object.keys(commonParam).forEach((key) => {
            config.data.append(key, commonParam[key]);
          });
        } else {
          // JSON数据，合并到data
          config.data = {
            ...config.data,
            ...commonParam,
          };
        }
      }
    }
    // 设置不需要超时拦截的请求
    const unLimitApis = UNLIMIT_TIMEOUT_API.some((api) => config.url.includes(api));
    if (unLimitApis) {
      config["timeout"] = 0;
    }

    const requestKey = `${config.method}_${config.url}_${JSON.stringify(config.params || {})}_${JSON.stringify(config.data || {})}`;
    const now = Date.now();
    const lastTime = lastRequestTime.get(requestKey);
    const skipThrottle = method === "get" || UNLIMIT_THROTTLE_API.includes(config.url);

    // 仅对写操作做短节流，避免误触重复提交；GET 查询/刷新不受限
    if (!skipThrottle) {
      if (lastTime && now - lastTime < throttleTime) {
        return Promise.reject(new Axios.CanceledError("REQUEST_THROTTLED"));
      }

      lastRequestTime.set(requestKey, now);
      setTimeout(() => lastRequestTime.delete(requestKey), throttleTime);
    }

    return config;
  },
  (error) => {
    console.log(error);
    return Promise.reject(error);
  },
);

/**
 * 响应拦截器
 */
client.interceptors.response.use(
  (response) => {
    const { status } = response;
    const payload = response.data;
    /** 304 等情况下正文常为空，继续解构会破坏业务逻辑 */
    if (status === 304 || payload === "" || payload == null) {
      ElMessage.warning("接口响应为空（常见于 HTTP 304 缓存），请勿对 JSON 列表接口做强缓存");
      return Promise.reject(new Error("EMPTY_OR_NOT_MODIFIED"));
    }

    const silent = response.config?.meta?.silent === true;
    const unauthorized = handleApiUnauthorizedFromResponse(response, {
      silent,
      unauthorizedCode,
    });
    if (unauthorized.handled) {
      const { code } = unauthorized.payload || {};
      return Promise.reject(
        new ApiBusinessError(unauthorized.errorMsg, code, unauthorized.payload),
      );
    }

    const { msg, message } = unauthorized.payload || payload;
    const errorMsg = msg || message;

    // 只在错误时提示，成功时不弹出消息避免干扰用户
    if (!isApiSuccess(payload) && !silent) {
      ElMessage.warning(errorMsg || "请求失败");
    }
    return response.data;
  },
  (error) => {
    if (Axios.isCancel(error) || error.name === "CanceledError") {
      return Promise.reject(error);
    }

    const silent = error.config?.meta?.silent === true;
    const unauthorized = handleApiUnauthorizedFromError(error, {
      silent,
      unauthorizedCode,
    });
    if (unauthorized.handled) {
      const { code } = unauthorized.payload || {};
      return Promise.reject(
        new ApiBusinessError(unauthorized.errorMsg, code, unauthorized.payload),
      );
    }

    // 统一处理 HTTP 错误
    const bodyMsg = error.response?.data?.msg || error.response?.data?.message;
    const errorMessage = bodyMsg || error.message || "网络请求错误";
    if (!silent) ElMessage.error(errorMessage);
    return Promise.reject(error);
  },
);

/**
 * 执行请求
 * @param url
 * @param data
 * @param method
 * @param ContentType
 * @param {RequestOptions} [options]
 * @returns {Promise<any>}
 */
export async function request(url, data, method = "POST", ContentType, options = {}) {
  const m = String(method || "POST").toLowerCase();
  // axios / 拦截器里多用小写 method（如 "get"），统一小写避免分支失效
  const config =
    m === "get"
      ? { url, ...(data || {}), method: m }
      : { url, data, method: m };
  if (ContentType) {
    config.headers = { "Content-Type": ContentType };
  }
  if (options.silent) {
    config.meta = { ...(config.meta || {}), silent: true };
  }
  if (options.baseURL) {
    config.baseURL = options.baseURL;
  }
  return await client.request(config);
}

/**
 * 业务成功时返回完整 body；失败 reject ApiBusinessError（拦截器已按 silent 决定是否 toast）
 * @param {RequestOptions} [options]
 */
export async function requestOk(url, data, method = "POST", ContentType, options = {}) {
  const body = await request(url, data, method, ContentType, options);
  if (!isApiSuccess(body)) {
    throw new ApiBusinessError(body?.msg || body?.message, body?.code, body);
  }
  return body;
}

/**
 * 业务成功时只返回 data 字段；失败 reject ApiBusinessError
 * @param {RequestOptions} [options]
 */
export async function requestData(url, data, method = "POST", ContentType, options = {}) {
  const body = await requestOk(url, data, method, ContentType, options);
  return body?.data;
}

/**
 * @description: 取消请求
 * @param {*} fetcher
 * @return {*}
 */
export function withCancelToken(fetcher) {
  let abort;
  function send(data, config) {
    cancel();
    const cancelToken = new CancelToken((cancel) => (abort = cancel));
    return fetcher(data, { ...config, cancelToken });
  }

  function cancel(message = "abort") {
    if (abort) {
      abort(message);
      abort = null;
    }
  }
  return [send, cancel];
}

export default client;
