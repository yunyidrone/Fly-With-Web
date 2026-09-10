import { normalizeWarnEvent } from "@/utils/plan-algorithm-data.js";

/** @param {Record<string, any> | null | undefined} drone */
export function resolveDroneSn(drone) {
  return String(drone?.sn ?? drone?.mqttSn ?? "").trim();
}

/** @param {Record<string, any> | null | undefined} drone */
export function resolveDroneThirdPartyId(drone) {
  return String(
    drone?.thirdPartyId ??
      drone?.third_party_id ??
      drone?.uuid ??
      drone?.taskUuid ??
      drone?.task_uuid ??
      "",
  ).trim();
}

/** @param {string} thirdPartyId 任务 uuid */
export function buildDroneAiResultTopic(thirdPartyId) {
  return `drone/${thirdPartyId}/aiResult`;
}

/**
 * @param {Record<string, any> | null | undefined} detail
 */
export function formatAiAlertCoord(detail) {
  if (!detail || typeof detail !== "object") return "—";
  const lng = detail.longitude ?? detail.lng;
  const lat = detail.latitude ?? detail.lat;
  if (
    lng != null &&
    lat != null &&
    Number.isFinite(Number(lng)) &&
    Number.isFinite(Number(lat))
  ) {
    return `${Number(lng)}, ${Number(lat)}`;
  }
  return String(detail.coord ?? "—").trim() || "—";
}

/** @param {string} sn 无人机 SN */
export function buildDroneAiResultYxTopic(sn) {
  return `drone/${String(sn || "").trim()}/aiResult-yx`;
}

/** @param {Record<string, any> | null | undefined} drone */
export function isYxDrone(drone) {
  const name = String(drone?.name ?? "").trim();
  return /yx/i.test(name);
}

function parseMqttPayload(msg) {
  if (msg == null) return null;

  let raw = msg;
  if (typeof raw === "string") {
    try {
      raw = JSON.parse(raw);
    } catch {
      return null;
    }
  }

  if (typeof raw !== "object" || raw === null) return null;

  return raw.data && typeof raw.data === "object"
    ? raw.data
    : raw.payload && typeof raw.payload === "object"
      ? raw.payload
      : raw;
}

function formatPlateNumbers(value) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item ?? "").trim()).filter(Boolean).join("、");
  }
  return String(value ?? "").trim();
}

/** ISO（如 2026-09-10T08:00:00Z）转为本地 YYYY-MM-DD HH:mm:ss */
function formatYxEventTime(value) {
  const text = String(value ?? "").trim();
  if (!text) return "";
  const date = new Date(text);
  if (Number.isNaN(date.getTime())) return text;
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

/**
 * yx 无人机 MQTT（drone/{sn}/aiResult-yx）→ 与 normalizeWarnEvent 兼容的结构
 * @param {unknown} msg
 * @param {{ droneName?: string }} [options]
 */
export function parseDroneAiResultYxMessage(msg, options = {}) {
  const payload = parseMqttPayload(msg);
  if (!payload || typeof payload !== "object") return null;

  const plateNumbers = formatPlateNumbers(payload.plate_numbers ?? payload.plateNumbers);
  if (!plateNumbers) return null;

  const imageUrl = String(
    payload.initial_image_url ?? payload.initialImageUrl ?? "",
  ).trim();

  return normalizeWarnEvent({
    id: payload.event_id ?? payload.eventId ?? `yx-${Date.now()}`,
    name: String(payload.target_object ?? payload.targetObject ?? "车牌识别").trim() || "车牌识别",
    aiResult: plateNumbers,
    alarmTime: formatYxEventTime(
      payload.recognized_at ?? payload.recognizedAt ?? payload.timestamp,
    ),
    imageUrl,
    originalImageUrl: imageUrl,
    longitude: payload.longitude,
    latitude: payload.latitude,
    droneName: String(options.droneName ?? payload.device_sn ?? payload.deviceSn ?? "").trim(),
  });
}

/**
 * @param {unknown} msg
 * @returns {ReturnType<typeof normalizeWarnEvent> | null}
 */
export function parseDroneAiResultMessage(msg) {
  const payload = parseMqttPayload(msg);
  if (!payload) return null;
  console.log("AI智能识别", payload);
  return normalizeWarnEvent(payload);
}

/**
 * @param {ReturnType<typeof normalizeWarnEvent>} ev
 */
export function toAiRecognitionEvent(ev) {
  if (!ev) return null;

  const lng = ev.longitude;
  const lat = ev.latitude;
  let coord = "";
  if (
    lng != null &&
    lat != null &&
    Number.isFinite(Number(lng)) &&
    Number.isFinite(Number(lat))
  ) {
    coord = `${Number(lng).toFixed(6)}, ${Number(lat).toFixed(6)}`;
  }

  return {
    key: ev.id,
    type: ev.warnType || "—",
    time: ev.eventTime || "—",
    image: ev.imageUrl || "",
    previewImage: ev.imageUrl || "",
    result: ev.aiResult || "—",
    coord,
  };
}
