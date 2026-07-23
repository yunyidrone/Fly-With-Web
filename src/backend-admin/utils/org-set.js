import { unwrapApiList } from "@backend/utils/request.js";
import { ORG_LABEL_TEXT } from "@backend/config/constants.js";

function toArray(value) {
  if (value == null) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === "object") return [value];
  return [];
}

/**
 * 是否为单位树子节点（parentId 不为 0 时展示性质标签）
 * @param {Record<string, unknown>} [node]
 */
export function shouldShowOrgLabel(node) {
  const parentId = node?.parentId;
  return parentId != null && parentId !== 0 && parentId !== "0";
}

/**
 * @param {unknown} orgLabel
 */
export function getOrgLabelText(orgLabel) {
  if (orgLabel == null || orgLabel === "") return "";
  const key = Number(orgLabel);
  return ORG_LABEL_TEXT[key] || "";
}

/**
 * 单位树节点名称前的性质标签文案
 * @param {Record<string, unknown>} [node]
 */
export function getOrgTreeNodeLabelText(node) {
  if (!shouldShowOrgLabel(node)) return "";
  return getOrgLabelText(node?.orgLabel);
}

/**
 * 解析接口返回的树形根节点
 * @param {unknown} payload
 * @returns {unknown[]}
 */
function resolveTreeRoots(payload) {
  if (payload == null) return [];
  if (Array.isArray(payload)) return payload;
  if (typeof payload !== "object") return [];

  const obj = /** @type {Record<string, unknown>} */ (payload);
  const nested = obj.tree ?? obj.nodes ?? obj.list ?? obj.records ?? obj.data;
  if (nested != null && nested !== payload) {
    return resolveTreeRoots(nested);
  }

  if (
    obj.id != null ||
    obj.orgId != null ||
    obj.name != null ||
    obj.orgName != null ||
    obj.children != null ||
    obj.childList != null
  ) {
    return [obj];
  }

  return [];
}

/**
 * 标准化单位树节点，确保 children 始终为数组
 * @param {unknown} node
 */
export function normalizeOrgTreeNode(node) {
  if (node == null || typeof node !== "object") return null;

  const item = /** @type {Record<string, unknown>} */ (node);
  const childrenSource = item.children ?? item.childList ?? item.nodes ?? item.subList;
  const children = toArray(childrenSource)
    .map(normalizeOrgTreeNode)
    .filter(Boolean);

  const id = item.id ?? item.orgId ?? item.value;
  const name =
    item.name ?? item.orgName ?? item.label ?? item.title ?? String(id ?? "");

  return {
    ...item,
    id,
    name,
    children,
  };
}

/**
 * 标准化单位树，供 el-tree 使用
 * @param {unknown} payload
 * @returns {Record<string, unknown>[]}
 */
export function normalizeOrgTree(payload) {
  return resolveTreeRoots(payload)
    .map(normalizeOrgTreeNode)
    .filter(Boolean);
}

/**
 * 标准化单位集级联节点；无 children 即为末级
 * @param {unknown} item
 */
function normalizeOrgSetNode(item) {
  if (item == null || typeof item !== "object") return null;

  const record = /** @type {Record<string, unknown>} */ (item);
  const id =
    record.id ??
    record.setId ??
    record.orgSetId ??
    record.code ??
    record.region ??
    record.value;
  const name =
    record.name ??
    record.setName ??
    record.orgSetName ??
    record.regionName ??
    record.label ??
    String(id ?? "");

  if (id == null || id === "") return null;

  const childrenSource =
    record.children ?? record.childList ?? record.nodes ?? record.subList;
  const option = { id, name: String(name) };

  if (childrenSource != null) {
    const children = toArray(childrenSource)
      .map(normalizeOrgSetNode)
      .filter(Boolean);
    if (children.length) {
      option.children = children;
    }
  }

  return option;
}

/**
 * 将单位集接口数据转为级联选项（兼容扁平列表与树形结构）
 * @param {unknown} payload
 */
