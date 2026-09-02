/** 算法 code（接口） */
export const ALGORITHM_CODE = {
  HEAD_SHOULDER: "head_shoulder",
  LICENSE_PLATE_OCR: "license_plate_ocr",
};

export const ALGORITHM_CODE_LABELS = {
  [ALGORITHM_CODE.HEAD_SHOULDER]: "人脸识别",
  [ALGORITHM_CODE.LICENSE_PLATE_OCR]: "车牌识别",
};

export const ALGORITHM_CODE_OPTIONS = [
  { value: ALGORITHM_CODE.HEAD_SHOULDER, label: ALGORITHM_CODE_LABELS[ALGORITHM_CODE.HEAD_SHOULDER] },
  {
    value: ALGORITHM_CODE.LICENSE_PLATE_OCR,
    label: ALGORITHM_CODE_LABELS[ALGORITHM_CODE.LICENSE_PLATE_OCR],
  },
];

/** 算法申请类型（审批页 mock 沿用） */
export const ALGORITHM_APPLY_TYPE = {
  FACE: "face",
  VEHICLE: "vehicle",
};

export const ALGORITHM_APPLY_TYPE_LABELS = {
  [ALGORITHM_APPLY_TYPE.FACE]: "人脸布控",
  [ALGORITHM_APPLY_TYPE.VEHICLE]: "车辆布控",
  ...ALGORITHM_CODE_LABELS,
};

export const ALGORITHM_APPLY_TYPE_OPTIONS = [
  { value: ALGORITHM_APPLY_TYPE.FACE, label: ALGORITHM_APPLY_TYPE_LABELS[ALGORITHM_APPLY_TYPE.FACE] },
  { value: ALGORITHM_APPLY_TYPE.VEHICLE, label: ALGORITHM_APPLY_TYPE_LABELS[ALGORITHM_APPLY_TYPE.VEHICLE] },
];

/** 算法权限来源 */
export const ALGORITHM_SOURCE = {
  SELF_APPLY: "self_apply",
  ACTIVE_ADD: "active_add",
};

export const ALGORITHM_SOURCE_LABELS = {
  [ALGORITHM_SOURCE.SELF_APPLY]: "自主申请",
  [ALGORITHM_SOURCE.ACTIVE_ADD]: "主动添加",
};

/** 拒绝原因预设 */
export const ALGORITHM_REJECT_REASON_PRESETS = [
  "材料不足，请重新提交！",
  "情况不属实，不予通过！",
  "不满足申请条件，不予通过！",
];

/** 算法申请审批结果（前端 mock） */
export const ALGORITHM_APPLY_RESULT = {
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
};

/** 接口 approvalResult：0 待审 / 1 通过 / 2 拒绝 */
export const ALGORITHM_APPROVAL_RESULT = {
  PENDING: 0,
  APPROVED: 1,
  REJECTED: 2,
};

/** 已经审批 Tab 默认查询：通过 + 拒绝 */
export const ALGORITHM_APPROVAL_RESULT_REVIEWED = [
  ALGORITHM_APPROVAL_RESULT.APPROVED,
  ALGORITHM_APPROVAL_RESULT.REJECTED,
].join(",");

export const ALGORITHM_APPLY_RESULT_META = {
  [ALGORITHM_APPLY_RESULT.PENDING]: { label: "", tagType: "info" },
  [ALGORITHM_APPLY_RESULT.APPROVED]: { label: "通过", tagType: "success" },
  [ALGORITHM_APPLY_RESULT.REJECTED]: { label: "拒绝", tagType: "danger" },
};

export const ALGORITHM_APPROVAL_RESULT_META = {
  [ALGORITHM_APPROVAL_RESULT.PENDING]: { label: "待审", tagType: "info" },
  [ALGORITHM_APPROVAL_RESULT.APPROVED]: { label: "通过", tagType: "success" },
  [ALGORITHM_APPROVAL_RESULT.REJECTED]: { label: "拒绝", tagType: "danger" },
};

export const ALGORITHM_APPROVAL_RESULT_FILTER_OPTIONS = [
  { value: ALGORITHM_APPROVAL_RESULT.PENDING, label: "待审" },
  { value: ALGORITHM_APPROVAL_RESULT.APPROVED, label: "通过" },
  { value: ALGORITHM_APPROVAL_RESULT.REJECTED, label: "拒绝" },
];

export function getAlgorithmApplyTypeLabel(type) {
  return ALGORITHM_APPLY_TYPE_LABELS[type] || type || "-";
}

export function splitAlgorithmCodes(value) {
  return String(value ?? "")
    .split(/[,，]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function joinAlgorithmCodes(codes) {
  return (codes || []).map((item) => String(item).trim()).filter(Boolean).join(",");
}

/** 审批结果多选查询参数（逗号拼接） */
export function joinApprovalResults(values) {
  if (Array.isArray(values)) {
    return values
      .map((item) => String(item ?? "").trim())
      .filter((item) => item !== "")
      .join(",");
  }
  const text = String(values ?? "").trim();
  return text;
}

/** @param {unknown} value */
export function parseAlgorithmCodes(value) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item ?? "").trim()).filter(Boolean);
  }
  return splitAlgorithmCodes(value);
}

/** 解析并格式化算法 code（支持逗号分隔多个） */
export function resolveAlgorithmLabels(...values) {
  const codes = [...new Set(values.flatMap((value) => parseAlgorithmCodes(value)))];
  if (!codes.length) return "-";
  return codes.map((key) => ALGORITHM_APPLY_TYPE_LABELS[key] || key).join("、");
}

export function getAlgorithmCodeLabel(code) {
  return resolveAlgorithmLabels(code);
}

/**
 * 解析 passList 接口返回的算法 code 列表
 * @param {unknown} payload
 */
export function resolveAlgorithmCodesFromPassList(payload) {
  const codes = new Set();

  /** @param {unknown} input */
  function unwrapList(input) {
    if (input == null) return [];
    if (Array.isArray(input)) return input;
    if (typeof input !== "object") return [];
    const obj = /** @type {Record<string, unknown>} */ (input);
    if (Array.isArray(obj.records)) return obj.records;
    if (Array.isArray(obj.list)) return obj.list;
    if (obj.data != null && obj.data !== input) return unwrapList(obj.data);
    return [];
  }

  for (const item of unwrapList(payload)) {
    if (typeof item === "string" || typeof item === "number") {
      parseAlgorithmCodes(String(item)).forEach((code) => codes.add(code));
      continue;
    }
    if (item && typeof item === "object") {
      const row = /** @type {Record<string, unknown>} */ (item);
      parseAlgorithmCodes(row.algorithmCode ?? row.code ?? row.algorithmCodes).forEach((code) =>
        codes.add(code),
      );
    }
  }

  return [...codes];
}

export function getAlgorithmApplyResultMeta(result) {
  return ALGORITHM_APPLY_RESULT_META[result] || ALGORITHM_APPLY_RESULT_META[ALGORITHM_APPLY_RESULT.PENDING];
}

export function getAlgorithmApprovalResultMeta(result) {
  const key = Number(result);
  return (
    ALGORITHM_APPROVAL_RESULT_META[key] ||
    ALGORITHM_APPROVAL_RESULT_META[ALGORITHM_APPROVAL_RESULT.PENDING]
  );
}

export function getAlgorithmSourceLabel(source) {
  return ALGORITHM_SOURCE_LABELS[source] || source || "";
}
