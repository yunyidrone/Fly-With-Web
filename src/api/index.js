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
   * 建议无人机列表（用于车辆详情推荐）
   * @param {Record<string, any>} [query]
   */
  static async droneSuggestList(query = {}) {
    return request("/drone/suggestList", { params: query }, "GET");
  }
  /**
   * 无人机详情
   * @param {{id: string|number}} query
   */
  static async droneDetail(query) {
    return request("/drone/detail", { params: query }, "GET");
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
  /**
   * 开始伴飞
   */
  static async startFollow(params) {
    return request("/target/startFollow", params, "POST", "application/json");
  }
   /**
   * 停止伴飞
   */
  static async stopFollow(params) {
    return request("/target/stopFollow", params, "POST", "application/json" );
  }
  /**
   * 一键起飞
   * @param params
   * @returns {Promise<*>}
   */
  // static async takeOff(params) {
  //   return request("/flywith/start", params);
  // }

  /**
   * 一键返航
   * @param params
   * @returns {Promise<*>}
   */
  // static async returnHome(params) {
  //   return request("/flywith/stop", params);
  // }

  /**
   * 通用配置数据源
   * @param {Record<string, any>} [query] type 非必填（如伴随资源枚举传 1）
   * @returns {Promise<{ code?: number, data?: Array<{ id?: string, type?: number, key?: string, value?: string, sort?: number }> }>}
   */
  static async getConfigSource(query = {}) {
    return request("/config/getSource", { params: query }, "GET");
  }
}
