<!--
 * @Author: ml
 * @Date: 2026-01-12 15:09:59
 * @LastEditTime: 2026-03-26 10:46:18
 * @FilePath: /accompanying-fly-project/src/components/TiandituMap.vue
 * @Description: map used by Tianditu
-->
<template>
  <div class="map-container">
    <!-- cesium container -->
    <div ref="cesiumContainerRef" class="cesium-container"></div>
    <!-- 加载遮罩 -->
    <MapLoadingOverlay v-if="isLoading" />
    <!-- map controls -->
    <MapControls
      :is-pitch2-d="isPitch2D"
      :vehicle-display-mode="vehicleDisplayMode"
      :is-lock-mode="isLockMode"
      @toggle-scene-mode="toggleSceneMode"
      @toggle-display-mode="toggleDisplayMode"
      @toggle-lock-mode="toggleLockMode"
      @zoom-in="zoomIn"
      @zoom-out="zoomOut"
    />
    <!-- 地图重叠设备悬浮列表 -->
    <OverlapDevicePopup
      :visible="overlapDevicePopup.visible"
      :popup-style="overlapDevicePopupStyle"
      :items="overlapDevicePopup.items"
      @mouseenter="onOverlapPopupMouseEnter"
      @mouseleave="onOverlapPopupMouseLeave"
      @select="handleOverlapDeviceSelect"
    />

    <!-- 目标设备伴飞弹窗：锚定在警车/警员/机器人旁 -->
    <PoliceVehiclePopup
      :visible="policeVehiclePopup.visible"
      :popup-style="policeVehiclePopupStyle"
      :popup="policeVehiclePopup"
      :immersive-flight="immersiveFlight"
      :sos-src="sosSvg"
      @update:selected-drone-id="policeVehiclePopup.selectedDroneId = $event"
      @escort="handlePolicePopupEscort"
    />
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, shallowRef, ref, watch, reactive } from "vue";
import * as Cesium from "cesium";
import { mqttService } from "@/utils/mqtt-service";
import { ensureDroneOsdMqtt, onDroneOsdTelemetry } from "@/composables/useDroneOsdMqtt.js";
import { cloneDeep, isEmpty } from "lodash-es";
import { CameraFrustum } from "@/utils/cameraFrustum";
import { CompanionFrustum } from "@/utils/companionFrustum";
import { useSystemStore } from "@/stores/index";
import { ZoomFrustumManager } from "@/utils/zoomFrustumManager";
import { TIANDITU_CONFIG, DEVICE_CONFIG, MAP_CONFIG } from "@/config/app-config.js";
import dtJyPng from "@/assets/images/dt_jy.png";
import dbWrjPng from "@/assets/images/db_wrj.png";
import dbJyPng from "@/assets/images/db_jy.png";
import dbJcPng from "@/assets/images/db_jc.png";
import dtJdPng from "@/assets/images/dt_jy.png";
import boatPng from "@/assets/images/boat.png";
import dtJqrPng from "@/assets/images/dt_jqr.png";
import sosSvg from "@/assets/images/sos.svg";
import { TEST_POLICE_VEHICLES } from "@/config/test-devices.js";
import { useDeviceStore } from "@/stores/device.js";
import { useFlightPlanStore } from "@/stores/flightPlan.js";
import { useAlarmEscortDialog } from "@/composables/tianditu-map/useAlarmEscortDialog.js";
import { createBillboardTargetManager } from "@/composables/tianditu-map/createBillboardTargetManager.js";
import { useDroneSelectionCircle } from "@/composables/tianditu-map/useDroneSelectionCircle.js";
import { useInitialDroneOverview } from "@/composables/tianditu-map/useInitialDroneOverview.js";
import { useImmersiveMapFocus } from "@/composables/tianditu-map/useImmersiveMapFocus.js";
import { useMapCoordinateTracker } from "@/composables/tianditu-map/useMapCoordinateTracker.js";
import { useMapDeviceHitTesting } from "@/composables/tianditu-map/useMapDeviceHitTesting.js";
import { useMapLayerVisibility } from "@/composables/tianditu-map/useMapLayerVisibility.js";
import { useMapControls } from "@/composables/tianditu-map/useMapControls.js";
import { useMapResizeRender } from "@/composables/tianditu-map/useMapResizeRender.js";
import { useMapTargetPopups } from "@/composables/tianditu-map/useMapTargetPopups.js";
import { useTiandituImageryLayers } from "@/composables/tianditu-map/useTiandituImageryLayers.js";
import { useLockdown } from "@/composables/useLockdown.js";
import { ElMessageBox, ElMessage } from "element-plus";
import { AccompanyingFlyService } from "@/api";
import { unwrapApiList } from "@/utils/request.js";
import MapControls from "@/components/tianditu-map/MapControls.vue";
import MapLoadingOverlay from "@/components/tianditu-map/MapLoadingOverlay.vue";
import OverlapDevicePopup from "@/components/tianditu-map/OverlapDevicePopup.vue";
import PoliceVehiclePopup from "@/components/tianditu-map/PoliceVehiclePopup.vue";
import { calcZoomFov } from "@/utils/tianditu-map/fov.js";
import { horizontalDistanceMeters, toFiniteNumber } from "@/utils/tianditu-map/geo.js";
import {
  getTargetTypeLabel as getTargetTypeLabelBase,
  isBoatTarget as isBoatTargetBase,
  resolveTargetType,
} from "@/utils/tianditu-map/target.js";

const props = defineProps({
  /** 伴飞中当前选中的无人机 id（通常来自视频弹窗/资源卡片） */
  activeEscortDroneId: { type: String, default: "" },
  /** 是否处于沉浸伴飞（告警弹窗在沉浸中会展示「开始伴飞并跳转」） */
  immersiveFlight: { type: Boolean, default: false },
  /** 伴生地图实例（如任务查看覆盖层）：不重复订阅 MQTT，卸载时不影响主地图连接 */
  companion: { type: Boolean, default: false },
  /** 暂停默认渲染循环（主地图在覆盖层打开时可设为 true，避免双 WebGL 实例首帧冲突） */
  renderSuspended: { type: Boolean, default: false },
});

const emit = defineEmits(["open-drone-stream", "open-robot-stream", "immersive-escort-switch"]);

// 加载状态
const isLoading = ref(true);

/** Cesium 容器 DOM 引用（用元素实例替代写死 id，允许多个地图实例并存） */
const cesiumContainerRef = ref(null);

const TEMP_BOAT_TARGET_SN = "13900083989";

function resolveTargetMapEntry(deviceId) {
  const id = String(deviceId || "").trim();
  if (!id) return null;
  return (
    vehicleManager.vehicles.get(id) ||
    officerManager.officers.get(id) ||
    robotManager.robots.get(id) ||
    shoulderLightManager.shoulderLights.get(id) ||
    null
  );
}

function resolveTargetMapPositionProp(deviceId) {
  return resolveTargetMapEntry(deviceId)?.positionProp ?? null;
}

function resolveTargetDisplayPosition(deviceId) {
  const lastPos = resolveTargetMapEntry(deviceId)?.lastPosition;
  if (lastPos) return lastPos;

  const target = (Array.isArray(deviceStore.targets) ? deviceStore.targets : []).find(
    (t) => String(t?.id) === String(deviceId),
  );
  const lng = Number(target?.lng ?? target?.longitude);
  const lat = Number(target?.lat ?? target?.latitude);
  if (Number.isFinite(lng) && Number.isFinite(lat) && (lng !== 0 || lat !== 0)) {
    return { longitude: lng, latitude: lat, height: 0 };
  }
  return null;
}

function openRobotStreamForTarget(deviceId) {
  const id = String(deviceId || "").trim();
  if (!id || !robotManager.robots.has(id)) return;

  const target = (Array.isArray(deviceStore.targets) ? deviceStore.targets : []).find(
    (t) => String(t?.id) === id,
  );
  const robot = robotManager.robots.get(id);
  emit("open-robot-stream", {
    id,
    name: target?.name || robot?.baseLabel || id,
    robotId: target?.robotId ?? target?.raw?.robotId ?? id,
    communityId: target?.communityId ?? target?.raw?.communityId ?? undefined,
    type: 3,
  });
}

function handleMapDeviceScreenHit(screenPosition) {
  const hit = resolveDeviceClickByScreenHit(screenPosition);
  if (!hit) return false;
  if (hit.kind === "drone" && hit.drone) {
    handleDroneSelect(hit.drone);
    return true;
  }
  if (hit.kind === "target" && hit.deviceId) {
    handleTargetSelectById(hit.deviceId);
    return true;
  }
  return false;
}

function handleTargetSelectById(deviceId) {
  const id = String(deviceId || "").trim();
  if (!id) return;
  setTargetSelected(id);
  const lastPos = resolveTargetDisplayPosition(id);
  if (robotManager.robots.has(id)) {
    openRobotStreamForTarget(id);
  }
  if (TEST_POLICE_VEHICLES.some((v) => v.id === id)) {
    showTestVehicleDialog(id, lastPos);
  } else {
    void showApiVehiclePopup(id, lastPos);
  }
}

function handleDroneSelect(drone) {
  if (!drone) return;
  applyDroneSelectionCircle(getDroneEntityKey(drone));
  emit("open-drone-stream", drone);
}

function handleOverlapDeviceSelect(item) {
  hideOverlapDevicePopup();
  if (!item) return;
  if (item.kind === "drone") {
    const drone =
      item.drone ||
      deviceStore.drones.find((d) => String(d?.id || "") === String(item.id || "")) ||
      deviceStore.drones.find((d) => String(d?.sn || "") === String(item.id || "")) ||
      deviceStore.drones.find((d) => String(d?.mqttSn || "") === String(item.id || ""));
    handleDroneSelect(drone);
    return;
  }
  handleTargetSelectById(item.id);
}

async function submitStartFollow(targetId, droneSn, droneId, options = {}) {
  const { applyLock = true, openStream = true, exitImmersive = false } = options;
  if (!targetId) {
    ElMessage.warning("未找到目标设备");
    return false;
  }
  if (!droneSn) {
    ElMessage.warning("未找到无人机");
    return false;
  }
  try {
    await AccompanyingFlyService.startFollow({
      id: targetId,
      droneId: droneId,
    });
    const escortDrone = resolveDroneByMqttSn(droneSn);
    const entityKey = escortDrone
      ? getDroneEntityKey(escortDrone)
      : String(droneId || "").trim();
    droneTestManager.clearDroneTrajectory(entityKey);
    await deviceStore.fetchDroneList();
    ElMessage.success(`已下发伴飞指令：${targetId}`);
    if (applyLock) {
      // 记录待锁目标；目标已在地图上则立即锁定，否则等 MQTT 后由 tryApplyPendingEscortLock 补锁
      pendingEscortLockTargetId = String(targetId).trim();
      lockToEscortTarget(pendingEscortLockTargetId);
    }
    if (openStream && escortDrone) {
      if (exitImmersive) {
        emit("immersive-escort-switch", escortDrone);
      } else {
        emit("open-drone-stream", escortDrone);
      }
    }
    return true;
  } catch (e) {
    // ElMessage.error(e?.message || "下发伴飞指令失败");
    return false;
  }
}

function subscribeEscortDroneOsd() {
  if (subscribeEscortDroneOsd._subscribed) return;
  subscribeEscortDroneOsd._subscribed = true;
  ensureDroneOsdMqtt();
  onDroneOsdTelemetry((sn, telemetry) => {
    const lng = telemetry.lng;
    const lat = telemetry.lat;
    const height = telemetry.height;
    if (
      Number.isFinite(lng) &&
      Number.isFinite(lat) &&
      Number.isFinite(height) &&
      (lng !== 0 || lat !== 0)
    ) {
      updateDroneMapEntityBySn(sn, lng, lat, height);
    }
  });
}

function isDroneOffline(drone) {
  if (!drone) return true;
  if (drone.rawStatus === 0 || Number(drone.status) === 0) return true;
  if (drone.status === "offline") return true;
  if (drone.active === false) return true;
  return false;
}

function updateDroneMapEntityBySn(sn, lng, lat, height) {
  if (!mainViewer || mainViewer.isDestroyed?.()) return;
  const key = String(sn || "").trim();
  const drone = resolveDroneByMqttSn(key);
  if (!drone) return;
  const entityKey = getDroneEntityKey(drone);
  if (!entityKey) return;

  if (isDroneOffline(drone)) {
    if (droneTestManager.drones.has(entityKey)) {
      droneTestManager.removeDrone(entityKey);
      if (isDroneSelected(entityKey)) {
        clearDroneSelectionCircle();
      }
    }
    return;
  }

  const label = String(drone?.name || drone?.id || key || "无人机");
  const resolvedHeight = Number.isFinite(height)
    ? height
    : Number.isFinite(Number(drone?.height))
      ? Number(drone.height)
      : DRONE_HEIGHT;

  droneTestManager.createDrone(
    mainViewer,
    entityKey,
    lng,
    lat,
    resolvedHeight,
    label,
  );
  droneTestManager.updateDroneLabel(entityKey, label);
  droneTestManager.updateDroneLabelColor(entityKey, drone.isEscorting);
  droneTestManager.updateDronePosition(entityKey, lng, lat, resolvedHeight);

  [drone?.id, drone?.sn, drone?.mqttSn, key].forEach((alias) => {
    const aliasKey = String(alias || "").trim();
    if (!aliasKey || aliasKey === entityKey) return;
    if (droneTestManager.drones.has(aliasKey)) {
      droneTestManager.removeDrone(aliasKey);
    }
  });
}

function subscribeInitialDroneOsdTopics() {
  subscribeEscortDroneOsd();

  if (deviceStore.dronesLoadedFromApi || initialDroneOsdFetchPending) return;
  initialDroneOsdFetchPending = true;
  deviceStore
    .fetchDroneList()
    .finally(() => {
      initialDroneOsdFetchPending = false;
    });
}


