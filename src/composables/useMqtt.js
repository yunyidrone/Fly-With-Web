/**
 * 暂时没使用该 useMqtt.js
 * MQTT 自动连接和订阅组合式函数
 * 页面加载时自动连接 MQTT 并订阅配置的 topic
 */
import { onMounted, onUnmounted } from 'vue';
import { mqttService } from '@/utils/mqtt-service.js';
import { useSystemStore } from '@/stores/index';
import { MQTT_CONFIG } from '@/config/app-config.js';

// ==========================================
// MQTT Topic 配置 - 在这里修改你要订阅的 topic
// ==========================================
export const MQTT_TOPICS = {
//   // 车机相关 topic
//   CAR_TOPIC: '/v/Device/13900089865/vehicle/rt/up',
//   // 无人机相关 topic
//   DRONE_TOPIC: '/v/Device/1581F6Q8D243R00CD5E3/rt/up',
//   // 根据实际需求添加更多 topic...

  WHOLE_CAR_TOPIC: "carBox/#", 
};

/**
 * MQTT 组合式函数
 * @param {Object} options - 配置选项
 * @param {Function} options.onCarMessage - 车机消息回调
 * @param {Function} options.onDroneMessage - 无人机消息回调
 * @param {Array} options.customTopics - 自定义订阅主题 [{topic, callback}]
 */
export function useMqtt(options = {}) {
  const systemStore = useSystemStore();

  // 消息处理函数
 const handleCarMessage = (topic, data ) => {
    const deviceId = extractDeviceId(topic);
    console.log(`🚗 收到设备 [${deviceId}] 消息:`, data);
    
    // 为消息添加设备号信息
    const messageWithDeviceId = {
      ...data,
      deviceId,
      topic,
      timestamp: Date.now()
    };
    
    systemStore.addCarMessage(messageWithDeviceId);
    options.onCarMessage?.(messageWithDeviceId, topic);
  };

  const handleDroneMessage = (data) => {
    console.log('🚁 收到无人机消息:', data);
    systemStore.addDroneMessage(data);
    options.onDroneMessage?.(data);
  };

  // 初始化 MQTT 连接
  const initMqtt = () => {
    console.log('🔧 开始初始化 MQTT 连接...');
    
    // 连接 MQTT
    mqttService.connect({
      username: MQTT_CONFIG.username,
      password: MQTT_CONFIG.password,
    });

    // 订阅配置的 topic
    setTimeout(() => {
      // 订阅车机 topic
      mqttService.subscribe(MQTT_TOPICS.WHOLE_CAR_TOPIC, handleCarMessage);
      

      // 订阅自定义 topic
      if (options.customTopics && Array.isArray(options.customTopics)) {
        options.customTopics.forEach(({ topic, callback }) => {
          mqttService.subscribe(topic, callback);
        });
      }
    }, 1000); // 等待连接建立
  };

   // 从主题中提取设备号
  const extractDeviceId = (topic) => {
    console.log("topic", topic);
    const parts = topic.split('/');
    if (parts.length >= 2) {
      return parts[1]; // 提取 carBox/{deviceId}/... 中的设备号
    }
    return null;
  };

  // 销毁连接
  const destroyMqtt = () => {
    mqttService.destroy();
  };

  // 页面加载时自动连接
  onMounted(() => {
    initMqtt();
  });

  // 页面卸载时断开连接
  onUnmounted(() => {
    destroyMqtt();
  });

  return {
    mqttService,
    initMqtt,
    destroyMqtt,
    MQTT_TOPICS,
  };
}