import {
  DRONE_RAW_STATUS,
  DRONE_TYPE,
  DRONE_TYPE_META,
  DRONE_WORK_STATUS,
} from "@backend/config/constants.js";

function resolveDroneTypeKind(raw) {
  const text = `${raw.name || ""} ${raw.type || ""} ${raw.category || ""} ${raw.deviceType || ""}`;
  if (/机场|airport|dock|机巢/i.test(text)) return DRONE_TYPE.DOCK;
  return DRONE_TYPE.SINGLE;
}

function resolveDroneModel(raw) {
  const model = raw.model || raw.modelName || raw.deviceModel;
  if (model) return String(model);
  const match = String(raw.name || "").match(/M\d+|DJI[\w-]+/i);
  return match ? match[0] : "型号";
}

function resolveBattery(raw) {
  const value = raw.battery ?? raw.batteryLevel ?? raw.batteryPercent;
  if (value == null || value === "") return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

function resolveDeviceEnabled(raw) {
  if (raw.enabled === false || raw.enabled === 0 || raw.deviceStatus === 0) return false;
  if (raw.status === "disabled") return false;
  return true;
}

function formatCoord(longitude, latitude) {
  const lng =
    typeof longitude === "number" && Number.isFinite(longitude) ? longitude : null;
  const lat = typeof latitude === "number" && Number.isFinite(latitude) ? latitude : null;
  if (lng == null && lat == null) return "-";
  return `(${lng ?? "-"}, ${lat ?? "-"})`;
}

export function formatDockLocation(raw) {
  const preset =
    raw.dockLocation ?? raw.baseLocation ?? raw.airportLocation ?? raw.location ?? "";
  if (String(preset).trim()) return String(preset).trim();

  const lng =
    typeof raw.longitude === "number" && Number.isFinite(raw.longitude) ? raw.longitude : null;
  const lat =
    typeof raw.latitude === "number" && Number.isFinite(raw.latitude) ? raw.latitude : null;
  if (lng == null && lat == null) return "";
  return `${lng ?? ""}, ${lat ?? ""}`.replace(/^,\s*|,\s*$/g, "").trim();
}

function parseDockLocation(value) {
  const text = String(value || "").trim();
  if (!text) return null;

  const match = text.match(/(-?\d+(?:\.\d+)?)\s*[,，]\s*(-?\d+(?:\.\d+)?)/);
  if (!match) return { raw: text };

  const longitude = Number(match[1]);
  const latitude = Number(match[2]);
  if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) return { raw: text };

  return { longitude, latitude, raw: text };
}

/**
 * 将后端 drone 记录转为 Admin 列表/表单使用的结构
 * 字段对齐 accompaning-fly-project/src/stores/device.js
 * @param {Record<string, any>} raw
 */
export function normalizeDroneRecord(raw) {
  if (!raw || typeof raw !== "object") return raw;

  const statusNum =
    typeof raw.status === "number"
      ? raw.status
      : raw.status === "" || raw.status == null
        ? NaN
        : Number(raw.status);

  const meta = DRONE_RAW_STATUS[statusNum] || { label: "未知", type: "info" };
  const droneTypeKind = resolveDroneTypeKind(raw);
  const typeMeta = DRONE_TYPE_META[droneTypeKind];

  return {
    ...raw,
    id: raw.id != null ? String(raw.id) : "",
    name: raw.name?.trim?.() ? raw.name : raw.sn || "无人机",
    sn: raw.sn ?? "",
    mqttSn: String(raw.sn ?? raw.mqttSn ?? "").trim(),
    waylineId: raw.waylineId ?? "",
    streamUrl: raw.streamUrl ?? "",
    playUrl: raw.playUrl ?? raw.play_url ?? "",
    description: raw.description ?? "",
    createTime: raw.createTime ?? raw.createdAt ?? "",
    executeTime: raw.executeTime ?? "",
    rawStatus: Number.isFinite(statusNum) ? statusNum : undefined,
    statusText: meta.label,
    statusType: meta.type,
    longitude: raw.longitude,
    latitude: raw.latitude,
    targetId: raw.targetId ?? "",
    distance: raw.distance,
    battery: resolveBattery(raw),
    isOnline: Number.isFinite(statusNum) ? statusNum !== 0 : null,
    workStatusText: DRONE_WORK_STATUS[statusNum] ?? "-",
    deviceEnabled: resolveDeviceEnabled(raw),
    droneTypeKind,
    droneTypeLabel: `${typeMeta.prefix}-${resolveDroneModel(raw)}`,
    droneTypeTagType: typeMeta.tagType,
    coordText: formatCoord(raw.longitude, raw.latitude),
    model: resolveDroneModel(raw),
    dockLocation: formatDockLocation(raw),
  };
}

export function normalizeDroneList(payload) {
  if (!Array.isArray(payload)) return [];
  return payload.map(normalizeDroneRecord);
}

/**
 * 提交新增/编辑时的请求体（与现网 /drone/add、/drone/update 对齐）
 * @param {Record<string, any>} form
 * @param {{ id?: string }} [options]
 */
export function buildDronePayload(form, options = {}) {
  const droneType = form.droneType === DRONE_TYPE.DOCK ? DRONE_TYPE.DOCK : DRONE_TYPE.SINGLE;
  const dockInfo = parseDockLocation(form.dockLocation);

  const payload = {
    name: String(form.name || "").trim(),
    sn: String(form.sn || "").trim(),
    model: String(form.model || "").trim(),
    type: droneType === DRONE_TYPE.DOCK ? "dock" : "single",
    category: droneType === DRONE_TYPE.DOCK ? "机场" : "单兵",
    deviceType: droneType === DRONE_TYPE.DOCK ? "机场" : "单兵",
  };

  if (dockInfo?.longitude != null && dockInfo?.latitude != null) {
    payload.longitude = dockInfo.longitude;
    payload.latitude = dockInfo.latitude;
    payload.dockLocation = dockInfo.raw;
  } else if (dockInfo?.raw) {
    payload.dockLocation = dockInfo.raw;
  }

  if (options.id) {
    payload.id = String(options.id);
  }

  return payload;
}