async function submitStopFollow(targetId, droneId) {
  // targetId = '25919cbc3d4811f1aded0242ac120005'
  const id = String(targetId || "").trim();
  const targetDroneId = String(droneId || "").trim();
  if (!id) {
    ElMessage.warning("未找到目标设备");
    return false;
  }
  if (!targetDroneId) {
    ElMessage.warning("未找到无人机ID");
    return false;
  }
  try {
    await AccompanyingFlyService.stopFollow({
      id,
      droneId: targetDroneId,
    });
    await deviceStore.fetchDroneList();
    ElMessage.success(`已结束伴飞：${id}`);
    return true;
  } catch (e) {
    ElMessage.error(e?.message || "结束伴飞失败");
    return false;
  }
}

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

/** 告警弹窗 / 警车弹窗共用：按动作下发伴飞并决定是否换锁车、切视频、退出沉浸 */
async function applyEscortFollowAction(action, targetId, droneSn, droneId) {
  if (!droneSn || !droneId) {
    ElMessage.warning("请选择可用无人机");
    return false;
  }
  if (action === "follow-only") {
    return submitStartFollow(targetId, droneSn, droneId, {
      applyLock: false,
      openStream: false,
    });
  }
  if (action === "follow-and-switch") {
    return submitStartFollow(targetId, droneSn, droneId, {
      applyLock: true,
      openStream: true,
      exitImmersive: true,
    });
  }
  return submitStartFollow(targetId, droneSn, droneId);
}

function resolvePolicePopupDroneSelection() {
  const targetId = resolveCanonicalTargetId(policeVehiclePopup.deviceId) ||
    String(policeVehiclePopup.deviceId || "").trim();
  const selectedId = policeVehiclePopup.selectedDroneId;
  const selected = (policeVehiclePopup.drones || []).find(
    (d) => String(d?.id ?? d?.sn ?? "") === String(selectedId),
  );
  const droneSn = String(selected?.sn || "");
  return { targetId, droneSn, droneId: selectedId };
}

const handlePolicePopupEscort = async (action = "follow-full") => {
  const { targetId, droneSn, droneId } = resolvePolicePopupDroneSelection();
  const ok = await applyEscortFollowAction(action, targetId, droneSn, droneId);
  if (ok) closePoliceVehiclePopup();
};

async function ensureTargetBindAllowed(sn) {
  const trimmed = String(sn ?? "").trim();
  if (!trimmed) return false;
  try {
    const res = await AccompanyingFlyService.targetBindCheck(
      { sn: trimmed },
      { silent: true },
    );
    return res?.data === true;
  } catch (_) {
    return false;
  }
}

function resolveVehicleTargetSn(vehicleData) {
  return String(
    vehicleData?.sn ||
      vehicleData?.mqttSn ||
      vehicleData?.raw?.terminalPhone ||
      vehicleData?.raw?.sn ||
      "",
  ).trim();
}

/** 按 SN / 终端号在 store 目标列表中查找（仅接口返回的设备） */
function findTargetBySn(sn) {
  const trimmed = String(sn || "").trim();
  if (!trimmed) return null;
  const targets = Array.isArray(deviceStore.targets) ? deviceStore.targets : [];
  return (
    targets.find((t) => {
      const keys = [
        t?.sn,
        t?.raw?.sn,
        t?.raw?.terminalPhone,
      ];
      return keys.some((v) => String(v || "").trim() === trimmed);
    }) || null
  );
}

/** 按 MQTT 主题 sn / 地图 deviceId / 目标 id 在 store 中查找伴飞目标 */
function findTargetByMqttKey(key) {
  const trimmed = String(key || "").trim();
  if (!trimmed) return null;
  const targets = Array.isArray(deviceStore.targets) ? deviceStore.targets : [];
  return (
    targets.find((t) => String(t?.id || "").trim() === trimmed) ||
    targets.find((t) => {
      const keys = [
        t?.sn,
        t?.mqttSn,
        t?.raw?.sn,
        t?.raw?.terminalPhone,
        t?.raw?.deviceSn,
        t?.raw?.targetSn,
        t?.raw?.vehicleSn,
      ];
      return keys.some((v) => String(v || "").trim() === trimmed);
    }) ||
    null
  );
}

/** 接口 targetId 一律使用 store 中的目标 id，禁止把终端 sn 当作 targetId */
function resolveCanonicalTargetId(deviceKey) {
  const target = findTargetByMqttKey(deviceKey);
  return target?.id ? String(target.id) : "";
}

const SUGGEST_DRONES_CACHE_TTL = 15 * 1000;
const suggestDronesCache = new Map();

function extractReadySuggestedDronesFromResponse(res) {
  return unwrapApiList(res).filter((d) => Number(d?.status) === 1);
}

function buildSuggestDronesQuery(targetId, devicePosition) {
  const canonicalTargetId = resolveCanonicalTargetId(targetId);
  const longitude = toFiniteNumber(devicePosition?.longitude);
  const latitude = toFiniteNumber(devicePosition?.latitude);
  if (!canonicalTargetId || !Number.isFinite(longitude) || !Number.isFinite(latitude)) {
    return null;
  }
  return {
    targetId: canonicalTargetId,
    longitude,
    latitude,
  };
}

function getSuggestDronesCacheKey(query) {
  return `${query.targetId}|${query.longitude}|${query.latitude}`;
}

async function getReadySuggestedDrones(query, forceRefresh = false) {
  if (!query) return [];
  const cacheKey = getSuggestDronesCacheKey(query);
  const cached = suggestDronesCache.get(cacheKey);
  const now = Date.now();
  if (
    !forceRefresh &&
    cached?.list?.length &&
    now - cached.fetchedAt < SUGGEST_DRONES_CACHE_TTL
  ) {
    return cached.list;
  }
  if (cached?.pending) {
    return cached.pending;
  }
  const pending = AccompanyingFlyService.droneSuggestList(query)
    .then((res) => {
      const ready = extractReadySuggestedDronesFromResponse(res);
      suggestDronesCache.set(cacheKey, {
        list: ready,
        fetchedAt: Date.now(),
        pending: null,
      });
      return ready;
    })
    .catch(() => {
      return [];
    })
    .finally(() => {
      const latest = suggestDronesCache.get(cacheKey);
      if (latest?.pending === pending) {
        suggestDronesCache.set(cacheKey, {
          list: latest.list || [],
          fetchedAt: latest.fetchedAt || 0,
          pending: null,
        });
      }
    });
  suggestDronesCache.set(cacheKey, {
    list: cached?.list || [],
    fetchedAt: cached?.fetchedAt || 0,
    pending,
  });
  return pending;
}

function mapSuggestedDronesForSelect(readyDrones) {
  return readyDrones
    .map((d) => {
      const id = String(d?.id ?? d?.sn ?? "");
      if (!id) return null;
      const name = String(d?.name || d?.sn || id);
      const sn = String(d?.sn || "");
      return {
        id,
        sn,
        raw: d,
        label: `${name}${sn ? `（${sn}）` : ""}`,
      };
    })
    .filter(Boolean);
}

async function loadSuggestedDronesForPopup(targetId, devicePosition) {
  policeVehiclePopup.loadingDrones = true;
  policeVehiclePopup.drones = [];
  policeVehiclePopup.selectedDroneId = "";
  try {
    const query = buildSuggestDronesQuery(targetId, devicePosition);
    const readyDrones = await getReadySuggestedDrones(query, true);
    const drones = mapSuggestedDronesForSelect(readyDrones);
    policeVehiclePopup.drones = drones;
    policeVehiclePopup.selectedDroneId = drones[0]?.id || "";
  } catch (e) {
    policeVehiclePopup.drones = [];
    policeVehiclePopup.selectedDroneId = "";
  } finally {
    policeVehiclePopup.loadingDrones = false;
  }
}

// 车辆点击事件处理器
let vehicleClickHandler = null;

const systemStore = useSystemStore();
const deviceStore = useDeviceStore();
const flightPlanStore = useFlightPlanStore();
let routeLayerVisible = false;

/** @type {import('cesium').Entity[]} */
let flightPlanPolygonEntities = [];
/** @type {import('cesium').Entity[]} */
let companionRouteEntities = [];

const syncFlightPlanPolygon = () => {
  if (!mainViewer || mainViewer.isDestroyed?.()) return;
  if (flightPlanPolygonEntities.length) {
    flightPlanPolygonEntities.forEach((e) => mainViewer.entities.remove(e));
    flightPlanPolygonEntities = [];
  }
};

watch(
  () => flightPlanStore.selectedPlanId,
  () => {
    syncFlightPlanPolygon();
  },
);
const DEFAULT_CENTER = MAP_CONFIG.defaultCenter;
const MAP_BASE_COLOR_HEX = "#292E38";
const DRONE_HEIGHT = MAP_CONFIG.droneHeight;
const CAR_SPEED = MAP_CONFIG.carSpeed;
const SCOPE_RATIO = MAP_CONFIG.scopeRatio; // 数值越小，取景框越靠中心
// cesium viewer
let mainViewer,
  carEntity,
  droneEntity;
// car model position property
let carPositionProp = new Cesium.SampledPositionProperty();
// uav model position property
let dronePositionProp = new Cesium.SampledPositionProperty();
// uniformly set HOLD and Interpolation Optionst
[carPositionProp, dronePositionProp].forEach((prop) => {
  // If the time exceeds the last point, keep it there.
  prop.forwardExtrapolationType = Cesium.ExtrapolationType.HOLD;
  // When the time is earlier than the first point, the position remains at the first point.
  prop.backwardExtrapolationType = Cesium.ExtrapolationType.HOLD;
  prop.setInterpolationOptions({
    interpolationDegree: 1,
    interpolationAlgorithm: Cesium.HermitePolynomialApproximation,
  });
});

const VEHICLE_HIGHLIGHT_COLOR = Cesium.Color.fromCssColorString("#ffcc00");
const VEHICLE_NORMAL_PATH_COLOR =
  Cesium.Color.fromCssColorString("#00eeee");
const OFFICER_NORMAL_PATH_COLOR =
  Cesium.Color.fromCssColorString("#66ccff");
const ROBOT_NORMAL_PATH_COLOR =
  Cesium.Color.fromCssColorString("#88ddff");
const SHOULDER_LIGHT_NORMAL_PATH_COLOR =
  Cesium.Color.fromCssColorString("#72d2ff");
const VEHICLE_LABEL_COLOR = Cesium.Color.fromCssColorString("#289EFF");
const DRONE_LABEL_COLOR = Cesium.Color.fromCssColorString("#0EF2F2");
const DRONE_LABEL_COLOR_ESCORTING = Cesium.Color.fromCssColorString("#52C41A");

/** 地图 pin 类图标原始尺寸（保持宽高比，避免被压扁） */
const SHOULDER_LIGHT_ICON_SIZE = { width: 98, height: 125 };
const PIN_BILLBOARD_BASE_WIDTH = 52;
const PIN_BILLBOARD_HIGHLIGHT_WIDTH = 56;
const VEHICLE_POINT_PIXEL_SIZE = 12;

function getPinBillboardSize(nativeWidth, nativeHeight, displayWidth) {
  return {
    width: displayWidth,
    height: Math.round(displayWidth * (nativeHeight / nativeWidth)),
  };
}

function getShoulderLightBillboardSize(selected = false) {
  return getPinBillboardSize(
    SHOULDER_LIGHT_ICON_SIZE.width,
    SHOULDER_LIGHT_ICON_SIZE.height,
    selected ? PIN_BILLBOARD_HIGHLIGHT_WIDTH : PIN_BILLBOARD_BASE_WIDTH,
  );
}

function resolveEntityTargetType(entity) {
  const targetType = entity?.properties?.targetType;
  if (!targetType) return undefined;
  if (typeof targetType.getValue === "function") {
    return targetType.getValue(mainViewer?.clock?.currentTime);
  }
  return targetType;
}

const escortTargetHighlight = reactive({
  targetId: null,
  droneName: "",
});

/** 地图点击选中的伴飞目标（警车 / 警员 / 机器人） */
let selectedTargetDeviceId = null;

function applyBillboardTargetHighlight(entity, selected) {
  if (!entity?.billboard || !entity?.label) return;

  const isShoulderLight = resolveEntityTargetType(entity) === 6;
  const pinSize = isShoulderLight ? getShoulderLightBillboardSize(selected) : null;
  const billboardWidth = pinSize?.width ?? (selected ? 46 : 34);
  const billboardHeight = pinSize?.height ?? (selected ? 46 : 34);
  const labelOffsetY = pinSize
    ? -(billboardHeight + (selected ? 6 : 4))
    : selected
      ? -46
      : -38;

  if (selected) {
    entity.billboard.width = billboardWidth;
    entity.billboard.height = billboardHeight;
    entity.label.fillColor = VEHICLE_HIGHLIGHT_COLOR;
    entity.label.outlineColor = Cesium.Color.BLACK;
    entity.label.outlineWidth = 3;
    entity.label.font = "bold 15px Microsoft YaHei, sans-serif";
    entity.label.pixelOffset = new Cesium.Cartesian2(0, labelOffsetY);
  } else {
    entity.billboard.width = billboardWidth;
    entity.billboard.height = billboardHeight;
    entity.label.fillColor = isShoulderLight ? VEHICLE_LABEL_COLOR : Cesium.Color.WHITE;
    entity.label.outlineColor = Cesium.Color.BLACK;
    entity.label.outlineWidth = 2;
    entity.label.font = "14px sans-serif";
    entity.label.pixelOffset = new Cesium.Cartesian2(0, labelOffsetY);
  }
}

function clearTargetVisualHighlight(deviceId) {
  const id = String(deviceId || "").trim();
  if (!id || escortTargetHighlight.targetId === id) return;

  if (vehicleManager.vehicles.has(id)) {
    vehicleManager._applyHighlight(id, false);
    if (vehicleManager.selectedDeviceId === id) {
      vehicleManager.selectedDeviceId = null;
    }
    return;
  }

  const officer = officerManager.officers.get(id);
  if (officer?.entity) {
    applyBillboardTargetHighlight(officer.entity, false);
    return;
  }

  const robot = robotManager.robots.get(id);
  if (robot?.entity) {
    applyBillboardTargetHighlight(robot.entity, false);
    return;
  }

  const shoulderLight = shoulderLightManager.shoulderLights.get(id);
  if (shoulderLight?.entity) {
    applyBillboardTargetHighlight(shoulderLight.entity, false);
  }
}

