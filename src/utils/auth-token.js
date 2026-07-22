const TOKEN_KEY = "admin_token";
const TOKEN_MAX_AGE_SECONDS = 7 * 24 * 60 * 60;

function readCookie(name) {
  const key = `${encodeURIComponent(name)}=`;
  const parts = document.cookie ? document.cookie.split("; ") : [];
  for (const part of parts) {
    if (part.startsWith(key)) {
      return decodeURIComponent(part.slice(key.length));
    }
  }
  return "";
}

function writeCookie(name, value, maxAgeSeconds = TOKEN_MAX_AGE_SECONDS) {
  const secure = location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAgeSeconds}; SameSite=Lax${secure}`;
}

function removeCookie(name) {
  const secure = location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${encodeURIComponent(name)}=; Path=/; Max-Age=0; SameSite=Lax${secure}`;
}

export function getToken() {
  const fromCookie = readCookie(TOKEN_KEY);
  if (fromCookie) return fromCookie;

  // 兼容老数据：首次读取时从 localStorage 迁移到 cookie
  const legacy = localStorage.getItem(TOKEN_KEY) || "";
  if (legacy) {
    writeCookie(TOKEN_KEY, legacy);
    localStorage.removeItem(TOKEN_KEY);
  }
  return legacy;
}

export function setToken(token) {
  if (token) {
    writeCookie(TOKEN_KEY, token);
    localStorage.removeItem(TOKEN_KEY);
  } else {
    clearToken();
  }
}

export function clearToken() {
  removeCookie(TOKEN_KEY);
  localStorage.removeItem(TOKEN_KEY);
}
