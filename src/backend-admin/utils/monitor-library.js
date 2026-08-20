import {
  VEHICLE_PLATE_PROVINCES,
  VEHICLE_POWER_TYPE,
  VEHICLE_POWER_TYPE_LABELS,
  resolveVehiclePowerTypeLabel,
  PORTRAIT_GENDER,
  resolvePortraitGenderLabel,
} from "@backend/config/constants.js";

function pickString(...values) {
  for (const value of values) {
    const text = String(value ?? "").trim();
    if (text) return text;
  }
  return "";
}

export function normalizePersonGroupRecord(raw) {
  if (!raw || typeof raw !== "object") {
    return {
      id: "",
      groupId: "",
      groupName: "",
      personCount: 0,
      tag: "",
      createTime: "",
      updateTime: "",
      description: "",
    };
  }

  return {
    id: raw.id,
    groupId: raw.groupId,
    groupName: raw.groupName,
    personCount: raw.personCount,
    tag: raw.tag,
    createTime: raw.createTime,
    updateTime: raw.updateTime,
    description: raw.description,
  };
}

export function normalizePersonGroupList(list) {
  return (Array.isArray(list) ? list : []).map(normalizePersonGroupRecord);
}

export function buildPersonGroupPayload(form, extra = {}) {
  const payload = {
    groupName: String(form.groupName ?? "").trim(),
    tag: String(form.tag ?? "").trim(),
    description: String(form.description ?? "").trim(),
  };

  if (extra.id != null && extra.id !== "") {
    payload.id = extra.id;
  }

  return payload;
}

export function normalizePortraitRecord(raw) {
  if (!raw || typeof raw !== "object") {
    return {
      id: "",
      name: "",
      imageUrl: "",
      gender: PORTRAIT_GENDER.UNKNOWN,
      genderLabel: resolvePortraitGenderLabel(PORTRAIT_GENDER.UNKNOWN),
      createTime: "",
    };
  }
  const gender = Number(raw.gender);
  const safeGender = Number.isFinite(gender) ? gender : PORTRAIT_GENDER.UNKNOWN;

  return {
    id: raw.id ?? raw.portraitId ?? "",
    name: pickString(raw.name, raw.personName),
    imageUrl: pickString(raw.imageUrl, raw.image, raw.photoUrl, raw.avatar),
    gender: safeGender,
    genderLabel: resolvePortraitGenderLabel(safeGender),
    createTime: pickString(raw.createTime, raw.createdAt, raw.gmtCreate),
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
    gender: Number.isFinite(Number(form.gender))
      ? Number(form.gender)
      : PORTRAIT_GENDER.UNKNOWN,
  };

  if (extra.id != null && extra.id !== "") {
    payload.id = extra.id;
  }

  const groupId = extra.groupId ?? form.groupId;
  if (groupId != null && groupId !== "") {
    payload.groupId = groupId;
  }

  return payload;
}

/** 人像批量上传单次上限 */
export const PORTRAIT_BATCH_MAX_COUNT = 50;

