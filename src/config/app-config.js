/**
 * 应用配置中心
 * 所有配置项从环境变量读取，提供默认值
 */

// ==========================================
// MQTT 配置
// ==========================================
export const MQTT_CONFIG = {
  protocol: import.meta.env.VITE_MQTT_PROTOCOL || "ws",
  host: import.meta.env.VITE_MQTT_HOST || "localhost",
  port: Number(import.meta.env.VITE_MQTT_PORT) || 8083,
  path: import.meta.env.VITE_MQTT_PATH || "/mqtt",
  username: import.meta.env.VITE_MQTT_USERNAME || "",
  password: import.meta.env.VITE_MQTT_PASSWORD || "",
  clientId: `vue3_mqtt_${Math.random().toString(16).slice(3)}`,
  clean: true,
  connectTimeout: 4000,
  reconnectPeriod: 1000,
};

export const WRJ_MQTT_CONFIG = {
  protocol: import.meta.env.VITE_WRJ_MQTT_PROTOCOL || "ws",
  host: import.meta.env.VITE_WRJ_MQTT_HOST || MQTT_CONFIG.host,
  port: Number(import.meta.env.VITE_WRJ_MQTT_PORT) || MQTT_CONFIG.port,
  path: import.meta.env.VITE_WRJ_MQTT_PATH || MQTT_CONFIG.path,
  username: import.meta.env.VITE_WRJ_MQTT_USERNAME || "",
  password: import.meta.env.VITE_WRJ_MQTT_PASSWORD || "",
  clientId: `vue3_wrj_mqtt_${Math.random().toString(16).slice(3)}`,
  clean: true,
  connectTimeout: 4000,
  reconnectPeriod: 1000,
};

// ==========================================
// API 配置
// ==========================================
export const API_CONFIG = {
  baseURL: import.meta.env.VITE_API_BASE_URL || "/api",
};

// ==========================================
// 视频流配置
// ==========================================
export const VIDEO_CONFIG = {
  streamUrl: import.meta.env.VITE_VIDEO_STREAM_URL || "",
};

// ==========================================
// 目标设备配置
// ==========================================
export const DEVICE_CONFIG = {
  targetId: import.meta.env.VITE_TARGET_ID || "test-target-id",
  droneId: import.meta.env.VITE_DRONE_ID || "test-drone-id",
};

// ==========================================
// 天地图配置
// ==========================================
export const TIANDITU_CONFIG = {
  key: import.meta.env.VITE_TIANDITU_KEY || "",
  // 备用 Key 列表
  keyList: [
    import.meta.env.VITE_TIANDITU_KEY || "97f84a3949b68123fc89e54758d5cd08",
  ],
};

// ==========================================
// 地图默认配置
// ==========================================
export const MAP_CONFIG = {
  defaultCenter: { lng: 121.427, lat: 28.6528 },
  maxLevel: 18,
  droneHeight: 150,
  carSpeed: 30,
  scopeRatio: 0.5,
};
