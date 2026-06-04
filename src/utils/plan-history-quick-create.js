import { TAB_TO_API_TYPE } from "@/components/plan-panel/plan-scenarios.js";

/** 历史记录快捷创建：重点安保需重新选择日期时间 */
export function historyQuickCreateNeedsSchedule(record) {
  return record?.scenarioKey === "security";
}

/** @param {string} hm */
export function formatExecuteTimeForApi(hm) {
  const s = String(hm || "").trim();
  if (!s) return "";
  const parts = s.split(":").map((p) => p.trim());
  const h = parts[0].padStart(2, "0");
  const m = (parts[1] || "00").padStart(2, "0");
  return `${h}:${m}`;
}

/**
 * @param {{ executeDate?: string, timeStart?: string, timeEnd?: string }} schedule
 */
export function validateSecurityQuickCreateSchedule(schedule) {
  const executeDate = String(schedule?.executeDate || "").slice(0, 10);
  const timeStart = String(schedule?.timeStart || "").trim();
  const timeEnd = String(schedule?.timeEnd || "").trim();
  if (!executeDate) return "请选择实行日期";
  if (!timeStart) return "请选择开始时间";
  if (!timeEnd) return "请选择结束时间";
  const startParts = timeStart.split(":").map(Number);
  const endParts = timeEnd.split(":").map(Number);
  const startMin = startParts[0] * 60 + (startParts[1] || 0);
  const endMin = endParts[0] * 60 + (endParts[1] || 0);
  if (endMin <= startMin) return "结束时间须晚于开始时间";
  return "";
}

/**
 * 从历史记录构建 planAdd 请求体
 * @param {Record<string, any>} record  normalizeHistoryRecord 后的行数据
 * @param {{ executeDate?: string, timeStart?: string, timeEnd?: string }} [schedule] 仅重点安保由用户重选
 */
export function buildQuickCreateBody(record, schedule) {
  const raw = record?.raw ?? record ?? {};

  const type = TAB_TO_API_TYPE[record?.scenarioKey] ?? Number(raw?.type ?? 1);

  const name = String(
    raw?.name ?? raw?.planName ?? raw?.subject ?? record?.subject ?? "",
  ).trim();

  // 兼容多种 placeIds 格式
  const rawPlaceIds = raw?.placeIds ?? raw?.placeIdList ?? raw?.placeList ?? [];
  const placeIds = typeof rawPlaceIds === "string"
    ? rawPlaceIds
    : Array.isArray(rawPlaceIds)
      ? rawPlaceIds.map((v) => (typeof v === "object" ? v?.id ?? String(v) : String(v))).join(",")
      : "";

  // resourceConfig
  const resourceConfig = raw?.resourceConfig ?? raw?.resourceList ?? [];

  // algorithmIds: 逗号分隔字符串
  const rawAlgo = raw?.algorithmIds ?? raw?.algorithmIdList ?? raw?.algorithms ?? "";
  const algorithmIds = typeof rawAlgo === "string"
    ? rawAlgo
    : Array.isArray(rawAlgo)
      ? rawAlgo.map((v) => (typeof v === "object" ? v?.algorithmId ?? v?.id ?? String(v) : String(v))).join(",")
      : "";

  const description = String(raw?.description ?? raw?.detailRemark ?? "").trim();

  const body = {
    type,
    name,
    placeIds,
    resourceConfig: Array.isArray(resourceConfig) ? resourceConfig : [],
    description,
  };

  if (algorithmIds) {
    body.algorithmIds = algorithmIds;
  }

  if (schedule?.executeDate) {
    body.executeDate = String(schedule.executeDate).slice(0, 10);
    body.executeStartTime = formatExecuteTimeForApi(schedule.timeStart);
    body.executeEndTime = formatExecuteTimeForApi(schedule.timeEnd);
  } else if (raw?.executeDate || raw?.flightDate) {
    body.executeDate = String(raw.executeDate ?? raw.flightDate ?? "").slice(0, 10);
    if (raw?.executeStartTime || raw?.timeStart) {
      body.executeStartTime = formatExecuteTimeForApi(raw.executeStartTime ?? raw.timeStart);
    }
    if (raw?.executeEndTime || raw?.timeEnd) {
      body.executeEndTime = formatExecuteTimeForApi(raw.executeEndTime ?? raw.timeEnd);
    }
  }

  return body;
}
