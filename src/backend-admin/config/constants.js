/** 角色枚举 */
export const ROLES = {
  SUPER_ADMIN: "super_admin",
  ORG_ADMIN: "org_admin",
  ORG_VIEWER: "org_viewer",
};

export const ROLE_LABELS = {
  [ROLES.SUPER_ADMIN]: "中心超管",
  [ROLES.ORG_ADMIN]: "单位管理员",
  [ROLES.ORG_VIEWER]: "单位只读",
};

/** 无人机运行态 */
export const DRONE_RAW_STATUS = {
  0: { label: "离线", type: "info" },
  1: { label: "就绪", type: "success" },
  2: { label: "伴飞中", type: "warning" },
  3: { label: "返航中", type: "primary" },
};

/** 无人机作业状态（列表展示）：仅 status=2 为伴飞中，其余为空闲 */
export function resolveDroneWorkStatusText(status) {
  return Number(status) === 2 ? "伴飞中" : "空闲";
}

/** 无人机类型 */
export const DRONE_TYPE = {
  SINGLE: "single",
  DOCK: "dock",
};

export const DRONE_TYPE_META = {
  [DRONE_TYPE.SINGLE]: { prefix: "单兵", tagType: "success" },
  [DRONE_TYPE.DOCK]: { prefix: "机巢", tagType: "warning" },
};

/** 目标设备类型：1警车 2警员 3机器人 4车辆(第三方推送) 5学生证 6肩灯 */
export const TARGET_TYPE = {
  POLICE_CAR: 1,
  OFFICER: 2,
  ROBOT: 3,
  VEHICLE: 4,
  STUDENT_CARD: 5,
  SHOULDER_LIGHT: 6,
};

export const TARGET_TYPE_LABELS = {
  [TARGET_TYPE.POLICE_CAR]: "警车",
  [TARGET_TYPE.OFFICER]: "警员",
  [TARGET_TYPE.ROBOT]: "机器人",
  [TARGET_TYPE.VEHICLE]: "车辆(第三方推送)",
  [TARGET_TYPE.STUDENT_CARD]: "学生证",
  [TARGET_TYPE.SHOULDER_LIGHT]: "肩灯",
};

export const TARGET_TYPE_OPTIONS = Object.entries(TARGET_TYPE_LABELS).map(([value, label]) => ({
  value: Number(value),
  label,
}));

/** 卡点类型：1高速口 2CBD 3学校 */
export const CHECKPOINT_TYPE = {
  HIGHWAY_EXIT: 1,
  CBD: 2,
  SCHOOL: 3,
};

export const CHECKPOINT_TYPE_LABELS = {
  [CHECKPOINT_TYPE.HIGHWAY_EXIT]: "高速口",
  [CHECKPOINT_TYPE.CBD]: "CBD",
  [CHECKPOINT_TYPE.SCHOOL]: "学校",
};

export const CHECKPOINT_TYPE_OPTIONS = Object.entries(CHECKPOINT_TYPE_LABELS).map(
  ([value, label]) => ({
    value: Number(value),
    label,
  }),
);

/** 计划类型：与 /place/listQuery、/place/add 的 type 一致 */
export const PLAN_TYPE = {
  MOUNTAIN: 1,
  WATER: 2,
  SECURITY: 3,
};

export const PLAN_TYPE_LABELS = {
  [PLAN_TYPE.MOUNTAIN]: "山林救援",
  [PLAN_TYPE.WATER]: "水上观察",
  [PLAN_TYPE.SECURITY]: "重点安保",
};

export const PLAN_TYPE_OPTIONS = Object.entries(PLAN_TYPE_LABELS).map(([value, label]) => ({
  value: Number(value),
  label,
}));

/** 重点地点类别：与 /place/listQuery 的 placeType 一致 */
export const PLACE_TYPE = {
  PRIMARY_SCHOOL: 1,
  MIDDLE_SCHOOL: 2,
  UNIVERSITY: 3,
  GAS_STATION: 4,
  RAIL_STATION: 5,
  HOSPITAL: 6,
  PARK: 7,
  GOVERNMENT: 8,
};

