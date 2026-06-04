/** 即将执行：距开始时间 30 分钟内（且尚未到点开始） */
export const PLAN_UPCOMING_WINDOW_MS = 30 * 60 * 1000;

/** @type {Record<number, string>} */
export const PLAN_STATUS_LABELS = {
  0: "未执行",
  1: "执行中",
  2: "执行完成",
};

/**
 * 从接口原始行解析计划状态码 0未执行 1执行中 2执行完成
 * @param {Record<string, any>} raw
 * @returns {number | undefined}
 */
export function parsePlanStatusNum(raw) {
  if (!raw || typeof raw !== "object") return undefined;

  if (raw.isRunning === 1 || raw.isRunning === true || raw.running === 1) return 1;

  const fields = [
    "status",
    "planStatus",
    "taskStatus",
    "followStatus",
    "executeStatus",
    "runStatus",
  ];

  for (const key of fields) {
    const v = raw[key];
    if (v == null || v === "") continue;
    const n = Number(v);
    if (Number.isFinite(n) && n >= 0 && n <= 10) return n;
    const s = String(v).trim();
    if (/执行中|进行中|跟随中|已启动/.test(s)) return 1;
    if (/未执行|待执行|预备|待启动/.test(s)) return 0;
    if (/完成|已结束|已停止/.test(s)) return 2;
  }

  return undefined;
}

/**
 * @param {Record<string, any>} plan
 * @returns {number | undefined}
 */
export function getPlanStatusNum(plan) {
  const direct = Number(plan?.status);
  if (Number.isFinite(direct)) return direct;
  const fromRaw = parsePlanStatusNum(plan?.raw);
  if (fromRaw != null) return fromRaw;
  return parsePlanStatusNum(plan);
}

/**
 * @param {import('@/stores/flightPlan.js').FlightPlanItem | Record<string, any>} plan
 * @returns {number | null}
 */
export function getPlanExecuteStartMs(plan) {
  const raw = plan?.raw ?? plan;
  const date = String(
    plan?.flightDate ?? raw?.executeDate ?? raw?.flightDate ?? raw?.startDate ?? "",
  ).slice(0, 10);
  const time = String(
    plan?.timeStart ?? raw?.executeStartTime ?? raw?.timeStart ?? raw?.startTime ?? "",
  ).slice(0, 5);
  if (!date || !time) return null;
  const [y, m, d] = date.split("-").map(Number);
  const [hh, mm] = time.split(":").map(Number);
  if (!y || !m || !d || !Number.isFinite(hh) || !Number.isFinite(mm)) return null;
  return new Date(y, m - 1, d, hh, mm, 0, 0).getTime();
}

/** @param {Record<string, any>} plan */
export function isPlanExecuting(plan) {
  return getPlanStatusNum(plan) === 1;
}

/** 非执行中（含未执行、已完成等）：可紧急启动 */
export function canPlanEmergencyStart(plan) {
  return getPlanStatusNum(plan) !== 1;
}

/** 执行中：可停止任务 */
export function canPlanStopTask(plan) {
  return getPlanStatusNum(plan) === 1;
}

/**
 * 未执行(0) 且开始时间在 (now, now+30min] 内
 * @param {Record<string, any>} plan
 * @param {number} [now]
 */
export function isPlanUpcoming(plan, now = Date.now()) {
  if (getPlanStatusNum(plan) !== 0) return false;
  const startMs = getPlanExecuteStartMs(plan);
  if (startMs == null) return false;
  const diff = startMs - now;
  return diff > 0 && diff <= PLAN_UPCOMING_WINDOW_MS;
}

/**
 * @param {Record<string, any>} plan
 * @param {number} [now]
 */
export function formatPlanUpcomingCountdown(plan, now = Date.now()) {
  const startMs = getPlanExecuteStartMs(plan);
  if (startMs == null) return "";
  const diff = startMs - now;
  if (diff <= 0) return "即将开始";
  const min = Math.max(1, Math.ceil(diff / 60000));
  return `${min} 分钟后开始`;
}

/** 即将执行倒计时 MM:SS */
export function formatPlanUpcomingClock(plan, now = Date.now()) {
  const startMs = getPlanExecuteStartMs(plan);
  if (startMs == null) return "--:--";
  const diff = Math.max(0, startMs - now);
  const totalSec = Math.floor(diff / 1000);
  const mm = String(Math.floor(totalSec / 60)).padStart(2, "0");
  const ss = String(totalSec % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}

/**
 * @param {string} date YYYY-MM-DD
 * @param {string} time HH:mm
 */
export function formatPlanDateTimeLine(date, time) {
  const d = String(date || "").slice(0, 10).replace(/-/g, ".");
  if (!d) return "";
  const t = String(time || "").slice(0, 5);
  const ts = t ? (t.length === 5 ? `${t}:00` : t) : "";
  return ts ? `${d} ${ts}` : d;
}

/**
 * @param {Record<string, any>} plan
 */
export function resolvePlanStartModeLabel(plan) {
  const raw = plan?.raw ?? plan;
  const t = raw?.startType ?? raw?.startWay ?? raw?.launchType ?? raw?.followStartType;
  if (t === 1 || t === "1" || t === "emergency" || raw?.emergencyStart === 1) {
    return "紧急启动";
  }
  if (t === 2 || t === "2" || t === "scheduled" || t === "onTime") {
    return "按时启动";
  }
  if (Number(plan?.status) === 1 && raw?.actualStartTime) {
    return "紧急启动";
  }
  return "按时启动";
}
