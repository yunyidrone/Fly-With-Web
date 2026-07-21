import { normalizeAreaData, serializeAreaData } from "@/utils/tianditu-area.js";

export { normalizeAreaData, serializeAreaData };

/**
 * 从单位详情中解析辖区范围
 * @param {Record<string, any> | null | undefined} raw
 */
export function parseJurisdictionArea(raw) {
  return normalizeAreaData(raw);
}

/**
 * 提交单位表单时携带辖区字段
 * @param {Record<string, any>} form
 */
export function buildOrgJurisdictionPayload(form) {
  const jurisdictionArea = serializeAreaData(form.jurisdictionArea);
  return {
    jurisdictionArea,
    jurisdictionRing: jurisdictionArea?.ring ?? null,
  };
}
