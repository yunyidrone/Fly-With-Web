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
      <TiandituMap
        ref="mapRef"
        :active-escort-drone-id="activeEscortDroneId"
        :immersive-flight="immersiveFlight"
        :render-suspended="taskViewVisible"
        @open-drone-stream="openDroneStream"
        @open-robot-stream="openRobotStream"
        @immersive-escort-switch="onImmersiveEscortSwitch"
      />
      <div v-show="!immersiveFlight && manualControlVisible" class="map-legend-host">
        <ManualControlPanel
          :recording-active="manualRecordingActive"
          :drone-serial-number="manualControlDroneSn"
          @close="closeManualControl"
          @control-event="handleManualControlEvent"
        />
      </div>
    </div>

    <!-- 图例叠在页面层，高于左侧 dock(z-index:100)，避免底部被透明侧栏挡住点击 -->
    <div
      v-show="!immersiveFlight && !manualControlVisible"
      class="map-legend-host"
      :class="{ 'map-legend-host--stream-open': streamFloatOpen }"
    >
      <MapLegend
        ref="mapLegendRef"
        @lockdown="onLockdown"
        @toggle="onLegendToggle"
      />
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

    <!-- 任务查看（全屏覆盖层；home 在底层保活。入口待定，下方按钮为临时触发） -->
    <!-- <TaskView v-model:visible="taskViewVisible" /> -->
    <!-- <button
      v-show="!immersiveFlight && !taskViewVisible"
      type="button"
      class="task-view-temp-entry"
      @click="taskViewVisible = true"
    >
      查看任务
    </button> -->

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
              ref="droneStreamRef"
              :key="streamDroneKey"
              :drone-id="streamDroneLive?.id"
              :drone-name="streamDroneLive?.name"
              :stream-url="streamDroneLive?.streamUrl"
              :playUrl="streamDroneLive?.playUrl"
              :ai-play-url="streamDroneLive?.aiPlayUrl"
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
              :manual-control-visible="manualControlVisible"
              @toggle-immersive="onToggleImmersive"
              @toggle-manual-control="onToggleManualControl"
              @recording-change="onDroneRecordingChange"
              @recall="handleStreamRecall"
            />
        </div>
      </Transition>
    </Teleport>

    <!-- 机器人视频：风格与无人机一致，内容精简 -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="robotStreamVisible" class="drone-stream-float">
          <button type="button" class="drone-stream-close" aria-label="关闭" @click="closeRobotStream">
            <i class="ri-close-line" />
          </button>
          <RobotStream
            ref="robotStreamRef"
            :key="streamRobotKey"
            :robot-id="streamRobot?.robotId"
            :robot-name="streamRobot?.name"
            :community-id="streamRobot?.communityId"
            @close="closeRobotStream"
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
import ManualControlPanel from "@/components/ManualControlPanel.vue";
import LeftSidebarTabs from "@/components/LeftSidebarTabs.vue";
import PlanUpcomingAlert from "@/components/plan-panel/PlanUpcomingAlert.vue";
import PlanHistoryPanel from "@/components/plan-panel/PlanHistoryPanel.vue";
import PlanTaskMonitorView from "@/components/plan-panel/PlanTaskMonitorView.vue";

const PlanPanel = defineAsyncComponent(() => import("@/components/PlanPanel.vue"));
const TaskView = defineAsyncComponent(() => import("@/views/task-view/index.vue"));
// const AreaDrawPopup = defineAsyncComponent(() => import("@/components/AreaDrawPopup.vue"));
const ResourcePanel = defineAsyncComponent(() => import("@/components/ResourcePanel.vue"));
const DroneStream = defineAsyncComponent(() => import("@/components/DroneStream.vue"));
const RobotStream = defineAsyncComponent(() => import("@/components/RobotStream.vue"));
import { MAP_CONFIG } from "@/config/app-config.js";
import { DEFAULT_ROBOT_ID, DEFAULT_COMMUNITY_ID } from "@/api/robot.js";
import { ensureDroneOsdMqtt } from "@/composables/useDroneOsdMqtt.js";
import { useDeviceStore } from "@/stores/device.js";
import { useFlightPlanStore } from "@/stores/flightPlan.js";
import { AccompanyingFlyService } from "@/api";

