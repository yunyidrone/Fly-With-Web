import { unwrapApiList } from "@/utils/request.js";
import { SCENARIO_TITLE_BY_KEY } from "@/components/plan-panel/plan-scenarios.js";
import { resolvePlanStartModeLabel } from "@/utils/plan-task.js";

/** 可选日期：今日起往前 30 天（含今日） */
export const PLAN_HISTORY_MAX_DAYS = 30;

export function formatDateYmd(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function getTodayYmd() {
  return formatDateYmd(new Date());
}

export function getHistoryMinDateYmd() {
  const d = new Date();
  d.setDate(d.getDate() - (PLAN_HISTORY_MAX_DAYS - 1));
  return formatDateYmd(d);
}

/** 历史记录默认日期范围：今日 */
export function getDefaultHistoryDateRange() {
  const today = getTodayYmd();
  return [today, today];
}

/** 历史记录可选最大范围：近 30 日（含今日） */
export function getHistoryFullDateRange() {
  return [getHistoryMinDateYmd(), getTodayYmd()];
}

/**
 * @param {Date} date
 */
export function isDateInHistoryRange(date) {
  const t = date.getTime();
  const min = new Date(getHistoryMinDateYmd());
  min.setHours(0, 0, 0, 0);
  const max = new Date();
  max.setHours(23, 59, 59, 999);
  return t >= min.getTime() && t <= max.getTime();
}

/**
 * @param {unknown} payload
 */
export function unwrapHistoryRecordList(payload) {
  return unwrapApiList(payload);
}

function apiTypeToScenarioKey(typeNum) {
  if (typeNum === 2) return "water";
  if (typeNum === 3) return "security";
  return "mountain";
}

function toHm(t) {
  if (t == null || t === "") return "";
  const s = String(t);
  return s.length >= 5 ? s.slice(0, 5) : s;
}

function formatResourceSummary(raw) {
  const rc = raw?.resourceConfig ?? raw?.resourceList;
  if (Array.isArray(rc) && rc.length) {
    return rc
      .map((r) => {
        const label = r?.resourceTypeName ?? r?.resourceType ?? r?.key ?? "资源";
        const count = Number(r?.resourceCount ?? r?.count) || 0;
        return count > 0 ? `${label}×${count}` : "";
      })
      .filter(Boolean)
      .join("、");
  }
  const parts = [];
  const drone = Number(raw?.resourceDroneCount ?? raw?.droneCount);
  const dog = Number(raw?.resourceDogCount ?? raw?.dogCount);
  const boat = Number(raw?.resourceBoatCount ?? raw?.boatCount);
  if (drone > 0) parts.push(`无人机×${drone}`);
  if (dog > 0) parts.push(`无人犬×${dog}`);
  if (boat > 0) parts.push(`无人艇×${boat}`);
  return parts.join("、") || "—";
}

function normalizeEvent(raw) {
  if (!raw || typeof raw !== "object") return null;
  const id = raw?.id ?? raw?.eventId ?? raw?.alarmId;
  const imageUrl =
    raw?.imageUrl ??
    raw?.imgUrl ??
    raw?.pictureUrl ??
    raw?.snapshotUrl ??
    raw?.recognizeImage ??
    "";
  const lng = raw?.longitude ?? raw?.lng ?? raw?.lon;
  const lat = raw?.latitude ?? raw?.lat;
  const lngLat =
    lng != null && lat != null
      ? `${Number(lng).toFixed(6)}, ${Number(lat).toFixed(6)}`
      : "—";

  return {
    id: id != null ? String(id) : `ev-${Math.random().toString(36).slice(2, 9)}`,
    warnType: raw?.warnType ?? raw?.alarmType ?? raw?.eventType ?? "—",
    imageUrl: String(imageUrl || ""),
    eventTime: raw?.eventTime ?? raw?.alarmTime ?? raw?.createTime ?? "—",
    recognizeType: raw?.recognizeType ?? raw?.recognitionType ?? "—",
    recognizeName: raw?.recognizeName ?? raw?.recognitionName ?? raw?.name ?? "—",
    lngLat,
    deviceName: raw?.deviceName ?? raw?.reportDeviceName ?? raw?.droneName ?? "—",
    raw,
  };
}

/**
 * @param {Record<string, any>} raw
 */
export function normalizeHistoryRecord(raw) {
  const id =
    raw?.id != null && raw.id !== ""
      ? String(raw.id)
      : raw?.recordId != null
        ? String(raw.recordId)
        : `rec-${Date.now()}`;

  const typeNum = Number(raw?.type ?? raw?.planType ?? raw?.sceneType ?? 1);
  const scenarioKey = apiTypeToScenarioKey(typeNum);

  const eventsRaw =
    raw?.eventList ??
    raw?.aiEventList ??
    raw?.alarmList ??
    raw?.events ??
    raw?.children ??
    [];

  const events = (Array.isArray(eventsRaw) ? eventsRaw : [])
    .map(normalizeEvent)
    .filter(Boolean);

  const subjectBase = String(raw?.name ?? raw?.planName ?? raw?.subject ?? raw?.theme ?? "—").trim();
  const mockRemark = raw?._mockRemark ? String(raw._mockRemark).trim() : "";
  const subject =
    raw?._mock && mockRemark
      ? `[模拟] ${subjectBase}（${mockRemark}）`
      : raw?._mock
        ? `[模拟] ${subjectBase}`
        : subjectBase;

  const item = {
    id,
    isMock: Boolean(raw?._mock),
    mockRemark,
    planId: raw?.planId != null ? String(raw.planId) : "",
    scenarioKey,
    scenarioTitle: SCENARIO_TITLE_BY_KEY[scenarioKey] || "—",
    subject,
    locationLabel: String(
      raw?.locationLabel ?? raw?.placeNames ?? raw?.placeName ?? raw?.location ?? "—",
    ).trim(),
    executeDate: String(raw?.executeDate ?? raw?.flightDate ?? "").slice(0, 10),
    resourceText: formatResourceSummary(raw),
    aiEventCount: Number(raw?.aiEventCount ?? raw?.eventCount ?? events.length) || 0,
    timeStart: toHm(raw?.executeStartTime ?? raw?.timeStart ?? raw?.startTime ?? ""),
    timeEnd: toHm(raw?.executeEndTime ?? raw?.timeEnd ?? raw?.endTime ?? ""),
    startModeLabel: resolvePlanStartModeLabel(raw),
    events,
    raw,
  };

  return item;
}
