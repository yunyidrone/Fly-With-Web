<!--
 * @Author: ml
 * @Date: 2026-01-12 14:47:16
 * @FilePath: /accompanying-fly-project/src/views/home-view/index.vue
 * @Description: homepage - fullscreen map with overlays
-->
<template>
  <div class="page-wrapper" :class="{ 'immersive-flight': immersiveFlight }">
    <!-- 全屏地图 -->
    <div class="map-container">
      <TiandituMap ref="mapRef" />
    </div>

    <!-- 顶部覆盖层 -->
    <HomeHeader v-show="!immersiveFlight" />

    <!-- 左侧 Tab：无人设备 / 飞行计划 -->
    <LeftSidebarTabs v-show="!immersiveFlight">
      <template #device>
        <ResourcePanel
          embedded
          :stream-active-device-id="
            droneStreamVisible && streamDrone?.id ? streamDrone.id : ''
          "
          @recall="(device) => mapRef?.recallDrone(device)"
          @open-drone-stream="openDroneStream"
        />
      </template>
      <template #plan>
        <PlanPanel embedded />
      </template>
    </LeftSidebarTabs>

    <!-- 底部中间地图标注图例 -->
    <MapLegend
      v-show="!immersiveFlight"
      @lockdown="mapRef?.triggerLockdown()"
      @toggle="(e) => mapRef?.toggleLayerVisibility(e)"
    />

    <!-- 无人机视频：无全屏遮罩，仅固定卡片，不阻挡地图操作 -->
    <Teleport to="body">
      <Transition name="fade">
        <div
          v-if="droneStreamVisible"
          class="drone-stream-float"
          :class="{ 'drone-stream-float--immersive': immersiveFlight }"
        >
            <button type="button" class="drone-stream-close" aria-label="关闭" @click="closeDroneStream">
              <i class="ri-close-line" />
            </button>
            <DroneStream
              :key="streamDroneKey"
              :drone-id="streamDrone?.id"
              :drone-name="streamDrone?.name"
              :target-device-label="streamTargetLabel"
              :battery="streamDrone?.battery"
              :status-label="streamStatusLabel"
              :companion-task-title="streamCompanionTaskTitle"
              :immersive-flight="immersiveFlight"
              @toggle-immersive="immersiveFlight = !immersiveFlight"
            />
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import TiandituMap from "@/components/TiandituMap.vue";
import HomeHeader from "@/components/HomeHeader.vue";
import DroneStream from "@/components/DroneStream.vue";
import ResourcePanel from "@/components/ResourcePanel.vue";
import MapLegend from "@/components/MapLegend.vue";
import PlanPanel from "@/components/PlanPanel.vue";
import LeftSidebarTabs from "@/components/LeftSidebarTabs.vue";

const mapRef = ref(null);
const droneStreamVisible = ref(false);
const streamDrone = ref(null);
const immersiveFlight = ref(false);

const streamDroneKey = computed(() => streamDrone.value?.id || "none");

const streamTargetLabel = computed(() => {
  const t = streamDrone.value?.escortTarget;
  if (t) return typeof t === "string" ? t : `目标 ${t}`;
  return "—";
});

/** 与左侧资源卡片一致：伴飞中 / 就绪 / 离线 */
const streamStatusLabel = computed(() => {
  const d = streamDrone.value;
  if (!d) return "就绪";
  if (d.commOk === false) return "离线";
  if (d.isEscorting) return "伴飞中";
  if (d.statusText === "待命") return "就绪";
  return d.statusText || "就绪";
});

/** 伴飞任务标题副文案，示意稿为「任务一号」；无数据时回退设备名或占位 */
const streamCompanionTaskTitle = computed(() => {
  const d = streamDrone.value;
  if (!d) return "任务一号";
  return d.name || d.id || "任务一号";
});

const openDroneStream = (device) => {
  streamDrone.value = device;
  droneStreamVisible.value = true;
};

const closeDroneStream = () => {
  if (document.fullscreenElement) {
    document.exitFullscreen().catch(() => {});
  }
  droneStreamVisible.value = false;
  immersiveFlight.value = false;
  streamDrone.value = null;
};
</script>

<style lang="scss" scoped>
.page-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: #292E38;

}

.map-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.page-wrapper.immersive-flight .map-container {
  z-index: 0;
}
</style>

<style lang="scss">
/* Teleport 到 body，需非 scoped */
/* 仅占卡片尺寸，不铺满视口，地图在卡片外可正常点击 */
.drone-stream-float {
  position: fixed;
  top: 96px;
  right: 16px;
  z-index: 2000;
  width: min(568px, calc(100vw - 32px));
  max-height: calc(100vh - 88px);
  box-sizing: border-box;
}

.drone-stream-float--immersive {
  top: 16px;
  right: 16px;
  width: min(560px, calc(100vw - 32px));
  max-height: calc(100vh - 32px);
}

.drone-stream-shell {
  position: relative;
  width: 100%;
  max-height: inherit;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  /* 为右上角关闭钮留白，避免压住顶栏「电量」 */
  padding: 4px 44px 0 0;
}

.drone-stream-shell--immersive {
  max-height: calc(100vh - 32px);
  padding: 4px 44px 0 0;
  box-sizing: border-box;
}

.drone-stream-close {
  position: absolute;
  top: -10px;
  right: -15px;
  z-index: 3;
  width: 25px;
  height: 25px;
  padding: 0;
  margin: 0;
  border: 1px solid rgba(73, 101, 201, 0.55);
  border-radius: 6px;
  background: rgba(12, 16, 24, 0.92);
  color: rgba(255, 255, 255, 0.88);
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  transition:
    background 0.2s ease,
    border-color 0.2s ease,
    color 0.2s ease,
    box-shadow 0.2s ease;

  i {
    font-size: 18px;
    line-height: 1;
  }

  &:hover {
    color: #fff;
    background: rgba(73, 101, 201, 0.22);
    border-color: rgba(120, 148, 236, 0.9);
    box-shadow: 0 4px 18px rgba(0, 0, 0, 0.45);
  }

  &:active {
    background: rgba(73, 101, 201, 0.38);
  }

  &:focus-visible {
    outline: 2px solid rgba(120, 148, 236, 0.75);
    outline-offset: 2px;
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
