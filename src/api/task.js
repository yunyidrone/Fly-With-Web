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
   * @param {{ thirdPartyId: string, current?: number, pageSize?: number }} params
   */
  static taskWarningPageQuery(params = {}) {
    return requestData("/task/warning/pageQuery", { params }, "GET");
  }

  /**
   * 识别结果是否弹窗提示
   * @param {{ aiResult: string, name?: string, originalImageUrl?: string, groupIds?: string[] }} data
   * @param {{ silent?: boolean }} [options] 默认 silent，非 2000 时不弹全局错误提示
   * @returns {Promise<unknown>} code 2000 时返回 data，仅用于替换弹窗「识别结果」
   */
  static alertCheck(data = {}, options = { silent: true }) {
    return requestData("/task/alertCheck", data, "POST", "application/json", options);
  }
}
