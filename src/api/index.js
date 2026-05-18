import { request } from "@/utils/request.js";

export class AccompanyingFlyService {
  /**
   * 无人机列表（分页在 data.records）
   * @param {Record<string, any>} [query] 可选查询参数（如分页）
   */
  static async droneList(query = {}) {
    return request("/drone/list", { params: query }, "GET");
  }
  // 伴飞目标物体
  static async targetList() {
    return request("/target/pageQuery", {}, "GET");
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
