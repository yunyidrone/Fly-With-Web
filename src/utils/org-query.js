import { useAuthStore } from "@/stores/auth.js";

/**
 * 登录用户信息里有 orgId 时带上，没有则不传该字段。
 * @param {Record<string, any>} [params]
 * @returns {Record<string, any>}
 */
export function withLoginOrgId(params = {}) {
  const query = { ...(params || {}) };
  let orgId = null;
  try {
    orgId = useAuthStore().orgId;
  } catch {
    orgId = null;
  }
  if (orgId != null && orgId !== "") {
    query.orgId = orgId;
  } else {
    delete query.orgId;
  }
  return query;
}