/** 用文件名（去掉扩展名）作为人像姓名，最长 32 字 */
export function resolvePortraitNameFromFilename(filename) {
  const text = String(filename ?? "").trim();
  if (!text) return "";
  const lastDot = text.lastIndexOf(".");
  const base = (lastDot > 0 ? text.slice(0, lastDot) : text).trim();
  return base.slice(0, 32);
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

export const VEHICLE_BATCH_TEMPLATE_NAME = "批量添加车辆信息模板.xlsx";

export const VEHICLE_BATCH_TEMPLATE_HEADERS = [
  "省份缩写",
  "市及代码",
  "车牌信息",
  "车辆动力类型",
];

export const VEHICLE_BATCH_TEMPLATE_EXAMPLE = {
  plateProvince: "浙",
  plateLetter: "A",
  plateBody: "9754V",
  powerTypeLabel: "新能源",
};

const PROVINCE_SET = new Set(VEHICLE_PLATE_PROVINCES.map((item) => item.value));

export function resolveVehiclePowerType(value) {
  const text = String(value ?? "").trim();
  if (!text) return null;
  if (text === "新能源" || text === String(VEHICLE_POWER_TYPE.NEW_ENERGY)) {
    return VEHICLE_POWER_TYPE.NEW_ENERGY;
  }
  if (text === "燃油车" || text === String(VEHICLE_POWER_TYPE.FUEL)) {
    return VEHICLE_POWER_TYPE.FUEL;
  }
  const num = Number(text);
  if (num === VEHICLE_POWER_TYPE.NEW_ENERGY || num === VEHICLE_POWER_TYPE.FUEL) {
    return num;
  }
  return null;
}

/**
 * 解析批量导入的一行，校验规则与单条新建一致
 * @param {{ plateProvince?: string, plateLetter?: string, plateBody?: string, powerTypeLabel?: string }} row
 */
export function parseVehicleBatchRow(row) {
  const plateProvince = String(row?.plateProvince ?? "").trim();
  const plateLetter = sanitizePlateLetter(row?.plateLetter);
  const plateBody = sanitizePlateBody(row?.plateBody);
  const powerTypeLabel = String(row?.powerTypeLabel ?? "").trim();

  if (!plateProvince && !plateLetter && !plateBody && !powerTypeLabel) {
    return { empty: true };
  }

  if (!PROVINCE_SET.has(plateProvince)) {
    return { error: "请选择省份简称" };
  }

  const plateError = validatePlateParts({ plateProvince, plateLetter, plateBody });
  if (plateError) return { error: plateError };

  const powerType = resolveVehiclePowerType(powerTypeLabel);
  if (powerType == null) {
    return { error: "请选择车辆动力类型" };
  }

  const form = { plateProvince, plateLetter, plateBody, powerType };
  return {
    form,
    payload: buildVehiclePayload(form),
  };
}

const HEADER_FIELD_MAP = {
  省份缩写: "plateProvince",
  市及代码: "plateLetter",
  车牌信息: "plateBody",
  车辆动力类型: "powerTypeLabel",
};

function normalizeHeader(value) {
  return String(value ?? "").replace(/\s+/g, "");
}

function cellText(value) {
  return String(value ?? "").trim();
}

function resolveHeaderIndex(headerRow = []) {
  const indexMap = {};
  headerRow.forEach((cell, index) => {
    const field = HEADER_FIELD_MAP[normalizeHeader(cell)];
    if (field) indexMap[field] = index;
  });
  return indexMap;
}

function findHeaderRow(rows = []) {
  const maxScan = Math.min(rows.length, 5);
  for (let index = 0; index < maxScan; index += 1) {
    const headerIndex = resolveHeaderIndex(rows[index]);
    const missingHeaders = Object.values(HEADER_FIELD_MAP).filter(
      (field) => headerIndex[field] == null,
    );
    if (!missingHeaders.length) {
      return { headerIndex, dataStart: index + 1 };
    }
  }
  return null;
}

/**
 * @param {File} file
 * @returns {Promise<{ payloads: Array<Record<string, any>>, errors: string[] }>}
 */
export async function parseVehicleBatchFile(file) {
  const excelModule = await import("xlsx");
  const XLSX = excelModule.default ?? excelModule;
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });
  const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
  if (!firstSheet) {
    return { payloads: [], errors: ["未读取到表格内容"] };
  }

  const rows = XLSX.utils.sheet_to_json(firstSheet, {
    header: 1,
    defval: "",
    raw: false,
    blankrows: false,
  });
  if (!rows.length) {
    return { payloads: [], errors: ["模板内容为空"] };
  }

  const headerRow = findHeaderRow(rows);
  if (!headerRow) {
    return { payloads: [], errors: ["模板表头不正确，请重新下载模板"] };
  }

  const payloads = [];
  const errors = [];
  const seenPlate = new Set();

  rows.slice(headerRow.dataStart).forEach((cells, offset) => {
    const excelRow = headerRow.dataStart + offset + 1;
    const parsed = parseVehicleBatchRow({
      plateProvince: cellText(cells[headerRow.headerIndex.plateProvince]),
      plateLetter: cellText(cells[headerRow.headerIndex.plateLetter]),
      plateBody: cellText(cells[headerRow.headerIndex.plateBody]),
      powerTypeLabel: cellText(cells[headerRow.headerIndex.powerTypeLabel]),
    });

    if (parsed.empty) return;
    if (parsed.error) {
      errors.push(`第 ${excelRow} 行：${parsed.error}`);
      return;
    }

    const plateNo = parsed.payload.plateNo;
    if (seenPlate.has(plateNo)) {
      errors.push(`第 ${excelRow} 行：车牌号重复`);
      return;
    }
    seenPlate.add(plateNo);
    payloads.push(parsed.payload);
  });

  if (!payloads.length && !errors.length) {
    errors.push("没有可导入的车辆数据");
  }

  return { payloads, errors };
}