/**
 * 新增能力：相机聚焦到指定无人机（供任务查看等外部实例调用）。
 * 仅新增，不改变任何既有行为；home 不调用即无影响。
 */
function focusDrone(droneId, { duration = 0.8, height } = {}) {
  const id = String(droneId || "").trim();
  if (!id || !mainViewer || mainViewer.isDestroyed?.()) return false;
  const drone =
    deviceStore.drones.find((d) => String(d?.id || "") === id) ||
    deviceStore.drones.find((d) => String(d?.sn || "") === id) ||
    deviceStore.drones.find((d) => String(d?.mqttSn || "") === id);
  if (!drone) return false;
  const lng = Number(drone.longitude ?? drone.lng);
  const lat = Number(drone.latitude ?? drone.lat);
  if (!Number.isFinite(lng) || !Number.isFinite(lat)) return false;
  if (lng === 0 && lat === 0) return false;
  mainViewer.camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(
      lng,
      lat,
      height ?? MAP_CONFIG.mapDefaultRange,
    ),
    orientation: {
      heading: Cesium.Math.toRadians(0),
      pitch: Cesium.Math.toRadians(-90),
      roll: 0,
    },
    duration,
  });
  return true;
}

function applyTargetVisualHighlight(deviceId) {
  const id = String(deviceId || "").trim();
  if (!id) return;

  if (vehicleManager.vehicles.has(id)) {
    vehicleManager.selectedDeviceId = id;
    vehicleManager._applyHighlight(id, true);
    return;
  }

  vehicleManager.selectedDeviceId = null;

  const officer = officerManager.officers.get(id);
  if (officer?.entity) {
    applyBillboardTargetHighlight(officer.entity, true);
    return;
  }

  const robot = robotManager.robots.get(id);
  if (robot?.entity) {
    applyBillboardTargetHighlight(robot.entity, true);
    return;
  }

  const shoulderLight = shoulderLightManager.shoulderLights.get(id);
  if (shoulderLight?.entity) {
    applyBillboardTargetHighlight(shoulderLight.entity, true);
  }
}

function setTargetSelected(deviceId) {
  const id = deviceId ? String(deviceId).trim() : null;
  if (selectedTargetDeviceId === id) return;

  if (selectedTargetDeviceId) {
    clearTargetVisualHighlight(selectedTargetDeviceId);
  }

  selectedTargetDeviceId = id;
  if (id) {
    applyTargetVisualHighlight(id);
  }

  mainViewer?.scene?.requestRender?.();
}

function clearTargetSelection() {
  setTargetSelected(null);
}

function formatTargetDisplayLabel(baseLabel, droneName = "") {
  const base = String(baseLabel || "").trim();
  const drone = String(droneName || "").trim();
  if (!base) return drone ? `(${drone})` : "";
  if (!drone) return base;
  return `${base} (${drone})`;
}

function resolveEscortHighlightDroneName(droneId) {
  const id = String(droneId || "").trim();
  if (!id) return "";
  const drone = deviceStore.drones.find((d) => String(d?.id || "") === id);
  return String(drone?.name || drone?.id || "无人机").trim();
}

function refreshTargetLabel(deviceId) {
  const targetId = String(deviceId || "").trim();
  if (!targetId) return;

  const highlighted =
    escortTargetHighlight.targetId === targetId
      ? escortTargetHighlight.droneName
      : "";

  const vehicle = vehicleManager.vehicles.get(targetId);
  if (vehicle?.entity?.label) {
    vehicle.entity.label.text = formatTargetDisplayLabel(
      vehicle.baseLabel,
      highlighted,
    );
    return;
  }

  const officer = officerManager.officers.get(targetId);
  if (officer?.entity?.label) {
    officer.entity.label.text = formatTargetDisplayLabel(
      officer.baseLabel,
      highlighted,
    );
    return;
  }

  const robot = robotManager.robots.get(targetId);
  if (robot?.entity?.label) {
    robot.entity.label.text = formatTargetDisplayLabel(
      robot.baseLabel,
      highlighted,
    );
    return;
  }

  const shoulderLight = shoulderLightManager.shoulderLights.get(targetId);
  if (shoulderLight?.entity?.label) {
    shoulderLight.entity.label.text = formatTargetDisplayLabel(
      shoulderLight.baseLabel,
      highlighted,
    );
  }
}

function applyTargetEscortHighlight(deviceId, active) {
  const targetId = String(deviceId || "").trim();
  if (!targetId) return;

  const vehicle = vehicleManager.vehicles.get(targetId);
  if (vehicle?.entity) {
    if (active) {
      vehicleManager._applyHighlight(targetId, true);
    } else if (
      selectedTargetDeviceId !== targetId &&
      vehicleManager.selectedDeviceId !== targetId
    ) {
      vehicleManager._applyHighlight(targetId, false);
    }
    return;
  }

  const officer = officerManager.officers.get(targetId);
  if (officer?.entity) {
    if (active) {
      applyBillboardTargetHighlight(officer.entity, true);
    } else if (selectedTargetDeviceId !== targetId) {
      applyBillboardTargetHighlight(officer.entity, false);
    }
    return;
  }

  const robot = robotManager.robots.get(targetId);
  if (robot?.entity) {
    if (active) {
      applyBillboardTargetHighlight(robot.entity, true);
    } else if (selectedTargetDeviceId !== targetId) {
      applyBillboardTargetHighlight(robot.entity, false);
    }
    return;
  }

  const shoulderLight = shoulderLightManager.shoulderLights.get(targetId);
  if (!shoulderLight?.entity) return;

  if (active) {
    applyBillboardTargetHighlight(shoulderLight.entity, true);
  } else if (selectedTargetDeviceId !== targetId) {
    applyBillboardTargetHighlight(shoulderLight.entity, false);
  }
}

function syncEscortTargetHighlight(droneId) {
  const prevTargetId = escortTargetHighlight.targetId;
  if (prevTargetId) {
    applyTargetEscortHighlight(prevTargetId, false);
    refreshTargetLabel(prevTargetId);
  }

  escortTargetHighlight.targetId = null;
  escortTargetHighlight.droneName = "";

  const id = String(droneId || "").trim();
  if (!id) {
    mainViewer?.scene?.requestRender?.();
    return;
  }

  const drone = deviceStore.drones.find((d) => String(d?.id || "") === id);
  if (!drone?.isEscorting) {
    mainViewer?.scene?.requestRender?.();
    return;
  }

  const targetId = resolveEscortTargetId(drone);
  if (!targetId) {
    mainViewer?.scene?.requestRender?.();
    return;
  }

  escortTargetHighlight.targetId = targetId;
  escortTargetHighlight.droneName = resolveEscortHighlightDroneName(id);

  applyTargetEscortHighlight(targetId, true);
  refreshTargetLabel(targetId);
  mainViewer?.scene?.requestRender?.();
}

function isBoatTarget(target) {
  return isBoatTargetBase(target, TEMP_BOAT_TARGET_SN);
}

function getTargetTypeLabel(target) {
  return getTargetTypeLabelBase(target, TEMP_BOAT_TARGET_SN);
}

const getVehicleDeviceIdFromEntity = (entity) => {
  const propDeviceId = entity?.properties?.deviceId;
  if (propDeviceId) {
    if (typeof propDeviceId.getValue === "function") {
      const val = propDeviceId.getValue(mainViewer?.clock?.currentTime);
      if (val != null && val !== "") return String(val);
    } else if (propDeviceId != null && propDeviceId !== "") {
      return String(propDeviceId);
    }
  }
  const labelText = entity?.label?.text;
  if (typeof labelText === "string") return labelText;
  if (labelText && typeof labelText.getValue === "function") {
    return labelText.getValue(mainViewer?.clock?.currentTime);
  }
  return null;
};

const getEntityType = (entity) => {
  const propEntityType = entity?.properties?.entityType;
  if (!propEntityType) return "";
  if (typeof propEntityType.getValue === "function") {
    const val = propEntityType.getValue(mainViewer?.clock?.currentTime);
    return val != null ? String(val) : "";
  }
  return String(propEntityType || "");
};

const getDroneDeviceFromEntity = (entity) => {
  const deviceId = getVehicleDeviceIdFromEntity(entity);
  if (!deviceId || getEntityType(entity) !== "drone") return null;
  return (
    deviceStore.drones.find((drone) => String(drone?.mqttSn) === deviceId) ||
    deviceStore.drones.find((drone) => String(drone?.id) === deviceId) ||
    deviceStore.drones.find((drone) => String(drone?.sn) === deviceId) ||
    null
  );
};

const getDroneEntityKey = (drone) =>
  String(drone?.id || drone?.sn || drone?.mqttSn || "").trim();

function resolveDroneByMqttSn(sn) {
  const key = String(sn || "").trim();
  if (!key) return null;
  return (
    deviceStore.drones.find((item) => String(item?.sn || "").trim() === key) ||
    deviceStore.drones.find((item) => String(item?.mqttSn || "").trim() === key)
  );
}

// 多车辆管理系统
const vehicleManager = {
  // 存储所有车辆实体 { deviceId: { entity, positionProp, orientationProp, lastPosition } }
  vehicles: new Map(),
  selectedDeviceId: null,

  setSelected(deviceId) {
    if (this.selectedDeviceId === deviceId) return;
    if (this.selectedDeviceId) {
      this._applyHighlight(this.selectedDeviceId, false);
    }
    this.selectedDeviceId = deviceId || null;
    if (this.selectedDeviceId) {
      this._applyHighlight(this.selectedDeviceId, true);
    }
    mainViewer?.scene?.requestRender?.();
  },

  clearSelection() {
    this.setSelected(null);
  },

  _applyHighlight(deviceId, selected) {
    const vehicle = this.vehicles.get(deviceId);
    if (!vehicle?.entity) return;
    const entity = vehicle.entity;
    if (!entity.model && entity.billboard) {
      applyBillboardTargetHighlight(entity, selected);
      return;
    }

    if (selected) {
      entity.model.silhouetteColor = VEHICLE_HIGHLIGHT_COLOR;
      entity.model.silhouetteSize = 2.5;
      entity.label.fillColor = VEHICLE_HIGHLIGHT_COLOR;
      entity.label.outlineColor = Cesium.Color.BLACK;
      entity.label.outlineWidth = 3;
      entity.label.font = "bold 15px Microsoft YaHei, sans-serif";
      entity.label.pixelOffset = new Cesium.Cartesian2(0, -48);
    } else {
      entity.model.silhouetteSize = 0;
      entity.model.silhouetteColor = undefined;
      entity.label.fillColor = VEHICLE_LABEL_COLOR;
      entity.label.outlineColor = Cesium.Color.BLACK;
      entity.label.outlineWidth = 2;
      entity.label.font = "14px sans-serif";
      entity.label.pixelOffset = new Cesium.Cartesian2(0, -40);
    }
  },

  // 为指定设备创建车辆实体
  createVehicle(viewer, deviceId, labelText = deviceId, options = {}) {
    const { billboardImage = "" } = options;
    const useBillboard = Boolean(billboardImage);
    if (this.vehicles.has(deviceId)) {
      const existing = this.vehicles.get(deviceId);
      const existingUseBillboard = Boolean(existing?.entity?.billboard && !existing?.entity?.model);
      if (existingUseBillboard !== useBillboard) {
        this.removeVehicle(deviceId);
      } else {
        return existing;
      }
    }

    const positionProp = new Cesium.SampledPositionProperty();
    positionProp.forwardExtrapolationType = Cesium.ExtrapolationType.HOLD;
    positionProp.backwardExtrapolationType = Cesium.ExtrapolationType.HOLD;
    positionProp.setInterpolationOptions({
      interpolationDegree: 1,
      interpolationAlgorithm: Cesium.HermitePolynomialApproximation,
    });

    const velocityOrientation = new Cesium.VelocityOrientationProperty(
      positionProp,
    );
    let lastValidOrientation = null;

    const defaultPathMaterial = new Cesium.PolylineGlowMaterialProperty({
      glowPower: 0.2,
      taperPower: 0.7,
      color: VEHICLE_NORMAL_PATH_COLOR,
    });

    const entity = viewer.entities.add({
      availability: new Cesium.TimeIntervalCollection([
        new Cesium.TimeInterval({
          start: viewer.clock.startTime,
          stop: Cesium.JulianDate.fromIso8601("9999-12-31T23:59:59Z"),
        }),
      ]),
      position: positionProp,
      orientation: new Cesium.CallbackProperty((time, result) => {
        const currentOrientation = velocityOrientation.getValue(time);
        if (Cesium.defined(currentOrientation)) {
          lastValidOrientation = Cesium.Quaternion.clone(
            currentOrientation,
            lastValidOrientation,
          );
          return currentOrientation;
        } else {
          return lastValidOrientation;
        }
      }, false),
      ...(useBillboard
        ? {
            billboard: {
              image: billboardImage,
              width: 34,
              height: 34,
              verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
              heightReference: Cesium.HeightReference.RELATIVE_TO_GROUND,
              disableDepthTestDistance: Number.POSITIVE_INFINITY,
            },
          }
        : getVehicleShapeGraphics()),
      path: {
        show: routeLayerVisible,
        width: 5,
        material: defaultPathMaterial,
        leadTime: 0,
        trailTime: 999999,
      },
      properties: {
        deviceId,
        deviceName: labelText || deviceId,
      },
      label: {
        text: labelText || deviceId,
        font: "14px sans-serif",
        fillColor: VEHICLE_LABEL_COLOR,
        outlineColor: Cesium.Color.BLACK,
        outlineWidth: 2,
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
        pixelOffset: new Cesium.Cartesian2(0, -40),
        show: true,
        heightReference: Cesium.HeightReference.RELATIVE_TO_GROUND,
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
      },
    });

    this.vehicles.set(deviceId, {
      entity,
      positionProp,
      velocityOrientation,
      lastValidOrientation,
      lastPosition: null,
      defaultPathMaterial,
      baseLabel: labelText || deviceId,
    });

    console.log(`🚗 创建车辆实体: ${deviceId}`);
    return this.vehicles.get(deviceId);
  },

  // 更新车辆位置
  updateVehiclePosition(deviceId, longitude, latitude, height = 0) {
    const vehicle = this.vehicles.get(deviceId);
    if (!vehicle) {
      console.warn(`⚠️ 车辆 ${deviceId} 不存在，跳过更新`);
      return;
    }

    const currentTime = mainViewer.clock.currentTime;
    const newPosition = Cesium.Cartesian3.fromDegrees(
      longitude,
      latitude,
      height,
    );

    vehicle.positionProp.addSample(currentTime, newPosition);
    vehicle.lastPosition = { longitude, latitude, height };
  },

  updateVehicleLabel(deviceId, labelText) {
    const vehicle = this.vehicles.get(deviceId);
    if (!vehicle?.entity?.label) return;
    vehicle.baseLabel = labelText || deviceId;
    vehicle.entity.label.text = formatTargetDisplayLabel(
      vehicle.baseLabel,
      escortTargetHighlight.targetId === String(deviceId)
        ? escortTargetHighlight.droneName
        : "",
    );
    if (vehicle.entity.properties?.deviceName) {
      vehicle.entity.properties.deviceName = labelText || deviceId;
    }
  },

  // 获取所有车辆
  getAllVehicles() {
    return Array.from(this.vehicles.keys());
  },

  removeVehicle(deviceId) {
    const vehicle = this.vehicles.get(deviceId);
    if (!vehicle) return;
    if (this.selectedDeviceId === deviceId) this.selectedDeviceId = null;
    mainViewer.entities.remove(vehicle.entity);
    this.vehicles.delete(deviceId);
    console.log(`🗑️ 移除车辆实体: ${deviceId}`);
  },

  // 清除所有车辆
  clearAll() {
    this.selectedDeviceId = null;
    closePoliceVehiclePopup();
    this.vehicles.forEach((vehicle) => {
      mainViewer.entities.remove(vehicle.entity);
    });
    this.vehicles.clear();
    console.log("🗑️ 已清除所有车辆");
  },
};

