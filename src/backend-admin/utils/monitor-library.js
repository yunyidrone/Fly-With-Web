import {
  VEHICLE_POWER_TYPE_LABELS,
  resolveVehiclePowerTypeLabel,
  resolvePortraitWarningTypeLabel,
} from "@backend/config/constants.js";

function pickString(...values) {
  for (const value of values) {
    const text = String(value ?? "").trim();
    if (text) return text;
  }
  return "";
}
export function normalizePortraitRecord(raw) {
  if (!raw || typeof raw !== "object") {
    return {
      id: "",
      name: "",
      imageUrl: "",
      warningType: "",
      warningTypeLabel: "",
      createTime: "",
    };
  }

  const warningType = raw.warningType ?? raw.warnType ?? raw.alertType ?? raw.alarmType ?? "";
  const warningTypeLabel = pickString(
    raw.warningTypeLabel,
    raw.warnTypeLabel,
    raw.warnTypeName,
    raw.alertTypeName,
    resolvePortraitWarningTypeLabel(warningType),
  );

  return {
    id: raw.id ?? raw.portraitId ?? "",
    name: pickString(raw.name, raw.personName),
    imageUrl: pickString(raw.imageUrl, raw.image, raw.photoUrl, raw.avatar),
    warningType,
    warningTypeLabel,
    createTime: pickString(raw.createTime, raw.createdAt, raw.gmtCreate),
    warnType: warningType,
    warnTypeLabel: warningTypeLabel,
  };
}

export function normalizePortraitList(list) {
  return (Array.isArray(list) ? list : []).map(normalizePortraitRecord);
}

export function buildQueryTimeRange(startDate, endDate) {
  const start = String(startDate ?? "").trim();
  const end = String(endDate ?? "").trim();
  if (!start && !end) {
    return { startTime: "", endTime: "" };
  }
  return {
    startTime: start ? `${start} 00:00:00` : "",
    endTime: end ? `${end} 23:59:59` : "",
  };
}

/** @param {{ startTime?: string, endTime?: string, dateRange?: string[] | null }} params */
export function resolveQueryTimeRange(params = {}) {
  const range = params.dateRange;
  if (Array.isArray(range) && range.length === 2 && range[0] && range[1]) {
    return buildQueryTimeRange(range[0], range[1]);
  }
  return {
    startTime: String(params.startTime ?? "").trim(),
    endTime: String(params.endTime ?? "").trim(),
  };
}

export function buildPortraitPayload(form, extra = {}) {
  const payload = {
    name: String(form.name ?? "").trim(),
    imageUrl: String(form.imageUrl ?? "").trim(),
    warningType: form.warningType ?? form.warnType,
  };

  if (extra.id != null && extra.id !== "") {
    payload.id = extra.id;
  }

  return payload;
}

export function normalizeVehicleRecord(raw) {
  if (!raw || typeof raw !== "object") {
    return {
      id: "",
      plateNo: "",
      plateNumber: "",
      powerType: "",
      powerTypeLabel: "",
      createTime: "",
    };
  }

  const powerType = raw.powerType ?? raw.vehiclePowerType ?? raw.energyType ?? "";
  const plateNo = pickString(raw.plateNo, raw.plateNumber, raw.licensePlate, raw.carNumber);
  const powerTypeLabel = pickString(
    raw.powerTypeLabel,
    raw.vehiclePowerTypeLabel,
    resolveVehiclePowerTypeLabel(powerType),
    VEHICLE_POWER_TYPE_LABELS[powerType],
  );

  return {
    id: raw.id ?? raw.vehicleId ?? "",
    plateNo,
    plateNumber: plateNo,
    powerType,
    powerTypeLabel,
    createTime: pickString(raw.createTime, raw.createdAt, raw.gmtCreate),
  };
}

export function normalizeVehicleList(list) {
  return (Array.isArray(list) ? list : []).map(normalizeVehicleRecord);
}

const PLATE_LETTER_PATTERN = /^[A-Za-z]$/;
const PLATE_BODY_PATTERN = /^[\u4e00-\u9fa5A-Za-z0-9]+$/;

export function sanitizePlateLetter(value) {
  return String(value ?? "")
    .replace(/[^A-Za-z]/g, "")
    .slice(0, 1)
    .toUpperCase();
}

export function sanitizePlateBody(value) {
  return String(value ?? "")
    .replace(/[^\u4e00-\u9fa5A-Za-z0-9]/g, "")
    .slice(0, 8);
}

export function formatPlateNumber(province, letter, body) {
  const provinceText = String(province ?? "").trim();
  const letterText = sanitizePlateLetter(letter);
  const bodyText = sanitizePlateBody(body);
  if (!provinceText || !letterText || !bodyText) return "";
  return `${provinceText}${letterText}·${bodyText}`;
}

/** 列表展示：浙J54K82 → 浙J·54K82 */
export function formatPlateNumberDisplay(plateNo) {
  const raw = String(plateNo ?? "").trim();
  if (!raw) return "";

  const parts = parsePlateNumber(raw);
  if (parts.plateProvince && parts.plateLetter && parts.plateBody) {
    return `${parts.plateProvince}${parts.plateLetter}·${parts.plateBody}`;
  }
  return raw;
}

export function parsePlateNumber(plateNumber) {
  const raw = String(plateNumber ?? "").trim();
  if (!raw) {
    return { plateProvince: "", plateLetter: "", plateBody: "" };
  }

  const normalized = raw.replace(/\s+/g, "").replace(/[·.]/g, "·");
  const match = normalized.match(/^([\u4e00-\u9fff])([A-Za-z])·?([\u4e00-\u9fa5A-Za-z0-9]+)$/);
  if (!match) {
    return { plateProvince: "", plateLetter: "", plateBody: raw };
  }

  return {
    plateProvince: match[1],
    plateLetter: match[2].toUpperCase(),
    plateBody: match[3],
  };
}

export function validatePlateParts(form) {
  const province = String(form?.plateProvince ?? "").trim();
  const letter = sanitizePlateLetter(form?.plateLetter);
  const body = sanitizePlateBody(form?.plateBody);

  if (!province) return "请选择省份简称";
  if (!letter || !PLATE_LETTER_PATTERN.test(letter)) return "请输入车牌字母";
  if (!body || !PLATE_BODY_PATTERN.test(body)) return "请输入有效车牌号码";
  return "";
}

export function buildVehiclePayload(form, extra = {}) {
  const payload = {
    plateNo: formatPlateNumber(form.plateProvince, form.plateLetter, form.plateBody),
    powerType: form.powerType,
  };

  if (extra.id != null && extra.id !== "") {
    payload.id = extra.id;
  }

  return payload;
}
