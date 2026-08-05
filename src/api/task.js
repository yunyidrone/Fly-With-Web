import { requestData } from "@/utils/request.js";

export class TaskService {
  /**
   * 伴飞任务分页
   * @param {Record<string, any>} params current pageSize startTime endTime status
   */
  static taskPageQuery(params = {}) {
    return requestData("/task/pageQuery", { params }, "GET");
  }

  /**
   * 伴飞任务告警分页
   * @param {{ uuid: string, current?: number, pageSize?: number }} params
   */
  static taskWarningPageQuery(params = {}) {
    return requestData("/task/warning/pageQuery", { params }, "GET");
  }

  /**
   * 识别结果是否弹窗提示
   * @param {{ aiResult: string }} data
   * @returns {Promise<boolean>}
   */
  static alertCheck(data = {}) {
    return requestData("/task/alertCheck", data, "POST", "application/json");
  }
}
