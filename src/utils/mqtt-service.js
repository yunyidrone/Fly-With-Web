/*
 * @Author: ml
 * @Date: 2026-01-20 10:54:43
 * @FilePath: /accompanying-fly-project/src/utils/mqtt-service.js
 * @Description: MQTT 单例连接（全局仅一条 WebSocket）
 */
import mqtt from "mqtt";
import { useSystemStore } from "@/stores/index";
import { MQTT_CONFIG } from "@/config/app-config.js";

class MqttService {
  constructor(defaultConfig = MQTT_CONFIG, name = "MQTT") {
    this.defaultConfig = defaultConfig;
    this.name = name;
    /** @type {import('mqtt').MqttClient | null} */
    this.client = null;
    /** @type {Promise<import('mqtt').MqttClient> | null} */
    this._connectPromise = null;
    /** @type {Map<string, (actualTopic: string | undefined, data: unknown) => void>} */
    this.subscriptions = new Map();
    /** @type {Set<string>} */
    this._brokerSubscribed = new Set();
    this._messageBound = false;
  }

  /**
   * @param {Object} [options]
   * @returns {Promise<import('mqtt').MqttClient | null>}
   */
  ensureConnected(options = {}) {
    if (this.client?.connected) {
      return Promise.resolve(this.client);
    }
    if (this._connectPromise) {
      return this._connectPromise;
    }
    if (this.client) {
      return new Promise((resolve) => {
        if (this.client?.connected) {
          resolve(this.client);
          return;
        }
        const onConnect = () => {
          this.client?.off("connect", onConnect);
          resolve(this.client);
        };
        this.client.once("connect", onConnect);
      });
    }
    return this._waitConnect(options);
  }

  /** @deprecated 请使用 ensureConnected */
  connect(options = {}) {
    return this.ensureConnected(options);
  }

  /**
   * @param {Object} options
   * @returns {Promise<import('mqtt').MqttClient | null>}
   */
  _waitConnect(options = {}) {
    const systemStore = useSystemStore();

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

    console.log(`正在连接 ${this.name}:`, url);

    this._connectPromise = new Promise((resolve) => {
      this.client = mqtt.connect(url, config);
      this._bindMessageDispatcher();

      this.client.once("connect", () => {
        console.log(`✅ ${this.name} 连接成功`);
        systemStore.setMqttStatus(2);
        this._connectPromise = null;
        this._resubscribeAll();
        resolve(this.client);
      });

      this.client.on("reconnect", () => {
        console.log(`🔄 ${this.name} 正在尝试重连...`);
        systemStore.setMqttStatus(1);
      });

      this.client.on("error", (err) => {
        console.error(`❌ ${this.name} 错误:`, err?.message || err);
        systemStore.setMqttStatus(3);
      });

      this.client.on("close", () => {
        systemStore.setMqttStatus(0);
        this._brokerSubscribed.clear();
        this._connectPromise = null;
      });

      this.client.on("offline", () => {
        systemStore.setMqttStatus(0);
      });
    });

    return this._connectPromise;
  }

  _bindMessageDispatcher() {
    if (!this.client || this._messageBound) return;
    this._messageBound = true;
    this.client.on("message", (topic, payload) => {
      this._dispatchMessage(topic, payload);
    });
  }

  _dispatchMessage(topic, payload) {
    let data;
    try {
      data = JSON.parse(payload.toString());
    } catch {
      data = payload.toString();
    }

    for (const [pattern, callback] of this.subscriptions) {
      if (!this._matchTopic(topic, pattern)) continue;
      const hasWildcard = pattern.includes("+") || pattern.includes("#");
      try {
        callback(hasWildcard ? topic : undefined, data);
      } catch (e) {
        console.warn(`[MQTT] 回调异常 ${pattern}:`, e);
      }
    }
  }

  _resubscribeAll() {
    if (!this.client?.connected) return;
    for (const topic of this.subscriptions.keys()) {
      if (this._brokerSubscribed.has(topic)) continue;
      this.client.subscribe(topic, (err) => {
        if (!err) {
          this._brokerSubscribed.add(topic);
          console.log(`📡 ${this.name} 已订阅: ${topic}`);
        }
      });
    }
  }

  /**
   * @param {string} topic
   * @param {(actualTopic: string | undefined, data: unknown) => void} callback
   */
  subscribe(topic, callback) {
    this.subscriptions.set(topic, callback);

    if (!this.client) {
      this.ensureConnected().then(() => this._subscribeTopic(topic));
      return;
    }
    if (this.client.connected) {
      this._subscribeTopic(topic);
      return;
    }
    this.client.once("connect", () => this._subscribeTopic(topic));
  }

  _subscribeTopic(topic) {
    if (!this.client?.connected || this._brokerSubscribed.has(topic)) return;

    this.client.subscribe(topic, (err) => {
      if (!err) {
        this._brokerSubscribed.add(topic);
        console.log(`📡 ${this.name} 已成功订阅主题: ${topic}`);
      }
    });
  }

  publish(topic, message) {
    if (!this.client?.connected) {
      console.warn("MQTT 未连接，无法发布消息");
      return;
    }
    const data = typeof message === "object" ? JSON.stringify(message) : message;
    this.client.publish(topic, data);
  }

  unsubscribe(topic) {
    this.subscriptions.delete(topic);
    this._brokerSubscribed.delete(topic);
    this.client?.unsubscribe(topic);
  }

  /** 仅应用退出时调用；页面卸载勿 destroy */
  destroy() {
    if (!this.client) return;
    try {
      this.client.end(true);
    } catch {
      /* ignore */
    }
    this.client = null;
    this._connectPromise = null;
    this._messageBound = false;
    this._brokerSubscribed.clear();
    this.subscriptions.clear();
    console.log(`🔌 ${this.name} 已断开连接`);
  }

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
}

export const mqttService = new MqttService(MQTT_CONFIG, "MQTT");
