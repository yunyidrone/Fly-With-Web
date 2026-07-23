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

/** 无人机作业状态（列表展示） */
export const DRONE_WORK_STATUS = {
  0: "-",
  1: "空闲",
  2: "伴飞中",
  3: "返航中",
};

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

export const LOW_BATTERY_THRESHOLD = 20;

/** 看板轮询间隔（毫秒） */
export const DASHBOARD_POLL_INTERVAL = 10000;

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

/** 账户平台权限 */
export const USER_PLATFORM = {
  WEB: "web",
  CLIENT: "client",
};

export const USER_PLATFORM_LABELS = {
  [USER_PLATFORM.WEB]: "伴飞平台web端",
  [USER_PLATFORM.CLIENT]: "伴飞客户端",
};
