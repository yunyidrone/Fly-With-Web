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
  constructor() {
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
      protocol: MQTT_CONFIG.protocol,
      host: MQTT_CONFIG.host,
      port: MQTT_CONFIG.port,
      path: MQTT_CONFIG.path,
      clientId: MQTT_CONFIG.clientId,
      clean: MQTT_CONFIG.clean,
      connectTimeout: MQTT_CONFIG.connectTimeout,
      reconnectPeriod: MQTT_CONFIG.reconnectPeriod,
      username: MQTT_CONFIG.username,
      password: MQTT_CONFIG.password,
    };

    const config = { ...defaultOptions, ...options };
    const url = `${config.protocol}://${config.host}:${config.port}${config.path}`;

    console.log("正在连接 MQTT:", url, config);

    this.client = mqtt.connect(url, config);

    // 全局事件监听
    this.client.on("connect", () => {
      console.log("✅ MQTT 连接成功");
      systemStore.setMqttStatus(2);
    });

    this.client.on("error", (err) => {
      console.error("❌ MQTT 连接失败:", err);
      this.client.end();
      systemStore.setMqttStatus(3);
    });

    this.client.on("reconnect", () => {
      console.log("🔄 正在尝试重连...", url);
      systemStore.setMqttStatus(1);
    });
  }

  /**
   * 订阅主题
   */
  subscribe(topic, callback) {
    if (!this.client) return;
    this.client.subscribe(topic, (err) => {
      if (!err) {
        console.log(`📡 已成功订阅主题: ${topic}`);
        this.subscriptions.set(topic, callback);
      }
    });

    // 监听消息
    // 判断当前的topic 是否携带 通配符
    // t 为收到的主题 payload 为收到的消息 t 为订阅的带通配符的主题
    if (topic.endsWith("#")) {
       this.client.on("message", (t, payload) => {
        try {
          const data = JSON.parse(payload.toString());
          callback(t,data);
        } catch (e) {
          callback(payload.toString());
        }
      });
    } else {
      this.client.on("message", (t, payload) => {
        if (t === topic) {
          try {
            const data = JSON.parse(payload.toString());
            callback(data);
          } catch (e) {
            callback(payload.toString());
          }
        }
      });
    }
    
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
      console.log("🔌 MQTT 已断开连接");
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
export const mqttService = new MqttService();
