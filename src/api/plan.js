import { requestData } from "@/utils/request.js";

export class FlightPlanService {
  /**
   * 飞行计划分页列表
   * @param {Record<string, any>} query type: 1山林救援 2水上观察 3重点安保 | name | current | pageSize
   */
  static async planPageQuery(query = {}) {
    const params = {
      current: 1,
      pageSize: 100,
      ...query,
    };
    return requestData("/plan/pageQuery", { params }, "GET");
  }

  /**
   * 新增飞行计划（JSON）
   * @param {Record<string, any>} body type name place longitude latitude executeDate executeStartTime executeEndTime resourceConfig
   */
  static async planAdd(body) {
    return requestData("/plan/add", body, "POST");
  }

  /**
   * 删除飞行计划
   * @param {{id:string|number}} params
   */
  static async planDelete(params) {
    return requestData("/plan/delete", params, "POST", "application/json");
  }

  /**
   * 开启飞行计划任务
   * @param {{id:string|number}} params
   */
  static async planStartFollow(params) {
    return requestData("/plan/startFollow", params, "POST", "application/json");
  }

  /**
   * 停止飞行计划任务
   * @param {{id:string|number}} params
   */
  static async planStopFollow(params) {
    return requestData("/plan/stopFollow", params, "POST", "application/json");
  }

  /**
   * 地点列表（按计划类型查询）
   * @param {{type:number}} params type: 1山林救援 2水上观察 3重点安保
   */
  static async placeListQuery(params) {
    return requestData("/place/listQuery", { params }, "GET");
  }

  /**
   * 飞行计划详情
   * @param {{id:string|number}} params
   */
  static async planDetail(params) {
    return requestData("/plan/detail", { params }, "GET");
  }

  /**
   * 编辑飞行计划
   * @param {Record<string, any>} body id type name executeDate executeStartTime executeEndTime placeIds resourceConfig
   */
  static async planUpdate(body) {
    return requestData("/plan/update", body, "POST");
  }
}
