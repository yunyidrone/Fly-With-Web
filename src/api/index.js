import { request } from "@/utils/request.js";

export class AccompanyingFlyService {
  /**
   * 无人机列表（分页在 data.records）
   * @param {Record<string, any>} [query] 可选查询参数；会与默认分页合并
   */
  static async droneList(query = {}) {
    const params = {
      current: 1, 
      pageSize: 100,
      ...query,
    };
    return request("/drone/pageQuery", { params }, "GET");
  }
  /**
   * 伴飞目标列表分页（数据多在 data.records，兼容 list / data 数组）
   * @param {Record<string, any>} [query]
   */
  static async targetList(query = {}) {
    const params = {
      current: 1,
      pageSize: 100,
      ...query,
    };
    return request("/target/pageQuery", { params }, "GET");
  }
  static async startFollow(params) {
    return request("/target/startFollow", params, "POST", "application/json");
  }
  static async stopFollow(params) {
    return request("/target/stopFollow", params, "POST", "application/json" );
  }
  /**
   * 一键起飞
   * @param params
   * @returns {Promise<*>}
   */
  static async takeOff(params) {
    return request("/flywith/start", params);
  }

  /**
   * 一键返航
   * @param params
   * @returns {Promise<*>}
   */
  static async returnHome(params) {
    return request("/flywith/stop", params);
  }
}
