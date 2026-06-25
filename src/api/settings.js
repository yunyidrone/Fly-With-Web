import { requestData } from "@/utils/request.js";

/**
 * 系统设置相关接口
 */
export class SettingsService {
  /**
   * 低电量阈值列表
   * @param {{ deviceType?: string }} [query] drone | boat | dog
   */
  static async getBatteryThresholdList(query = {}, options = {}) {
    return requestData(
      "/config/lowBatteryThreshold/list",
      { params: query },
      "GET",
      undefined,
      options,
    );
  }

  /**
   * 保存低电量阈值
   * @param {{ deviceType: string, items: Array<{ modelId: string, threshold: number }> }} body
   */
  static async saveBatteryThreshold(body, options = {}) {
    return requestData(
      "/config/lowBatteryThreshold/save",
      body,
      "POST",
      "application/json",
      options,
    );
  }

  /**
   * 无人设备状态列表
   * @param {{ deviceType?: string }} [query]
   */
  static async getDeviceStatusList(query = {}, options = {}) {
    return requestData(
      "/unmannedDevice/status/list",
      { params: query },
      "GET",
      undefined,
      options,
    );
  }

  /**
   * 批量保存无人设备启用状态
   * @param {{ deviceType: string, items: Array<{ id: string, enabled: boolean }> }} body
   */
  static async saveDeviceStatus(body, options = {}) {
    return requestData(
      "/unmannedDevice/status/batchUpdate",
      body,
      "POST",
      "application/json",
      options,
    );
  }

  /**
   * 保存全部设置（阈值 + 设备状态）
   * @param {Record<string, unknown>} body
   */
  static async saveAll(body, options = {}) {
    return requestData("/settings/save", body, "POST", "application/json", options);
  }
}
