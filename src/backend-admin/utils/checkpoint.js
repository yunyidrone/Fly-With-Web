import { CHECKPOINT_TYPE_LABELS } from "@backend/config/constants.js";

function resolveDroneId(raw) {
  const nested = raw?.drone && typeof raw.drone === "object" ? raw.drone : null;
  const value = raw?.droneId ?? raw?.drone_id ?? raw?.uavId ?? nested?.id;
  if (value == null || value === "") return "";
  return String(value);
}

function resolveDroneName(raw) {
  const nested = raw?.drone && typeof raw.drone === "object" ? raw.drone : null;
  const name =
    raw?.droneName ?? raw?.drone_name ?? raw?.uavName ?? nested?.name ?? nested?.sn;
  if (name == null || String(name).trim() === "") return "";
  return String(name).trim();
}

/**
 * 将后端卡点记录转为 Admin 列表使用的结构
 * @param {Record<string, any>} raw
 */
export function normalizeCheckpointRecord(raw) {
  if (!raw || typeof raw !== "object") return raw;

  const longitude = raw.longitude ?? raw.lng;
  const latitude = raw.latitude ?? raw.lat;
  const altitude = raw.altitude ?? raw.alt;
  const type = Number(raw.type);
  const coordParts = [longitude, latitude].filter((value) => value != null && value !== "");
  if (altitude != null && altitude !== "") {
    coordParts.push(altitude);
  }

  const droneId = resolveDroneId(raw);
  const droneName = resolveDroneName(raw);

  return {
    ...raw,
    id: raw.id != null ? raw.id : "",
    name: String(raw.name ?? "").trim() || "未命名卡点",
    type: Number.isFinite(type) && type > 0 ? type : null,
    typeLabel: CHECKPOINT_TYPE_LABELS[type] || "-",
    coord: coordParts.join(", "),
    longitude,
    latitude,
    description: raw.description ?? "",
    droneId,
    droneName,
  };
}

/**
 * 构建新增/编辑卡点请求体
 * @param {Record<string, any>} form
 * @param {Record<string, any>} [extra]
 */
export function buildCheckpointPayload(form, extra = {}) {
  const payload = {
    name: String(form.name ?? "").trim(),
    longitude: Number(form.longitude),
    latitude: Number(form.latitude),
    type: Number(form.type),
    description: String(form.description ?? "").trim(),
    droneId: String(form.droneId ?? "").trim(),
    ...extra,
  };
  if (extra.id != null) {
    payload.id = extra.id;
  }
  return payload;
}

export function normalizeCheckpointList(payload) {
  if (!Array.isArray(payload)) return [];
  return payload.map(normalizeCheckpointRecord);
}
