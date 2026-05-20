/*
 * @Author: ml
 * @Date: 2026-01-20 10:54:43
 * @LastEditTime: 2026-03-16 09:05:33
 * @FilePath: /accompanying-fly-project/src/utils/mqtt-service.js
 * @Description: mqtt service
 */
import mqtt from "mqtt";
import { useSystemStore } from "@/stores/index";
import { MQTT_CONFIG } from "@/config/app-config.js";

class MqttService {
  constructor(defaultConfig = MQTT_CONFIG, name = "MQTT") {
    this.defaultConfig = defaultConfig;
    this.name = name;
    this.client = null;
    this.isConnecting = false;
    this.subscriptions = new Map(); // 存储主题与回调的对应关系
  }

  /**
   * 初始化连接
   * @param {Object} options - 自定义配置项
   */
  connect(options = {}) {
    if (this.client && this.client.connected) return;

    const systemStore = useSystemStore();

    // 默认配置（从环境变量读取）
    const defaultOptions = {
      protocol: this.defaultConfig.protocol,
      host: this.defaultConfig.host,
      port: this.defaultConfig.port,
      path: this.defaultConfig.path,
      clientId: this.defaultConfig.clientId,
      clean: this.defaultConfig.clean,
      connectTimeout: this.defaultConfig.connectTimeout,
      reconnectPeriod: this.defaultConfig.reconnectPeriod,
      username: this.defaultConfig.username,
      password: this.defaultConfig.password,
    };

    const config = { ...defaultOptions, ...options };
    const url = `${config.protocol}://${config.host}:${config.port}${config.path}`;

    console.log(`正在连接 ${this.name}:`, url, config);

    this.client = mqtt.connect(url, config);

    // 全局事件监听
    this.client.on("connect", () => {
      console.log(`✅ ${this.name} 连接成功`);
      systemStore.setMqttStatus(2);
    });

    this.client.on("error", (err) => {
      console.error(`❌ ${this.name} 连接失败:`, err);
      this.client.end();
      systemStore.setMqttStatus(3);
    });

    this.client.on("reconnect", () => {
      console.log(`🔄 ${this.name} 正在尝试重连...`, url);
      systemStore.setMqttStatus(1);
    });
  }

  /**
   * MQTT 主题匹配（支持 + 单级通配 和 # 多级通配）
   */
  _matchTopic(actual, pattern) {
    const actualParts = actual.split("/");
    const patternParts = pattern.split("/");
    for (let i = 0; i < patternParts.length; i++) {
      if (patternParts[i] === "#") return true;
      if (i >= actualParts.length) return false;
      if (patternParts[i] === "+") continue;
      if (patternParts[i] !== actualParts[i]) return false;
    }
    return actualParts.length === patternParts.length;
  }

  /**
   * 订阅主题
   */
  subscribe(topic, callback) {
    if (!this.client) return;
    if (this.subscriptions.has(topic)) return;

    const hasWildcard = topic.includes("+") || topic.includes("#");

    this.client.subscribe(topic, (err) => {
      if (!err) {
        console.log(`📡 ${this.name} 已成功订阅主题: ${topic}`);
        this.subscriptions.set(topic, callback);
      }
    });

    this.client.on("message", (t, payload) => {
      if (!this._matchTopic(t, topic)) return;
      try {
        const data = JSON.parse(payload.toString());
        // 通配符订阅回调传入实际 topic，精确订阅只传 data
        callback(hasWildcard ? t : undefined, data);
      } catch (e) {
        callback(hasWildcard ? t : undefined, payload.toString());
      }
    });
  }

  /**
   * 发布消息
   */
  publish(topic, message) {
    if (!this.client || !this.client.connected) {
      console.error("MQTT 未连接，无法发布消息");
      return;
    }
    const data = typeof message === "object" ? JSON.stringify(message) : message;
    this.client.publish(topic, data);
  }

  /**
   * 取消订阅
   */
  unsubscribe(topic) {
    this.client?.unsubscribe(topic);
  }

  /**
   * 断开连接
   */
  destroy() {
    if (this.client) {
      this.client.end();
      this.client = null;
      this.subscriptions.clear();
      console.log(`🔌 ${this.name} 已断开连接`);
    }
  }

  // 处理消息分发
  handleMessage(topic, payload) {
    try {
      const data = JSON.parse(payload);
      // 查找该主题对应的所有回调函数并执行
      if (this.subscriptions.has(topic)) {
        this.subscriptions.get(topic)(data, topic);
      }
    } catch (e) {
      console.warn(`[MQTT] 收到非JSON格式数据: ${topic}`, payload);
    }
  }
}

// 导出单例
export const mqttService = new MqttService(MQTT_CONFIG, "MQTT");
