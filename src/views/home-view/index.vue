<!--
 * @Author: ml
 * @Date: 2026-01-12 14:47:16
 * @FilePath: /accompanying-fly-project/src/views/home-view/index.vue
 * @Description: homepage - fullscreen map with overlays
-->
<template>
  <div class="page-wrapper" :class="{ 'immersive-flight': immersiveFlight }">
    <!-- 全屏地图（图例叠在地图区域内，沉浸分屏时随左半屏地图居中） -->
    <div class="map-container" @click="onMapAreaClick">
      <TiandituMap ref="mapRef" />
      <MapLegend
        @lockdown="mapRef?.triggerLockdown()"
        @toggle="(e) => mapRef?.toggleLayerVisibility(e)"
      />
    </div>

    <!-- 顶部覆盖层 -->
    <HomeHeader v-show="!immersiveFlight" />

    <!-- 左侧 Tab：无人设备 / 飞行计划 -->
    <LeftSidebarTabs
      v-show="!immersiveFlight"
      ref="leftSidebarRef"
      @select-tab="onLeftSidebarSelect"
    >
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
        <PlanPanel ref="planPanelRef" embedded />
      </template>
    </LeftSidebarTabs>

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
              :stream-url="streamDrone?.streamUrl"
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
import { ref, computed, onMounted, watch, nextTick } from "vue";
import TiandituMap from "@/components/TiandituMap.vue";
import HomeHeader from "@/components/HomeHeader.vue";
import DroneStream from "@/components/DroneStream.vue";
import ResourcePanel from "@/components/ResourcePanel.vue";
import MapLegend from "@/components/MapLegend.vue";
import PlanPanel from "@/components/PlanPanel.vue";
import LeftSidebarTabs from "@/components/LeftSidebarTabs.vue";
import { useDeviceStore } from "@/stores/device.js";
import { AccompanyingFlyService } from "@/api";

const mapRef = ref(null);
const leftSidebarRef = ref(null);
const planPanelRef = ref(null);

function onLeftSidebarSelect(tab) {
  if (tab === "plan") {
    planPanelRef.value?.notifyPlanSidebarOpened?.();
  }
}
const droneStreamVisible = ref(false);
const streamDrone = ref(null);
const immersiveFlight = ref(false);

const deviceStore = useDeviceStore();

onMounted(() => {
  deviceStore.fetchDroneList();
  deviceStore.fetchTargetList();
});

watch(immersiveFlight, () => {
  nextTick(() => {
    requestAnimationFrame(() => {
      mapRef.value?.resizeMapView?.();
    });
  });
});

/** 点击地图区域（不含图例）收起左侧 Tab 内容；顶栏、左 Tab 条不在 map-container 内 */
function onMapAreaClick() {
  leftSidebarRef.value?.clearSelection?.();
}

const streamDroneKey = computed(() => streamDrone.value?.id || "none");

const streamTargetLabel = computed(() => {
  const t = streamDrone.value?.escortTarget;
  if (t) return typeof t === "string" ? t : `目标 ${t}`;
  return "—";
});

/** 与左侧资源卡片一致：伴飞中 / 返航中 / 就绪 / 离线 */
const streamStatusLabel = computed(() => {
  const d = streamDrone.value;
  if (!d) return "就绪";
  if (d.commOk === false) return "离线";
  if (d.isEscorting) return "伴飞中";
  if (d.status === "returning") return d.statusText || "返航中";
  return d.statusText === "待命" ? "就绪" : d.statusText || "就绪";
});

/** 伴飞任务标题副文案，示意稿为「任务一号」；无数据时回退设备名或占位 */
const streamCompanionTaskTitle = computed(() => {
  const d = streamDrone.value;
  if (!d) return "任务一号";
  return d.name || d.id || "任务一号";
});

const openDroneStream = async (device) => {
  if (!device?.id) return;
  const id = String(device.id);
  try {
    const res = await AccompanyingFlyService.droneDetail({ id });
    if (res?.code === 2000 && res?.data) {
      const d = res.data;
      streamDrone.value = {
        ...device,
        ...(typeof d === "object" ? d : {}),
        id,
        streamUrl: d?.streamUrl || device?.streamUrl || "",
      };
    } else {
      streamDrone.value = device;
    }
  } catch (_) {
    streamDrone.value = device;
  }
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
  z-index: 0;
  box-sizing: border-box;
  /* 子级 MapLegend 的 position:absolute 相对本区域；沉浸时左半屏 = 地图可视区域 */
}

.page-wrapper.immersive-flight .map-container {
  /* 用视口宽度一半，避免与内部 TiandituMap 根节点同 class 时百分比链叠加成 1/4 宽 */
  width: 50vw;
  max-width: 50vw;
  left: 0;
  top: 0;
  height: 100%;
  box-sizing: border-box;
  border-right: 1px solid rgba(48, 54, 59, 0.85);
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
  width: min(650px, calc(100vw - 32px));
  max-height: calc(100vh - 88px);
  box-sizing: border-box;
}

.drone-stream-float--immersive {
  top: 0;
  left: 50vw;
  right: auto;
  width: 50vw;
  max-width: none;
  height: 100vh;
  max-height: 100vh;
  padding: 12px 16px 16px 12px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.drone-stream-float--immersive .drone-stream-close {
  top: 10px;
  right: 12px;
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
