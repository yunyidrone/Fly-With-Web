const PC_BASE_WIDTH = 1920;
const MOBILE_BASE_WIDTH = 375;
const MOBILE_BREAKPOINT = 768;
const BASE_FONT_SIZE = 16;
const BACKEND_ROUTE_PREFIX = "/backend";

/** @param {string} [routePath] vue-router path，如 /backend/monitor */
export function isBackendAppRoute(routePath = "") {
  const path = String(routePath || "").trim();
  return path === BACKEND_ROUTE_PREFIX || path.startsWith(`${BACKEND_ROUTE_PREFIX}/`);
}

/** hash 路由（/#/backend）与 pathname 兜底 */
export function isBackendLocation(locationLike = window.location) {
  const hash = String(locationLike?.hash || "");
  if (hash.startsWith(`#${BACKEND_ROUTE_PREFIX}`)) return true;
  const pathname = String(locationLike?.pathname || "");
  return pathname === BACKEND_ROUTE_PREFIX || pathname.startsWith(`${BACKEND_ROUTE_PREFIX}/`);
}

/**
 * 同步 html 根字号：前台随视口缩放，后台固定 16px
 * @param {string} [routePath]
 */
export function syncAppRemRoot(routePath = "") {
  const doc = document.documentElement;
  if (isBackendAppRoute(routePath) || isBackendLocation()) {
    doc.style.fontSize = `${BASE_FONT_SIZE}px`;
    return;
  }

  const w = doc.clientWidth;
  let scale;
  if (w >= MOBILE_BREAKPOINT) {
    scale = w / PC_BASE_WIDTH;
  } else {
    scale = w / MOBILE_BASE_WIDTH;
    scale = Math.max(0.3, Math.min(scale, 0.36));
  }
  doc.style.fontSize = `${BASE_FONT_SIZE * scale}px`;
}