export const PLACE_TYPE_LABELS = {
  [PLACE_TYPE.PRIMARY_SCHOOL]: "小学",
  [PLACE_TYPE.MIDDLE_SCHOOL]: "中学",
  [PLACE_TYPE.UNIVERSITY]: "高校",
  [PLACE_TYPE.GAS_STATION]: "加油站",
  [PLACE_TYPE.RAIL_STATION]: "动车站",
  [PLACE_TYPE.HOSPITAL]: "医院",
  [PLACE_TYPE.PARK]: "公园",
  [PLACE_TYPE.GOVERNMENT]: "政府单位",
};

export const PLACE_TYPE_OPTIONS = Object.entries(PLACE_TYPE_LABELS).map(([value, label]) => ({
  value: Number(value),
  label,
}));

export const LOW_BATTERY_THRESHOLD = 20;

/** 看板轮询间隔（毫秒） */
export const DASHBOARD_POLL_INTERVAL = 10000;

/** 监控看板列表展示上限 */
export const MONITOR_PANEL_LIST_LIMIT = 10;

/** 单位性质 */
export const ORG_NATURE = {
  PUBLIC_SECURITY_BUREAU: "public_security_bureau",
  POLICE_STATION: "police_station",
  INSTITUTION: "institution",
  TEMPORARY: "temporary",
  OTHER: "other",
};

export const ORG_NATURE_LABELS = {
  [ORG_NATURE.PUBLIC_SECURITY_BUREAU]: "公安局",
  [ORG_NATURE.POLICE_STATION]: "派出所",
  [ORG_NATURE.INSTITUTION]: "事业单位",
  [ORG_NATURE.TEMPORARY]: "临时单位",
  [ORG_NATURE.OTHER]: "其他",
};

/** 单位性质 orgLabel：1单位集 2公安局 3派出所 4事业单位 5临时单位 6其他 */
export const ORG_LABEL = {
  SET: 1,
  PUBLIC_SECURITY_BUREAU: 2,
  POLICE_STATION: 3,
  INSTITUTION: 4,
  TEMPORARY: 5,
  OTHER: 6,
};

export const ORG_LABEL_TEXT = {
  [ORG_LABEL.SET]: "单位集",
  [ORG_LABEL.PUBLIC_SECURITY_BUREAU]: "公安局",
  [ORG_LABEL.POLICE_STATION]: "派出所",
  [ORG_LABEL.INSTITUTION]: "事业单位",
  [ORG_LABEL.TEMPORARY]: "临时单位",
  [ORG_LABEL.OTHER]: "其他",
};

/** 本期固定区域 */
export const DEFAULT_REGION = "huangyan";
export const DEFAULT_REGION_LABEL = "黄岩区管理";
export const DEFAULT_REGION_FULL_LABEL = "浙江省台州黄岩管理区";
export const DEFAULT_PARENT_PATH = "root/黄岩区管理";

/**
 * 账户授权平台 authPlatform（多选逗号拼接，如 "1,2"）
 * 1 平台权限  2 伴飞客户端
 */
export const USER_PLATFORM = {
  WEB: 1,
  CLIENT: 2,
};

export const USER_PLATFORM_LABELS = {
  [USER_PLATFORM.WEB]: "平台权限",
  [USER_PLATFORM.CLIENT]: "伴飞客户端",
};

export const USER_PLATFORM_OPTIONS = [
  { value: USER_PLATFORM.WEB, label: USER_PLATFORM_LABELS[USER_PLATFORM.WEB] },
  { value: USER_PLATFORM.CLIENT, label: USER_PLATFORM_LABELS[USER_PLATFORM.CLIENT] },
];

/** 监控库车辆动力类型：1 燃油车 2 新能源 */
export const VEHICLE_POWER_TYPE = {
  FUEL: 1,
  NEW_ENERGY: 2,
};

export const VEHICLE_POWER_TYPE_LABELS = {
  [VEHICLE_POWER_TYPE.NEW_ENERGY]: "新能源",
  [VEHICLE_POWER_TYPE.FUEL]: "燃油车",
};

export const VEHICLE_POWER_TYPE_OPTIONS = [
  { value: VEHICLE_POWER_TYPE.FUEL, label: "燃油车" },
  { value: VEHICLE_POWER_TYPE.NEW_ENERGY, label: "新能源" },
];

