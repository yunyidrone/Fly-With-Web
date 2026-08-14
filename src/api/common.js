import { requestData } from "@/utils/request.js";

export class CommonService {
  /**
   * 封控点列表
   */
  static async controlPointListQuery(params = {}) {
    return requestData("/control/point/listQuery", { params }, "GET");
  }

  /**
   * 一键封城部署
   * @param {{ droneIds: Array<string|number>, controlPointIds: Array<string|number> }} data
   */
  static async controlPointDeploy(data) {
    return requestData("/control/point/deploy", data, "POST");
  }

  /**
   * 解除封城
   * @param {{ droneIds: Array<string|number>, controlPointIds: Array<string|number> }} data
   */
  static async controlPointUnDeploy(data) {
    return requestData("/control/point/unDeploy", data, "POST");
  }
}
