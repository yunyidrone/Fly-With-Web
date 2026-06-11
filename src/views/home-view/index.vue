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
      <TiandituMap ref="mapRef" @open-drone-stream="openDroneStream" />
      <div v-show="!immersiveFlight" class="map-legend-host">
        <MapLegend
          @lockdown="mapRef?.triggerLockdown()"
          @toggle="(e) => mapRef?.toggleLayerVisibility(e)"
        />
      </div>
    </div>

    <!-- 顶部覆盖层 -->
    <HomeHeader v-show="!immersiveFlight" />

    <PlanUpcomingAlert
      :visible="!immersiveFlight"
      @view-allocation="onPlanViewAllocation"
    />

    <!-- 左侧 Tab + 历史任务记录（Tab 右侧，无遮罩） -->
    <div
      v-show="!immersiveFlight"
      class="home-left-dock"
      :class="{ 'home-left-dock--history': planHistoryVisible }"
    >
      <LeftSidebarTabs ref="leftSidebarRef" docked @select-tab="onLeftSidebarSelect">
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
          <PlanPanel
            ref="planPanelRef"
            embedded
            @start-area-draw="onStartAreaDraw"
            @view-area="onViewArea"
            @open-history-tasks="onOpenPlanHistory"
            @open-task-monitor="onOpenTaskMonitor"
          />
        </template>
      </LeftSidebarTabs>
      <PlanHistoryPanel
        v-model:visible="planHistoryVisible"
        @quick-create="onPlanHistoryQuickCreate"
        @deleted="onPlanHistoryChanged"
      />
    </div>

    <PlanTaskMonitorView
      v-model:visible="taskMonitorVisible"
      :plan-id="taskMonitorPlanId"
      :wide-left="planHistoryVisible"
      @recall="onTaskMonitorRecall"
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
              :drone-id="streamDroneLive?.id"
              :drone-name="streamDroneLive?.name"
              :stream-url="streamDroneLive?.streamUrl"
              :playUrl="streamDroneLive?.playUrl"
              :target-device-id="streamTargetId"
              :target-device-label="streamTargetLabel"
              :battery="streamDroneLive?.battery"
              :lng="streamDroneLive?.lng"
              :lat="streamDroneLive?.lat"
              :height="streamDroneLive?.height"
              :head="streamDroneLive?.attitudeHead"
              :pitch="streamDroneLive?.attitudePitch"
              :roll="streamDroneLive?.attitudeRoll"
              :status-label="streamStatusLabel"
              :escort-start-time="streamEscortStartTime"
              :companion-task-title="streamCompanionTaskTitle"
              :immersive-flight="immersiveFlight"
              @toggle-immersive="immersiveFlight = !immersiveFlight"
              @recall="handleStreamRecall"
            />
        </div>
      </Transition>
    </Teleport>

    <!-- 地图框选弹窗 -->
    <!-- <AreaDrawPopup
      :visible="areaDrawPopup.visible"
      :initial-area="areaDrawPopup.existingArea"
      :initial-center="areaDrawInitialCenter"
      @save="onAreaDrawSave"
      @cancel="onAreaDrawCancel"
    /> -->
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted, watch, nextTick, defineAsyncComponent } from "vue";
import { ElMessage } from "element-plus";
import TiandituMap from "@/components/TiandituMap.vue";
import HomeHeader from "@/components/HomeHeader.vue";
import MapLegend from "@/components/MapLegend.vue";
import LeftSidebarTabs from "@/components/LeftSidebarTabs.vue";
import PlanUpcomingAlert from "@/components/plan-panel/PlanUpcomingAlert.vue";
import PlanHistoryPanel from "@/components/plan-panel/PlanHistoryPanel.vue";
import PlanTaskMonitorView from "@/components/plan-panel/PlanTaskMonitorView.vue";

const PlanPanel = defineAsyncComponent(() => import("@/components/PlanPanel.vue"));
// const AreaDrawPopup = defineAsyncComponent(() => import("@/components/AreaDrawPopup.vue"));
const ResourcePanel = defineAsyncComponent(() => import("@/components/ResourcePanel.vue"));
const DroneStream = defineAsyncComponent(() => import("@/components/DroneStream.vue"));
import { MAP_CONFIG } from "@/config/app-config.js";
import { ensureDroneOsdMqtt } from "@/composables/useDroneOsdMqtt.js";
import { useDeviceStore } from "@/stores/device.js";
import { useFlightPlanStore } from "@/stores/flightPlan.js";
import { AccompanyingFlyService } from "@/api";

