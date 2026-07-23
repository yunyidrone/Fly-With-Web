import { ORG_LABEL } from "@backend/config/constants.js";
import { buildOrgJurisdictionPayload, parseJurisdictionArea } from "@backend/utils/jurisdiction.js";

/**
 * 单位详情 -> 表单
 * @param {Record<string, unknown>} data
 */
export function parseOrgFormDetail(data) {
  const rootId = data.rootId ?? data.region;
  return {
    region: rootId ?? "",
    parentId: data.parentId,
    rootId,
    name: data.name ?? "",
    orgLabel: Number(data.orgLabel) || ORG_LABEL.POLICE_STATION,
    status: data.status ?? 0,
    description: data.description ?? "",
    jurisdictionArea: parseJurisdictionArea(data),
  };
}

/**
 * 表单 -> 新增/编辑 payload
 * @param {Record<string, unknown>} form
 * @param {{ id?: string|number }} [options]
 */
export function buildOrgFormPayload(form, options = {}) {
  const { roiArea, roiRing } = buildOrgJurisdictionPayload(form);
  const orgSetId = form.region;
  const rootId = form.rootId ?? orgSetId;
  const isEdit = options.id != null && options.id !== "";

  const payload = {
    name: form.name,
    parentId: isEdit ? form.parentId : orgSetId,
    rootId,
    orgLabel: form.orgLabel,
    status: form.status ?? 0,
    description: form.description ?? "",
    roiArea,
    roiRing,
  };

  if (options.id != null && options.id !== "") {
    payload.id = options.id;
  }

  return payload;
}
