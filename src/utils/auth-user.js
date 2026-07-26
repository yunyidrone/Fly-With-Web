import { ROLES } from "@/config/constants.js";

/**
 * 将后端角色字段映射为前端 ROLES 枚举
 * @param {Record<string, unknown>} source
 * @returns {string}
 */
function normalizeRole(source) {
  if (Number(source.superFlag) === 1) {
    return ROLES.SUPER_ADMIN;
  }

  const raw =
    source.role ??
    source.roleCode ??
    source.roleKey ??
    source.userRole ??
    source.roleType ??
    source.roleName ??
    "";
  const text = String(raw).trim();
  if (!text) return "";

  const lower = text.toLowerCase().replace(/-/g, "_");
  const aliasMap = {
    [ROLES.SUPER_ADMIN]: ROLES.SUPER_ADMIN,
    [ROLES.ORG_ADMIN]: ROLES.ORG_ADMIN,
    [ROLES.ORG_VIEWER]: ROLES.ORG_VIEWER,
    admin: ROLES.SUPER_ADMIN,
    superadmin: ROLES.SUPER_ADMIN,
    orgadmin: ROLES.ORG_ADMIN,
    orgviewer: ROLES.ORG_VIEWER,
    viewer: ROLES.ORG_VIEWER,
    中心超管: ROLES.SUPER_ADMIN,
    平台管理员: ROLES.SUPER_ADMIN,
    超管: ROLES.SUPER_ADMIN,
    所级管理员: ROLES.ORG_ADMIN,
    单位级管理员: ROLES.ORG_ADMIN,
    单位管理员: ROLES.ORG_ADMIN,
    普通用户: ROLES.ORG_VIEWER,
    所级只读: ROLES.ORG_VIEWER,
  };

  return aliasMap[lower] || aliasMap[text] || text;
}

/**
 * 将后端 auth 接口返回的用户字段映射为前端统一结构
 * @param {unknown} raw
 */
export function normalizeAuthUser(raw) {
  if (!raw || typeof raw !== "object") return null;

  const source = /** @type {Record<string, unknown>} */ (raw);
  const userName = String(source.userName ?? source.username ?? source.account ?? "");
  const firstLoginRaw = source.firstLogin;

  return {
    id: source.id ?? source.userId ?? null,
    username: userName,
    userName,
    displayName: String(
      source.displayName ??
        source.nickname ??
        source.name ??
        userName ??
        "",
    ),
    role: normalizeRole(source),
    orgId: source.orgId ?? source.organizationId ?? null,
    orgName: String(
      source.orgName ?? source.organizationName ?? source.unitName ?? source.deptName ?? "",
    ),
    orgIsGrassroots: Boolean(source.orgIsGrassroots ?? source.isGrassroots ?? false),
    /** 0 首次登录需强制改密；1 非首次登录 */
    firstLogin: firstLoginRaw == null || firstLoginRaw === "" ? null : Number(firstLoginRaw),
    platforms: Array.isArray(source.platforms)
      ? source.platforms
      : Array.isArray(source.platformList)
        ? source.platformList
        : [],
  };
}

/**
 * 从登录响应 data 中提取 token 与用户信息
 * @param {unknown} data
 */
export function extractLoginPayload(data) {
  if (typeof data === "string") {
    return { token: data.trim(), user: null };
  }
  if (!data || typeof data !== "object") {
    return { token: "", user: null };
  }

  const root = /** @type {Record<string, unknown>} */ (data);
  const payload =
    root.data && typeof root.data === "object"
      ? /** @type {Record<string, unknown>} */ (root.data)
      : root;

  const tokenCandidates = [
    typeof payload.data === "string" ? payload.data : "",
    payload.token,
    payload.accessToken,
    payload.access_token,
    payload.authorization,
    payload.Authorization,
    payload.jwt,
    payload.jwtToken,
    payload.id_token,
    root.token,
    root.accessToken,
    root.access_token,
    root.authorization,
    root.Authorization,
    typeof root.data === "string" ? root.data : "",
  ];
  const tokenRaw = tokenCandidates.find((item) => typeof item === "string" && item.trim()) || "";
  const token = String(tokenRaw).replace(/^Bearer\s+/i, "").trim();

  const nestedUser = payload.user ?? payload.profile ?? payload.userInfo;
  const user = normalizeAuthUser(
    nestedUser ?? (payload.role || payload.username || payload.userName ? payload : null),
  );

  return { token, user };
}
