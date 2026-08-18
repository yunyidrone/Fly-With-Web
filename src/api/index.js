import { requestData, requestOk } from "@/utils/request.js";
import { withLoginOrgId } from "@/utils/org-query.js";

export class AccompanyingFlyService {
  /**
   * 无人机列表（分页在 data.records）
   * @param {Record<string, any>} [query] 可选查询参数；会与默认分页合并
   */
  static async droneList(query = {}) {
    const params = withLoginOrgId({
      current: 1, 
      pageSize: 999,
      ...query,
    });
    return requestData("/drone/pageQuery", { params }, "GET");
  }

  /**
   * 建议无人机列表（用于车辆详情推荐）
   * @param {Record<string, any>} [query]
   */
  static async droneSuggestList(query = {}) {
    return requestData("/drone/suggestList", { params: query }, "GET");
  }
  /**
   * 无人机详情
   * @param {{id: string|number}} query
   */
  static async droneDetail(query) {
    return requestData("/drone/detail", { params: query }, "GET");
  }

  /**
   * 无人机启停用
   * @param {{ ids: Array<string|number>, switchStatus: 0|1 }} body switchStatus 0启用 1禁用
   */
  static async droneSwitch(body, options = {}) {
    return requestData("/drone/switch", body, "POST", "application/json", options);
  }

  /**
   * 无人机电量阈值设置
   * @param {{ ids: Array<string|number>, batteryThreshold: number }} body
   */
  static async droneBatterySet(body, options = {}) {
    return requestData("/drone/batterySet", body, "POST", "application/json", options);
  }

  /**
   * 无人机算法配置
   * @param {{ ids: Array<string|number>, algorithmIds: string }} body algorithmIds 为逗号分隔 ID
   */
  static async droneAlgorithmSet(body, options = {}) {
    return requestData("/drone/algorithmSet", body, "POST", "application/json", options);
  }

  /**
   * 伴飞目标列表分页（数据多在 data.records，兼容 list / data 数组）
   * @param {Record<string, any>} [query]
   */
  static async targetList(query = {}) {
    const params = withLoginOrgId({
      current: 1,
      pageSize: 9999,
      ...query,
    });
    return requestData("/target/pageQuery", { params }, "GET");
  }
  /**
   * 开始伴飞
   */
  static async startFollow(params) {
    return requestData("/target/startFollow", params, "POST", "application/json");
  }

  /**
   * 伴飞请求绑定校验：sn 为目标 terminalPhone
   * @returns {Promise<{ code: number, data: boolean, [key: string]: unknown }>} 业务结果在 data：true 可弹窗，false 已绑定
   */
  static async targetBindCheck(query = {}, options = {}) {
    return requestOk("/target/bindCheck", { params: query }, "GET", undefined, options);
  }

   /**
   * 停止伴飞
   */
  static async stopFollow(params) {
    return requestData("/target/stopFollow", params, "POST", "application/json");
  }

  /**
   * 通用配置数据源
   * @param {Record<string, any>} [query] type 非必填（如伴随资源枚举传 1）
   * @param {{ silent?: boolean }} [options] silent 为 true 时不弹出全局失败 toast
   */
  static async getConfigSource(query = {}, options = {}) {
    return requestData("/config/getSource", { params: query }, "GET", undefined, options);
  }
}