const mapRef = ref(null);
const leftSidebarRef = ref(null);
const planPanelRef = ref(null);
const planHistoryVisible = ref(false);
const taskMonitorVisible = ref(false);
const taskMonitorPlanId = ref("");

function onOpenPlanHistory() {
  taskMonitorVisible.value = false;
  closeDroneStream();
  planHistoryVisible.value = true;
}

function onOpenTaskMonitor(planId) {
  planHistoryVisible.value = false;
  closeDroneStream();
  taskMonitorPlanId.value = String(planId || "");
  taskMonitorVisible.value = true;
}

async function onTaskMonitorRecall() {
  await planPanelRef.value?.notifyPlanSidebarOpened?.();
  await deviceStore.fetchDroneList();
}

async function onPlanHistoryQuickCreate() {
  await planPanelRef.value?.notifyPlanSidebarOpened?.();
}

async function onPlanHistoryChanged() {
  await planPanelRef.value?.notifyPlanSidebarOpened?.();
}

async function onLeftSidebarSelect(tab) {
  if (tab === "plan") {
    await planPanelRef.value?.notifyPlanSidebarOpened?.();
  }
}
const droneStreamVisible = ref(false);
const streamDrone = ref(null);
const immersiveFlight = ref(false);

const deviceStore = useDeviceStore();
const flightPlanStore = useFlightPlanStore();

// ===== 地点设置 → 地图框选弹窗 =====
const areaDrawPopup = reactive({
  visible: false,
  categoryValue: "",
  regionValue: "",
  existingArea: null,
});

const areaDrawInitialCenter = computed(() => {
  if (areaDrawPopup.existingArea?.center) {
    return areaDrawPopup.existingArea.center;
  }
  return { lng: MAP_CONFIG.defaultCenter.lng, lat: MAP_CONFIG.defaultCenter.lat };
});

/** 地点设置 → 打开框选弹窗 */
function onStartAreaDraw({ categoryValue, regionValue, existingArea }) {
  showAreaDrawPopup(categoryValue, regionValue, existingArea);
}

function showAreaDrawPopup(categoryValue, regionValue, existingArea) {
  areaDrawPopup.categoryValue = categoryValue;
  areaDrawPopup.regionValue = regionValue;
  areaDrawPopup.existingArea = existingArea || null;
  areaDrawPopup.visible = true;
}

function onAreaDrawSave(result) {
  if (result && (result.type === "rectangle" || result.type === "circle")) {
    flightPlanStore.setCustomRegionData(
      areaDrawPopup.categoryValue,
      areaDrawPopup.regionValue,
      result,
    );
  }
  areaDrawPopup.visible = false;
}

function onAreaDrawCancel() {
  areaDrawPopup.visible = false;
}

/** PlanPanel "查看" 按钮 → 主地图飞到指定区域 */
function onViewArea(ring) {
  mapRef.value?.flyToRing?.(ring);
}

function onPlanViewAllocation(plan) {
  onOpenTaskMonitor(plan?.id);
}

/** 无人机列表轮询间隔（毫秒），用于刷新设备在线/离线/伴飞状态 */
const DRONE_LIST_POLL_INTERVAL = 10000;

let droneListTimer = null;

onMounted(() => {
  ensureDroneOsdMqtt();
  flightPlanStore.initCustomLocationTree();
  flightPlanStore.fetchAllPlanList();
  flightPlanStore.startPlanTaskWatcher();

  // 等地图完成首帧渲染后再拉数据，避免阻塞首次绘制
  const schedule = window.requestIdleCallback || ((fn) => setTimeout(fn, 0));
  schedule(() => {
    deviceStore.fetchDroneList();
    deviceStore.fetchTargetList();
  });

  // 每 10 秒刷新无人机列表状态（合并策略保留 MQTT 动态字段）
  droneListTimer = setInterval(() => {
    deviceStore.fetchDroneList();
  }, DRONE_LIST_POLL_INTERVAL);
});

onUnmounted(() => {
  flightPlanStore.stopPlanTaskWatcher();
  if (droneListTimer) {
    clearInterval(droneListTimer);
    droneListTimer = null;
  }
});

// 监听任务完成：仅当前正在监控的任务完成时，先提示再关闭弹窗
watch(
  () => flightPlanStore.justCompletedPlanIds,
  (ids) => {
    if (!ids || ids.length === 0) return;
    if (taskMonitorVisible.value && ids.includes(taskMonitorPlanId.value)) {
      ElMessage.info("任务已经完成，即将主动关闭监控");
      setTimeout(() => {
        taskMonitorVisible.value = false;
      }, 2000);
    }
  },
);

