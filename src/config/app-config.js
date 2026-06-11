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
  // defaultCenter: { lng: 121.427, lat: 28.6528 },
  defaultCenter: { lng: 121.205390, lat: 28.624480 }, // 澄江封控点
  maxLevel: 18,
  droneHeight: 150,
  carSpeed: 30,
  scopeRatio: 0.5,
  /** 地图默认观察高度（米） */
  mapDefaultRange: 800,
  /** 视野高度可接受区间（米） */
  viewRangeMin: 300,
  viewRangeMax: 12000,
  /** 锁定跟随时相机与车辆的距离（米） */
  vehicleFollowRange2D: 1200,
  vehicleFollowRange3D: 500,
  /** 车辆 glb 在屏幕上的显示约束 */
  vehicleModelMinPixelSize: 32,
  vehicleModelMaxScale: 64,
};