const billboardTargetManagerContext = {
  getViewer: () => mainViewer,
  getRouteLayerVisible: () => routeLayerVisible,
  getTargetLayerVisibility: () => targetLayerVisibility,
  getVehicleViewFrom: (to2D) => getVehicleViewFrom(to2D),
  formatTargetDisplayLabel,
  escortTargetHighlight,
};

const officerEntityManager = createBillboardTargetManager(
  {
    targetType: 2,
    icon: dtJyPng,
    pathColor: OFFICER_NORMAL_PATH_COLOR,
    labelColor: Cesium.Color.WHITE,
    visibilityKey: "officer",
  },
  billboardTargetManagerContext,
);

const robotEntityManager = createBillboardTargetManager(
  {
    targetType: 3,
    icon: dtJqrPng,
    pathColor: ROBOT_NORMAL_PATH_COLOR,
    labelColor: Cesium.Color.WHITE,
    visibilityKey: "robot",
  },
  billboardTargetManagerContext,
);

const shoulderLightEntityManager = createBillboardTargetManager(
  {
    targetType: 6,
    icon: dtJdPng,
    pathColor: SHOULDER_LIGHT_NORMAL_PATH_COLOR,
    labelColor: VEHICLE_LABEL_COLOR,
    visibilityKey: "shoulderLight",
    getBillboardSize: getShoulderLightBillboardSize,
    getLabelOffsetY: (billboardSize) => -(billboardSize.height + 4),
  },
  billboardTargetManagerContext,
);

// 保留旧 manager 接口，降低调用层变更风险。
const officerManager = {
  officers: officerEntityManager.records,
  createOfficer: officerEntityManager.create,
  updateOfficerPosition: officerEntityManager.updatePosition,
  updateOfficerLabel: officerEntityManager.updateLabel,
  removeOfficer: officerEntityManager.remove,
  clearAll: officerEntityManager.clearAll,
};

const robotManager = {
  robots: robotEntityManager.records,
  createRobot: robotEntityManager.create,
  updateRobotPosition: robotEntityManager.updatePosition,
  updateRobotLabel: robotEntityManager.updateLabel,
  removeRobot: robotEntityManager.remove,
  clearAll: robotEntityManager.clearAll,
};

const shoulderLightManager = {
  shoulderLights: shoulderLightEntityManager.records,
  createShoulderLight: shoulderLightEntityManager.create,
  updateShoulderLightPosition: shoulderLightEntityManager.updatePosition,
  updateShoulderLightLabel: shoulderLightEntityManager.updateLabel,
  removeShoulderLight: shoulderLightEntityManager.remove,
  clearAll: shoulderLightEntityManager.clearAll,
};

// 多无人机测试管理器
const droneTestManager = {
  drones: new Map(),

  _removeAllPositionSamples(drone) {
    drone.positionProp.removeSamples(
      new Cesium.TimeInterval({
        start: Cesium.JulianDate.fromIso8601("1970-01-01T00:00:00Z"),
        stop: Cesium.JulianDate.fromIso8601("9999-12-31T23:59:59Z"),
      }),
    );
  },

  _refreshPath(drone) {
    if (!drone?.entity?.path) return;
    drone.entity.path.show = false;
    drone.entity.path.show = true;
  },

  _addTrailSample(drone, lng, lat, height) {
    const now = mainViewer.clock.currentTime;
    const position = Cesium.Cartesian3.fromDegrees(lng, lat, height);
    drone.positionProp.addSample(now, position);
    drone.lastPosition = { lng, lat, height };
  },

  createDrone(viewer, droneId, lng, lat, height = 80, labelText = droneId) {
    if (this.drones.has(droneId)) return this.drones.get(droneId);

    const positionProp = new Cesium.SampledPositionProperty();
    positionProp.forwardExtrapolationType = Cesium.ExtrapolationType.HOLD;
    positionProp.setInterpolationOptions({
      interpolationDegree: 2,
      interpolationAlgorithm: Cesium.HermitePolynomialApproximation,
    });

    const orientationProp = new Cesium.SampledProperty(Cesium.Quaternion);
    orientationProp.forwardExtrapolationType = Cesium.ExtrapolationType.HOLD;
    orientationProp.setInterpolationOptions({
      interpolationDegree: 2,
      interpolationAlgorithm: Cesium.HermitePolynomialApproximation,
    });

    const entity = viewer.entities.add({
      availability: new Cesium.TimeIntervalCollection([
        new Cesium.TimeInterval({
          start: Cesium.JulianDate.fromIso8601("1970-01-01T00:00:00Z"),
          stop: Cesium.JulianDate.fromIso8601("9999-12-31T23:59:59Z"),
        }),
      ]),
      position: positionProp,
      orientation: orientationProp,
      model: {
        uri: "/models/drone.glb",
        minimumPixelSize: 48,
        runAnimations: true,
      },
      properties: {
        deviceId: droneId,
        deviceName: labelText || droneId,
        entityType: "drone",
      },
      path: {
        show: routeLayerVisible,
        width: 3,
        material: new Cesium.PolylineGlowMaterialProperty({
          glowPower: 0.2,
          taperPower: 0.7,
          color: Cesium.Color.GOLD,
        }),
        leadTime: 0,
        trailTime: 999999,
        resolution: 1,
      },
      label: {
        text: labelText || droneId,
        font: "14px sans-serif",
        fillColor: DRONE_LABEL_COLOR,
        outlineColor: Cesium.Color.BLACK,
        outlineWidth: 2,
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
        pixelOffset: new Cesium.Cartesian2(0, -40),
        show: true,
        heightReference: Cesium.HeightReference.RELATIVE_TO_GROUND,
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
      },
    });

    this.drones.set(droneId, {
      entity,
      positionProp,
      orientationProp,
      lastPosition: { lng, lat, height },
      hasTrailSample: false,
    });

    console.log(`🛸 创建无人机实体: ${droneId}`);
    return this.drones.get(droneId);
  },

  updateDronePosition(droneId, lng, lat, height) {
    const drone = this.drones.get(droneId);
    if (!drone) {
      console.warn(`无人机 ${droneId} 不存在`);
      return;
    }
    if (!mainViewer || mainViewer.isDestroyed?.()) return;

    const maxStep = MAP_CONFIG.droneTrailMaxStepMeters ?? 500;
    const last = drone.lastPosition;

    if (
      drone.hasTrailSample &&
      last &&
      Number.isFinite(last.lng) &&
      Number.isFinite(last.lat)
    ) {
      const dist = horizontalDistanceMeters(last.lng, last.lat, lng, lat);
      if (dist > maxStep) {
        console.warn(
          `无人机 ${droneId} 轨迹跳变 ${dist.toFixed(0)}m，已清空旧轨迹并重记`,
        );
        this._removeAllPositionSamples(drone);
        this._addTrailSample(drone, lng, lat, height);
        drone.hasTrailSample = true;
        this._refreshPath(drone);
        return;
      }
    }

    this._addTrailSample(drone, lng, lat, height);
    drone.hasTrailSample = true;
  },

  clearDroneTrajectory(droneId) {
    const drone = this.drones.get(droneId);
    if (!drone) return;

    this._removeAllPositionSamples(drone);

    if (drone.lastPosition?.lng != null && drone.lastPosition?.lat != null) {
      this._addTrailSample(
        drone,
        drone.lastPosition.lng,
        drone.lastPosition.lat,
        drone.lastPosition.height ?? DRONE_HEIGHT,
      );
      drone.hasTrailSample = true;
    } else {
      drone.hasTrailSample = false;
    }

    this._refreshPath(drone);
    console.log(`🧹 已清除无人机 ${droneId} 轨迹`);
  },

  updateDroneLabel(droneId, labelText) {
    const drone = this.drones.get(droneId);
    if (!drone?.entity?.label) return;
    drone.entity.label.text = labelText || droneId;
    drone.entity.label.fillColor = DRONE_LABEL_COLOR;
  },

  updateDroneLabelColor(droneId, isEscorting) {
    const drone = this.drones.get(droneId);
    if (!drone?.entity?.label) return;
    drone.entity.label.fillColor = isEscorting
      ? DRONE_LABEL_COLOR_ESCORTING
      : DRONE_LABEL_COLOR;
  },

  getAllDrones() {
    return Array.from(this.drones.keys());
  },

  removeDrone(droneId) {
    const drone = this.drones.get(droneId);
    if (!drone) return;
    mainViewer.entities.remove(drone.entity);
    this.drones.delete(droneId);
    console.log(`🗑️ 移除无人机实体: ${droneId}`);
  },

  clearAll() {
    this.drones.forEach((drone) => {
      mainViewer.entities.remove(drone.entity);
    });
    this.drones.clear();
    console.log("🗑️ 已清除所有测试无人机");
  },
};
// 定义姿态属性 (注意：这里需要指定类型为 Cesium.Quaternion)
let droneOrientationProp = new Cesium.SampledProperty(Cesium.Quaternion);
// 姿态属性设置外推
droneOrientationProp.forwardExtrapolationType = Cesium.ExtrapolationType.HOLD;
droneOrientationProp.backwardExtrapolationType = Cesium.ExtrapolationType.HOLD;
// 设置平滑插值，防止姿态跳动
droneOrientationProp.setInterpolationOptions({
  interpolationDegree: 2,
  interpolationAlgorithm: Cesium.HermitePolynomialApproximation,
});
// Record the point is first or not
let isFirstPoint = true;
// 当前持续跟随的目标 deviceId（车辆 / 警员 / 机器人，伴飞时保持居中）
let followedVehicleDeviceId = null;
/**
 * 待锁定的伴飞目标 deviceId。
 * 开始伴飞 / 沉浸伴飞时写入；lockToEscortTarget 成功则清空，实体未就绪则保留。
 * 由 tryApplyPendingEscortLock 在目标 MQTT 更新时重试；用户拖拽解除跟随时也会清空。
 */
let pendingEscortLockTargetId = null;
// 汽车的朝向
let lastValidOrientation = null;
const velocityOrientation = new Cesium.VelocityOrientationProperty(
  carPositionProp,
);
// 无人机的朝向
let lastValidDroneOrientation = null;
const droneVelocityOrientation = new Cesium.VelocityOrientationProperty(
  dronePositionProp,
);
// 固定延迟 0.5 秒，用于平滑过渡
const LEAD_TIME = 0.5;
// 记录真实时间戳（ms）
let lastDronePushTime = 0;
// 无人机点位推送最小间隔：100ms (即最高 10Hz)
const DRONE_MIN_INTERVAL = 100;

// 定义一个固定延迟缓冲区（秒）
// 0.2 ~ 0.5秒是最佳平衡点：既能平滑插值，又不会感到肉眼可见的延迟
const REALTIME_BUFFER = 0.3;

// 视图加载的完成度
const viewerLoadCount = ref(0);

const targetLayerVisibility = reactive({
  policeCar: true,
  officer: false,
  robot: false,
  shoulderLight: false,
});

// refs
const currentMode = ref("satellite");
const mapConfigForm = ref({
  showMapRoadNet: true,
});

const {
  ensureSatelliteLayer,
  ensureSatelliteMarkLayer,
  handleMapRoadNetVisible,
  switchMapMode,
} = useTiandituImageryLayers({
  getViewer: () => mainViewer,
  keyList: TIANDITU_CONFIG.keyList,
  maxLevel: MAP_CONFIG.maxLevel,
  getCurrentMode: () => currentMode.value,
  setCurrentMode: (mode) => {
    currentMode.value = mode;
  },
  getRoadNetVisible: () => mapConfigForm.value.showMapRoadNet,
});

const {
  waitForStableSize,
  resizeMapView,
  startRenderLoop,
  applyRenderSuspended,
} = useMapResizeRender({
  getViewer: () => mainViewer,
  isRenderSuspended: () => props.renderSuspended,
});
// const isConnected = ref(false);
// const msgList = ref([]);
const drone_id = DEVICE_CONFIG.droneId;
let initialDroneOsdFetchPending = false;

