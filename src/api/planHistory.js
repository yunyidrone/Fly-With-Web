import { requestData } from "@/utils/request.js";

export class PlanHistoryService {
  /**
   * 执行任务记录分页（按开始日期，近 30 日）
   * @param {Record<string, any>} params startDate endDate current pageSize
   */
  static async executeRecordPageQuery(params = {}) {
    return requestData("/plan/executeRecord/pageQuery", { params }, "GET");
  }

  /**
   * 删除执行记录
   * @param {{ id: string|number }} params
   */
  static async executeRecordDelete(params) {
    return requestData("/plan/executeRecord/delete", params, "POST", "application/json");
  }

  /**
   * 快捷创建（基于历史记录复制为新计划）
   * @param {Record<string, any>} body
   */
  static async executeRecordQuickCreate(body) {
    return requestData("/plan/executeRecord/quickCreate", body, "POST");
  }
}
