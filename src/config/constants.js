/** 角色枚举 */
export const ROLES = {
  SUPER_ADMIN: "super_admin",
  ORG_ADMIN: "org_admin",
  ORG_VIEWER: "org_viewer",
};

export const ROLE_LABELS = {
  [ROLES.SUPER_ADMIN]: "中心超管",
  [ROLES.ORG_ADMIN]: "所级管理员",
  [ROLES.ORG_VIEWER]: "所级只读",
};

/** 无人机运行态 */
export const DRONE_RAW_STATUS = {
  0: { label: "离线", type: "info" },
  1: { label: "就绪", type: "success" },
  2: { label: "伴飞中", type: "warning" },
  3: { label: "返航中", type: "primary" },
};

export const LOW_BATTERY_THRESHOLD = 20;

/** 看板轮询间隔（毫秒） */
export const DASHBOARD_POLL_INTERVAL = 10000;
