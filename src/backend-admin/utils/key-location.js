import { PLACE_TYPE_LABELS, PLAN_TYPE_LABELS } from "@backend/config/constants.js";
import { unwrapApiList } from "@backend/utils/request.js";

function formatCoord(longitude, latitude, radius) {
  const parts = [longitude, latitude].filter((value) => value != null && value !== "");
  if (radius != null && radius !== "") {
    parts.push(radius);
  }
  return parts.length ? parts.join(", ") : "-";
}

/**
 * 将后端地点记录转为 Admin 列表/表单使用的结构
 * @param {Record<string, any>} raw
 */
export function normalizeKeyLocationRecord(raw) {
  if (!raw || typeof raw !== "object") return raw;

  const placeType = Number(raw.placeType) || null;
  const planType = Number(raw.type) || null;
  const longitude = raw.longitude ?? raw.lng;
  const latitude = raw.latitude ?? raw.lat;
  const radius = raw.radius;

  return {
    ...raw,
    id: raw.id != null ? String(raw.id) : "",
    name: String(raw.name ?? "").trim() || "未命名地点",
    type: planType,
    typeLabel: PLAN_TYPE_LABELS[planType] || "-",
    placeType,
    category: PLACE_TYPE_LABELS[placeType] || "-",
    orgId: raw.orgId ?? null,
    rootOrgId: raw.rootOrgId ?? null,
    orgName: String(raw.orgName ?? raw.org?.name ?? "").trim(),
    longitude,
    latitude,
    radius,
    description: String(raw.description ?? "").trim(),
    coord: formatCoord(longitude, latitude, radius),
  };
}

export function normalizeKeyLocationList(payload) {
  if (!Array.isArray(payload)) return [];
  return payload.map(normalizeKeyLocationRecord);
}

/**
 * 兼容 /place/listQuery 分组结构
 * @param {unknown} payload
 * @param {{ planType?: number }} [options]
 */
export function flattenPlaceListQuery(payload, options = {}) {
  const groups = unwrapApiList(payload);
  if (!groups.length) return [];

  const first = groups[0];
  if (first && !first.followPlaceList && (first.name || first.longitude != null)) {
    return normalizeKeyLocationList(groups);
  }

  const records = [];
  for (const group of groups) {
    const groupPlaceType = group?.placeType;
    const places = Array.isArray(group?.followPlaceList) ? group.followPlaceList : [];
    for (const item of places) {
      if (item?.delFlag === 1 || item?.delFlag === "1") continue;
      records.push(
        normalizeKeyLocationRecord({
          ...item,
          placeType: item?.placeType ?? groupPlaceType,
          type: item?.type ?? options.planType,
        }),
      );
    }
  }
  return records;
}

/**
 * 构建新增/编辑请求体
 * @param {Record<string, any>} form
 * @param {{ id?: string }} [options]
 */
export function buildKeyLocationPayload(form, options = {}) {
  const payload = {
    orgId: form.orgId,
    rootOrgId: form.rootOrgId,
    type: Number(form.type),
    placeType: Number(form.placeType),
    name: String(form.name ?? "").trim(),
    longitude: Number(form.longitude),
    latitude: Number(form.latitude),
    radius: Number(form.radius),
  };

  const description = String(form.description ?? "").trim();
  if (description) {
    payload.description = description;
  }

  if (options.id) {
    payload.id = String(options.id);
  }

  return payload;
}
