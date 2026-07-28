/** 伴飞任务状态 */
export const TASK_STATUS = {
  IDLE: 0,
  RUNNING: 1,
  ABNORMAL: 2,
  FAILED: 3,
  COMPLETED: 4,
};

export const TASK_STATUS_OPTIONS = [
  { value: TASK_STATUS.IDLE, label: "未运行" },
  { value: TASK_STATUS.RUNNING, label: "运行中" },
  { value: TASK_STATUS.ABNORMAL, label: "运行异常" },
  { value: TASK_STATUS.FAILED, label: "运行失败" },
  { value: TASK_STATUS.COMPLETED, label: "运行完成" },
];

const TASK_STATUS_LABELS = Object.fromEntries(
  TASK_STATUS_OPTIONS.map((item) => [item.value, item.label]),
);

/**
 * @param {number|string|null|undefined} status
 */
export function taskStatusLabel(status) {
  const num = Number(status);
  return TASK_STATUS_LABELS[num] ?? "—";
}

/**
 * @param {number|string|null|undefined} status
 */
export function taskStatusClass(status) {
  const num = Number(status);
  if (num === TASK_STATUS.RUNNING) return "task-status--running";
  if (num === TASK_STATUS.ABNORMAL) return "task-status--abnormal";
  if (num === TASK_STATUS.FAILED) return "task-status--failed";
  if (num === TASK_STATUS.COMPLETED) return "task-status--completed";
  return "task-status--idle";
}

/**
 * @param {Record<string, any>} raw
 */
export function taskToRecord(raw) {
  if (!raw || typeof raw !== "object") return null;
  const uuid = String(raw.uuid ?? raw.taskUuid ?? "").trim();
  const id = raw.id != null && raw.id !== "" ? String(raw.id) : uuid;
  if (!id) return null;

  const status = Number(raw.status);
  return {
    id,
    uuid: uuid || id,
    name: String(raw.name ?? "—").trim() || "—",
    status: Number.isFinite(status) ? status : null,
    statusLabel: taskStatusLabel(status),
    statusClass: taskStatusClass(status),
    createTime: raw.createTime ?? "—",
    startTime: raw.startTime ?? "—",
    finishTime: raw.finishTime ?? "—",
    events: [],
    raw,
  };
}