const mapRef = ref(null);
const mapLegendRef = ref(null);

async function onLegendToggle(event) {
  const result = await mapRef.value?.toggleLayerVisibility(event);
  if (result?.revert) {
    mapLegendRef.value?.setItemActive?.(event.key, false);
  }
}

async function onLockdown() {
  const result = await mapRef.value?.triggerLockdown();
  if (result?.hasPoints) {
    mapLegendRef.value?.setItemActive?.("checkpoint", true);
  }
}

const robotStreamRef = ref(null);
const droneStreamRef = ref(null);
const leftSidebarRef = ref(null);
const planPanelRef = ref(null);
const planHistoryVisible = ref(false);
const taskMonitorVisible = ref(false);
const taskMonitorPlanId = ref("");

function onOpenPlanHistory() {
  taskMonitorVisible.value = false;
  closeDroneStream();
  closeRobotStream();
  planHistoryVisible.value = true;
}

function onOpenTaskMonitor(planId) {
  planHistoryVisible.value = false;
  closeDroneStream();
  closeRobotStream();
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
const robotStreamVisible = ref(false);
const streamRobot = ref(null);
const immersiveFlight = ref(false);
const manualControlVisible = ref(false);
const manualRecordingActive = ref(false);
const taskViewVisible = ref(false);

/** 右上角视频浮窗打开时，图例需左移避免遮挡 */
const streamFloatOpen = computed(
  () => droneStreamVisible.value || robotStreamVisible.value,
);

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
let initialFetchTimeoutId = null;
let initialFetchIdleId = null;
let initialFetchDone = false;

function runInitialDeviceFetchOnce() {
  if (initialFetchDone) return;
  initialFetchDone = true;
  if (!deviceStore.dronesLoadedFromApi) {
    deviceStore.fetchDroneList();
  }
  if (!deviceStore.targetsLoadedFromApi) {
    deviceStore.fetchTargetList();
  }
  if (!flightPlanStore.plansLoadedFromApi) {
    flightPlanStore.fetchAllPlanList();
  }
}

onMounted(() => {
  ensureDroneOsdMqtt();
  flightPlanStore.initCustomLocationTree();
  flightPlanStore.startPlanTaskWatcher();

  // 后台预加载任务查看覆盖层 chunk，避免首次打开时与第二套 Cesium 冷启动叠加
  void import("@/views/task-view/index.vue");

  // 等地图完成首帧渲染后再拉数据，避免阻塞首次绘制；并用超时兜底避免 idle 回调饥饿
  if (typeof window.requestIdleCallback === "function") {
    initialFetchIdleId = window.requestIdleCallback(runInitialDeviceFetchOnce, {
      timeout: 1200,
    });
    initialFetchTimeoutId = window.setTimeout(runInitialDeviceFetchOnce, 1200);
  } else {
    initialFetchTimeoutId = window.setTimeout(runInitialDeviceFetchOnce, 0);
  }

  // 每 10 秒刷新无人机列表状态（合并策略保留 MQTT 动态字段）
  droneListTimer = setInterval(async () => {
    await deviceStore.fetchDroneList();
    if (droneStreamVisible.value) {
      await checkAndSwitchEscortStreamDrone({ closeIfNoReplacement: true });
    }
  }, DRONE_LIST_POLL_INTERVAL);
});

onUnmounted(() => {
  flightPlanStore.stopPlanTaskWatcher();
  if (initialFetchTimeoutId != null) {
    window.clearTimeout(initialFetchTimeoutId);
    initialFetchTimeoutId = null;
  }
  if (
    initialFetchIdleId != null &&
    typeof window.cancelIdleCallback === "function"
  ) {
    window.cancelIdleCallback(initialFetchIdleId);
    initialFetchIdleId = null;
  }
  initialFetchDone = false;
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

function onToggleImmersive() {
  const willEnter = !immersiveFlight.value;
  if (willEnter) {
    manualControlVisible.value = false;
  }
  immersiveFlight.value = willEnter;

  const targetId = streamTargetId.value;
  const droneId = String(
    streamDroneLive.value?.id || streamDrone.value?.id || "",
  );

  if (willEnter) {
    mapRef.value?.setImmersiveMapFocus?.(true, targetId, droneId);
    if (targetId) {
      mapRef.value?.lockEscortTargetOnImmersive?.(targetId);
    }
  } else {
    mapRef.value?.setImmersiveMapFocus?.(false);
  }
}

function onToggleManualControl(nextVisible) {
  const willOpen = Boolean(nextVisible && droneStreamVisible.value);
  if (willOpen) {
    leftSidebarRef.value?.clearSelection?.();
    planHistoryVisible.value = false;
  }
  manualControlVisible.value = willOpen;
}

function closeManualControl() {
  manualControlVisible.value = false;
}

function handleManualControlEvent(event) {
  if (!event || event.type !== "action") return;
  if (!droneStreamVisible.value) {
    ElMessage.warning("请先打开无人机视频");
    return;
  }
  if (event.action === "takePhoto") {
    droneStreamRef.value?.captureCurrentFrame?.();
    return;
  }
  if (event.action === "startRecord") {
    const started = droneStreamRef.value?.startLocalRecording?.();
    if (started) {
      manualRecordingActive.value = true;
    }
    return;
  }
  if (event.action === "stopRecord") {
    const stopped = droneStreamRef.value?.stopLocalRecording?.();
    if (stopped) {
      manualRecordingActive.value = false;
    }
  }
}

function onDroneRecordingChange(recording) {
  manualRecordingActive.value = Boolean(recording);
}

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
const streamRobotKey = computed(() => streamRobot.value?.id || "none");

/** 手动操控：当前视频流无人机 SN */
const manualControlDroneSn = computed(() => {
  const d = streamDroneLive.value;
  return String(d?.sn || d?.mqttSn || "").trim();
});

/** 当前视频弹窗选中的无人机（用于地图侧高亮/圈选） */
const activeEscortDroneId = computed(() => {
  if (!droneStreamVisible.value || !streamDrone.value?.id) return "";
  return String(streamDrone.value.id);
});

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

function isDroneCurrentlyEscorting(drone) {
  if (!drone) return false;
  if (drone.isEscorting) return true;
  if (Number(drone.status) === 2 || Number(drone.rawStatus) === 2) return true;
  if (drone.status === "escorting") return true;
  return false;
}

function isDroneCurrentlyReturning(drone) {
  if (!drone) return false;
  if (Number(drone.status) === 3 || Number(drone.rawStatus) === 3) return true;
  if (drone.status === "returning") return true;
  return String(drone.statusText || "").trim() === "返航中";
}

function isDroneCurrentlyStandby(drone) {
  if (!drone) return false;
  if (Number(drone.status) === 1 || Number(drone.rawStatus) === 1) return true;
  if (drone.status === "standby") return true;
  const text = String(drone.statusText || "").trim();
  return text === "待命" || text === "就绪";
}

function findReplacementEscortDrone(preferredTargetId, excludeDroneId) {
  const preferred = String(preferredTargetId || "").trim();
  if (!preferred) return null;

  const exclude = String(excludeDroneId || "");
  return (
    deviceStore.drones.find((d) => {
      const id = String(d?.id || "");
      if (!id || id === exclude) return false;
      if (!isDroneCurrentlyEscorting(d)) return false;
      return resolveEscortTargetId(d) === preferred;
    }) || null
  );
}

let streamSwitchInFlight = false;
/** 当前视频弹窗内无人机曾处于伴飞，用于识别「伴飞 → 其他」状态跃迁 */
let streamDroneWasEscorting = false;
/** 当前视频弹窗内无人机曾处于返航中，用于识别「返航中 → 就绪」状态跃迁 */
let streamDroneWasReturning = false;

function syncMapAfterStreamDroneSwitch(replacement) {
  if (!replacement?.id) return;
  const targetId = resolveEscortTargetId(replacement);
  const droneId = String(replacement.id);
  if (immersiveFlight.value) {
    mapRef.value?.setImmersiveMapFocus?.(true, targetId, droneId);
    if (targetId) {
      mapRef.value?.lockEscortTargetOnImmersive?.(targetId);
    }
  }
}

/** 仅在「返航中 -> 就绪」时提示并关闭监控弹窗 */
function checkAndCloseStreamOnReturnToStandby(liveDrone) {
  if (!droneStreamVisible.value || !streamDrone.value?.id) return false;
  const live = liveDrone || streamDroneLive.value || streamDrone.value;
  const currentlyReturning = isDroneCurrentlyReturning(live);
  const currentlyStandby = isDroneCurrentlyStandby(live);

  if (currentlyReturning) {
    streamDroneWasReturning = true;
    return false;
  }

  if (!streamDroneWasReturning || !currentlyStandby) return false;
  streamDroneWasReturning = false;
  ElMessage.info("任务已经完成，即将主动关闭监控");
  setTimeout(() => {
    closeDroneStream();
  }, 2000);
  return true;
}

/** 视频弹窗：当前无人机从伴飞变为其他状态时，尝试切换到同目标的其他伴飞机 */
async function checkAndSwitchEscortStreamDrone({
  closeIfNoReplacement = false,
} = {}) {
  if (!droneStreamVisible.value || !streamDrone.value?.id) return;
  if (streamSwitchInFlight) return;

  const live = streamDroneLive.value || streamDrone.value;
  const currentlyEscorting = isDroneCurrentlyEscorting(live);

  if (currentlyEscorting) {
    streamDroneWasEscorting = true;
    checkAndCloseStreamOnReturnToStandby(live);
    return;
  }

  if (!streamDroneWasEscorting) {
    if (closeIfNoReplacement) checkAndCloseStreamOnReturnToStandby(live);
    return;
  }
  streamDroneWasEscorting = false;

  const currentId = String(streamDrone.value.id);
  const currentTargetId =
    resolveEscortTargetId(live) || resolveEscortTargetId(streamDrone.value);

  if (!currentTargetId) {
    if (closeIfNoReplacement) checkAndCloseStreamOnReturnToStandby(live);
    return;
  }

  const replacement = findReplacementEscortDrone(currentTargetId, currentId);

  if (replacement && String(replacement.id) !== currentId) {
    streamSwitchInFlight = true;
    try {
      ElMessage.info(
        `伴飞无人机已切换至「${replacement.name || replacement.id}」`,
      );
      await openDroneStream(replacement);
      syncMapAfterStreamDroneSwitch(replacement);
    } finally {
      streamSwitchInFlight = false;
    }
    return;
  }

  if (closeIfNoReplacement) {
    checkAndCloseStreamOnReturnToStandby(live);
  }
}

watch(
  () => {
    if (!droneStreamVisible.value || !streamDrone.value?.id) return null;
    return isDroneCurrentlyEscorting(
      streamDroneLive.value || streamDrone.value,
    );
  },
  (escorting, prevEscorting) => {
    if (prevEscorting === true && escorting === false) {
      void checkAndSwitchEscortStreamDrone({ closeIfNoReplacement: true });
    } else if (escorting === true) {
      streamDroneWasEscorting = true;
    }
  },
);

watch(
  () => {
    if (!droneStreamVisible.value || !streamDrone.value?.id) return null;
    const live = streamDroneLive.value || streamDrone.value;
    return {
      returning: isDroneCurrentlyReturning(live),
      standby: isDroneCurrentlyStandby(live),
    };
  },
  (state, prevState) => {
    if (!state) return;
    if (prevState?.returning === true && state.standby === true) {
      checkAndCloseStreamOnReturnToStandby();
    } else if (state.returning === true) {
      streamDroneWasReturning = true;
    }
  },
);

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
  closeRobotStream();
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
  const liveFromStore = deviceStore.drones.find((d) => String(d?.id) === id);
  streamDroneWasEscorting = isDroneCurrentlyEscorting(
    liveFromStore ? { ...streamDrone.value, ...liveFromStore } : streamDrone.value,
  );
  streamDroneWasReturning = isDroneCurrentlyReturning(
    liveFromStore ? { ...streamDrone.value, ...liveFromStore } : streamDrone.value,
  );
};

/** 沉浸中「开始伴飞并跳转」：先退出沉浸，再切视频（锁车由地图侧 submitStartFollow 完成） */
function onImmersiveEscortSwitch(device) {
  if (immersiveFlight.value) {
    immersiveFlight.value = false;
    mapRef.value?.setImmersiveMapFocus?.(false);
  }
  void openDroneStream(device);
}

const openRobotStream = (device) => {
  if (!device?.id) return;
  closeDroneStream();
  planHistoryVisible.value = false;
  taskMonitorVisible.value = false;
  const id = String(device.id);
  const fromStore = deviceStore.targets.find((t) => String(t?.id) === id);
  const robotId = DEFAULT_ROBOT_ID;
  const communityId = DEFAULT_COMMUNITY_ID;
  streamRobot.value = {
    ...fromStore,
    ...device,
    id,
    name: device.name || fromStore?.name || id,
    robotId,
    communityId,
  };
  robotStreamVisible.value = true;
};

const handleStreamRecall = async ({ droneId } = {}) => {
  if (droneId) {
    deviceStore.setDroneStandby(droneId);
  }
  await deviceStore.fetchDroneList();
  closeDroneStream();
};

const closeDroneStream = () => {
  droneStreamRef.value?.exitVideoFullscreen?.();
  if (document.fullscreenElement) {
    document.exitFullscreen().catch(() => {});
  }
  if (immersiveFlight.value) {
    mapRef.value?.setImmersiveMapFocus?.(false);
  }
  streamDroneWasEscorting = false;
  streamDroneWasReturning = false;
  manualControlVisible.value = false;
  manualRecordingActive.value = false;
  droneStreamVisible.value = false;
  immersiveFlight.value = false;
  streamDrone.value = null;
  mapRef.value?.clearDroneSelectionCircle?.();
};

const closeRobotStream = () => {
  robotStreamRef.value?.exitVideoFullscreen?.();
  if (document.fullscreenElement) {
    document.exitFullscreen().catch(() => {});
  }
  robotStreamRef.value?.teardown?.();
  robotStreamVisible.value = false;
  streamRobot.value = null;
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

.map-legend-host {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 101;
  pointer-events: none;

  :deep(.map-legend-wrapper) {
    transition: padding-right 0.2s ease;
  }
}

/*
 * 宽高比 > 1（横屏）：视频打开时图例略左移，避开右上角视频
 * 宽高比 ≤ 1（竖屏）：保持居中，不额外偏移
 */
@media (min-aspect-ratio: 1/1) {
  .map-legend-host--stream-open {
    :deep(.map-legend-wrapper) {
      padding-right: min(280px, 28vw);
    }
  }
}

/* 任务查看临时入口按钮（入口方案确定后可移除/替换位置） */
.task-view-temp-entry {
  position: fixed;
  right: 24px;
  bottom: 24px;
  z-index: 200;
  height: 40px;
  padding: 0 18px;
  border: 1px solid #558efc;
  border-radius: 44px;
  background: rgba(3, 6, 10, 0.72);
  color: #fff;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.15s ease, border-color 0.15s ease;
}

.task-view-temp-entry:hover {
  background: rgba(85, 142, 252, 0.2);
  border-color: #6d9fff;
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
  z-index: 102;
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

@media (max-width: 767px) {
  /* 底部为地图图例预留空间，避免无人设备/飞行计划面板底部被遮挡 */
  .home-left-dock {
    max-height: calc(100dvh - 110px - 76px);
    height: calc(100dvh - 110px - 76px);
  }
}
</style>
