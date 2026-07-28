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
