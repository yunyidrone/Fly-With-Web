import { networkConfig } from "@/config/network.js";
import { requestData, requestOk } from "@/utils/request.js";
import { encryptLoginPassword } from "@/utils/login-crypto.js";

/** 登录会话相关接口（鉴权服务） */
const authRequestOptions = { baseURL: networkConfig.authBaseURL };

function encryptAuthPassword(plainPassword) {
  return encryptLoginPassword(String(plainPassword ?? ""), networkConfig.loginAesSecret, {
    keyFormat: networkConfig.loginAesKeyFormat,
    mode: networkConfig.loginAesMode,
    padding: networkConfig.loginAesPadding,
    iv: networkConfig.loginAesIv,
    ivFormat: networkConfig.loginAesIvFormat,
    outputFormat: networkConfig.loginAesOutputFormat,
    keySource: networkConfig.loginAesKeySource,
  });
}

export function login(data) {
  return requestOk("/login", data, "POST", undefined, authRequestOptions);
}

export function logout(options = {}) {
  return requestData("/logout", {}, "POST", undefined, { ...authRequestOptions, ...options });
}

/**
 * 修改密码（auth：POST /auth/update）
 * 入参可传明文，内部按登录同款 AES 加密后提交
 * @param {{ oldPassword: string, password?: string, newPassword?: string }} data
 */
export function changePassword(data) {
  const oldPassword = encryptAuthPassword(data?.oldPassword);
  const password = encryptAuthPassword(data?.password ?? data?.newPassword);
  return requestData("/update", { oldPassword, password }, "POST", undefined, authRequestOptions);
}

/**
 * 当前登录用户信息（auth：POST /auth/info）
 * Content-Type: application/x-www-form-urlencoded
 * @param {import('@/utils/request.js').RequestOptions} [options]
 */
export function fetchUserInfo(options = {}) {
  return requestData(
    "/info",
    new URLSearchParams(),
    "POST",
    "application/x-www-form-urlencoded",
    {
      ...authRequestOptions,
      ...options,
    },
  );
}

/** @deprecated 请使用 fetchUserInfo */
export function fetchMe(options = {}) {
  return fetchUserInfo(options);
}
