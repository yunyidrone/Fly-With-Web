import { normalizeWarnEvent } from "@/utils/plan-algorithm-data.js";

/** @param {Record<string, any> | null | undefined} drone */
export function resolveDroneSn(drone) {
  return String(drone?.sn ?? drone?.mqttSn ?? "").trim();
}

/** @param {Record<string, any> | null | undefined} drone */
export function resolveDroneThirdPartyId(drone) {
  return String(
    drone?.thirdPartyId ?? drone?.third_party_id ?? "",
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

/**
 * @param {unknown} msg
 * @returns {ReturnType<typeof normalizeWarnEvent> | null}
 */
export function parseDroneAiResultMessage(msg) {
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

  const payload =
    raw.data && typeof raw.data === "object"
      ? raw.data
      : raw.payload && typeof raw.payload === "object"
        ? raw.payload
        : raw;

  return normalizeWarnEvent(payload);
}

/**
 * @param {ReturnType<typeof normalizeWarnEvent>} ev
 */
export function toAiRecognitionEvent(ev) {
  if (!ev) return null;

  const lng = ev.longitude;
  const lat = ev.latitude;
  let coord = "经纬度";
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
