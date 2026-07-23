import { normalizeAreaData, serializeAreaData } from "@/utils/tianditu-area.js";

export { normalizeAreaData, serializeAreaData };

/**
 * 从单位详情中解析辖区范围
 * @param {Record<string, any> | null | undefined} raw
 */
export function parseJurisdictionArea(raw) {
  if (!raw) return null;

  const fromRoiArea = normalizeAreaData(raw.roiArea);
  if (fromRoiArea) return fromRoiArea;

  return normalizeAreaData({
    ...raw,
    jurisdictionArea: raw.roiArea ?? raw.jurisdictionArea,
    jurisdictionRing: raw.roiRing ?? raw.jurisdictionRing,
  });
}

/**
 * 提交单位表单时携带辖区字段
 * @param {Record<string, any>} form
 */
export function buildOrgJurisdictionPayload(form) {
  const roiArea = serializeAreaData(form.jurisdictionArea);
  return {
    roiArea,
    roiRing: roiArea?.ring ?? null,
  };
}
