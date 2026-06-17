import Axios from "axios";
import { ElMessage } from "element-plus";
import { ROBOT_VIDEO_CONFIG } from "@/config/app-config.js";

const client = Axios.create({
  baseURL: ROBOT_VIDEO_CONFIG.baseURL,
  timeout: 150000,
});

/**
 * 从接口响应中提取后台 message（兼容 msg）
 * @param {unknown} payload
 */
function extractApiMessage(payload) {
  if (payload == null || typeof payload !== "object") return "";
  const obj = /** @type {Record<string, unknown>} */ (payload);
  const raw = obj.message ?? obj.msg;
  return typeof raw === "string" ? raw.trim() : "";
}

/**
 * 弹出错误提示并抛出 Error
 * @param {string} fallback
 * @param {unknown} [payload]
 * @returns {never}
 */
function failRequest(fallback, payload) {
  const message = extractApiMessage(payload) || fallback;
  ElMessage.error(message);
  throw new Error(message);
}

client.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      extractApiMessage(error.response?.data) ||
      error.message ||
      "机器人视频接口请求失败";
    ElMessage.error(message);
    return Promise.reject(new Error(message));
  },
);

/**
 * 从星枢 WebRTC 接口响应中解析播放地址
 * @param {unknown} payload
 */
export function unwrapRobotWebrtcUrl(payload) {
  if (payload == null) return "";
  if (typeof payload === "string") return payload.trim();

  if (typeof payload !== "object") return "";

  const obj = /** @type {Record<string, unknown>} */ (payload);
  const direct =
    obj.rtcs ??
    obj.rtc ??
    obj.playUrl ??
    obj.streamUrl ??
    obj.url ??
    obj.webrtcUrl;
  if (typeof direct === "string" && direct.trim()) return direct.trim();

  if (obj.data != null && obj.data !== payload) {
    return unwrapRobotWebrtcUrl(obj.data);
  }

  return "";
}

export class RobotVideoService {
  /**
   * 获取机器人 WebRTC 播放地址
   * @param {{ communityId: number|string, robotId: number|string }} params
   */
  static async getWebrtcPlayUrl(params) {
    const communityId = Number(params?.communityId);
    const robotId = Number(params?.robotId);
    if (!Number.isFinite(communityId) || !Number.isFinite(robotId)) {
      failRequest("缺少 communityId 或 robotId");
    }

    const token = String(ROBOT_VIDEO_CONFIG.token || "").trim();
    if (!token) {
      failRequest("未配置机器人视频接口 Token");
    }

    const res = await client.post(
      "/inspection/media/camera-video/webrtc/:get",
      { communityId, robotId },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    const url = unwrapRobotWebrtcUrl(res.data);
    if (!url) {
      failRequest("接口未返回有效的 rtcs 播放地址", res.data);
    }
    return url;
  }
}
