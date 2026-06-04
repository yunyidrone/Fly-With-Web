/**
 * 无人机 OSD 遥测（MQTT topic: thing/product/{sn}/osd）
 */

export const DRONE_OSD_MQTT_TOPIC = "thing/product/+/osd";

export function toFiniteNumber(v) {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() !== "") {
    const n = Number(v);
    if (Number.isFinite(n)) return n;
  }
  return null;
}

/** @param {string} actualTopic */
export function extractOsdSnFromTopic(actualTopic) {
  return String(actualTopic?.split("/")[2] || "").trim();
}

/**
 * @param {unknown} msg MQTT 消息体（可能包在 data 字段内）
 * @returns {Record<string, number | undefined> | null}
 */
export function parseDroneOsdPayload(msg) {
  const payload = msg && typeof msg === "object" && "data" in msg ? msg.data : msg;
  if (!payload || typeof payload !== "object") return null;

  const lng = toFiniteNumber(payload.longitude ?? payload.lng);
  const lat = toFiniteNumber(payload.latitude ?? payload.lat);
  const height = toFiniteNumber(payload.height ?? payload.altitude);
  const attitudeHead = toFiniteNumber(
    payload.attitude_head ?? payload.attitudeHead ?? payload.head,
  );
  const attitudePitch = toFiniteNumber(
    payload.attitude_pitch ?? payload.attitudePitch ?? payload.pitch,
  );
  const attitudeRoll = toFiniteNumber(
    payload.attitude_roll ?? payload.attitudeRoll ?? payload.roll,
  );
  const batteryPercent = toFiniteNumber(
    payload?.battery?.batteries?.[0]?.capacity_percent ?? payload.battery,
  );
  const distanceLimit = toFiniteNumber(
    payload?.distance_limit_status?.distance_limit ?? payload.endurance,
  );

  return {
    battery: Number.isFinite(batteryPercent) ? batteryPercent : undefined,
    endurance: Number.isFinite(distanceLimit) ? distanceLimit : undefined,
    lng: Number.isFinite(lng) ? lng : undefined,
    lat: Number.isFinite(lat) ? lat : undefined,
    height: Number.isFinite(height) ? height : undefined,
    attitudeHead: Number.isFinite(attitudeHead) ? attitudeHead : undefined,
    attitudePitch: Number.isFinite(attitudePitch) ? attitudePitch : undefined,
    attitudeRoll: Number.isFinite(attitudeRoll) ? attitudeRoll : undefined,
  };
}

/**
 * @param {import('@/stores/device.js').useDeviceStore} deviceStore
 * @param {string} sn
 * @param {unknown} msg
 */
export function applyDroneOsdMessage(deviceStore, sn, msg) {
  const key = String(sn || "").trim();
  if (!key) return false;
  const telemetry = parseDroneOsdPayload(msg);
  if (!telemetry) return false;
  return deviceStore.updateDroneTelemetryBySn(key, telemetry);
}