const setFollowedVehicleDeviceId = (deviceId) => {
  followedVehicleDeviceId = deviceId == null ? null : String(deviceId);
};

const {
  vehicleDisplayMode,
  isPitch2D,
  isLockMode,
  getVehicleViewFrom,
  applyEntityTrackViewFrom,
  toggleDisplayMode,
  toggleSceneMode,
  switchTrackedView,
  zoomIn,
  zoomOut,
  shouldRefreshFollowOnMqtt,
  followVehicleEntity,
  releaseVehicleFollow,
  toggleLockMode,
  initManualUnlock,
  cleanupManualUnlock,
} = useMapControls({
  getViewer: () => mainViewer,
  resolveLockedFollowEntity,
  resolveManualFollowTarget,
  getFollowedVehicleDeviceId: () => followedVehicleDeviceId,
  setFollowedVehicleDeviceId,
  clearPendingEscortLock: () => {
    pendingEscortLockTargetId = null;
  },
  onVehicleDisplayModeChange: patchAllVehicleDisplayGraphics,
  onMissingFollowTarget: () => ElMessage.warning("暂无可跟随的目标"),
});

const {
  collectOverlapPopupItems,
  resolveDeviceClickByScreenHit,
} = useMapDeviceHitTesting({
  getViewer: () => mainViewer,
  getDrones: () => deviceStore.drones,
  getTargets: () => deviceStore.targets,
  getDroneEntityKey,
  getDroneDeviceFromEntity,
  getVehicleDeviceIdFromEntity,
  resolveTargetMapEntry,
  resolveTargetType,
  isBoatTarget,
  isDroneOffline,
  droneTestManager,
  vehicleManager,
  officerManager,
  robotManager,
  shoulderLightManager,
  icons: {
    drone: dbWrjPng,
    boat: boatPng,
    officer: dbJyPng,
    robot: dtJqrPng,
    shoulderLight: dtJdPng,
    policeCar: dbJcPng,
  },
});

const {
  policeVehiclePopup,
  policeVehiclePopupStyle,
  overlapDevicePopup,
  overlapDevicePopupStyle,
  updatePolicePopupScreenPosition,
  attachPolicePopupTracker,
  closePoliceVehiclePopup,
  hideOverlapDevicePopup,
  showOverlapDevicePopup,
  updateOverlapPopupFromPointer,
  onOverlapPopupMouseEnter,
  onOverlapPopupMouseLeave,
  cleanupTargetPopups,
} = useMapTargetPopups({
  getViewer: () => mainViewer,
  resolveTargetMapPositionProp,
  collectOverlapPopupItems,
});

// 无人机姿态
const droneState = reactive({
  attitude_head: null,
  attitude_pitch: null,
  attitude_roll: null,
  gimbal_pitch: null,
  gimbal_roll: null,
  gimbal_yaw: null,
  zoom_factor: 1.0,
});
let isAttitudeValid = false;
let currentFovH = 62;
let currentFovV = 41.2;
let zoomManager;

const {
  coords,
  initCoordinateTracker,
  cleanupCoordinateTracker,
} = useMapCoordinateTracker();

const {
  applyDroneSelectionCircle,
  clearDroneSelectionCircle,
  syncActiveDroneSelectionCircle,
  isDroneSelected,
} = useDroneSelectionCircle({
  getViewer: () => mainViewer,
  getDrones: () => deviceStore.drones,
  getDroneEntityKey,
  droneTestManager,
});

const { flyToInitialDroneOverview } = useInitialDroneOverview({
  getViewer: () => mainViewer,
  getDrones: () => deviceStore.drones,
  isDroneOffline,
  mapDefaultRange: MAP_CONFIG.mapDefaultRange,
});

const getVehicleModelRotation = () =>
  new Cesium.CallbackProperty(() => {
    const hpr = new Cesium.HeadingPitchRoll(
      Cesium.Math.toRadians(180),
      0,
      0,
    );
    return Cesium.Quaternion.fromHeadingPitchRoll(hpr);
  }, false);

const getVehicleShapeGraphics = () => ({
  model: {
    uri: "/models/car.glb",
    minimumPixelSize: MAP_CONFIG.vehicleModelMinPixelSize,
    show: new Cesium.CallbackProperty(
      () => vehicleDisplayMode.value === "model",
      false,
    ),
    heightReference: Cesium.HeightReference.RELATIVE_TO_GROUND,
    nodeTransformations: {
      root: new Cesium.NodeTransformationProperty({
        rotation: getVehicleModelRotation(),
      }),
    },
  },
  point: {
    pixelSize: VEHICLE_POINT_PIXEL_SIZE,
    color: Cesium.Color.BLUE,
    outlineColor: Cesium.Color.WHITE,
    outlineWidth: 2,
    show: new Cesium.CallbackProperty(
      () => vehicleDisplayMode.value === "point",
      false,
    ),
    heightReference: Cesium.HeightReference.RELATIVE_TO_GROUND,
    disableDepthTestDistance: Number.POSITIVE_INFINITY,
  },
  viewFrom: getVehicleViewFrom(false),
});

const patchVehicleDisplayGraphics = (entity) => {
  if (!entity?.model) return;

  if (!(entity.model.show instanceof Cesium.CallbackProperty)) {
    entity.model.show = new Cesium.CallbackProperty(
      () => vehicleDisplayMode.value === "model",
      false,
    );
  }

  if (entity.ellipsoid) {
    entity.ellipsoid.show = false;
  }

  if (!entity.point) {
    entity.point = getVehicleShapeGraphics().point;
  } else {
    entity.point.pixelSize = VEHICLE_POINT_PIXEL_SIZE;
    entity.point.outlineWidth = 1;
  }

  applyEntityTrackViewFrom(entity);
};

function patchAllVehicleDisplayGraphics() {
  if (carEntity) {
    patchVehicleDisplayGraphics(carEntity);
  }
  vehicleManager.vehicles.forEach(({ entity }) => {
    patchVehicleDisplayGraphics(entity);
  });
  mainViewer?.scene?.requestRender?.();
}

const scheduleAfterFirstPaint = (callback) => {
  requestAnimationFrame(() => {
    const run = () => {
      if (!mainViewer || mainViewer.isDestroyed?.()) return;
      callback();
    };

    if ("requestIdleCallback" in window) {
      window.requestIdleCallback(run, { timeout: 1500 });
      return;
    }

    setTimeout(run, 0);
  });
};

let modelsPreloaded = false;
const preloadModels = () => {
  if (modelsPreloaded) return;
  modelsPreloaded = true;
  ["/models/car.glb", "/models/drone.glb"].forEach((url) => {
    fetch(url).catch(() => {});
  });
};
preloadModels();

const warmUpPicker = (viewer) => {
  try {
    viewer.scene.pick(new Cesium.Cartesian2(0, 0));
  } catch (_) {}
};

const warmUpMessageBox = () => {
  const el = document.createElement("div");
  el.style.cssText =
    "position:fixed;left:-9999px;top:-9999px;opacity:0;pointer-events:none";
  document.body.appendChild(el);
  ElMessageBox.alert("", "", {
    customClass: "warmup-hidden",
    showConfirmButton: false,
    showCancelButton: false,
    showClose: false,
  }).catch(() => {});
  setTimeout(() => {
    ElMessageBox.close();
    el.remove();
  }, 50);
};

const initDeferredViewerFeatures = (viewer) => {
  if (mapConfigForm.value.showMapRoadNet && currentMode.value === "satellite") {
    ensureSatelliteMarkLayer();
  }

  preloadModels();
  initScene(viewer);
  initManualUnlock(viewer);
  initCoordinateTracker(viewer);
  initVehicleClickHandler(viewer);

  warmUpPicker(viewer);
  if (!props.companion) {
    warmUpMessageBox();
  }
};

/**
 * @description: initialize cesium viewer by Tianditu
 * @return {*}
 */
const initViewer = () => {
  // initialize cesium Viewer
  mainViewer = new Cesium.Viewer(cesiumContainerRef.value, {
    resolutionScale: window.devicePixelRatio || 1,
    sceneMode: Cesium.SceneMode.SCENE3D,
    shouldAnimate: true,
    useDefaultRenderLoop: false,
    sceneModePicker: false,
    navigationHelpButton: false,
    geocoder: false,
    homeButton: false,
    baseLayerPicker: false,
    animation: false,
    timeline: false,
    fullscreenButton: false,
    infoBox: false,
    selectionIndicator: false,
    baseLayer: false,
    creditContainer: document.createElement("div"),
    contextOptions: {
      webgl: {
        alpha: true,
        depth: true,
        stencil: true,
        antialias: true,
        // 这里的配置有时在初始化参数中，有时需要手动在scene设置
      },
      msaaSamples: 4, 
    },
  });

  mainViewer.scene.logarithmicDepthBuffer = true;

  // 修复标注图标锯齿问题：开启 FXAA，改善 pin 类 billboard 缩放边缘
  if (mainViewer.scene.postProcessStages?.fxaa) {
    mainViewer.scene.postProcessStages.fxaa.enabled = true;
  }

  // 关闭大气/雾效，避免整体偏色（发紫/发蓝）。
  mainViewer.scene.skyAtmosphere.show = false;
  mainViewer.scene.fog.enabled = false;
  if (mainViewer.scene.skyBox) {
    mainViewer.scene.skyBox.show = false;
  }
  mainViewer.scene.backgroundColor =
    Cesium.Color.fromCssColorString(MAP_BASE_COLOR_HEX);

  mainViewer.clock.shouldAnimate = true; // 开启时间轴
  mainViewer.clock.clockRange = Cesium.ClockRange.CLAMPED; // 运行到终点后停下，而不是循环或停止动画

  viewerLoadCount.value++;

  // When you zoom in on the map or the tiles haven't loaded yet, change the background color.
  mainViewer.scene.globe.baseColor =
    Cesium.Color.fromCssColorString(MAP_BASE_COLOR_HEX);

  // hide default map
  mainViewer.imageryLayers.removeAll();

  // 首屏只加载影像底图，标注层/矢量层延后或按需加载。
  ensureSatelliteLayer();

  // 初始视角：destination 直接表示相机位置（高度 mapDefaultRange 米）
  mainViewer.camera.setView({
    destination: Cesium.Cartesian3.fromDegrees(
      DEFAULT_CENTER.lng,
      DEFAULT_CENTER.lat,
      MAP_CONFIG.mapDefaultRange,
    ),
    orientation: {
      heading: Cesium.Math.toRadians(0),
      pitch: Cesium.Math.toRadians(-90),
      roll: 0,
    },
  });

  // Global deceleration by half
  mainViewer.clock.multiplier = 0.5;

  // 锁定位置：禁止用户通过洗盘/拖拽改变位置，只能右键旋转视角
  mainViewer.scene.screenSpaceCameraController.enableTranslate = true; // 允许平移
  mainViewer.scene.screenSpaceCameraController.enableZoom = true; // 允许缩放(FOV)
  mainViewer.scene.screenSpaceCameraController.enableTilt = true; // 允许倾斜
  mainViewer.scene.screenSpaceCameraController.enableRotate = true; // 允许旋转

  // 开启深度测试，确保模型在地形上
  mainViewer.scene.globe.depthTestAgainstTerrain = true;

  scheduleAfterFirstPaint(() => initDeferredViewerFeatures(mainViewer));
};

/** 按 deviceId 从车辆 / 警员 / 机器人管理器解析地图实体 */
function resolveFollowTargetEntity(deviceId) {
  const id = String(deviceId || "").trim();
  if (!id) return null;

  const vehicle = vehicleManager.vehicles.get(id);
  if (vehicle?.entity) return { entity: vehicle.entity, deviceId: id };

  const officer = officerManager.officers.get(id);
  if (officer?.entity) return { entity: officer.entity, deviceId: id };

  const robot = robotManager.robots.get(id);
  if (robot?.entity) return { entity: robot.entity, deviceId: id };

  const shoulderLight = shoulderLightManager.shoulderLights.get(id);
  if (shoulderLight?.entity) return { entity: shoulderLight.entity, deviceId: id };

  return null;
}

/** 解析当前锁定跟随目标实体（车辆 / 警员 / 机器人） */
function resolveLockedFollowEntity() {
  const deviceId = String(followedVehicleDeviceId || "").trim();
  if (deviceId) {
    const resolved = resolveFollowTargetEntity(deviceId);
    if (resolved) return resolved;
  }
  const tracked = mainViewer?.trackedEntity;
  if (tracked) return { entity: tracked, deviceId: deviceId || null };
  return null;
}

/** 手动锁定模式：解析当前应跟随的目标（车辆 / 警员 / 机器人） */
function resolveManualFollowTarget() {
  const candidateIds = [
    vehicleManager.selectedDeviceId,
    followedVehicleDeviceId,
  ]
    .map((id) => String(id || "").trim())
    .filter(Boolean);

  for (const id of candidateIds) {
    const resolved = resolveFollowTargetEntity(id);
    if (resolved) return resolved;
  }

  const targetList = Array.isArray(deviceStore.targets) ? deviceStore.targets : [];
  for (const target of targetList) {
    const id = String(target?.id || "").trim();
    if (!id) continue;
    const resolved = resolveFollowTargetEntity(id);
    if (resolved) return resolved;
  }

  for (const id of officerManager.officers.keys()) {
    const resolved = resolveFollowTargetEntity(id);
    if (resolved) return resolved;
  }
  for (const id of robotManager.robots.keys()) {
    const resolved = resolveFollowTargetEntity(id);
    if (resolved) return resolved;
  }
  for (const id of shoulderLightManager.shoulderLights.keys()) {
    const resolved = resolveFollowTargetEntity(id);
    if (resolved) return resolved;
  }

  const firstVehicleId = vehicleManager.getAllVehicles()[0];
  if (firstVehicleId) {
    const resolved = resolveFollowTargetEntity(firstVehicleId);
    if (resolved) return resolved;
  }

  if (
    carEntity &&
    carEntity.position?.getValue?.(mainViewer?.clock?.currentTime)
  ) {
    return { entity: carEntity, deviceId: followedVehicleDeviceId };
  }

  return null;
}

