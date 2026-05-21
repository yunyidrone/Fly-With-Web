/**
 * 飞行计划 — 地点树（支持多级 children）
 * 仅「叶子节点」配置 ring 时可勾选并上图
 * ring: 闭合多边形 [lng, lat, lng, lat, ...]（WGS84）
 */

const R = (pairs) => pairs.flat();

// const RING_HUANGYAN_GOV = R([
//   [121.418, 28.6565],
//   [121.432, 28.6565],
//   [121.432, 28.6495],
//   [121.418, 28.6495],
// ]);

// const RING_JIAOJIANG_GOV = R([
//   [121.402, 28.672],
//   [121.418, 28.672],
//   [121.418, 28.664],
//   [121.402, 28.664],
// ]);

// const RING_CULTURE_PLAZA = R([
//   [121.424, 28.658],
//   [121.43, 28.658],
//   [121.4285, 28.652],
//   [121.422, 28.653],
// ]);

// const RING_STADIUM = R([
//   [121.438, 28.646],
//   [121.446, 28.646],
//   [121.446, 28.64],
//   [121.438, 28.64],
// ]);
const RING_HUANGYAN_GOV = {
  type: 'rectangle',
  points: [{lng: 121.418, lat: 28.6565}, {lng: 121.432, lat: 28.6565}, {lng: 121.432, lat: 28.6495}, {lng: 121.418, lat: 28.6495}]
}
const RING_JIAOJIANG_GOV = {
  type: 'rectangle',
  points: [{lng: 121.402, lat: 28.672}, {lng: 121.418, lat: 28.672}, {lng: 121.418, lat: 28.664}, {lng: 121.402, lat: 28.664}]
}
const RING_CULTURE_PLAZA = {
  type: 'rectangle',
  points: [{lng: 121.424, lat: 28.658}, {lng: 121.43, lat: 28.658}, {lng: 121.4285, lat: 28.652}, {lng: 121.422, lat: 28.653}]
}
const RING_STADIUM = {
  type: 'rectangle',
  points: [{lng: 121.438, lat: 28.646}, {lng: 121.446, lat: 28.646}, {lng: 121.446, lat: 28.64}, {lng: 121.438, lat: 28.64}]
}
export const FLIGHT_LOCATION_CASCADER_OPTIONS = [
  {
    value: "gov",
    label: "政府区域",
    children: [
      { value: "gov_huangyan", label: "黄岩区政府", regionData: RING_HUANGYAN_GOV },
      { value: "gov_jiaojiang", label: "椒江行政中心", regionData: RING_JIAOJIANG_GOV },
    ],
    // children: [
    //   {
    //     value: "huangyan",
    //     label: "黄岩区",
    //     children: [
    //       { value: "gov_huangyan", label: "黄岩区政府", ring: RING_HUANGYAN_GOV },
    //     ],
    //   },
    //   {
    //     value: "jiaojiang",
    //     label: "椒江区",
    //     children: [
    //       { value: "gov_jiaojiang", label: "椒江行政中心", ring: RING_JIAOJIANG_GOV },
    //     ],
    //   },
    // ],
  },
  {
    value: "culture",
    label: "文娱场所",
    children: [
      { value: "culture_plaza", label: "市民文化广场", regionData: RING_CULTURE_PLAZA },
      { value: "culture_stadium", label: "区体育馆", regionData: RING_STADIUM },
    ],
  },
];

const PATH_SEP = "/";

/**
 * @param {string[]} path
 * @param {typeof FLIGHT_LOCATION_CASCADER_OPTIONS} [roots]
 * @param {typeof FLIGHT_LOCATION_CASCADER_OPTIONS} [extraRoots]
 * @returns {{ value: string, label: string, ring?: number[], children?: unknown[] } | null}
 */
export function findLocationNodeByPath(path, roots = FLIGHT_LOCATION_CASCADER_OPTIONS, extraRoots = []) {
  if (!Array.isArray(path) || !path.length) return null;
  const searchIn = (tree) => {
    let level = tree;
    let node = null;
    for (const seg of path) {
      node = level?.find((n) => n.value === seg) ?? null;
      if (!node) return null;
      level = node.children || [];
    }
    return node;
  };
  return searchIn(roots) || searchIn(extraRoots);
}

/** 叶子：无 children 或 children 为空，且带 ring */
export function isLocationLeafNode(node) {
  if (!node) return false;
  const hasChildren = Array.isArray(node.children) && node.children.length > 0;
  return !hasChildren && Array.isArray(node.ring) && node.ring.length >= 6;
}

/**
 * @param {string[]} path
 * @param {Array} [extraRoots] 可选的自定义地点树，优先查预设树再查此树
 * @returns {number[] | null}
 */
export function resolvePolygonRingByPath(path, extraRoots = []) {
  const node = findLocationNodeByPath(path, FLIGHT_LOCATION_CASCADER_OPTIONS, extraRoots);
  if (!isLocationLeafNode(node)) return null;
  return node.ring;
}

/**
 * @param {string[]} path
 * @param {Array} [extraRoots]
 * @returns {string}
 */
export function resolveLocationLabelByPath(path, extraRoots = []) {
  if (!Array.isArray(path) || !path.length) return "";
  const labels = [];
  let level = FLIGHT_LOCATION_CASCADER_OPTIONS;
  let extraLevel = extraRoots;
  for (const seg of path) {
    let node = level?.find((n) => n.value === seg);
    if (!node && extraLevel) {
      node = extraLevel?.find((n) => n.value === seg);
    }
    if (!node) break;
    labels.push(node.label);
    level = node.children || [];
    extraLevel = null;
  }
  return labels.join(" / ");
}

