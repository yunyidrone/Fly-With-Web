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
const { baseURL, contentType, requestTimeout, successCode, invalidCode, throttleTime } = networkConfig;

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
    // const token = getToken();
    // if (token && config?.headers) {
    //   config.headers.Authorization = "Bearer " + token;
    // }
    // 检查当前请求的URL是否需要添加参数
    const needAddParams = REASON_API_NEED_ORGID.some((api) => config.url.includes(api));
    const userStore = JSON.parse(localStorage.getItem("user"));
    if (needAddParams && !isEmpty(userStore.currentOrgId) && userStore.currentOrgId !== -1) {
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

    // 请求节流
    if (!UNLIMIT_THROTTLE_API.includes(config.url)) {
      // 如果在1秒内，取消当前请求
      if (lastTime && now - lastTime < throttleTime) {
        const source = Axios.CancelToken.source();
        source.cancel(`请求${config.url}过于频繁，请${throttleTime}ms后再试`);
        config.cancelToken = source.token;
        return config;
      }
    }

    // 更新时间戳
    lastRequestTime.set(requestKey, now);

    // 设置清理定时器
    setTimeout(() => {
      lastRequestTime.delete(requestKey);
    }, throttleTime);

    console.log("config", config);
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
    let { code, message, ...rest } = response.data;
    // 只在错误时提示，成功时不弹出消息避免干扰用户
    if (code !== successCode) {
      ElMessage.warning(message || "请求失败");
    }
    return response.data;
  },
  (error) => {
    if (Axios.isCancel(error)) {
      return new Promise(() => {});
    }
    // 统一处理 HTTP 错误
    const errorMessage = error.response?.data?.message || error.message || "网络请求错误";
    ElMessage.error(errorMessage);
    return Promise.reject(error);
  },
);

/**
 * 执行请求
 * @param url
 * @param data
 * @param method
 * @param ContentType
 * @returns {Promise<any>}
 */
export async function request(url, data, method = "POST", ContentType) {
  let config = method === "GET" ? { url, ...data, method } : { url, data, method };
  if (ContentType) {
    config.headers = { "Content-Type": ContentType };
  }
  return await client.request(config);
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