export function mapOrgSetCascaderOptions(payload) {
  if (payload == null) return [];

  if (Array.isArray(payload)) {
    const options = payload.map(normalizeOrgSetNode).filter(Boolean);
    if (options.length) return options;
  }

  const list = unwrapApiList(payload);
  if (!list.length && typeof payload === "object") {
    const single = normalizeOrgSetNode(payload);
    return single ? [single] : [];
  }

  return list.map(normalizeOrgSetNode).filter(Boolean);
}

/**
 * 将单位集接口数据转为下拉选项
 * @param {unknown} payload
 * @returns {{ label: string, value: string|number }[]}
 */
export function mapOrgSetOptions(payload) {
  return unwrapApiList(payload)
    .map((item) => {
      if (item == null || typeof item !== "object") return null;

      const value =
        item.id ??
        item.setId ??
        item.orgSetId ??
        item.code ??
        item.region ??
        item.value;
      const label =
        item.name ??
        item.setName ??
        item.orgSetName ??
        item.regionName ??
        item.label ??
        String(value ?? "");

      if (value == null || value === "") return null;
      return { label: String(label), value };
    })
    .filter(Boolean);
}

/**
 * 单位树 el-cascader 配置（无 children 即为末级）
 */
export const ORG_CASCADER_PROPS = {
  label: "name",
  value: "id",
  children: "children",
  emitPath: false,
};

/** 单位集级联与单位级联共用配置 */
export const ORG_SET_CASCADER_PROPS = ORG_CASCADER_PROPS;

/**
 * 转为级联下拉选项；无下级时不设置 children
 * @param {unknown} nodes
 */
export function buildOrgCascaderOptions(nodes) {
  return normalizeOrgTree(nodes).map((node) => {
    const option = {
      id: node.id,
      name: node.name,
      orgLabel: node.orgLabel,
      parentId: node.parentId,
    };

    if (node.children?.length) {
      option.children = buildOrgCascaderOptions(node.children);
    }

    return option;
  });
}

/**
 * @param {unknown} nodes
 * @param {string|number} orgId
 */
export function findOrgInTree(nodes, orgId) {
  for (const node of normalizeOrgTree(nodes)) {
    if (String(node.id) === String(orgId)) return node;
    if (node.children?.length) {
      const found = findOrgInTree(node.children, orgId);
      if (found) return found;
    }
  }
  return null;
}

/**
 * @param {unknown} nodes
 */
export function findFirstLeafOrgId(nodes) {
  for (const node of normalizeOrgTree(nodes)) {
    if (node.children?.length) {
      const leafId = findFirstLeafOrgId(node.children);
      if (leafId != null) return leafId;
      continue;
    }
    if (node.id != null) return node.id;
  }
  return null;
}

/**
 * @param {unknown} nodes
 * @param {unknown[]} [result]
 */
export function collectLeafOrgIds(nodes, result = []) {
  for (const node of normalizeOrgTree(nodes)) {
    if (node.children?.length) {
      collectLeafOrgIds(node.children, result);
      continue;
    }
    if (node.id != null) result.push(node.id);
  }
  return result;
}

/**
 * @param {unknown} nodes
 * @param {{ id: string|number, name: string }} orgNode
 */
export function prependOrgNodeToTree(nodes, orgNode) {
  if (findOrgInTree(nodes, orgNode.id)) return nodes;
  return [orgNode, ...normalizeOrgTree(nodes)];
}

/**
 * 将单位树扁平化为下拉选项
 * @param {unknown} nodes
 * @param {{ id: string|number, name: string }[]} [result]
 */
export function flattenOrgTree(nodes, result = []) {
  for (const node of normalizeOrgTree(nodes)) {
    if (node.id != null) {
      result.push({ id: node.id, name: node.name });
    }
    if (node.children?.length) {
      flattenOrgTree(node.children, result);
    }
  }
  return result;
}
