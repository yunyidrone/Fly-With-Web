<!--
 * @Author: ml
 * @Date: 2026-03-12 08:37:46
 * @LastEditTime: 2026-03-12 09:59:53
 * @FilePath: /accompanying-fly-project/src/components/HomeHeader.vue
 * @Description: home header
-->
<template>
  <div class="home_header">
    <div class="connected-status">
      <div class="indicator-light" :class="lightClass"></div>
      <div class="light-status-text">{{ lightStatusText }}</div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import { useSystemStore } from "@/stores/index.js";

const systemStore = useSystemStore();
// 指示灯样式
const lightClass = computed(() => {
  switch (systemStore.mqttStatus) {
    case 1:
      return "waiting";
    case 2:
      return "active";
    case 3:
      return "inactive";
    default:
      return "disabled";
  }
});
// 指示灯状态描述
const lightStatusText = computed(() => {
  switch (systemStore.mqttStatus) {
    case 1:
      return "远程控制 - 连接中";
    case 2:
      return "远程控制 - 已连接";
    case 3:
      return "远程控制 - 连接失败";
    default:
      return "远程控制 - 未连接";
  }
});
</script>

<style lang="scss" scoped>
.home_header {
  position: relative;
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  background-color: #1f1f1f;
  height: 48px;
  width: 100%;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  .connected-status {
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;
    .indicator-light {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      transition: all 0.3s ease;
      margin-right: 5px;
      overflow: hidden;

      &.active {
        background-color: #4caf50;
        box-shadow: 0 0 5px #4caf50;
      }

      &.inactive {
        background-color: #f44336;
        box-shadow: 0 0 5px #f44336;
      }

      &.waiting {
        background-color: #ffc251;
        box-shadow: 0 0 5px #ffc251;
      }

      &.disabled {
        background-color: #9e9e9e;
        box-shadow: 0 0 5px #9e9e9e;
      }
    }
    .light-status-text {
      font-size: 16px;
      color: #fff;
      margin-left: 10px;
    }
  }
}
</style>
