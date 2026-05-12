/*
 * @Author: ml
 * @Date: 2026-03-12 08:40:08
 * @LastEditTime: 2026-03-13 16:51:16
 * @FilePath: /accompanying-fly-project/src/stores/index.js
 * @Description:缓存
 */
import { defineStore } from "pinia";
import { ref, computed } from "vue";

export const useSystemStore = defineStore(
  "system",
  () => {
    // state
    const mqttStatus = ref(0); // 0 未连接 1 连接中 2 已连接 3连接失败
    const carMessageList = ref([]); // 车机消息列表
    const droneMessageList = ref([]); // 无人机消息列表
    const droneStatus = ref(0); // 0 未起飞 1 已起飞
    const droneCurrentState = ref({
      attitude_head: null,
      attitude_pitch: null,
      attitude_roll: null,
      gimbal_pitch: null,
      gimbal_roll: null,
      gimbal_yaw: null,
      zoom_factor: 1.0,
    });

    // 消息列表最大长度限制，防止内存溢出
    const MAX_MESSAGE_LIST_SIZE = 1000;

    // actions
    function setMqttStatus(status) {
      mqttStatus.value = status;
    }
    function addCarMessage(message) {
      carMessageList.value.push(message);
      // 限制消息列表长度，防止内存溢出
      if (carMessageList.value.length > MAX_MESSAGE_LIST_SIZE) {
        carMessageList.value = carMessageList.value.slice(-MAX_MESSAGE_LIST_SIZE);
      }
    }
    function addDroneMessage(message) {
      droneMessageList.value.push(message);
      // 限制消息列表长度，防止内存溢出
      if (droneMessageList.value.length > MAX_MESSAGE_LIST_SIZE) {
        droneMessageList.value = droneMessageList.value.slice(-MAX_MESSAGE_LIST_SIZE);
      }
    }
    function setDroneStatus(status) {
      droneStatus.value = status;
    }
    function clearCarMessageList() {
      carMessageList.value = [];
    }
    function clearDroneMessageList() {
      droneMessageList.value = [];
    }
    function setDroneCurrentState(state) {
      droneCurrentState.value = state;
    }

    return {
      mqttStatus,
      carMessageList,
      droneMessageList,
      droneStatus,
      droneCurrentState,
      setMqttStatus,
      addCarMessage,
      addDroneMessage,
      setDroneStatus,
      clearCarMessageList,
      clearDroneMessageList,
      setDroneCurrentState,
    };
  },
  {
    persist: {
      // 只持久化以下字段，消息列表不持久化以避免 localStorage 无限增长
      paths: ["mqttStatus", "droneStatus", "droneCurrentState"],
    },
  },
);
