/**
 * 一键封城确认弹窗：把 /control/point/listQuery 转成「卡点 + 绑定无人机」行。
 */

export const LOCKDOWN_LIST_QUERY_PARAMS = { current: 1, pageSize: 999 };

function toCoord(value) {
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
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

    rows.push({
      checkpointId,
      checkpointName: String(raw.name ?? "").trim() || "未命名卡点",
      droneId,
      droneName: String(raw.droneName ?? "").trim() || droneId,
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
    if (!row?.checked) continue;
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

/**
 * 只组装已勾选卡点，droneIds[i] 对应 controlPointIds[i]
 * @param {Array<Record<string, any>>} rows
 */
export function buildLockdownDeployPayload(rows = []) {
  const droneIds = [];
  const controlPointIds = [];
  const links = [];

  for (const row of rows) {
    if (!row?.checked) continue;
    const droneId = String(row?.droneId ?? "").trim();
    const controlPointId = String(row?.checkpointId ?? "").trim();
    if (!droneId || !controlPointId) continue;
    droneIds.push(droneId);
    controlPointIds.push(controlPointId);
    if (hasLinkCoords(row)) {
      links.push({
        checkpointId: controlPointId,
        droneId,
        checkpointLng: row.checkpointLng,
        checkpointLat: row.checkpointLat,
        droneLng: row.droneLng,
        droneLat: row.droneLat,
      });
    }
  }

  return { droneIds, controlPointIds, links };
}
