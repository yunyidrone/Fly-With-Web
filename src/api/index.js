import { request } from "@/utils/request.js";

export class AccompanyingFlyService {
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
