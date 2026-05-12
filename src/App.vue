<!--
 * @Author: ml
 * @Date: 2026-01-12 13:59:48
 * @LastEditTime: 2026-01-12 15:04:11
 * @FilePath: /accompanying-fly-project/src/App.vue
 * @Description: 
-->
<script setup>
import { useMqtt } from "@/composables/useMqtt.js";

// 页面加载时自动连接 MQTT 并订阅 topic
// useMqtt({
//   // 车机消息回调（可选）
//   onCarMessage: (data) => {
//     // console.log('处理车机消息', data);
//   },
//   // 无人机消息回调（可选）
//   onDroneMessage: (data) => {
//     // console.log('处理无人机消息', data);
//   },
//   // 自定义订阅主题（可选）
//   // customTopics: [
//   //   { topic: '/your/custom/topic', callback: (data) => {} }
//   // ],
// });
</script>

<template>
  <router-view v-slot="{ Component, route }">
    <transition :name="route.meta.transition || 'fade'" mode="out-in" appear>
      <component :is="Component" :key="route.path" />
    </transition>
  </router-view>
</template>

<style lang="scss" scoped>
// fade效果
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

// slide-fade效果
.slide-fade-enter-active {
  transition: all 0.2s ease-out;
}

.slide-fade-leave-active {
  transition: all 0.8s cubic-bezier(1, 0.5, 0.8, 1);
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  transform: translateX(20px);
  opacity: 0;
}

// slide效果
.slide-enter-active,
.slide-leave-active {
  transition: all 0.75s ease-out;
}

.slide-enter-to {
  position: absolute;
  right: 0;
}

.slide-enter-from {
  position: absolute;
  right: -100%;
}

.slide-leave-to {
  position: absolute;
  left: -100%;
}

.slide-leave-from {
  position: absolute;
  left: 0;
}

// scale效果
.scale-enter-active,
.scale-leave-active {
  transition: all 0.2s ease;
}

.scale-enter-from,
.scale-leave-to {
  opacity: 0;
  transform: scale(0.9);
}

// scale-slide 组合效果
.scale-slide-enter-active,
.scale-slide-leave-active {
  position: absolute;
  transition: all 0.85s ease;
}

.scale-slide-enter-from {
  left: -100%;
}

.scale-slide-enter-to {
  left: 0%;
}

.scale-slide-leave-from {
  transform: scale(1);
}

.scale-slide-leave-to {
  transform: scale(0.8);
}
</style>
