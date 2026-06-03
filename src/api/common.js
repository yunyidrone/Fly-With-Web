import { requestData } from "@/utils/request.js";

export class CommonService {
  /**
   * 封控点列表
   */
  static async controlPointListQuery(params = {}) {
    return requestData("/control/point/listQuery", { params }, "GET");
  }
}
