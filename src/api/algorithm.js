import { requestData } from "@/utils/request.js";

export class AlgorithmService {
  /**
   * 算法列表（开放接口）
   * @returns {Promise<unknown>} 项含 algorithmId、algorithmCode、algorithmName
   */
  static async list() {
    return requestData("/open/algorithm/list", {}, "GET");
  }
}
