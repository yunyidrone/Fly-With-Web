/**
 * 一键封城确认弹窗：把 /control/point/listQuery 转成「卡点 + 绑定无人机」行。
 */

export const LOCKDOWN_LIST_QUERY_PARAMS = { current: 1, pageSize: 999 };

/** 无人机状态：0离线 1就绪 2伴飞中 3返航中，仅就绪可勾选 */
export const LOCKDOWN_DRONE_STATUS = {
  OFFLINE: 0,
  READY: 1,
  ESCORTING: 2,
  RETURNING: 3,
};

export const LOCKDOWN_DRONE_STATUS_LABELS = {
  [LOCKDOWN_DRONE_STATUS.OFFLINE]: "离线",
  [LOCKDOWN_DRONE_STATUS.READY]: "就绪",
  [LOCKDOWN_DRONE_STATUS.ESCORTING]: "伴飞中",
  [LOCKDOWN_DRONE_STATUS.RETURNING]: "返航中",
};

/** 无人机任务类型：1 正在执行一键封城 */
export const LOCKDOWN_DRONE_TASK_TYPE = {
  LOCKDOWN: 1,
};

function toCoord(value) {
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

function toDroneStatus(value) {
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

export function isLockdownRowSelectable(row) {
  return Number(row?.droneStatus) === LOCKDOWN_DRONE_STATUS.READY;
}

export function isLockdownTaskExecuting(row) {
  return Number(row?.droneTaskType) === LOCKDOWN_DRONE_TASK_TYPE.LOCKDOWN;
}

export function hasExecutingLockdown(rows = []) {
  return rows.some((row) => isLockdownTaskExecuting(row));
}

/**
 * 以卡点为维度，仅保留已绑定无人机的卡点。
 * @param {Array<Record<string, any>>} list
 */
export function normalizeLockdownCheckpointRows(list = []) {
  const rows = [];
  const seen = new Set();

  for (const raw of list) {
    if (!raw || typeof raw !== "object") continue;
    const checkpointId = String(raw.id ?? "").trim();
    const droneId = String(raw.droneId ?? "").trim();
    if (!checkpointId || !droneId || seen.has(checkpointId)) continue;
    seen.add(checkpointId);

    const droneStatus = toDroneStatus(raw.droneStatus ?? raw.drone_status);
    const droneTaskType = toDroneStatus(raw.droneTaskType ?? raw.drone_task_type);
    const executing = droneTaskType === LOCKDOWN_DRONE_TASK_TYPE.LOCKDOWN;
    rows.push({
      checkpointId,
      checkpointName: String(raw.name ?? "").trim() || "未命名卡点",
      droneId,
      droneName: String(raw.droneName ?? "").trim() || droneId,
      droneStatus,
      droneStatusLabel: LOCKDOWN_DRONE_STATUS_LABELS[droneStatus] || "",
      droneTaskType,
      executing,
      selectable: droneStatus === LOCKDOWN_DRONE_STATUS.READY,
      checkpointLng: toCoord(raw.longitude ?? raw.lng),
      checkpointLat: toCoord(raw.latitude ?? raw.lat),
      droneLng: toCoord(raw.droneLongitude ?? raw.droneLng),
      droneLat: toCoord(raw.droneLatitude ?? raw.droneLat),
    });
  }

  return rows;
}

/**
 * 已勾选行中，被分配到多个卡点的无人机
 * @param {Array<{ checked?: boolean, droneId?: string, droneName?: string }>} rows
 */
export function findDuplicateLockdownDrones(rows = []) {
  /** @type {Map<string, { droneId: string, droneName: string, count: number }>} */
  const grouped = new Map();

  for (const row of rows) {
    if (!row?.checked || !isLockdownRowSelectable(row)) continue;
    const droneId = String(row?.droneId ?? "").trim();
    if (!droneId) continue;
    const current = grouped.get(droneId) || {
      droneId,
      droneName: String(row?.droneName ?? "").trim() || droneId,
      count: 0,
    };
    current.count += 1;
    grouped.set(droneId, current);
  }

  return [...grouped.values()].filter((item) => item.count > 1);
}

function hasLinkCoords(row) {
  return (
    Number.isFinite(row?.checkpointLng) &&
    Number.isFinite(row?.checkpointLat) &&
    Number.isFinite(row?.droneLng) &&
    Number.isFinite(row?.droneLat)
  );
}

function appendLockdownPayloadRow(row, acc) {
  const droneId = String(row?.droneId ?? "").trim();
  const controlPointId = String(row?.checkpointId ?? "").trim();
  if (!droneId || !controlPointId) return;
  acc.droneIds.push(droneId);
  acc.controlPointIds.push(controlPointId);
  if (hasLinkCoords(row)) {
    acc.links.push({
      checkpointId: controlPointId,
      droneId,
      checkpointLng: row.checkpointLng,
      checkpointLat: row.checkpointLat,
      droneLng: row.droneLng,
      droneLat: row.droneLat,
    });
  }
}

function createEmptyLockdownPayload() {
  return { droneIds: [], controlPointIds: [], links: [] };
}

/**
 * 只组装已勾选卡点，droneIds[i] 对应 controlPointIds[i]
 * @param {Array<Record<string, any>>} rows
 */
export function buildLockdownDeployPayload(rows = []) {
  const payload = createEmptyLockdownPayload();
  for (const row of rows) {
    if (!row?.checked || !isLockdownRowSelectable(row)) continue;
    appendLockdownPayloadRow(row, payload);
  }
  return payload;
}

/**
 * 正在执行一键封城的卡点，供回显、解除和对端同步。
 * @param {Array<Record<string, any>>} rows
 */
export function buildLockdownUndeployPayload(rows = []) {
  const payload = createEmptyLockdownPayload();
  for (const row of rows) {
    if (!isLockdownTaskExecuting(row)) continue;
    appendLockdownPayloadRow(row, payload);
  }
  return payload;
}
