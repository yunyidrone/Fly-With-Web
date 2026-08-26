import * as ElementPlusIconsVue from "@element-plus/icons-vue";

/** @typedef {import('@backend/api/menu.js').BackendMenuNode} BackendMenuNode */

export const BACKEND_BASE = "/backend";

/**
 * 后端菜单 component -> 前端路由路径
 * 约定：
 * - 一级：MonitoringCenter / UnitManage / AccountManage / SystemSettings
 * - 二级：MonitoringData / DroneManage / BoatManage / HoundManage
 *        PointSettings / TargetDeviceManage / KeyPointManage / MonitorLibraryManage
 *        LoginLog
 */
const MENU_COMPONENT_ROUTE_PATH_MAP = new Map([
  // 一级菜单
  ["MonitoringCenter", "/backend/monitor"],
  ["UnitManage", "/backend/orgs"],
  ["AccountManage", "/backend/users"],
  ["LoginLog", "/backend/users/login-logs"],
  ["SystemSettings", "/backend/infra/checkpoints"],

  // 监控中心二级
  ["MonitoringData", "/backend/monitor"],
  ["DroneManage", "/backend/monitor/drones"],
  ["BoatManage", "/backend/monitor/boats"],
  ["HoundManage", "/backend/monitor/dogs"],

  // 系统基建设置二级
  ["PointSettings", "/backend/infra/checkpoints"],
  ["TargetDeviceManage", "/backend/infra/targets"],
  ["KeyPointManage", "/backend/infra/locations"],
  ["MonitorLibraryManage", "/backend/infra/library"],
]);

export function resolveStaticRoutePath(path) {
  const p = String(path ?? "").trim();
  if (!p) return BACKEND_BASE;
  if (p.startsWith("/")) return p;
  return `${BACKEND_BASE}/${p.replace(/^\/+/, "")}`;
}

/**
 * 由 router.getRoutes() 构造标题到路径映射（支持嵌套路由）
 * @param {Array<{path?: string, meta?: Record<string, unknown>, children?: Array<any>}>} routes
 */
export function buildMenuTitleRoutePathMap(routes = []) {
  /** @type {Map<string, string>} */
  const map = new Map();

  /** @param {Array<any>} routeList @param {string} parentPath */
  function walk(routeList, parentPath = "") {
    for (const route of routeList || []) {
      const rawPath = String(route?.path ?? "");
      let fullPath = parentPath;

      if (rawPath) {
        if (rawPath.startsWith("/")) {
          fullPath = rawPath;
        } else if (parentPath) {
          fullPath = `${parentPath.replace(/\/+$/, "")}/${rawPath.replace(/^\/+/, "")}`;
        } else {
          fullPath = `/${rawPath.replace(/^\/+/, "")}`;
        }
      }

      const title = String(route?.meta?.title || "").trim();
      if (title && fullPath) {
        map.set(title, resolveStaticRoutePath(fullPath));
      }

      if (route.children?.length) {
        walk(route.children, fullPath);
      }
    }
  }

  walk(routes);
  return map;
}

/**
 * 菜单路由优先级：component > frontPermission/path > menuName(title)
 * @param {BackendMenuNode|null|undefined} node
 * @param {Map<string, string>} [titleRoutePathMap]
 */
