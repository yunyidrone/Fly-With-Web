import { requestData, unwrapApiList } from "@/utils/request.js";
import { withLoginOrgId } from "@/utils/org-query.js";

function normalizePersonGroupIds(data) {
  if (Array.isArray(data)) {
    return data.map((id) => String(id ?? "").trim()).filter(Boolean);
  }
  return unwrapApiList(data)
    .map((id) => String(id ?? "").trim())
    .filter(Boolean);
}

export class PersonGroupService {
  /**
   * 当前单位所有人脸库 ID（结果在 data 中）
   * @param {Record<string, any>} [query]
   * @param {{ silent?: boolean }} [options]
   * @returns {Promise<string[]>}
   */
  static async getIds(query = {}, options = { silent: true }) {
    const params = withLoginOrgId(query);
    const data = await requestData(
      "/personGroup/getIds",
      { params },
      "GET",
      undefined,
      options,
    );
    return normalizePersonGroupIds(data);
  }
}