/** 车牌省份简称（含全称，供搜索） */
export const VEHICLE_PLATE_PROVINCES = [
  { value: "京", name: "北京" },
  { value: "津", name: "天津" },
  { value: "沪", name: "上海" },
  { value: "渝", name: "重庆" },
  { value: "冀", name: "河北" },
  { value: "豫", name: "河南" },
  { value: "云", name: "云南" },
  { value: "辽", name: "辽宁" },
  { value: "黑", name: "黑龙江" },
  { value: "湘", name: "湖南" },
  { value: "皖", name: "安徽" },
  { value: "鲁", name: "山东" },
  { value: "新", name: "新疆" },
  { value: "苏", name: "江苏" },
  { value: "浙", name: "浙江" },
  { value: "赣", name: "江西" },
  { value: "鄂", name: "湖北" },
  { value: "桂", name: "广西" },
  { value: "甘", name: "甘肃" },
  { value: "晋", name: "山西" },
  { value: "蒙", name: "内蒙古" },
  { value: "陕", name: "陕西" },
  { value: "吉", name: "吉林" },
  { value: "闽", name: "福建" },
  { value: "贵", name: "贵州" },
  { value: "粤", name: "广东" },
  { value: "青", name: "青海" },
  { value: "藏", name: "西藏" },
  { value: "川", name: "四川" },
  { value: "宁", name: "宁夏" },
  { value: "琼", name: "海南" },
];

export const VEHICLE_PLATE_PROVINCE_OPTIONS = VEHICLE_PLATE_PROVINCES.map((item) => ({
  value: item.value,
  label: item.value,
  name: item.name,
}));

export function resolveVehiclePowerTypeLabel(type) {
  const key = Number(type);
  if (Number.isFinite(key) && VEHICLE_POWER_TYPE_LABELS[key]) {
    return VEHICLE_POWER_TYPE_LABELS[key];
  }
  return String(type ?? "").trim();
}

/** 监控库人像预警类型 warningType */
export const PORTRAIT_WARNING_TYPE = {
  CONTROL: 1,
  DISTURBANCE: 2,
  FUGITIVE: 3,
  OTHER: 4,
};

export const PORTRAIT_WARNING_TYPE_LABELS = {
  [PORTRAIT_WARNING_TYPE.CONTROL]: "布控",
  [PORTRAIT_WARNING_TYPE.DISTURBANCE]: "可解密事",
  [PORTRAIT_WARNING_TYPE.FUGITIVE]: "在逃人员",
  [PORTRAIT_WARNING_TYPE.OTHER]: "其他",
};

export const PORTRAIT_WARNING_TYPE_OPTIONS = Object.entries(PORTRAIT_WARNING_TYPE_LABELS).map(
  ([value, label]) => ({
    value: Number(value),
    label,
  }),
);

export function resolvePortraitWarningTypeLabel(type) {
  const key = Number(type);
  if (Number.isFinite(key) && PORTRAIT_WARNING_TYPE_LABELS[key]) {
    return PORTRAIT_WARNING_TYPE_LABELS[key];
  }
  return String(type ?? "").trim();
}

/** 人像性别 gender：0 未填写 1 男性 2 女性 */
export const PORTRAIT_GENDER = {
  UNKNOWN: 0,
  MALE: 1,
  FEMALE: 2,
};

export const PORTRAIT_GENDER_LABELS = {
  [PORTRAIT_GENDER.UNKNOWN]: "未知",
  [PORTRAIT_GENDER.MALE]: "男性",
  [PORTRAIT_GENDER.FEMALE]: "女性",
};

export const PORTRAIT_GENDER_OPTIONS = Object.entries(PORTRAIT_GENDER_LABELS).map(
  ([value, label]) => ({
    value: Number(value),
    label,
  }),
);

export function resolvePortraitGenderLabel(gender) {
  const key = Number(gender);
  if (Number.isFinite(key) && PORTRAIT_GENDER_LABELS[key]) {
    return PORTRAIT_GENDER_LABELS[key];
  }
  return PORTRAIT_GENDER_LABELS[PORTRAIT_GENDER.UNKNOWN];
}

/** @deprecated 使用 PORTRAIT_WARNING_TYPE */
export const PORTRAIT_WARN_TYPE = PORTRAIT_WARNING_TYPE;
/** @deprecated 使用 PORTRAIT_WARNING_TYPE_LABELS */
export const PORTRAIT_WARN_TYPE_LABELS = PORTRAIT_WARNING_TYPE_LABELS;
/** @deprecated 使用 PORTRAIT_WARNING_TYPE_OPTIONS */
export const PORTRAIT_WARN_TYPE_OPTIONS = PORTRAIT_WARNING_TYPE_OPTIONS;