// 监听无人机伴飞结束：当前展示的无人机结束伴飞时，提示并关闭视频
watch(
  () => deviceStore.justStoppedEscortDroneIds,
  (ids) => {
    if (!ids || ids.length === 0) return;
    if (droneStreamVisible.value && streamDrone.value?.id && ids.includes(streamDrone.value.id)) {
      ElMessage.info("任务已经完成，即将主动关闭监控");
      setTimeout(() => {
        closeDroneStream();
      }, 2000);
    }
  },
);

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

const streamDroneLive = computed(() => {
  const base = streamDrone.value;
  if (!base) return null;
  const live = deviceStore.drones.find(
    (d) =>
      String(d?.id || "") === String(base.id || "") ||
      (d?.sn && base.sn && String(d.sn) === String(base.sn)),
  );
  if (!live) return base;
  return {
    ...base,
    ...live,
    streamUrl: base.streamUrl || live.streamUrl || "",
    playUrl: base.playUrl || live.playUrl || "",
  };
});

const streamDroneKey = computed(() => streamDroneLive.value?.id || "none");

function resolveEscortTargetId(device) {
  return String(
    device?.escortTarget ??
      device?.targetId ??
      device?.target_id ??
      device?.raw?.targetId ??
      device?.raw?.target_id ??
      device?.raw?.target?.id ??
      "",
  ).trim();
}

const streamTargetId = computed(() => resolveEscortTargetId(streamDrone.value));

const streamTargetLabel = computed(() => {
  const targetName = String(streamDroneLive.value?.targetName || "").trim();
  if (targetName) return targetName;
  const t = streamTargetId.value;
  if (t) return typeof t === "string" ? t : `目标 ${t}`;
  return "—";
});

const streamEscortStartTime = computed(() => {
  const d = streamDroneLive.value;
  return String(d?.executeTime ?? d?.executeTime ?? "").trim();
});

/** 与左侧资源卡片一致：伴飞中 / 返航中 / 就绪 / 离线 */
const streamStatusLabel = computed(() => {
  const d = streamDroneLive.value;
  if (!d) return "就绪";
  if (d.statusText) return d.statusText === "待命" ? "就绪" : d.statusText;
  if (d.statusLabel) return d.statusLabel;
  if (d.commOk === false) return "离线";
  if (d.isEscorting) return "伴飞中";
  if (d.status === "returning") return d.statusText || "返航中";
  if (Number(d.status) === 0) return "离线";
  if (Number(d.status) === 1) return "就绪";
  if (Number(d.status) === 2) return "伴飞中";
  if (Number(d.status) === 3) return "返航中";
  return "就绪";
});

/** 伴飞任务标题副文案，示意稿为「任务一号」；无数据时回退设备名或占位 */
const streamCompanionTaskTitle = computed(() => {
  const d = streamDroneLive.value;
  if (!d) return "任务一号";
  return d.name || d.id || "任务一号";
});

const openDroneStream = async (device) => {
  if (!device?.id) return;
  planHistoryVisible.value = false;
  taskMonitorVisible.value = false;
  const id = String(device.id);
  try {
    const d = await AccompanyingFlyService.droneDetail({ id });
    if (d) {
      streamDrone.value = {
        ...device,
        ...(typeof d === "object" ? d : {}),
        id,
        escortTarget:
          resolveEscortTargetId(d) || resolveEscortTargetId(device) || null,
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

const handleStreamRecall = async ({ droneId } = {}) => {
  if (droneId) {
    deviceStore.setDroneStandby(droneId);
  }
  await deviceStore.fetchDroneList();
  closeDroneStream();
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
  // padding: 12px 16px 16px 12px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.drone-stream-float--immersive .drone-stream-close {
  display: none;
  top: 0;
  right: 0;
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

/* 左侧 Tab 与历史记录横排；未开历史时仅占 Tab 宽度，不挡地图点击 */
.home-left-dock {
  position: fixed;
  left: 24px;
  top: 90px;
  z-index: 100;
  display: flex;
  flex-direction: row;
  align-items: stretch;
  gap: 12px;
  width: fit-content;
  max-width: calc(100vw - 48px);
  height: calc(100vh - 110px);
  max-height: calc(100vh - 110px);
  box-sizing: border-box;
  pointer-events: none;

  > * {
    pointer-events: auto;
  }

  &--history {
    width: calc(100vw - 48px);
    max-width: calc(100vw - 48px);
  }
}
</style>