export function resolveMenuPath(node, titleRoutePathMap) {
  const componentKey = String(node?.component ?? "").trim();
  if (componentKey) {
    const byComponent = MENU_COMPONENT_ROUTE_PATH_MAP.get(componentKey);
    if (byComponent) return byComponent;
  }

  const preferred =
    node?.frontPermission ??
    node?.path ??
    node?.permission ??
    node?.basicPermission;
  const p = String(preferred ?? "").trim();
  if (!p) {
    const byTitle = titleRoutePathMap?.get(String(node?.menuName ?? "").trim());
    return byTitle || BACKEND_BASE;
  }
  if (/^backend\//i.test(p)) return `/${p}`;
  if (/^\/backend\//i.test(p)) return p;
  if (p.startsWith("#/")) return p.slice(1);
  if (p.startsWith("/")) return p;
  return `${BACKEND_BASE}/${p.replace(/^\/+/, "")}`;
}

/**
 * @param {string|null|undefined} icon
 */
export function resolveMenuIcon(icon) {
  const name = String(icon ?? "").trim();
  if (!name) return null;
  return ElementPlusIconsVue[name] || null;
}

/** 一级菜单 component 与默认图标映射（接口 icon 无效时使用） */
const TOP_MENU_COMPONENT_ICON_MAP = new Map([
  ["MonitoringCenter", "Monitor"],
  ["UnitManage", "OfficeBuilding"],
  ["AccountManage", "User"],
  ["SystemSettings", "Setting"],
]);

const DEFAULT_TOP_MENU_ICON = "Menu";

/**
 * 侧栏菜单图标：优先接口 icon，一级菜单无效时使用默认图标
 * @param {BackendMenuNode|null|undefined} node
 * @param {{ topLevel?: boolean }} [options]
 */
export function resolveSidebarMenuIcon(node, options = {}) {
  const resolved = resolveMenuIcon(node?.icon);
  if (resolved) return resolved;

  if (!options.topLevel) return null;

  const componentKey = String(node?.component ?? "").trim();
  const fallbackName = TOP_MENU_COMPONENT_ICON_MAP.get(componentKey) || DEFAULT_TOP_MENU_ICON;

  return ElementPlusIconsVue[fallbackName] || ElementPlusIconsVue.Menu || null;
}

/**
 * 侧栏不展示按钮类菜单
 * @param {BackendMenuNode|null|undefined} node
 */
export function isSidebarMenuNode(node) {
  if (!node || typeof node !== "object") return false;
  const type = node.menuType;
  if (type === 3 || type === "3" || type === "F" || type === "BUTTON") return false;
  return true;
}

/**
 * @param {unknown} list
 * @returns {BackendMenuNode[]}
 */
export function normalizeMenuTree(list) {
  const source = normalizeMenuArray(list);
  return source
    .filter(isSidebarMenuNode)
    .map((node) => ({
      ...node,
      children: normalizeMenuTree(node.children || []),
    }))
    .filter((node) => node.children?.length || hasRenderablePath(node));
}

/**
 * 兼容后端可能返回：
 * - 数组（标准）
 * - 单个根节点对象（children 挂菜单）
 * - records/list/data 包装结构
 * @param {unknown} input
 * @returns {BackendMenuNode[]}
 */
function normalizeMenuArray(input) {
  if (Array.isArray(input)) return input;
  if (!input || typeof input !== "object") return [];
  const obj = /** @type {Record<string, unknown>} */ (input);

  if (Array.isArray(obj.records)) return /** @type {BackendMenuNode[]} */ (obj.records);
  if (Array.isArray(obj.list)) return /** @type {BackendMenuNode[]} */ (obj.list);
  if (Array.isArray(obj.data)) return /** @type {BackendMenuNode[]} */ (obj.data);
  if (obj.data && obj.data !== input) return normalizeMenuArray(obj.data);

  // 单根节点对象：若存在 children，侧栏直接从 children 开始渲染
  if (Array.isArray(obj.children)) {
    return /** @type {BackendMenuNode[]} */ (obj.children);
  }

  // 单个可渲染节点
  if ("id" in obj || "menuName" in obj || "path" in obj) {
    return [/** @type {BackendMenuNode} */ (obj)];
  }

  return [];
}

/**
 * 某些后端菜单项可能无 path，但存在 frontPermission/component 可用于渲染
 * @param {BackendMenuNode} node
 */
function hasRenderablePath(node) {
  return Boolean(
    String(node?.frontPermission ?? "").trim() ||
      String(node?.path ?? "").trim() ||
      String(node?.component ?? "").trim() ||
      String(node?.menuName ?? "").trim() ||
      node?.id != null,
  );
}

/**
 * @param {BackendMenuNode[]} tree
 * @param {string} activePath
 * @param {Map<string, string>} [titleRoutePathMap]
 */
export function collectOpenMenuIds(tree, activePath, titleRoutePathMap) {
  /** @type {string[]} */
  const openIds = [];

  /** @param {BackendMenuNode[]} nodes */
  function walk(nodes) {
    for (const node of nodes) {
      if (!node.children?.length) continue;
      const nodePath = resolveMenuPath(node, titleRoutePathMap);
      const childMatched = node.children.some((child) =>
        activePath.startsWith(resolveMenuPath(child, titleRoutePathMap)),
      );
      if (activePath.startsWith(nodePath) || childMatched) {
        openIds.push(String(node.id));
      }
      walk(node.children);
    }
  }

  walk(tree);
  return openIds;
}

/**
 * 根据当前激活路径解析面包屑：一级菜单 / 二级菜单
 * @param {BackendMenuNode[]} tree
 * @param {string} activePath
 * @param {Map<string, string>} [titleRoutePathMap]
 * @returns {string[]}
 */
export function resolveMenuBreadcrumb(tree, activePath, titleRoutePathMap) {
  const target = resolveStaticRoutePath(activePath);
  /** @type {{ node: BackendMenuNode, parent: BackendMenuNode | null, pathLen: number } | null} */
  let best = null;

  /** @param {BackendMenuNode[]} nodes @param {BackendMenuNode | null} parent */
  function walk(nodes, parent) {
    for (const node of nodes) {
      const nodePath = resolveMenuPath(node, titleRoutePathMap);
      const matched = target === nodePath || target.startsWith(`${nodePath}/`);
      if (!matched) {
        if (node.children?.length) walk(node.children, node);
        continue;
      }

      const pathLen = nodePath.length;
      const preferCurrent =
        !best ||
        pathLen > best.pathLen ||
        (pathLen === best.pathLen && parent && !best.parent);

      if (preferCurrent) {
        best = { node, parent, pathLen };
      }

      if (node.children?.length) walk(node.children, node);
    }
  }

  walk(tree, null);
  if (!best) return [];

  if (best.parent) {
    return [best.parent.menuName, best.node.menuName].filter(Boolean);
  }

  return [best.node.menuName].filter(Boolean);
}

/**
 * @param {BackendMenuNode|null|undefined} node
 */
export function hasMenuChildren(node) {
  return Array.isArray(node?.children) && node.children.length > 0;
}

/**
 * 取菜单树中第一个可导航叶子路径（用于默认落地）
 * @param {BackendMenuNode[]} tree
 * @param {Map<string, string>} [titleRoutePathMap]
 * @returns {string|null}
 */
export function findFirstAccessibleMenuPath(tree, titleRoutePathMap) {
  /** @param {BackendMenuNode[]} nodes */
  function walk(nodes) {
    for (const node of nodes || []) {
      if (Array.isArray(node?.children) && node.children.length) {
        const childPath = walk(node.children);
        if (childPath) return childPath;
      }
      const path = resolveMenuPath(node, titleRoutePathMap);
      if (path && path !== BACKEND_BASE) return path;
    }
    return null;
  }

  return walk(tree);
}
