import { requestData } from "@/utils/request.js";

/** 默认机器人 ID */
export const DEFAULT_ROBOT_ID = 39;
/** 默认社区 ID */
export const DEFAULT_COMMUNITY_ID = 48;

export class RobotService {
  /**
   * 获取机器人 WebRTC 播放地址
   * @param {{ communityId: number|string, robotId: number|string }} params
   * @returns {Promise<string>}
   */
  static async getPlayUrl(params) {
    const communityId = Number(params?.communityId);
    const robotId = Number(params?.robotId);
    if (!Number.isFinite(communityId) || !Number.isFinite(robotId)) {
      throw new Error("缺少 communityId 或 robotId");
    }
    const data = await requestData("/target/robotPlayUrl", { communityId, robotId }, "POST");
    if (!data?.rtcs) {
      throw new Error("接口未返回有效的 rtcs 播放地址");
    }
    return data.rtcs;
  }
}
