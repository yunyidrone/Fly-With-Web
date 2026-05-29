import { request } from "@/utils/request.js";

export class CommonService {
  /**
   * 封控点列表
   */
  static async controlPointListQuery(params = {}) {
    return request("/control/point/listQuery", { params }, "GET");
  }
}
