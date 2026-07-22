import CryptoJS from "crypto-js";

const DEFAULT_LOGIN_AES_SECRET = "hyG/mAukdHOEBWPH3SFNfg==";

function resolveMode(mode) {
  return String(mode || "ECB").toUpperCase() === "CBC" ? CryptoJS.mode.CBC : CryptoJS.mode.ECB;
}

function resolvePadding(padding) {
  const p = String(padding || "Pkcs7").toLowerCase();
  if (p === "zeropadding" || p === "zero") return CryptoJS.pad.ZeroPadding;
  if (p === "nopadding" || p === "none") return CryptoJS.pad.NoPadding;
  return CryptoJS.pad.Pkcs7;
}

function resolveWordArray(text, format) {
  const raw = String(text || "").trim();
  const f = String(format || "base64").toLowerCase();
  if (f === "utf8") return CryptoJS.enc.Utf8.parse(raw);
  if (f === "hex") return CryptoJS.enc.Hex.parse(raw);
  return CryptoJS.enc.Base64.parse(raw);
}

function toCipherOutput(cipherParams, outputFormat) {
  const fmt = String(outputFormat || "base64").toLowerCase();
  const raw = cipherParams.ciphertext;
  if (fmt === "hex") return raw.toString(CryptoJS.enc.Hex);
  const base64 = raw.toString(CryptoJS.enc.Base64);
  if (fmt === "base64url") {
    return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
  }
  return base64;
}

/**
 * 登录密码加密，输出 Base64 密文
 * @param {string} plainPassword
 * @param {string} [secret]
 * @param {{
 *  keyFormat?: "base64"|"utf8"|"hex",
 *  mode?: "ECB"|"CBC",
 *  padding?: "Pkcs7"|"ZeroPadding"|"NoPadding",
 *  iv?: string,
 *  ivFormat?: "base64"|"utf8"|"hex",
 *  outputFormat?: "base64"|"hex"|"base64url",
 *  keySource?: "raw"|"passphrase"
 * }} [options]
 */
export function encryptLoginPassword(plainPassword, secret = DEFAULT_LOGIN_AES_SECRET, options = {}) {
  const text = String(plainPassword ?? "");
  const keySource = String(options.keySource || "raw").toLowerCase();
  if (keySource === "passphrase") {
    // 兼容部分后端/历史实现：把 secret 当口令让库自动派生 key+iv
    const encrypted = CryptoJS.AES.encrypt(text, String(secret || DEFAULT_LOGIN_AES_SECRET));
    return encrypted.toString();
  }

  const key = resolveWordArray(secret || DEFAULT_LOGIN_AES_SECRET, options.keyFormat);
  const mode = resolveMode(options.mode);
  const padding = resolvePadding(options.padding);

  const encryptOptions = { mode, padding };
  if (mode === CryptoJS.mode.CBC) {
    const ivText = options.iv || String(secret || DEFAULT_LOGIN_AES_SECRET).slice(0, 16);
    encryptOptions.iv = resolveWordArray(ivText, options.ivFormat || "utf8");
  }

  const encrypted = CryptoJS.AES.encrypt(text, key, encryptOptions);
  return toCipherOutput(encrypted, options.outputFormat);
}
