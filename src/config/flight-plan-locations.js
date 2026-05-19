/**
 * 飞行计划 — 地点树（支持多级 children）
 * 仅「叶子节点」配置 ring 时可勾选并上图
 * ring: 闭合多边形 [lng, lat, lng, lat, ...]（WGS84）
 */

const R = (pairs) => pairs.flat();

const RING_HUANGYAN_GOV = R([
  [121.418, 28.6565],
  [121.432, 28.6565],
  [121.432, 28.6495],
  [121.418, 28.6495],
  [121.418, 28.6565],
]);

const RING_JIAOJIANG_GOV = R([
  [121.402, 28.672],
  [121.418, 28.672],
  [121.418, 28.664],
  [121.402, 28.664],
  [121.402, 28.672],
]);

const RING_CULTURE_PLAZA = R([
  [121.424, 28.658],
  [121.43, 28.658],
  [121.4285, 28.652],
  [121.422, 28.653],
  [121.424, 28.658],
]);

const RING_STADIUM = R([
  [121.438, 28.646],
  [121.446, 28.646],
  [121.446, 28.64],
  [121.438, 28.64],
  [121.438, 28.646],
]);

export const FLIGHT_LOCATION_CASCADER_OPTIONS = [
  {
    value: "gov",
    label: "政府区域",
    children: [
      { value: "gov_huangyan", label: "黄岩区政府", ring: RING_HUANGYAN_GOV },
      { value: "gov_jiaojiang", label: "椒江行政中心", ring: RING_JIAOJIANG_GOV },
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
      { value: "culture_plaza", label: "市民文化广场", ring: RING_CULTURE_PLAZA },
      { value: "culture_stadium", label: "区体育馆", ring: RING_STADIUM },
    ],
  },
];

const PATH_SEP = "/";

/**
 * @param {string[]} path
 * @param {typeof FLIGHT_LOCATION_CASCADER_OPTIONS} [roots]
 * @returns {{ value: string, label: string, ring?: number[], children?: unknown[] } | null}
 */
export function findLocationNodeByPath(path, roots = FLIGHT_LOCATION_CASCADER_OPTIONS) {
  if (!Array.isArray(path) || !path.length) return null;
  let level = roots;
  let node = null;
  for (const seg of path) {
    node = level?.find((n) => n.value === seg) ?? null;
    if (!node) return null;
    level = node.children || [];
  }
  return node;
}

/** 叶子：无 children 或 children 为空，且带 ring */
export function isLocationLeafNode(node) {
  if (!node) return false;
  const hasChildren = Array.isArray(node.children) && node.children.length > 0;
  return !hasChildren && Array.isArray(node.ring) && node.ring.length >= 6;
}

/**
 * @param {string[]} path
 * @returns {number[] | null}
 */
export function resolvePolygonRingByPath(path) {
  const node = findLocationNodeByPath(path);
  if (!isLocationLeafNode(node)) return null;
  return node.ring;
}

/**
 * @param {string[]} path
 * @returns {string}
 */
export function resolveLocationLabelByPath(path) {
  if (!Array.isArray(path) || !path.length) return "";
  const labels = [];
  let level = FLIGHT_LOCATION_CASCADER_OPTIONS;
  for (const seg of path) {
    const node = level?.find((n) => n.value === seg);
    if (!node) break;
    labels.push(node.label);
    level = node.children || [];
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
    const children = node.children?.length ? mapNodesToTreeData(node.children, path) : undefined;
    const item = {
      id: pathToLocationNodeKey(path),
      label: node.label,
      path,
    };
    if (children?.length) {
      item.children = children;
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
 * @returns {string}
 */
export function resolveLocationLabelsFromPaths(paths) {
  if (!Array.isArray(paths) || !paths.length) return "";
  return paths
    .map((p) => resolveLocationLabelByPath(p))
    .filter(Boolean)
    .join("、");
}

/**
 * @param {string[][]} paths
 * @returns {number[][]}
 */
export function resolvePolygonRingsFromPaths(paths) {
  if (!Array.isArray(paths)) return [];
  return paths
    .map((p) => resolvePolygonRingByPath(p))
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