/**
 * @description: Load all models (cars & drones)
 * @param {*} viewer
 * @return {*}
 */
const initScene = (viewer) => {
  carEntity = createDynamicVehicle(viewer);
  droneEntity = viewer.entities.add({
    // 设置可用时间范围为从 1970 年到 9999 年，确保无人机在任何时间都可见
    availability: new Cesium.TimeIntervalCollection([
      new Cesium.TimeInterval({
        start: Cesium.JulianDate.fromIso8601("1970-01-01T00:00:00Z"),
        stop: Cesium.JulianDate.fromIso8601("9999-12-31T23:59:59Z"),
      }),
    ]),
    position: dronePositionProp,
    orientation: droneOrientationProp,
    model: {
      uri: "/models/drone.glb",
      minimumPixelSize: 48,
      runAnimations: true,
    },
    path: {
      show: routeLayerVisible,
      width: 3,
      material: new Cesium.PolylineGlowMaterialProperty({
        glowPower: 0.2,
        taperPower: 0.7,
        color: Cesium.Color.GOLD,
      }),
      leadTime: 0,
      trailTime: 999999,
      resolution: 1,
    },
  });

  // addDJIZoomFrustum(mainViewer, droneEntity, 84);

  const companionRouteEntity = viewer.entities.add({
    polyline: {
      show: routeLayerVisible,
      positions: new Cesium.CallbackProperty(() => {
        const carPos = carPositionProp.getValue(viewer.clock.currentTime);
        const dronePos = dronePositionProp.getValue(viewer.clock.currentTime);
        if (carPos && dronePos) return [carPos, dronePos];
        return [];
      }, false),
      width: 1,
      material: new Cesium.PolylineDashMaterialProperty({
        color: Cesium.Color.WHITE.withAlpha(0.3),
        dashLength: 4,
      }),
    },
  });
  companionRouteEntities.push(companionRouteEntity);
};

const createDynamicVehicle = (viewer) => {
  return viewer.entities.add({
    availability: new Cesium.TimeIntervalCollection([
      new Cesium.TimeInterval({
        start: viewer.clock.startTime,
        stop: Cesium.JulianDate.fromIso8601("9999-12-31T23:59:59Z"),
      }),
    ]),
    position: carPositionProp,
    orientation: new Cesium.CallbackProperty((time, result) => {
      // Obtain the direction calculated based on the speed at the current moment
      const currentOrientation = velocityOrientation.getValue(time);

      if (Cesium.defined(currentOrientation)) {
        // If the current direction is valid (indicating movement), then record it and return it.
        lastValidOrientation = Cesium.Quaternion.clone(
          currentOrientation,
          lastValidOrientation,
        );
        return currentOrientation;
      } else {
        // If the direction is invalid (the car has stopped), then return to the last valid direction.
        return lastValidOrientation;
      }
    }, false),

    ...getVehicleShapeGraphics(),
    // cylinder: {
    //   length: 1.0, // 高度（厚度）1米
    //   topRadius: 1.0, // 半径 2米
    //   bottomRadius: 1.0,
    //   material: Cesium.Color.BLUE.withAlpha(0.8),
    //   outline: false,
    //   outlineColor: Cesium.Color.RED,
    //   show: new Cesium.CallbackProperty(() => vehicleDisplayMode.value === "point", false),
    //   heightReference: Cesium.HeightReference.RELATIVE_TO_GROUND,
    //   nodeTransformations: {
    //     root: new Cesium.NodeTransformationProperty({
    //       rotation: new Cesium.CallbackProperty(() => {
    //         const hpr = new Cesium.HeadingPitchRoll(Cesium.Math.toRadians(180), 0, 0);
    //         return Cesium.Quaternion.fromHeadingPitchRoll(hpr);
    //       }, false),
    //     }),
    //   },
    // },
    path: {
      show: routeLayerVisible,
      width: 10,
      material: new Cesium.PolylineGlowMaterialProperty({
        glowPower: 0.2,
        taperPower: 0.7,
        color: Cesium.Color.fromCssColorString("#00eeee"),
      }),
      leadTime: 0,
      trailTime: 999999,
    },
    viewFrom: getVehicleViewFrom(false),
  });
};

/**
 * 将大疆姿态转换为 Cesium 四元数
 */
const getDroneOrientation = (position, head, pitch, roll) => {
  const hpr = new Cesium.HeadingPitchRoll(
    Cesium.Math.toRadians(head),
    Cesium.Math.toRadians(pitch),
    Cesium.Math.toRadians(roll),
  );
  // 基于当前位置的东-北-上 (ENU) 坐标系计算四元数
  return Cesium.Transforms.headingPitchRollQuaternion(position, hpr);
};

/**
 * @description: 绘制大疆无人机的视场锥
 * @param {*} viewer
 * @param {*} droneEntity
 * @param {*} fovH 水平视场角度，指相机从最左侧到最右侧能看到的角度
 * @param {*} fovV 垂直视场角度，指相机从最上方到最下方能看到的角度
 * @return {*}
 */
let lastTime, cachedResult;
const addDJIZoomFrustum = (viewer, droneEntity, dfov = 84) => {
  const { hfov, vfov } = calcZoomFov(dfov, droneState?.zoom_factor ?? 1.0);
  console.log("变焦后的 H/V FOV", { hfov, vfov, droneState });

  const getCorners = (time) => {
    if (lastTime && Cesium.JulianDate.equals(lastTime, time))
      return cachedResult;
    // 获取机身的基础位置和姿态
    const position = droneEntity.position.getValue(time);
    const bodyOrientation = droneEntity.orientation.getValue(time);

    // 如果位置或姿态属性本身没有数据，或者状态位为 false
    if (
      !Cesium.defined(position) ||
      !Cesium.defined(bodyOrientation) ||
      !isAttitudeValid
    ) {
      return null;
    }

    // 检查四元数数值是否有效（防止 NaN 崩溃）
    if (isNaN(bodyOrientation.x) || isNaN(bodyOrientation.y)) {
      return null;
    }

    // --- 云台俯仰叠加逻辑 ---

    // 假设从 MQTT 获取到的云台俯仰角，如果没有，默认下看 -90 度
    // 注意：大疆云台 0度是水平，-90度是垂直向下
    const gimbalPitchValue = droneState?.gimbal_pitch ?? -90; // droneState.gimbal_pitch
    const gimbalPitchRad = Cesium.Math.toRadians(gimbalPitchValue);

    // 创建云台的旋转四元数 (围绕机身的本地 X 轴旋转)
    const gimbalQuaternion = Cesium.Quaternion.fromAxisAngle(
      Cesium.Cartesian3.UNIT_X,
      gimbalPitchRad,
      new Cesium.Quaternion(),
    );

    // 将【机身姿态】与【云台姿态】合并
    // 最终姿态 = 机身姿态 * 云台姿态
    const finalOrientation = Cesium.Quaternion.multiply(
      bodyOrientation,
      gimbalQuaternion,
      new Cesium.Quaternion(),
    );

    // 使用合并后的 finalOrientation 生成旋转矩阵
    const matrix = Cesium.Matrix3.fromQuaternion(finalOrientation);

    // --- 计算中心交点 (光轴) ---
    // 假设相机前向是 Y 轴 (0, 1, 0)
    const centerLocalDir = new Cesium.Cartesian3(0, 1, 0);
    const centerWorldDir = Cesium.Matrix3.multiplyByVector(
      matrix,
      centerLocalDir,
      new Cesium.Cartesian3(),
    );
    Cesium.Cartesian3.normalize(centerWorldDir, centerWorldDir);

    const centerRay = new Cesium.Ray(position, centerWorldDir);
    let centerIntersect = viewer.scene.globe.pick(centerRay, viewer.scene);

    if (centerIntersect) {
      // 同样做高度抬升，防止与地面闪烁
      const carto = Cesium.Cartographic.fromCartesian(centerIntersect);
      carto.height += 0.8; // 比底框线再高一点
      centerIntersect = Cesium.Cartographic.toCartesian(carto);
    } else {
      centerIntersect = Cesium.Ray.getPoint(centerRay, 500.0);
    }

    const tanH = Math.tan(hfov / 2);
    const tanV = Math.tan(vfov / 2);

    // 定义视场四个角的本地方向 (此时 localDirs 是相对于镜头中心的)
    const directions = [
      new Cesium.Cartesian3(-tanH, 1, tanV), // 左上
      new Cesium.Cartesian3(tanH, 1, tanV), // 右上
      new Cesium.Cartesian3(tanH, 1, -tanV), // 右下
      new Cesium.Cartesian3(-tanH, 1, -tanV), // 左下
    ];
    const corners = [];
    directions.forEach((dir) => {
      // 使用合并了云台旋转的矩阵进行转换
      const worldDir = Cesium.Matrix3.multiplyByVector(
        matrix,
        dir,
        new Cesium.Cartesian3(),
      );
      Cesium.Cartesian3.normalize(worldDir, worldDir);

      const ray = new Cesium.Ray(position, worldDir);
      let intersect = viewer.scene.globe.pick(ray, viewer.scene);

      if (intersect) {
        // --- 将交点稍微抬高一点 ---
        const carto = Cesium.Cartographic.fromCartesian(intersect);
        carto.height += 0.5; // 抬高0.5米，避开地面
        intersect = Cesium.Cartographic.toCartesian(carto);
      } else {
        intersect = Cesium.Ray.getPoint(ray, 1000.0);
      }

      // if (!intersect) {
      //   intersect = Cesium.Ray.getPoint(ray, 500.0);
      // }
      corners.push(intersect);
    });

    const result = { apex: position, corners, center: centerIntersect };

    lastTime = time;
    cachedResult = result;
    return result;
  };

  // 绘制 4 个侧面
  for (let i = 0; i < 4; i++) {
    viewer.entities.add({
      polygon: {
        hierarchy: new Cesium.CallbackProperty((time) => {
          const res = getCorners(time);
          if (!res || !res.apex || res.corners.length < 4) {
            // 返回一个空的对象，而不是 null，这样实体不会消失，只是暂时不画
            return new Cesium.PolygonHierarchy([]);
          }
          return new Cesium.PolygonHierarchy([
            res.apex,
            res.corners[i],
            res.corners[(i + 1) % 4],
          ]);
        }, false),
        material: Cesium.Color.CYAN.withAlpha(0.3),
        perPositionHeight: true,
        outline: false,
        outlineColor: Cesium.Color.CYAN,
        show: new Cesium.CallbackProperty(() => isAttitudeValid, false), // 双重保险
        // 解决被地形遮挡导致的闪烁
        classificationType: Cesium.ClassificationType.BOTH,
        // 如果还是闪烁严重，可以尝试强制置顶（慎用，会穿透所有建筑）
        // disableDepthTestDistance: Number.POSITIVE_INFINITY
      },
    });
  }

  // 绘制底面 (Base Face)
  viewer.entities.add({
    name: `Frustum_Base`,
    polygon: {
      hierarchy: new Cesium.CallbackProperty((time) => {
        const res = getCorners(time);
        if (!res) return new Cesium.PolygonHierarchy([]);
        // 底面四边形：连接所有地面交点
        return new Cesium.PolygonHierarchy(res.corners);
      }, false),
      material: Cesium.Color.YELLOW.withAlpha(0.5),
      // material: new Cesium.StripeMaterialProperty({
      //   evenColor: Cesium.Color.YELLOW.withAlpha(0.4),
      //   oddColor: Cesium.Color.YELLOW.withAlpha(0.1),
      //   repeat: 10,
      //   orientation: Cesium.StripeOrientation.VERTICAL,
      // }),
      perPositionHeight: true,
      outline: false,
      outlineColor: Cesium.Color.YELLOW,
      outlineWidth: 2,
      // 确保底面在最上层显示
      zIndex: 10,
    },
  });

  // 绘制 4 条侧棱线 (Apex 到 Corners)
  for (let i = 0; i < 4; i++) {
    viewer.entities.add({
      name: `Frustum_Line_Slant_${i}`,
      polyline: {
        positions: new Cesium.CallbackProperty((time) => {
          const res = getCorners(time);
          if (!res) return [];
          return [res.apex, res.corners[i]];
        }, false),
        width: 2,
        // 使用发光材质，更美观
        material: new Cesium.PolylineGlowMaterialProperty({
          glowPower: 0.1,
          color: Cesium.Color.CYAN.withAlpha(0.8),
        }),
        disableDepthTestDistance: Number.POSITIVE_INFINITY, // 确保线条不被模型或地形遮挡
      },
    });
  }

  // 绘制底面边框线 (4 个地面点连成圈)
  viewer.entities.add({
    name: `Frustum_Line_Base_Outline`,
    polyline: {
      positions: new Cesium.CallbackProperty((time) => {
        const res = getCorners(time);
        if (!res) return [];
        // 闭合路径：p1 -> p2 -> p3 -> p4 -> p1
        return [...res.corners, res.corners[0]];
      }, false),
      width: 3,
      material: Cesium.Color.YELLOW,
      disableDepthTestDistance: Number.POSITIVE_INFINITY,
    },
  });

  // 绘制中心线 (Apex 到 Center)
  viewer.entities.add({
    name: "Frustum_Center_Line",
    polyline: {
      positions: new Cesium.CallbackProperty((time) => {
        const data = getCorners(time);
        if (!data) return [];
        return [data.apex, data.center];
      }, false),
      width: 2,
      // 使用虚线材质，增加科技感且不遮挡目标
      material: new Cesium.PolylineDashMaterialProperty({
        color: Cesium.Color.RED.withAlpha(0.8),
        dashLength: 12,
        gapColor: Cesium.Color.TRANSPARENT,
      }),
      disableDepthTestDistance: Number.POSITIVE_INFINITY,
    },
  });

  // 在中心交点处画一个小的十字准星或圆点
  viewer.entities.add({
    name: "Frustum_Center_Point",
    position: new Cesium.CallbackProperty((time) => {
      const data = getCorners(time);
      return data ? data.center : undefined;
    }, false),
    point: {
      pixelSize: 6,
      color: Cesium.Color.RED,
      outlineColor: Cesium.Color.WHITE,
      outlineWidth: 2,
      disableDepthTestDistance: Number.POSITIVE_INFINITY,
    },
  });
};