/** 节点 id（路径各段用 / 连接，value 中请勿包含 /） */
export function pathToLocationNodeKey(path) {
  if (!Array.isArray(path) || !path.length) return "";
  return path.join(PATH_SEP);
}

/** @returns {string[] | null} */
export function locationNodeKeyToPath(nodeKey) {
  if (!nodeKey || typeof nodeKey !== "string") return null;
  const parts = nodeKey.split(PATH_SEP).filter(Boolean);
  return parts.length ? parts : null;
}

/**
 * @param {typeof FLIGHT_LOCATION_CASCADER_OPTIONS} nodes
 * @param {string[]} ancestorPath
 */
function mapNodesToTreeData(nodes, ancestorPath = []) {
  if (!Array.isArray(nodes)) return [];
  return nodes.map((node) => {
    const path = [...ancestorPath, node.value];
    const hasChildren = Array.isArray(node.children);
    const children = hasChildren && node.children.length
      ? mapNodesToTreeData(node.children, path)
      : undefined;
    const item = {
      id: pathToLocationNodeKey(path),
      value: node.value,
      label: node.label,
      path,
    };
    // 透传自定义节点的 ring / regionData
    if (node.ring?.length) item.ring = node.ring;
    if (node.regionData) item.regionData = node.regionData;
    // 保留 children 数组（即使为空），以便区分分类与地区
    if (hasChildren) {
      item.children = children || [];
    }
    return item;
  });
}

/** el-tree 数据（递归，任意层级） */
export function buildFlightLocationTreeData() {
  return mapNodesToTreeData(FLIGHT_LOCATION_CASCADER_OPTIONS);
}

/**
 * @param {string[][]} paths
 * @param {Array} [extraRoots]
 * @returns {string}
 */
export function resolveLocationLabelsFromPaths(paths, extraRoots = []) {
  if (!Array.isArray(paths) || !paths.length) return "";
  return paths
    .map((p) => resolveLocationLabelByPath(p, extraRoots))
    .filter(Boolean)
    .join("、");
}

/**
 * @param {string[][]} paths
 * @param {Array} [extraRoots]
 * @returns {number[][]}
 */
export function resolvePolygonRingsFromPaths(paths, extraRoots = []) {
  if (!Array.isArray(paths)) return [];
  return paths
    .map((p) => resolvePolygonRingByPath(p, extraRoots))
    .filter((ring) => ring && ring.length >= 6);
}

/**
 * @param {{ locationPaths?: string[][], locationPath?: string[] }} plan
 * @returns {string[][]}
 */
export function normalizePlanLocationPaths(plan) {
  let paths = [];
  if (plan?.locationPaths?.length) {
    paths = plan.locationPaths.filter((p) => Array.isArray(p) && p.length > 0);
  } else if (Array.isArray(plan?.locationPath) && plan.locationPath.length > 0) {
    paths = [plan.locationPath];
  }
  return paths.map((p) => migrateLegacyLocationPath(p));
}

// ===== 自定义地点树（地点设置） =====

let customCategorySeq = 0;
let customRegionSeq = 0;

/** 深拷贝预设地点树作为自定义地点初始数据 */
export function createCustomLocationTree() {
  return [];
}

/** 从中文 label 生成拼音风格的 value */
function labelToValue(label, prefix) {
  const sanitized = String(label || "")
    .trim()
    .replace(/[^一-龥a-zA-Z0-9]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "")
    .toLowerCase()
    || "item";
  return `${prefix}_${sanitized}_${Date.now().toString(36)}`;
}

/** 创建一级分类节点 */
export function createCategoryNode(label) {
  return {
    value: labelToValue(label, `cat_${++customCategorySeq}`),
    label: String(label || "").trim(),
    children: [],
  };
}

/** 创建二级地区节点（初始无 ring） */
export function createRegionNode(label) {
  return {
    value: labelToValue(label, `reg_${++customRegionSeq}`),
    label: String(label || "").trim(),
    ring: null,
  };
}

/**
 * 将自定义地点树转为 el-tree data + cascader options 双格式
 * 复用已有的 mapNodesToTreeData
 */
export function buildCustomLocationTreeData(tree) {
  if (!Array.isArray(tree)) return [];
  return mapNodesToTreeData(tree);
}

/**
 * 在自定义树中按 value 查找节点（浅层：仅查 category + 其 children）
 * @returns {{ category: object, categoryIndex: number, region: object | null, regionIndex: number } | null}
 */
export function findCustomLocationNode(tree, categoryValue, regionValue) {
  if (!Array.isArray(tree)) return null;
  const catIdx = tree.findIndex((n) => n.value === categoryValue);
  if (catIdx < 0) return null;
  const category = tree[catIdx];
  if (!regionValue) return { category, categoryIndex: catIdx, region: null, regionIndex: -1 };
  const children = category.children || [];
  const regIdx = children.findIndex((n) => n.value === regionValue);
  if (regIdx < 0) return { category, categoryIndex: catIdx, region: null, regionIndex: -1 };
  return { category, categoryIndex: catIdx, region: children[regIdx], regionIndex: regIdx };
}

/** 兼容旧二级路径：gov + gov_huangyan → gov + huangyan + gov_huangyan */
export function migrateLegacyLocationPath(path) {
  if (!Array.isArray(path) || path.length !== 2) return path;
  if (path[0] === "gov" && path[1] === "gov_huangyan") {
    return ["gov", "huangyan", "gov_huangyan"];
  }
  if (path[0] === "gov" && path[1] === "gov_jiaojiang") {
    return ["gov", "jiaojiang", "gov_jiaojiang"];
  }
  return path;
}
