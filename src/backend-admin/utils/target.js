import { TARGET_TYPE_LABELS } from "@backend/config/constants.js";

/**
 * 将后端 target 记录转为 Admin 列表/表单使用的结构
 * @param {Record<string, any>} raw
 */
export function normalizeTargetRecord(raw) {
  if (!raw || typeof raw !== "object") return raw;

  const typeNum = Number(raw.type ?? raw.targetType ?? raw.category ?? 1) || 1;
  const sn = String(
    raw.sn ?? raw.targetSn ?? raw.terminalPhone ?? raw.deviceSn ?? raw.vehicleSn ?? "",
  ).trim();

  return {
    ...raw,
    id: raw.id != null ? String(raw.id) : "",
    name: raw.name?.trim?.() ? raw.name : sn || "目标设备",
    sn,
    type: typeNum,
    typeLabel: TARGET_TYPE_LABELS[typeNum] || `类型${typeNum}`,
    orgId: raw.orgId ?? raw.org_id ?? null,
    rootOrgId: raw.rootOrgId ?? raw.rootId ?? raw.root_org_id ?? null,
    orgName: raw.orgName ?? raw.org_name ?? "",
  };
}

export function normalizeTargetList(payload) {
  if (!Array.isArray(payload)) return [];
  return payload.map(normalizeTargetRecord);
}

/**
 * 提交新增/编辑时的请求体
 * @param {Record<string, any>} form
 * @param {{ id?: string, rootOrgId?: string|number }} [options]
 */
export function buildTargetPayload(form, options = {}) {
  const payload = {
    name: String(form.name || "").trim(),
    sn: String(form.sn || "").trim(),
    terminalPhone: String(form.sn || "").trim(),
    type: Number(form.type) || 1,
    orgId: form.orgId,
  };

  const rootOrgId = options.rootOrgId ?? form.rootOrgId;
  if (rootOrgId != null && rootOrgId !== "") {
    payload.rootOrgId = rootOrgId;
  }

  if (options.id) {
    payload.id = String(options.id);
  }

  return payload;
}
