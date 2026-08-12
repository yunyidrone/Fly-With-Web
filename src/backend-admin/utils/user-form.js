/**
 * 从列表行或详情中解析账户主键
 * @param {Record<string, unknown> | null | undefined} record
 * @returns {string|number|null}
 */
export function resolveUserRecordId(record) {
  const raw = record?.id ?? record?.userId;
  if (raw == null || raw === "") return null;
  return raw;
}

/**
 * 构建编辑账户提交体（auth：POST /auth/user/update）
 * @param {Record<string, unknown>} form
 * @param {{
 *   id?: string|number,
 *   orgId?: string|number|null,
 *   rootOrgId?: string|number|null,
 *   authPlatform?: string,
 * }} options
 */
export function buildUserUpdatePayload(form, options = {}) {
  const id = resolveUserRecordId({
    id: options.id ?? form.id,
  });
  if (id == null) {
    throw new Error("缺少 id");
  }

  const payload = {
    id,
    userName: String(form.userName ?? "").trim(),
    roleId: form.roleId,
    orgId: options.orgId ?? form.orgId,
    rootOrgId: options.rootOrgId ?? form.rootOrgId,
    authPlatform: options.authPlatform,
  };

  const phone = String(form.phone ?? "").trim();
  const email = String(form.email ?? "").trim();
  if (phone) payload.phone = phone;
  if (email) payload.email = email;

  return payload;
}
