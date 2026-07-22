/**
 * 将后端 auth 接口返回的用户字段映射为前端统一结构
 * @param {unknown} raw
 */
export function normalizeAuthUser(raw) {
  if (!raw || typeof raw !== "object") return null;

  const source = /** @type {Record<string, unknown>} */ (raw);
  const role = source.role ?? source.userRole ?? source.roleType ?? "";

  return {
    id: source.id ?? source.userId ?? null,
    username: String(source.username ?? source.userName ?? source.account ?? ""),
    displayName: String(
      source.displayName ??
        source.nickname ??
        source.name ??
        source.username ??
        source.userName ??
        source.account ??
        "",
    ),
    role: String(role),
    orgId: source.orgId ?? source.organizationId ?? null,
    orgName: String(source.orgName ?? source.organizationName ?? ""),
    orgIsGrassroots: Boolean(source.orgIsGrassroots ?? source.isGrassroots ?? false),
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