/**
 * @description: update the position of the entity with time
 * @param {*} entityProp
 * @param {*} lng
 * @param {*} lat
 * @param {*} height
 * @return {*}
 */
const updateEntityPosition = (entityProp, lng, lat, height) => {
  // 获取当前 Cesium 运行的绝对时间
  const now = mainViewer.clock.currentTime;

  // 核心改进：直接将目标时间定为“现在 + 0.5秒”
  // 这样无论消息频率多高，点永远都在“现在”的 0.5s 后，不会产生累积排队
  const arrivalTime = Cesium.JulianDate.addSeconds(
    now,
    LEAD_TIME,
    new Cesium.JulianDate(),
  );
  const position = Cesium.Cartesian3.fromDegrees(lng, lat, height);

  // 推入采样
  entityProp.addSample(arrivalTime, position);

  if (isFirstPoint) {
    mainViewer.trackedEntity = carEntity;
    isLockMode.value = true;
    switchTrackedView(mainViewer, carEntity, isPitch2D.value);
    // 原逻辑：测试路径首个点位时自动切 3D
    // switchTrackedView(mainViewer, carEntity, false);
    // isPitch2D.value = false;
    isFirstPoint = false;
  }

  // 动态调整时钟终点，确保不会超出范围
  if (Cesium.JulianDate.compare(arrivalTime, mainViewer.clock.stopTime) > 0) {
    mainViewer.clock.stopTime = Cesium.JulianDate.addSeconds(
      arrivalTime,
      2,
      new Cesium.JulianDate(),
    );
  }
};

/**
 * 无人机独立实时更新
 * 不计算距离，不计算速度，只根据接收时刻点位进行投影
 */
const updateDroneRealtime = (lng, lat, height) => {
  if (!mainViewer || !dronePositionProp) return;

  // 获取当前 Cesium 时钟显示的“现在”时间
  const now = mainViewer.clock.currentTime;

  // 直接将目标时间设为“当前时间 + 固定的微小延迟”
  // 无论汽车在哪，无论上一点在哪，无人机都会立即向这个新点滑动
  const arrivalTime = Cesium.JulianDate.addSeconds(
    now,
    REALTIME_BUFFER,
    new Cesium.JulianDate(),
  );

  const position = Cesium.Cartesian3.fromDegrees(lng, lat, height);

  // 推入采样点
  dronePositionProp.addSample(arrivalTime, position);

  // 更新姿态（计算四元数并 addSample 到一个 SampledProperty 里）
  const orientation = getDroneOrientation(
    position,
    droneState.attitude_head,
    droneState.attitude_pitch,
    droneState.attitude_roll,
  );
  droneOrientationProp.addSample(arrivalTime, orientation);

  // 保持时钟步调（防止时间轴停止）
  if (Cesium.JulianDate.compare(arrivalTime, mainViewer.clock.stopTime) > 0) {
    mainViewer.clock.stopTime = Cesium.JulianDate.addSeconds(
      arrivalTime,
      5,
      new Cesium.JulianDate(),
    );
  }
};

/**
 * @description: 初始化地图目标点击事件（警车 / 警员 / 机器人）
 * @param {*} viewer
 * @return {*}
 */
