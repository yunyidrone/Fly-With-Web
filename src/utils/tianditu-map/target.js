export function resolveTargetType(target) {
  const type = Number(target?.type);
  return Number.isFinite(type) ? type : 1;
}

export function isBoatTarget(target, boatTargetSn) {
  const sn = String(target?.sn || target?.mqttSn || "").trim();
  return Boolean(boatTargetSn) && sn === boatTargetSn;
}

export function getTargetTypeLabel(target, boatTargetSn) {
  // 目标类型：1警车 2警员 3机器人 4车辆(第三方推送的) 6肩灯
  if (isBoatTarget(target, boatTargetSn)) return "船";
  const type = resolveTargetType(target);
  if (type === 1) return "警车";
  if (type === 2) return "警员";
  if (type === 3) return "机器人";
  if (type === 4) return "车辆";
  if (type === 6) return "肩灯";
  return "未知";
}