const initVehicleClickHandler = (viewer) => {
  // 清除之前的处理器
  if (vehicleClickHandler) {
    vehicleClickHandler.destroy();
  }

  vehicleClickHandler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);

  // 处理鼠标点击事件
  vehicleClickHandler.setInputAction((click) => {
    const overlapItems = collectOverlapPopupItems(click.position);
    if (overlapItems.length >= 2) {
      showOverlapDevicePopup(click.position, overlapItems);
      return;
    }
    hideOverlapDevicePopup();

    // 拾取点击的对象；模型空隙等 pick 未命中时，用屏幕热区兜底
    const pickedObject = viewer.scene.pick(click.position);

    if (Cesium.defined(pickedObject) && pickedObject.id) {
      const entity = pickedObject.id;

      const drone = getDroneDeviceFromEntity(entity);
      if (drone) {
        handleDroneSelect(drone);
        return;
      }

      const deviceId = getVehicleDeviceIdFromEntity(entity);
      const targetEntry = deviceId ? resolveTargetMapEntry(deviceId) : null;
      if (targetEntry) {
        handleTargetSelectById(deviceId);
        return;
      }
    }

    if (handleMapDeviceScreenHit(click.position)) {
      return;
    }

    clearTargetSelection();
    closePoliceVehiclePopup();
  }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

  vehicleClickHandler.setInputAction((movement) => {
    updateOverlapPopupFromPointer(movement?.endPosition);
  }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
};

/**
 * @description: 测试目标详情浮层（锚定在目标旁）
 */
const showTestVehicleDialog = (deviceId, position) => {
  const resolvedPosition = position || resolveTargetDisplayPosition(deviceId);
  if (!resolvedPosition) return;

  const policeData = TEST_POLICE_VEHICLES.find((v) => v.id === deviceId);

  policeVehiclePopup.deviceId = deviceId;
  policeVehiclePopup.vehicleName = policeData?.name || deviceId;
  policeVehiclePopup.targetTypeLabel = "警车";
  policeVehiclePopup.alertInfo = policeData?.description || "暂无描述";
  policeVehiclePopup.coordText = `${resolvedPosition.longitude.toFixed(6)}, ${resolvedPosition.latitude.toFixed(6)}`;
  policeVehiclePopup.drones = [];
  policeVehiclePopup.selectedDroneId = "";
  policeVehiclePopup.visible = true;

  updatePolicePopupScreenPosition();
  attachPolicePopupTracker();
  loadSuggestedDronesForPopup(deviceId, resolvedPosition);
};

/**
 * @description: 接口目标详情浮层（警车 / 警员 / 机器人，锚定在目标旁）
 */
const showApiVehiclePopup = async (deviceId, position) => {
  const canonicalTargetId = resolveCanonicalTargetId(deviceId) || String(deviceId || "").trim();
  const resolvedPosition = position || resolveTargetDisplayPosition(canonicalTargetId);
  if (!resolvedPosition) return;

  const vehicleData =
    findTargetByMqttKey(deviceId) ||
    (Array.isArray(deviceStore.targets) ? deviceStore.targets : []).find(
      (v) => String(v.id) === String(canonicalTargetId),
    );
  if (!(await ensureTargetBindAllowed(resolveVehicleTargetSn(vehicleData)))) return;

  policeVehiclePopup.deviceId = canonicalTargetId;
  policeVehiclePopup.vehicleName = vehicleData?.name || canonicalTargetId;
  policeVehiclePopup.targetTypeLabel = getTargetTypeLabel(vehicleData);
  policeVehiclePopup.alertInfo =
    String(vehicleData?.raw?.description || "").trim() || "暂无描述";
  policeVehiclePopup.coordText = `${resolvedPosition.longitude.toFixed(6)}, ${resolvedPosition.latitude.toFixed(6)}`;
  policeVehiclePopup.drones = [];
  policeVehiclePopup.selectedDroneId = "";
  policeVehiclePopup.visible = true;

  updatePolicePopupScreenPosition();
  attachPolicePopupTracker();
  loadSuggestedDronesForPopup(canonicalTargetId, resolvedPosition);
};

/**
 * @description: 清理车辆点击事件处理器
 * @return {*}
 */
const cleanupVehicleClickHandler = () => {
  if (vehicleClickHandler) {
    vehicleClickHandler.destroy();
    vehicleClickHandler = null;
  }
};

// ========== 测试数据设置 ==========
// TEST_POLICE_VEHICLES 从 @/config/test-devices.js 统一导入

// 伴飞跟踪定时器
const escortTimers = new Map();

/**
 * 锁定镜头到伴飞目标（车辆 / 警员 / 机器人），以最新一次伴飞为准。
 * @returns {boolean} 地图上已有对应实体并完成跟随时为 true，并清空 pendingEscortLockTargetId；否则 false 且保留 pending 供后续重试。
 */
function lockToEscortTarget(targetId) {
  if (!mainViewer || mainViewer.isDestroyed?.()) return false;

  const id = String(targetId || "").trim();
  if (!id) return false;

  const resolved = resolveFollowTargetEntity(id);
  if (resolved?.entity) {
    // 原逻辑：伴飞锁定目标时自动切 3D
    followVehicleEntity(resolved.entity, id);
    pendingEscortLockTargetId = null;
    return true;
  }
  return false;
}

/**
 * 延迟锁车重试：目标实体尚未就绪时 pending 会保留，待该目标 MQTT 上报后再调用 lockToEscortTarget。
 * 若已成功锁定（pending 已清空）或本次更新的是其他设备，则直接返回、不重复锁定。
 */
function tryApplyPendingEscortLock(deviceId) {
  const pending = String(pendingEscortLockTargetId || "").trim();
  if (!pending) return;
  if (deviceId && String(deviceId) !== pending) return;
  lockToEscortTarget(pending);
}

function lockEscortTargetOnImmersive(targetId) {
  const id = String(targetId || "").trim();
  if (!id) return false;

  if (isLockMode.value && String(followedVehicleDeviceId || "") === id) {
    return true;
  }

  // 与开始伴飞相同：先记 pending，实体未就绪时由 tryApplyPendingEscortLock 补锁
  pendingEscortLockTargetId = id;
  const ok = lockToEscortTarget(id);
  if (!ok) {
    ElMessage.warning("伴飞目标尚未就绪，将在位置更新后自动锁定");
  }
  return ok;
}

/**
 * @description: 锁定到指定目标（车辆 / 警员 / 机器人）
 */
const lockToTarget = (deviceId) => {
  const id = String(deviceId || "").trim();
  if (!id) {
    ElMessage.warning("未找到目标");
    return;
  }
  if (lockToEscortTarget(id)) {
    console.log(`🔒 已锁定到目标: ${id}`);
    ElMessage.success(`已锁定到目标 ${id}`);
  } else {
    console.warn(`⚠️ 未找到目标: ${id}`);
    ElMessage.warning(`未找到目标 ${id}`);
  }
};

const { showAlarmDialog } = useAlarmEscortDialog({
  ensureTargetBindAllowed,
  resolveCanonicalTargetId,
  findTargetByMqttKey,
  getTargets: () => deviceStore.targets,
  getTargetTypeLabel,
  buildSuggestDronesQuery,
  getReadySuggestedDrones,
  mapSuggestedDronesForSelect,
  isImmersiveFlight: () => props.immersiveFlight,
  applyEscortFollowAction,
  warn: (...args) => console.warn(...args),
});

/**
 * @description: 处理 carBox 主题车辆消息（MQTT 与本地模拟共用）
 */
const handleCarBoxMessage = (topic, data) => {
  // console.log("🚗 收到车辆消息:", topic, data);
  if (!mainViewer || mainViewer.isDestroyed?.()) {
    ElMessage.warning("地图未就绪");
    return;
  }

  if (isEmpty(data)) return;

  const topicParts = topic.split("/");
  const sn = String(topicParts[1] || data.deviceId || "").trim();
  if (!sn) {
    console.warn("⚠️ 无法从主题中提取设备号:", topic);
    return;
  }
  // 仅响应接口目标列表中存在的设备，按 SN / 终端号匹配
  const target = findTargetBySn(sn);
  if (!target?.id) return;

  const mapDeviceId = String(target.id);
  if (sn) {
    target.mqttSn = sn;
    vehicleManager.removeVehicle(sn);
  }

  const { alarmFlag, terminalPhone } = data;
  const latitude = toFiniteNumber(data.latitude);
  const longitude = toFiniteNumber(data.longitude);

  if (Number.isFinite(latitude) && Number.isFinite(longitude) && (latitude !== 0 || longitude !== 0)) {
    target.lat = latitude;
    target.lng = longitude;
    const label = target.name || mapDeviceId;
    const targetType = resolveTargetType(target);

    if (targetType === 2) {
      vehicleManager.removeVehicle(mapDeviceId);
      robotManager.removeRobot(mapDeviceId);
      shoulderLightManager.removeShoulderLight(mapDeviceId);
      officerManager.createOfficer(mainViewer, mapDeviceId, label);
      officerManager.updateOfficerLabel(mapDeviceId, label);
      officerManager.updateOfficerPosition(mapDeviceId, longitude, latitude, 0);
    } else if (targetType === 3) {
      vehicleManager.removeVehicle(mapDeviceId);
      officerManager.removeOfficer(mapDeviceId);
      shoulderLightManager.removeShoulderLight(mapDeviceId);
      robotManager.createRobot(mainViewer, mapDeviceId, label);
      robotManager.updateRobotLabel(mapDeviceId, label);
      robotManager.updateRobotPosition(mapDeviceId, longitude, latitude, 0);
    } else if (targetType === 6) {
      vehicleManager.removeVehicle(mapDeviceId);
      officerManager.removeOfficer(mapDeviceId);
      robotManager.removeRobot(mapDeviceId);
      shoulderLightManager.createShoulderLight(mainViewer, mapDeviceId, label);
      shoulderLightManager.updateShoulderLightLabel(mapDeviceId, label);
      shoulderLightManager.updateShoulderLightPosition(mapDeviceId, longitude, latitude, 0);
    } else {
      officerManager.removeOfficer(mapDeviceId);
      robotManager.removeRobot(mapDeviceId);
      shoulderLightManager.removeShoulderLight(mapDeviceId);
      vehicleManager.createVehicle(mainViewer, mapDeviceId, label, {
        billboardImage: isBoatTarget(target) ? boatPng : "",
      });
      vehicleManager.updateVehicleLabel(mapDeviceId, label);
      vehicleManager.updateVehiclePosition(mapDeviceId, longitude, latitude, 0);
    }

    if (shouldRefreshFollowOnMqtt(mapDeviceId)) {
      const locked = resolveFollowTargetEntity(mapDeviceId);
      if (locked?.entity) {
        followVehicleEntity(locked.entity, mapDeviceId, { resetViewFrom: false });
      }
    }

    // 伴飞待锁目标：实体刚创建或位置更新时尝试补锁
    tryApplyPendingEscortLock(mapDeviceId);
  }

  if (alarmFlag && alarmFlag !== 0) {
    void showAlarmDialog(String(target.id), { longitude, latitude }, terminalPhone);
  }

  systemStore.addCarMessage({ ...data, deviceId: mapDeviceId });
};

/**
 * 将 store 中接口设备（targets / drones）同步到地图实体
 */
/** 上一轮同步时处于伴飞中的无人机 entityKey 集合，用于检测就绪→伴飞中的状态跃迁 */
const prevEscortingDroneKeys = new Set();

function syncStoreDevicesToMap() {
  if (!mainViewer || mainViewer.isDestroyed?.()) return;

  const targetList = Array.isArray(deviceStore.targets)
    ? deviceStore.targets
    : [];
  const activeOfficerIds = new Set();
  const activeRobotIds = new Set();
  const activeShoulderLightIds = new Set();
  targetList.forEach((target) => {
    if (!target?.id) return;
    const lng = Number(target.lng);
    const lat = Number(target.lat);
    if (!Number.isFinite(lng) || !Number.isFinite(lat) || (lng === 0 && lat === 0)) return;
    const id = String(target.id);
    const label = String(target.name || target.id || "目标");
    const targetType = Number(target.type);
    if (targetType === 2) {
      activeOfficerIds.add(id);
      vehicleManager.removeVehicle(id);
      robotManager.removeRobot(id);
      shoulderLightManager.removeShoulderLight(id);
      officerManager.createOfficer(mainViewer, id, label);
      officerManager.updateOfficerLabel(id, label);
      officerManager.updateOfficerPosition(id, lng, lat, 0);
      const officer = officerManager.officers.get(id);
      if (officer?.entity) officer.entity.show = targetLayerVisibility.officer;
      return;
    }

    if (targetType === 3) {
      activeRobotIds.add(id);
      vehicleManager.removeVehicle(id);
      officerManager.removeOfficer(id);
      shoulderLightManager.removeShoulderLight(id);
      robotManager.createRobot(mainViewer, id, label);
      robotManager.updateRobotLabel(id, label);
      robotManager.updateRobotPosition(id, lng, lat, 0);
      const robot = robotManager.robots.get(id);
      if (robot?.entity) robot.entity.show = targetLayerVisibility.robot;
      return;
    }

    if (targetType === 6) {
      activeShoulderLightIds.add(id);
      vehicleManager.removeVehicle(id);
      officerManager.removeOfficer(id);
      robotManager.removeRobot(id);
      shoulderLightManager.createShoulderLight(mainViewer, id, label);
      shoulderLightManager.updateShoulderLightLabel(id, label);
      shoulderLightManager.updateShoulderLightPosition(id, lng, lat, 0);
      const shoulderLight = shoulderLightManager.shoulderLights.get(id);
      if (shoulderLight?.entity) shoulderLight.entity.show = targetLayerVisibility.shoulderLight;
      return;
    }

    if (targetType === 1 || targetType === 4 || !Number.isFinite(targetType)) {
      officerManager.removeOfficer(id);
      robotManager.removeRobot(id);
      shoulderLightManager.removeShoulderLight(id);
      vehicleManager.createVehicle(mainViewer, id, label, {
        billboardImage: isBoatTarget(target) ? boatPng : "",
      });
      vehicleManager.updateVehicleLabel(id, label);
      vehicleManager.updateVehiclePosition(id, lng, lat, 0);
      const vehicle = vehicleManager.vehicles.get(id);
      if (vehicle?.entity) vehicle.entity.show = targetLayerVisibility.policeCar;
    }
  });

  Array.from(officerManager.officers.keys()).forEach((id) => {
    if (!activeOfficerIds.has(id)) {
      officerManager.removeOfficer(id);
    }
  });

  Array.from(robotManager.robots.keys()).forEach((id) => {
    if (!activeRobotIds.has(id)) {
      robotManager.removeRobot(id);
    }
  });

  Array.from(shoulderLightManager.shoulderLights.keys()).forEach((id) => {
    if (!activeShoulderLightIds.has(id)) {
      shoulderLightManager.removeShoulderLight(id);
    }
  });

  const droneList = Array.isArray(deviceStore.drones) ? deviceStore.drones : [];
  const activeDroneKeys = new Set();
  const currentEscortingKeys = new Set();
  droneList.forEach((drone) => {
    if (isDroneOffline(drone)) return;
    const key = getDroneEntityKey(drone);
    if (key) {
      activeDroneKeys.add(key);
      if (drone.isEscorting) {
        currentEscortingKeys.add(key);
      }
    }
  });

  // 检测就绪→伴飞中的状态跃迁，清除旧轨迹
  currentEscortingKeys.forEach((key) => {
    if (!prevEscortingDroneKeys.has(key)) {
      droneTestManager.clearDroneTrajectory(key);
    }
  });
  prevEscortingDroneKeys.clear();
  currentEscortingKeys.forEach((key) => prevEscortingDroneKeys.add(key));

  droneList.forEach((drone) => {
    if (isDroneOffline(drone)) return;
    const entityKey = getDroneEntityKey(drone);
    if (!entityKey) return;
    const lng = Number(drone.lng);
    const lat = Number(drone.lat);
    if (!Number.isFinite(lng) || !Number.isFinite(lat) || (lng === 0 && lat === 0)) return;
    const label = String(drone.name || drone.id || drone.sn || "无人机");
    const height = Number(drone.height);
    const resolvedHeight = Number.isFinite(height) ? height : DRONE_HEIGHT;
    droneTestManager.createDrone(
      mainViewer,
      entityKey,
      lng,
      lat,
      resolvedHeight,
      label,
    );
    droneTestManager.updateDroneLabel(entityKey, label);
    droneTestManager.updateDroneLabelColor(entityKey, drone.isEscorting);
    if (!drone._mqttUpdated) {
      droneTestManager.updateDronePosition(entityKey, lng, lat, resolvedHeight);
    }
  });

  // 清理已从 store 移除的无人机实体
  const orphanIds = [];
  droneTestManager.drones.forEach((_drone, droneId) => {
    if (!activeDroneKeys.has(droneId)) {
      orphanIds.push(droneId);
    }
  });
  orphanIds.forEach((id) => {
    droneTestManager.removeDrone(id);
    if (isDroneSelected(id)) {
      clearDroneSelectionCircle();
    }
  });

  if (props.activeEscortDroneId) {
    syncEscortTargetHighlight(props.activeEscortDroneId);
  }

  // 仅在首屏时，根据 droneList 的经纬度自动框选无人机到一屏
  flyToInitialDroneOverview();

  refreshImmersiveMapFocus();
}

function subscribeVehicleLocationTopics() {
  mqttService.subscribe("carBox/+/location", (actualTopic, data) => {
    handleCarBoxMessage(actualTopic, data);
  });
}

/**
 * @description: Initialize MQTT connection
 * @return {*}
 */
const initialMqttConnect = async () => {
  await ensureDroneOsdMqtt();
  subscribeVehicleLocationTopics();
  subscribeInitialDroneOsdTopics();
};

const {
  triggerLockdown: runLockdown,
  ensureCheckpointLayer,
  setCheckpointVisibility,
  clearLockdownMarkers,
  lockdownEntities,
} = useLockdown({
  getViewer: () => mainViewer,
});

const { toggleLayerVisibility } = useMapLayerVisibility({
  getViewer: () => mainViewer,
  droneTestManager,
  vehicleManager,
  officerManager,
  robotManager,
  shoulderLightManager,
  getCarEntity: () => carEntity,
  getDroneEntity: () => droneEntity,
  getCompanionRouteEntities: () => companionRouteEntities,
  setRouteLayerVisible: (active) => {
    routeLayerVisible = active;
  },
  targetLayerVisibility,
  ensureCheckpointLayer,
  setCheckpointVisibility,
  notify: {
    error: (message) => ElMessage.error(message),
    warning: (message) => ElMessage.warning(message),
    success: (message) => ElMessage.success(message),
  },
});

const {
  setImmersiveMapFocus,
  refreshImmersiveMapFocus,
} = useImmersiveMapFocus({
  getViewer: () => mainViewer,
  getDrones: () => deviceStore.drones,
  getDroneEntityKey,
  droneTestManager,
  vehicleManager,
  officerManager,
  robotManager,
  shoulderLightManager,
  getCarEntity: () => carEntity,
  getDroneEntity: () => droneEntity,
  getLegacyDroneId: () => drone_id,
  getLockdownEntities: () => lockdownEntities,
  getCompanionRouteEntities: () => companionRouteEntities,
  getFlightPlanPolygonEntities: () => flightPlanPolygonEntities,
  getRouteLayerVisible: () => routeLayerVisible,
  targetLayerVisibility,
});

const triggerLockdown = async () => {
  const result = await runLockdown();
  if (!result.ok) {
    ElMessage.error("获取封控点失败");
    return result;
  }
  if (!result.hasPoints) {
    ElMessage.warning("暂无封控点");
    return result;
  }
  return result;
};

const recallDrone = async (device) => {
  if (!device?.id) return Promise.resolve(false);
  try {
    await ElMessageBox.confirm(
      `确定结束「${device.name || device.id || "该无人机"}」的伴飞任务？`,
      "结束伴飞确认",
      {
        confirmButtonText: "结束伴飞",
        cancelButtonText: "取消",
        type: "warning",
      },
    );
  } catch {
    return false;
  }
  const timer = escortTimers.get(device.id);
  if (timer) {
    clearInterval(timer);
    escortTimers.delete(device.id);
  }
  const targetId = resolveEscortTargetId(device) || policeVehiclePopup.deviceId || "";
  const droneId = device?.id || "";
  const ok = await submitStopFollow(targetId, droneId);
  if (ok) {
    deviceStore.setDroneStandby(device.id);
  }
  return ok;
};

defineExpose({
  triggerLockdown,
  recallDrone,
  toggleLayerVisibility,
  lockEscortTargetOnImmersive,
  setImmersiveMapFocus,
  clearDroneSelectionCircle,
  focusDrone,
  resizeMapView,
});

watch(
  () => props.activeEscortDroneId,
  (droneId) => {
    syncEscortTargetHighlight(droneId);
    syncActiveDroneSelectionCircle(droneId);
  },
);

watch(
  () => props.immersiveFlight,
  () => {
    if (props.activeEscortDroneId) {
      syncEscortTargetHighlight(props.activeEscortDroneId);
    }
  },
);

watch(
  () => {
    const droneId = String(props.activeEscortDroneId || "").trim();
    if (!droneId || !escortTargetHighlight.targetId) return "";
    const drone = deviceStore.drones.find((d) => String(d?.id || "") === droneId);
    return drone?.isEscorting ? resolveEscortTargetId(drone) : "";
  },
  (targetId) => {
    if (!props.activeEscortDroneId || !targetId) return;
    syncEscortTargetHighlight(props.activeEscortDroneId);
  },
);

watch(
  () => viewerLoadCount.value,
  (newVal) => {
    if (newVal >= 1 && mainViewer && !mainViewer.isDestroyed?.()) {
      syncFlightPlanPolygon();
    }
  },
);

watch(
  [() => viewerLoadCount.value, () => deviceStore.targets, () => deviceStore.drones],
  ([loadCount]) => {
    if (loadCount >= 1) {
      syncStoreDevicesToMap();
    }
  },
  { deep: true, immediate: true },
);

onMounted(async () => {
  try {
    await waitForStableSize(cesiumContainerRef.value);
    initViewer();
    resizeMapView();
    startRenderLoop();
  } finally {
    isLoading.value = false;
  }
  if (!props.companion) {
    // 地图首屏优先，MQTT 连接放到 Viewer 初始化之后再启动。
    setTimeout(() => {
      initialMqttConnect();
    }, 0);
  }
});

watch(
  () => props.renderSuspended,
  (suspended) => {
    applyRenderSuspended(suspended);
  },
);

onUnmounted(() => {
  syncEscortTargetHighlight("");
  cleanupTargetPopups();
  if (!props.companion) {
    mqttService.unsubscribe("carBox/+/location");
    subscribeEscortDroneOsd._subscribed = false;
  }
  officerManager.clearAll();
  robotManager.clearAll();
  shoulderLightManager.clearAll();
  clearLockdownMarkers();
  clearDroneSelectionCircle();
  selectedTargetDeviceId = null;
  vehicleManager.selectedDeviceId = null;
  if (mainViewer) {
    mainViewer.destroy();
    mainViewer = null;
  }
  cleanupCoordinateTracker();
  cleanupManualUnlock();
  // 清理车辆点击事件处理器
  cleanupVehicleClickHandler();
  systemStore.clearCarMessageList();
  systemStore.clearDroneMessageList();
});
</script>

<style lang="scss" scoped>
.map-container,
.cesium-container {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

:deep(.cesium-viewer-bottom) {
  display: none;
}

</style>
<style lang="scss">
.alarm-dialog--immersive {
  .el-message-box__btns {
    justify-content: flex-end;
  }

  .el-message-box__btns .el-button--primary {
    display: none;
  }
}

.alarm-dialog__immersive-btns {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  flex-wrap: wrap;
}

.alarm-dialog__btn {
  min-width: 88px;
  height: 32px;
  padding: 0 14px;
  border-radius: 4px;
  border: 1px solid transparent;
  font-size: 14px;
  cursor: pointer;
  color: #fff;
}

.alarm-dialog__btn--primary {
  background: #409eff;
  border-color: #409eff;
}

.alarm-dialog__btn--jump {
  background: #e6a23c;
  border-color: #e6a23c;
}

.alarm-dialog__btn--jump:hover {
  background: #ebb563;
  border-color: #ebb563;
}
</style>
