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
    <div id="cesiumContainer"></div>
    <!-- 加载遮罩 -->
    <div v-if="isLoading" class="map-loading-overlay">
      <div class="map-loading-spinner"></div>
      <span class="map-loading-text">地图加载中...</span>
    </div>
    <!-- map controls -->
    <div class="custom-controls">
      <!-- <el-tooltip effect="dark" content="一键清除" placement="left">
        <button @click="clearRunningRoute">
          <RiEraserLine size="18px" color="#4d4d4d" />
        </button>
      </el-tooltip>
      <el-tooltip effect="dark" content="发送消息" placement="left">
        <button @click="startPublishMessage">
          <RiSendPlaneFill size="18px" color="#4d4d4d" />
        </button>
      </el-tooltip> -->
      <el-tooltip
        effect="dark"
        :content="isPitch2D ? '切换为3D地图' : '切换为2D地图'"
        placement="left"
      >
        <button @click="toggleSceneMode">
          {{ isPitch2D ? "3D" : "2D" }}
        </button>
      </el-tooltip>
      <!-- <el-tooltip
        effect="dark"
        :content="isAllowAddLocation ? '关闭地图选点' : '允许地图选点'"
        placement="left"
      >
        <button @click="toggleAddLocation">
          <LocationAdd24Filled
            size="18px"
            color="#4d4d4d"
            v-if="isAllowAddLocation"
          />
          <LocationOff48Filled size="18px" color="#4d4d4d" v-else />
        </button>
      </el-tooltip> -->
      <el-tooltip
        effect="dark"
        :content="vehicleDisplayMode === 'model' ? '切换为点' : '切换为车'"
        placement="left"
      >
        <button @click="toggleDisplayMode">
          <RiBubbleChartFill
            size="18px"
            color="#4d4d4d"
            v-if="vehicleDisplayMode === 'model'"
          />
          <RiCarFill size="18px" color="#4d4d4d" v-else />
        </button>
      </el-tooltip>
      <el-tooltip
        effect="dark"
        :content="isLockMode ? '取消锁定模式' : '切换为锁定模式'"
        placement="left"
      >
        <button @click="toggleLockMode">
          <ScanObject20Filled size="18px" color="#4d4d4d" v-if="!isLockMode" />
          <ScanDisabled size="18px" color="#4d4d4d" v-else />
        </button>
      </el-tooltip>
      <div class="group-controls">
        <el-tooltip effect="dark" content="放大地图" placement="left">
          <button @click="zoomIn">
            <RiAddLine size="18px" color="#4d4d4d" />
          </button>
        </el-tooltip>
        <el-tooltip effect="dark" content="缩小地图" placement="left">
          <button @click="zoomOut">
            <RiSubtractLine size="18px" />
          </button>
        </el-tooltip>
      </div>
      <!-- <el-tooltip
        v-if="isDev"
        effect="dark"
        content="测试机器人视频（星树 WebRTC）"
        placement="left"
      >
        <button class="test-robot-btn" type="button" @click="openTestRobotStream">
          机视
        </button>
      </el-tooltip> -->
      <!-- <el-popover placement="left" :width="240" trigger="click">
        <template #reference>
          <div class="round-control" :style="mapSwitchStyle"></div>
        </template>
        <el-form :model="mapConfigForm">
          <el-form-item label="路网和标注">
            <el-switch
              v-model="mapConfigForm.showMapRoadNet"
              @change="handleMapRoadNetVisible"
            />
          </el-form-item>
        </el-form>
        <div class="mode-list">
          <div
            class="mode-list_img"
            v-for="item in MAP_MODE_LIST"
            :key="item.value"
            @click="switchMapMode(item.value)"
          >
            <el-image :src="item.src"></el-image>
            <div class="description">{{ item.label }}</div>
            <div class="check-button" v-if="item.value === currentMode">
              <RiCheckLine size="18px" color="#ffffff" />
            </div>
          </div>
        </div>
      </el-popover> -->
    </div>
    <!-- <div class="bottom-controls">
      <el-popover
        popper-class="mouse-operation-popover"
        placement="top"
        effect="dark"
        :width="300"
        trigger="click"
        title="鼠标操作"
        :auto-close="5000"
        :show-arrow="false"
      >
        <template #reference>
          <el-button
            class="icon-button"
            :icon="KeyboardRegular"
            type="primary"
            link
          ></el-button>
        </template>
        <div class="mouse-operation">
          <div class="mouse-operation-list">
            <div class="mouse-operation-item">水平移动地图</div>
            <div class="mouse-operation-item">旋转地图</div>
            <div class="mouse-operation-item">缩放地图</div>
            <div class="mouse-operation-item">环顾四周</div>
            <div class="mouse-operation-item">查看模型垂直面</div>
          </div>
          <div class="mouse-operation-list">
            <div class="mouse-operation-item">左键</div>
            <div class="mouse-operation-item">ctrl + 左键</div>
            <div class="mouse-operation-item">右键 或 滚轮</div>
            <div class="mouse-operation-item">Alt + 左键</div>
            <div class="mouse-operation-item">Shift + 左键</div>
          </div>
        </div>
      </el-popover>
      <div class="location-text" v-if="coords.lng && coords.lat">
        {{ "经度:" + coords.lng }}，{{ "纬度:" + coords.lat }}
      </div>
    </div> -->
    <!-- 右下角小窗 -->
    <div class="sub-view-window" style="opacity: 0; display: none">
      <div id="subViewerContainer"></div>
    </div>

    <!-- 目标设备伴飞弹窗：锚定在警车/警员/机器人旁 -->
    <div
      v-if="policeVehiclePopup.visible"
      class="police-vehicle-popup"
      :style="policeVehiclePopupStyle"
      @click.stop
    >
      <div class="police-vehicle-popup__header">
        <div class="police-vehicle-popup__urgent">
          <img class="police-vehicle-popup__urgent-icon" :src="sosSvg" alt="" />
          <span>紧急伴飞</span>
        </div>
      </div>
      <div class="police-vehicle-popup__row">
        <span class="police-vehicle-popup__label">目标设备：</span>
        <span class="police-vehicle-popup__value">{{ policeVehiclePopup.vehicleName }}（{{ policeVehiclePopup.targetTypeLabel }}）</span>
      </div>
      <div class="police-vehicle-popup__row">
        <span class="police-vehicle-popup__label">坐标信息：</span>
        <span class="police-vehicle-popup__value">{{ policeVehiclePopup.coordText }}</span>
      </div>
      <div class="police-vehicle-popup__row police-vehicle-popup__row--alert">
        <span class="police-vehicle-popup__label">简要警情：</span>
        <span class="police-vehicle-popup__value">{{ policeVehiclePopup.alertInfo }}</span>
      </div>
      <div
        v-if="policeVehiclePopup.loadingDrones"
        class="police-vehicle-popup__field"
      >
        <span class="police-vehicle-popup__label">推荐无人机：</span>
        <span class="police-vehicle-popup__value">加载中...</span>
      </div>
      <div
        v-else-if="policeVehiclePopup.drones.length"
        class="police-vehicle-popup__field"
      >
        <span class="police-vehicle-popup__label">推荐无人机：</span>
        <select
          v-model="policeVehiclePopup.selectedDroneId"
          class="police-vehicle-popup__select"
        >
          <option
            v-for="d in policeVehiclePopup.drones"
            :key="d.id"
            :value="d.id"
          >
            {{ d.label }}
          </option>
        </select>
      </div>
      <p v-else class="police-vehicle-popup__empty">暂无可用无人机</p>
      <div
        v-if="immersiveFlight"
        class="police-vehicle-popup__actions"
      >
        <button
          type="button"
          class="police-vehicle-popup__escort police-vehicle-popup__escort--primary"
          :disabled="policeVehiclePopup.loadingDrones || !policeVehiclePopup.drones.length"
          @click="handlePolicePopupEscort('follow-only')"
        >
          开始伴飞
        </button>
        <button
          type="button"
          class="police-vehicle-popup__escort police-vehicle-popup__escort--jump"
          title="将退出当前沉浸并切换到新伴飞目标"
          :disabled="policeVehiclePopup.loadingDrones || !policeVehiclePopup.drones.length"
          @click="handlePolicePopupEscort('follow-and-switch')"
        >
          开始伴飞并跳转
        </button>
      </div>
      <button
        v-else
        type="button"
        class="police-vehicle-popup__escort"
        :disabled="policeVehiclePopup.loadingDrones || !policeVehiclePopup.drones.length"
        @click="handlePolicePopupEscort('follow-full')"
      >
        开始伴飞
      </button>
    </div>
  </div>
</template>

<script setup>
import {
  onMounted,
  onUnmounted,
  shallowRef,
  ref,
  computed,
  watch,
  reactive,
} from "vue";
import * as Cesium from "cesium";
import {
  RiAddLine,
  RiSubtractLine,
  RiCheckLine,
  RiCarFill,
  RiEraserLine,
  RiMapPin5Line,
  RiFocus3Line,
  RiRouteFill,
  RiSendPlaneFill,
  RiBubbleChartFill,
} from "@remixicon/vue";
import { KeyboardRegular } from "@vicons/fa";
import DefaultMapImg from "@/assets/images/img-map-default.png";
import DefaultMapImg2 from "@/assets/images/img-map-default2.png";
import axios from "axios";
import { mqttService } from "@/utils/mqtt-service";
import { ensureDroneOsdMqtt, onDroneOsdTelemetry } from "@/composables/useDroneOsdMqtt.js";
import { cloneDeep, isEmpty } from "lodash-es";
import { CameraFrustum } from "@/utils/cameraFrustum";
import { CompanionFrustum } from "@/utils/companionFrustum";
import { useSystemStore } from "@/stores/index";
import {
  ScanObject20Filled,
  LocationOff48Filled,
  LocationAdd24Filled,
} from "@vicons/fluent";
import { ScanDisabled } from "@vicons/carbon";
import { ZoomFrustumManager } from "@/utils/zoomFrustumManager";
import * as testJson from "@/assets/test.json";
import {
  TIANDITU_CONFIG,
  DEVICE_CONFIG,
  MAP_CONFIG,
} from "@/config/app-config.js";
import { DEFAULT_ROBOT_ID, DEFAULT_COMMUNITY_ID } from "@/api/robot.js";
import dtJyPng from "@/assets/images/dt_jy.png";
import dbJqrPng from "@/assets/images/db_jqr.png";
import sosSvg from "@/assets/images/sos.svg";
import { TEST_POLICE_VEHICLES, TEST_DRONES } from "@/config/test-devices.js";
import { useDeviceStore } from "@/stores/device.js";
import { useFlightPlanStore } from "@/stores/flightPlan.js";
import { useLockdown } from "@/composables/useLockdown.js";
import { ElMessageBox, ElMessage } from "element-plus";
import { AccompanyingFlyService } from "@/api";
import { unwrapApiList } from "@/utils/request.js";

const props = defineProps({
  /** 伴飞中当前选中的无人机 id（通常来自视频弹窗/资源卡片） */
  activeEscortDroneId: { type: String, default: "" },
  /** 是否处于沉浸伴飞（告警弹窗在沉浸中会展示「开始伴飞并跳转」） */
  immersiveFlight: { type: Boolean, default: false },
});

const emit = defineEmits(["open-drone-stream", "open-robot-stream", "immersive-escort-switch"]);

const isDev = import.meta.env.DEV;

// 加载状态
const isLoading = ref(true);

/** 开发环境：打开机器人视频测试窗 */
function openTestRobotStream() {
  const robotId = DEFAULT_ROBOT_ID;
  const communityId = DEFAULT_COMMUNITY_ID;
  emit("open-robot-stream", {
    id: `test-robot-${robotId}`,
    name: "机器人39号",
    robotId,
    communityId,
    type: 3,
  });
}

const POLICE_POPUP_WIDTH = 280;
const POLICE_POPUP_OFFSET = 16;

const policeVehiclePopup = reactive({
  visible: false,
  deviceId: "",
  vehicleName: "",
  targetTypeLabel: "警车",
  alertInfo: "",
  coordText: "",
  drones: [],
  selectedDroneId: "",
  loadingDrones: false,
  left: 0,
  top: 0,
});

const policeVehiclePopupStyle = computed(() => ({
  left: `${policeVehiclePopup.left}px`,
  top: `${policeVehiclePopup.top}px`,
  transform: "translateY(-50%)",
}));

let policePopupPostRenderRemove = null;

function resolveTargetMapEntry(deviceId) {
  const id = String(deviceId || "").trim();
  if (!id) return null;
  return (
    vehicleManager.vehicles.get(id) ||
    officerManager.officers.get(id) ||
    robotManager.robots.get(id) ||
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
  const lng = Number(target?.lng);
  const lat = Number(target?.lat);
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

const updatePolicePopupScreenPosition = () => {
  if (!policeVehiclePopup.visible || !mainViewer || mainViewer.isDestroyed?.()) {
    return;
  }
  const positionProp = resolveTargetMapPositionProp(policeVehiclePopup.deviceId);
  if (!positionProp) return;

  const pos = positionProp.getValue(mainViewer.clock.currentTime);
  if (!Cesium.defined(pos)) return;

  const canvasPos = Cesium.SceneTransforms.worldToWindowCoordinates(
    mainViewer.scene,
    pos,
  );
  if (!Cesium.defined(canvasPos)) {
    policeVehiclePopup.visible = false;
    return;
  }

  const w = mainViewer.canvas.clientWidth;
  const h = mainViewer.canvas.clientHeight;
  let left = canvasPos.x + POLICE_POPUP_OFFSET;
  let top = canvasPos.y;

  if (left + POLICE_POPUP_WIDTH > w - 8) {
    left = canvasPos.x - POLICE_POPUP_WIDTH - POLICE_POPUP_OFFSET;
  }
  left = Math.max(8, Math.min(left, w - POLICE_POPUP_WIDTH - 8));
  top = Math.max(80, Math.min(top, h - 100));

  policeVehiclePopup.left = left;
  policeVehiclePopup.top = top;
};

const attachPolicePopupTracker = () => {
  if (policePopupPostRenderRemove || !mainViewer) return;
  policePopupPostRenderRemove = mainViewer.scene.postRender.addEventListener(
    updatePolicePopupScreenPosition,
  );
};

const detachPolicePopupTracker = () => {
  if (typeof policePopupPostRenderRemove === "function") {
    policePopupPostRenderRemove();
  }
  policePopupPostRenderRemove = null;
};

const closePoliceVehiclePopup = () => {
  policeVehiclePopup.visible = false;
  detachPolicePopupTracker();
};

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

function updateDroneMapEntityBySn(sn, lng, lat, height) {
  if (!mainViewer || mainViewer.isDestroyed?.()) return;
  const key = String(sn || "").trim();
  const drone = resolveDroneByMqttSn(key);
  if (!drone) return;
  const entityKey = getDroneEntityKey(drone);
  if (!entityKey) return;

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
  const targetId = policeVehiclePopup.deviceId;
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

function toFiniteNumber(v) {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() !== "") {
    const n = Number(v);
    if (Number.isFinite(n)) return n;
  }
  return null;
}

const SUGGEST_DRONES_CACHE_TTL = 15 * 1000;
const suggestDronesCache = new Map();

function extractReadySuggestedDronesFromResponse(res) {
  return unwrapApiList(res).filter((d) => Number(d?.status) === 1);
}

function buildSuggestDronesQuery(targetId, devicePosition) {
  const longitude = toFiniteNumber(devicePosition?.longitude);
  const latitude = toFiniteNumber(devicePosition?.latitude);
  if (!targetId || !Number.isFinite(longitude) || !Number.isFinite(latitude)) {
    return null;
  }
  return {
    targetId,
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
  // 临时需求：点击飞行计划条目时，不再根据经纬度在地图上绘制/定位圈选区域。
  // 保留下面原逻辑（历史版本）以便后续恢复：
  // const planId = flightPlanStore.selectedPlanId;
  // if (!planId) return;
  // const plan = flightPlanStore.getPlanById(planId);
  // const rings =
  //   plan?.polygonLngLatList?.filter((r) => r?.length >= 6) ||
  //   (plan?.polygonLngLat?.length >= 6 ? [plan.polygonLngLat] : []);
  // if (!rings.length) return;
  //
  // const allPositions = [];
  // rings.forEach((ring, index) => {
  //   const positions = Cesium.Cartesian3.fromDegreesArray(ring);
  //   allPositions.push(...positions);
  //   const entity = mainViewer.entities.add({
  //     polygon: {
  //       hierarchy: new Cesium.PolygonHierarchy(positions),
  //       material: Cesium.Color.fromCssColorString("#409eff").withAlpha(0.28 + index * 0.04),
  //       outline: true,
  //       outlineColor: Cesium.Color.fromCssColorString("#67c23a"),
  //       outlineWidth: 2,
  //       perPositionHeight: false,
  //       heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
  //     },
  //   });
  //   flightPlanPolygonEntities.push(entity);
  // });
  //
  // mainViewer.scene.requestRender?.();
  // try {
  //   if (flightPlanPolygonEntities.length === 1) {
  //     mainViewer.flyTo(flightPlanPolygonEntities[0], { duration: 1.0 });
  //   } else {
  //     const bs = Cesium.BoundingSphere.fromPoints(allPositions);
  //     if (bs && bs.radius > 0) {
  //       mainViewer.camera.flyToBoundingSphere(bs, { duration: 1.0 });
  //     }
  //   }
  // } catch (_) {
  //   const bs = Cesium.BoundingSphere.fromPoints(allPositions);
  //   if (bs && bs.radius > 0) {
  //     mainViewer.camera.flyToBoundingSphere(bs, { duration: 1.0 });
  //   }
  // }
};

watch(
  () => flightPlanStore.selectedPlanId,
  () => {
    syncFlightPlanPolygon();
  },
);
const TK_LIST = TIANDITU_CONFIG.keyList;
const DEFAULT_CENTER = MAP_CONFIG.defaultCenter;
const MAP_BASE_COLOR_HEX = "#292E38";
/** 影像主题色映射（与原 blueTint 同思路）：灰度按此 RGB 比例染色，对齐设计底色的色相 */
const MAP_TINT_RGB = { r: 0x29, g: 0x2e, b: 0x38 };

/**
 * 标注层（cia / cva）：略压暗，减轻过亮刺眼
 * brightness 可在 0.7–0.9 区间微调
 */
function applyLabelImageryTone(layer) {
  if (!layer) return;
  layer.alpha = 0.9;
  layer.brightness = 0.6;
  layer.saturation = 0.85;
  layer.contrast = 0.94;
  layer.gamma = 1.0;
  layer.hue = 0.0;
}
// map mode type list
const MAP_MODE_LIST = [
  { src: DefaultMapImg2, label: "标准地图", value: "normal" },
  { src: DefaultMapImg, label: "卫星地图", value: "satellite" },
];
const MAX_LEVEL = MAP_CONFIG.maxLevel;
const DRONE_HEIGHT = MAP_CONFIG.droneHeight;
const CAR_SPEED = MAP_CONFIG.carSpeed;
const SCOPE_RATIO = MAP_CONFIG.scopeRatio; // 数值越小，取景框越靠中心
const INITIAL_DRONE_VIEW_MIN_SPAN = 0.01; // 首屏自适应时，最小经纬跨度（防止过近）
const INITIAL_DRONE_VIEW_PADDING_RATIO = 0.2; // 首屏自适应时，边距比例
// cesium viewer
let mainViewer,
  carEntity,
  droneEntity,
  satelliteLayer,
  satelMarkLayer,
  vectorLayer,
  vectorMarkLayer;
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
const VEHICLE_LABEL_COLOR = Cesium.Color.fromCssColorString("#5794DF");
const DRONE_LABEL_COLOR = Cesium.Color.fromCssColorString("#0EF2F2");

const escortTargetHighlight = reactive({
  targetId: null,
  droneName: "",
});
let hasAppliedInitialDroneOverview = false;

/** 地图点击选中的伴飞目标（警车 / 警员 / 机器人） */
let selectedTargetDeviceId = null;

function applyBillboardTargetHighlight(entity, selected) {
  if (!entity?.billboard || !entity?.label) return;
  if (selected) {
    entity.billboard.width = 46;
    entity.billboard.height = 46;
    entity.label.fillColor = VEHICLE_HIGHLIGHT_COLOR;
    entity.label.outlineColor = Cesium.Color.BLACK;
    entity.label.outlineWidth = 3;
    entity.label.font = "bold 15px Microsoft YaHei, sans-serif";
    entity.label.pixelOffset = new Cesium.Cartesian2(0, -46);
  } else {
    entity.billboard.width = 34;
    entity.billboard.height = 34;
    entity.label.fillColor = Cesium.Color.WHITE;
    entity.label.outlineColor = Cesium.Color.BLACK;
    entity.label.outlineWidth = 2;
    entity.label.font = "14px sans-serif";
    entity.label.pixelOffset = new Cesium.Cartesian2(0, -38);
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
  }
}

function collectInitialDroneOverviewCoords() {
  const droneList = Array.isArray(deviceStore.drones) ? deviceStore.drones : [];
  return droneList
    .map((drone) => {
      const lng = Number(
        drone?.longitude ?? drone?.lng,
      );
      const lat = Number(
        drone?.latitude ?? drone?.lat,
      );
      if (!Number.isFinite(lng) || !Number.isFinite(lat)) return null;
      if (lng === 0 && lat === 0) return null;
      return { lng, lat };
    })
    .filter(Boolean);
}

function flyToInitialDroneOverview() {
  if (hasAppliedInitialDroneOverview) return;
  if (!mainViewer || mainViewer.isDestroyed?.()) return;

  const coords = collectInitialDroneOverviewCoords();
  if (!coords.length) return;

  hasAppliedInitialDroneOverview = true;

  if (coords.length === 1) {
    const { lng, lat } = coords[0];
    mainViewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(
        lng,
        lat,
        MAP_CONFIG.mapDefaultRange,
      ),
      orientation: {
        heading: Cesium.Math.toRadians(0),
        pitch: Cesium.Math.toRadians(-90),
        roll: 0,
      },
      duration: 0.8,
    });
    return;
  }

  let west = Number.POSITIVE_INFINITY;
  let east = Number.NEGATIVE_INFINITY;
  let south = Number.POSITIVE_INFINITY;
  let north = Number.NEGATIVE_INFINITY;
  coords.forEach(({ lng, lat }) => {
    west = Math.min(west, lng);
    east = Math.max(east, lng);
    south = Math.min(south, lat);
    north = Math.max(north, lat);
  });

  const lngSpan = Math.max(east - west, INITIAL_DRONE_VIEW_MIN_SPAN);
  const latSpan = Math.max(north - south, INITIAL_DRONE_VIEW_MIN_SPAN);
  const padLng = lngSpan * INITIAL_DRONE_VIEW_PADDING_RATIO;
  const padLat = latSpan * INITIAL_DRONE_VIEW_PADDING_RATIO;

  const clampedWest = Math.max(-180, west - padLng);
  const clampedEast = Math.min(180, east + padLng);
  const clampedSouth = Math.max(-85, south - padLat);
  const clampedNorth = Math.min(85, north + padLat);

  mainViewer.camera.flyTo({
    destination: Cesium.Rectangle.fromDegrees(
      clampedWest,
      clampedSouth,
      clampedEast,
      clampedNorth,
    ),
    orientation: {
      heading: Cesium.Math.toRadians(0),
      pitch: Cesium.Math.toRadians(-90),
      roll: 0,
    },
    duration: 0.8,
  });
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
  if (!robot?.entity) return;

  if (active) {
    applyBillboardTargetHighlight(robot.entity, true);
  } else if (selectedTargetDeviceId !== targetId) {
    applyBillboardTargetHighlight(robot.entity, false);
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

function resolveTargetType(target) {
  const type = Number(target?.type);
  return Number.isFinite(type) ? type : 1;
}

function getTargetTypeLabel(target) {
  const type = resolveTargetType(target);
  if (type === 2) return "警员";
  if (type === 3) return "机器人";
  return "警车";
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
  createVehicle(viewer, deviceId, labelText = deviceId) {
    if (this.vehicles.has(deviceId)) {
      return this.vehicles.get(deviceId);
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
      ...getVehicleShapeGraphics(),
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

// 警员目标管理（billboard + 采样位置 + 轨迹，与 vehicleManager 分离）
const officerManager = {
  officers: new Map(),

  createOfficer(viewer, deviceId, labelText = deviceId) {
    if (this.officers.has(deviceId)) {
      return this.officers.get(deviceId);
    }

    const positionProp = new Cesium.SampledPositionProperty();
    positionProp.forwardExtrapolationType = Cesium.ExtrapolationType.HOLD;
    positionProp.backwardExtrapolationType = Cesium.ExtrapolationType.HOLD;
    positionProp.setInterpolationOptions({
      interpolationDegree: 1,
      interpolationAlgorithm: Cesium.HermitePolynomialApproximation,
    });

    const defaultPathMaterial = new Cesium.PolylineGlowMaterialProperty({
      glowPower: 0.2,
      taperPower: 0.7,
      color: OFFICER_NORMAL_PATH_COLOR,
    });

    const entity = viewer.entities.add({
      availability: new Cesium.TimeIntervalCollection([
        new Cesium.TimeInterval({
          start: viewer.clock.startTime,
          stop: Cesium.JulianDate.fromIso8601("9999-12-31T23:59:59Z"),
        }),
      ]),
      position: positionProp,
      properties: {
        deviceId,
        deviceName: labelText || deviceId,
        targetType: 2,
      },
      billboard: {
        image: dtJyPng,
        width: 34,
        height: 34,
        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
        heightReference: Cesium.HeightReference.RELATIVE_TO_GROUND,
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
      },
      label: {
        text: labelText || deviceId,
        font: "14px sans-serif",
        fillColor: Cesium.Color.WHITE,
        outlineColor: Cesium.Color.BLACK,
        outlineWidth: 2,
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
        pixelOffset: new Cesium.Cartesian2(0, -38),
        heightReference: Cesium.HeightReference.RELATIVE_TO_GROUND,
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
      },
      path: {
        show: routeLayerVisible,
        width: 4,
        material: defaultPathMaterial,
        leadTime: 0,
        trailTime: 999999,
      },
      viewFrom: getVehicleViewFrom(false),
      show: targetLayerVisibility.officer,
    });

    this.officers.set(deviceId, {
      entity,
      positionProp,
      lastPosition: null,
      defaultPathMaterial,
      baseLabel: labelText || deviceId,
    });
    return this.officers.get(deviceId);
  },

  updateOfficerPosition(deviceId, longitude, latitude, height = 0) {
    const officer = this.officers.get(deviceId);
    if (!officer) return;

    const currentTime = mainViewer.clock.currentTime;
    const newPosition = Cesium.Cartesian3.fromDegrees(
      longitude,
      latitude,
      height,
    );
    officer.positionProp.addSample(currentTime, newPosition);
    officer.lastPosition = { longitude, latitude, height };
  },

  updateOfficerLabel(deviceId, labelText) {
    const officer = this.officers.get(deviceId);
    if (!officer?.entity?.label) return;
    officer.baseLabel = labelText || deviceId;
    officer.entity.label.text = formatTargetDisplayLabel(
      officer.baseLabel,
      escortTargetHighlight.targetId === String(deviceId)
        ? escortTargetHighlight.droneName
        : "",
    );
    if (officer.entity.properties?.deviceName) {
      officer.entity.properties.deviceName = labelText || deviceId;
    }
  },

  removeOfficer(deviceId) {
    const officer = this.officers.get(deviceId);
    if (!officer) return;
    mainViewer?.entities?.remove(officer.entity);
    this.officers.delete(deviceId);
  },

  clearAll() {
    this.officers.forEach((officer) => {
      mainViewer?.entities?.remove(officer.entity);
    });
    this.officers.clear();
  },
};

// 机器人目标管理（type=3，billboard + 采样位置 + 轨迹）
const robotManager = {
  robots: new Map(),

  createRobot(viewer, deviceId, labelText = deviceId) {
    if (this.robots.has(deviceId)) {
      return this.robots.get(deviceId);
    }

    const positionProp = new Cesium.SampledPositionProperty();
    positionProp.forwardExtrapolationType = Cesium.ExtrapolationType.HOLD;
    positionProp.backwardExtrapolationType = Cesium.ExtrapolationType.HOLD;
    positionProp.setInterpolationOptions({
      interpolationDegree: 1,
      interpolationAlgorithm: Cesium.HermitePolynomialApproximation,
    });

    const defaultPathMaterial = new Cesium.PolylineGlowMaterialProperty({
      glowPower: 0.2,
      taperPower: 0.7,
      color: ROBOT_NORMAL_PATH_COLOR,
    });

    const entity = viewer.entities.add({
      availability: new Cesium.TimeIntervalCollection([
        new Cesium.TimeInterval({
          start: viewer.clock.startTime,
          stop: Cesium.JulianDate.fromIso8601("9999-12-31T23:59:59Z"),
        }),
      ]),
      position: positionProp,
      properties: {
        deviceId,
        deviceName: labelText || deviceId,
        targetType: 3,
      },
      billboard: {
        image: dbJqrPng,
        width: 34,
        height: 34,
        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
        heightReference: Cesium.HeightReference.RELATIVE_TO_GROUND,
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
      },
      label: {
        text: labelText || deviceId,
        font: "14px sans-serif",
        fillColor: Cesium.Color.WHITE,
        outlineColor: Cesium.Color.BLACK,
        outlineWidth: 2,
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
        pixelOffset: new Cesium.Cartesian2(0, -38),
        heightReference: Cesium.HeightReference.RELATIVE_TO_GROUND,
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
      },
      path: {
        show: routeLayerVisible,
        width: 4,
        material: defaultPathMaterial,
        leadTime: 0,
        trailTime: 999999,
      },
      viewFrom: getVehicleViewFrom(false),
      show: targetLayerVisibility.robot,
    });

    this.robots.set(deviceId, {
      entity,
      positionProp,
      lastPosition: null,
      defaultPathMaterial,
      baseLabel: labelText || deviceId,
    });
    return this.robots.get(deviceId);
  },

  updateRobotPosition(deviceId, longitude, latitude, height = 0) {
    const robot = this.robots.get(deviceId);
    if (!robot) return;

    const currentTime = mainViewer.clock.currentTime;
    const newPosition = Cesium.Cartesian3.fromDegrees(
      longitude,
      latitude,
      height,
    );
    robot.positionProp.addSample(currentTime, newPosition);
    robot.lastPosition = { longitude, latitude, height };
  },

  updateRobotLabel(deviceId, labelText) {
    const robot = this.robots.get(deviceId);
    if (!robot?.entity?.label) return;
    robot.baseLabel = labelText || deviceId;
    robot.entity.label.text = formatTargetDisplayLabel(
      robot.baseLabel,
      escortTargetHighlight.targetId === String(deviceId)
        ? escortTargetHighlight.droneName
        : "",
    );
    if (robot.entity.properties?.deviceName) {
      robot.entity.properties.deviceName = labelText || deviceId;
    }
  },

  removeRobot(deviceId) {
    const robot = this.robots.get(deviceId);
    if (!robot) return;
    mainViewer?.entities?.remove(robot.entity);
    this.robots.delete(deviceId);
  },

  clearAll() {
    this.robots.forEach((robot) => {
      mainViewer?.entities?.remove(robot.entity);
    });
    this.robots.clear();
  },
};

function horizontalDistanceMeters(lng1, lat1, lng2, lat2) {
  const c1 = Cesium.Cartesian3.fromDegrees(lng1, lat1, 0);
  const c2 = Cesium.Cartesian3.fromDegrees(lng2, lat2, 0);
  return Cesium.Cartesian3.distance(c1, c2);
}

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
      lastScheduledTime: null,
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
    drone.lastScheduledTime = null;
    console.log(`🧹 已清除无人机 ${droneId} 轨迹`);
  },

  updateDroneLabel(droneId, labelText) {
    const drone = this.drones.get(droneId);
    if (!drone?.entity?.label) return;
    drone.entity.label.text = labelText || droneId;
    drone.entity.label.fillColor = DRONE_LABEL_COLOR;
  },

  flyToPoint(droneId, lng, lat, speed = 30, height = 80) {
    const drone = this.drones.get(droneId);
    if (!drone) return;

    const newPosition = Cesium.Cartesian3.fromDegrees(lng, lat, 0);
    const now = mainViewer.clock.currentTime;
    let arrivalTime;

    if (
      !drone.lastScheduledTime ||
      Cesium.JulianDate.compare(drone.lastScheduledTime, now) < 0
    ) {
      arrivalTime = Cesium.JulianDate.addSeconds(
        now,
        1,
        new Cesium.JulianDate(),
      );
    } else {
      const lastPos = Cesium.Cartesian3.fromDegrees(
        drone.lastPosition.lng,
        drone.lastPosition.lat,
        drone.lastPosition.height,
      );
      const distance = Cesium.Cartesian3.distance(lastPos, newPosition);
      const travelTime = Math.max(distance / speed, 0.1);
      arrivalTime = Cesium.JulianDate.addSeconds(
        drone.lastScheduledTime,
        travelTime,
        new Cesium.JulianDate(),
      );
    }

    const dronePos = Cesium.Cartesian3.fromDegrees(lng, lat, height);
    drone.positionProp.addSample(arrivalTime, dronePos);
    drone.lastScheduledTime = arrivalTime;
    drone.lastPosition = { lng, lat, height };

    if (Cesium.JulianDate.compare(arrivalTime, mainViewer.clock.stopTime) > 0) {
      mainViewer.clock.stopTime = Cesium.JulianDate.addSeconds(
        arrivalTime,
        2,
        new Cesium.JulianDate(),
      );
    }
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
// Record the location markers
let locationMarkers = [];
// Record route marker point
let routeMarkers = [];
// Record vertical lines
let verticalLines = [];
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
// Record the next point index
let runPointIndex = 0;
// Record the time of the last path point for car
let lastScheduledTime = null;
// Record the last location for car
let lastPosition = null;
// Record the time of the last path point for drone
let lastDroneScheduledTime = null;
// Record the last location for dronw
let lastDronePosition = null;
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

// 右下角小窗
let subViewer = null;
const CAMERA_POS = Cesium.Cartesian3.fromDegrees(
  DEFAULT_CENTER.lng,
  DEFAULT_CENTER.lat,
  1000,
); // 摄像头固定位置

// 视图加载的完成度
const viewerLoadCount = ref(0);

// 定义展示模式：'model' 代表车，'point' 代表立体圆点
const vehicleDisplayMode = ref("model");
const targetLayerVisibility = reactive({
  policeCar: true,
  officer: false,
  robot: false,
});

// refs
const isPitch2D = ref(true);
const currentMode = ref("satellite");
const isLockMode = ref(false);
const isAllowAddLocation = ref(false);
const mapConfigForm = ref({
  showMapRoadNet: true,
});
// const isConnected = ref(false);
// const msgList = ref([]);
const target_id = DEVICE_CONFIG.targetId;
const drone_id = DEVICE_CONFIG.droneId;
const targetTopic = `flywith/target/${target_id}`;
const droneTopic = `flywith/uav/${drone_id}`;
let initialDroneOsdFetchPending = false;

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

// 响应式数据，用于 UI 自动更新
const coords = reactive({
  lng: null,
  lat: null,
  alt: null,
});

let handler = null; // 存储事件处理器

// computed
const mapSwitchStyle = computed(() => {
  return {
    "--switch-background": `url(${DefaultMapImg}) 100% no-repeat`,
  };
});

// get Tianditu Key by random
const getTDT_TK = () => TK_LIST[Math.floor(Math.random() * TK_LIST.length)];

const getVehicleModelRotation = () =>
  new Cesium.CallbackProperty(() => {
    const hpr = new Cesium.HeadingPitchRoll(
      Cesium.Math.toRadians(180),
      0,
      0,
    );
    return Cesium.Quaternion.fromHeadingPitchRoll(hpr);
  }, false);

/** 根据 2D/3D 模式计算 trackedEntity 的相机偏移（ENU：东、北、上） */
const getVehicleViewFrom = (to2D = false) => {
  const range = to2D
    ? MAP_CONFIG.vehicleFollowRange2D
    : MAP_CONFIG.vehicleFollowRange3D;
  if (to2D) {
    return new Cesium.Cartesian3(0, 0, range);
  }
  const pitchRad = Cesium.Math.toRadians(45);
  return new Cesium.Cartesian3(
    0,
    -range * Math.cos(pitchRad),
    range * Math.sin(pitchRad),
  );
};

const applyEntityTrackViewFrom = (entity, to2D = isPitch2D.value) => {
  if (!entity) return;
  entity.viewFrom = getVehicleViewFrom(to2D);
};

const refreshTrackedEntity = (viewer, entity) => {
  if (!viewer || viewer.isDestroyed?.() || !entity) return;
  if (viewer.trackedEntity === entity) {
    viewer.trackedEntity = undefined;
  }
  viewer.trackedEntity = entity;
};

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
    pixelSize: 12,
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
  }

  applyEntityTrackViewFrom(entity);
};

// 切换展示模式
const toggleDisplayMode = () => {
  vehicleDisplayMode.value =
    vehicleDisplayMode.value === "model" ? "point" : "model";

  if (carEntity) {
    patchVehicleDisplayGraphics(carEntity);
  }
  vehicleManager.vehicles.forEach(({ entity }) => {
    patchVehicleDisplayGraphics(entity);
  });
  mainViewer?.scene?.requestRender?.();
};

/**
 * @description: Control map road net show or not
 * @param {*} e
 * @return {*}
 */
const handleMapRoadNetVisible = (e) => {
  if (e) {
    if (currentMode.value === "satellite") {
      ensureSatelliteMarkLayer();
      satelMarkLayer.show = true;
    } else {
      ensureVectorMarkLayer();
      vectorMarkLayer.show = true;
    }
  } else {
    if (currentMode.value === "satellite") {
      if (satelMarkLayer) satelMarkLayer.show = false;
    } else {
      if (vectorMarkLayer) vectorMarkLayer.show = false;
    }
  }
};

const applyDarkMapTone = (layer, layerCode) => {
  if (!layer) return;

  const isBaseLayer = layerCode === "img_w" || layerCode === "vec_w";
  const isLabelLayer = layerCode === "cia_w" || layerCode === "cva_w";
  if (isBaseLayer) {
    // 底图颜色走瓦片内 mapTint（原 blueTint 路径）；此处不再叠加重滤镜，以免发灰发紫。
    layer.alpha = 1.0;
    layer.brightness = 1.0;
    layer.contrast = 1.0;
    layer.saturation = 1.0;
    layer.gamma = 1.0;
    layer.hue = 0.0;
  }
  if (isLabelLayer) {
    applyLabelImageryTone(layer);
  }
};

const createMainImageryLayer = (layerCode, options = {}, show = true) => {
  if (!mainViewer) return null;

  const layer = mainViewer.imageryLayers.addImageryProvider(
    getTdtLayerProvider(layerCode, options),
  );
  layer.maximumTerrainLevel = MAX_LEVEL;
  layer.show = show;
  applyDarkMapTone(layer, layerCode);
  return layer;
};

const ensureSatelliteMarkLayer = () => {
  if (!satelMarkLayer) {
    satelMarkLayer = createMainImageryLayer(
      "cia_w",
      {},
      mapConfigForm.value.showMapRoadNet && currentMode.value === "satellite",
    );
  }
  return satelMarkLayer;
};

const ensureVectorLayer = () => {
  if (!vectorLayer) {
    vectorLayer = createMainImageryLayer(
      "vec_w",
      { blueTint: true },
      currentMode.value === "normal",
    );
  }
  return vectorLayer;
};

const ensureVectorMarkLayer = () => {
  if (!vectorMarkLayer) {
    vectorMarkLayer = createMainImageryLayer(
      "cva_w",
      { blueTint: false, bright: 1.7 },
      mapConfigForm.value.showMapRoadNet && currentMode.value === "normal",
    );
  }
  return vectorMarkLayer;
};

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
  initClickControl(viewer);
  initManualUnlock(viewer);
  initCoordinateTracker(viewer);
  initVehicleClickHandler(viewer);

  warmUpPicker(viewer);
  warmUpMessageBox();
};

/**
 * @description: initialize cesium viewer by Tianditu
 * @return {*}
 */
const initViewer = () => {
  // initialize cesium Viewer
  mainViewer = new Cesium.Viewer("cesiumContainer", {
    resolutionScale: window.devicePixelRatio || 1,
    sceneMode: Cesium.SceneMode.SCENE3D,
    shouldAnimate: true,
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

  // 修复标注图标锯齿问题
  // if (mainViewer.scene.postProcessStages) {
  //   mainViewer.scene.postProcessStages.fxaa.enabled = false;
  // }

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
  satelliteLayer = createMainImageryLayer("img_w", { blueTint: true });

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

/**
 * @description: 取当前视口中心对应的地表点，用于切换 2D/3D 时保持视野不跑飞
 */
const pickGlobeCenter = (viewer) => {
  if (!viewer?.scene?.canvas) return undefined;

  const { clientWidth, clientHeight } = viewer.scene.canvas;
  const windowPosition = new Cesium.Cartesian2(
    clientWidth / 2,
    clientHeight / 2,
  );

  let cartesian;
  if (viewer.scene.mode === Cesium.SceneMode.SCENE3D) {
    const ray = viewer.camera.getPickRay(windowPosition);
    cartesian = ray ? viewer.scene.globe.pick(ray, viewer.scene) : undefined;
  }
  if (!Cesium.defined(cartesian)) {
    cartesian = viewer.camera.pickEllipsoid(
      windowPosition,
      viewer.scene.globe.ellipsoid,
    );
  }
  if (!Cesium.defined(cartesian)) {
    const carto = viewer.camera.positionCartographic;
    cartesian = Cesium.Cartesian3.fromRadians(
      carto.longitude,
      carto.latitude,
      0,
    );
  }
  return cartesian;
};

/**
 * 取当前相机到屏幕中心地面点的距离（即真实 range）。
 * 返回 { center: Cartesian3, range: number }
 * 这个 range 在 lookAt(HeadingPitchRange) 中是稳定的，不随 pitch 变化而漂移。
 */
const getCenterAndRange = (viewer, focusEntity = null) => {
  // 优先使用锁定实体位置
  if (focusEntity?.position) {
    const pos = focusEntity.position.getValue(viewer.clock.currentTime);
    if (Cesium.defined(pos)) {
      const dist = Cesium.Cartesian3.distance(viewer.camera.position, pos);
      const safeRange = Number.isFinite(dist) && dist > 10 && dist < 100000
        ? dist
        : MAP_CONFIG.mapDefaultRange;
      return { center: pos, range: safeRange };
    }
  }

  // 从屏幕中心射线拾取地面
  const groundCenter = pickGlobeCenter(viewer);
  if (Cesium.defined(groundCenter)) {
    const dist = Cesium.Cartesian3.distance(viewer.camera.position, groundCenter);
    if (Number.isFinite(dist) && dist > 10 && dist < 100000) {
      return { center: groundCenter, range: dist };
    }
  }

  // 兜底：以相机正下方地面点 + 相机高度作为 range
  const carto = viewer.camera.positionCartographic;
  const fallbackCenter = Cesium.Cartesian3.fromRadians(
    carto.longitude, carto.latitude, 0,
  );
  const fallbackRange = Cesium.Math.clamp(
    carto.height || MAP_CONFIG.mapDefaultRange, 100, 50000,
  );
  return { center: fallbackCenter, range: fallbackRange };
};

/**
 * @description: switch 2D and 3D pitch（仅改俯仰角，中心点和缩放不变）
 * @return {*}
 */
const toggleSceneMode = () => {
  if (!mainViewer || mainViewer.isDestroyed?.()) return;

  let focusEntity = null;
  if (isLockMode.value) {
    focusEntity =
      mainViewer.trackedEntity || resolveLockedFollowEntity()?.entity;
  }

  isPitch2D.value = !isPitch2D.value;
  const to2D = isPitch2D.value;

  if (isLockMode.value && focusEntity) {
    applyEntityTrackViewFrom(focusEntity, to2D);
    refreshTrackedEntity(mainViewer, focusEntity);
    return;
  }

  // 在改 isPitch2D 之前先拿到当前 center + range
  const { center, range } = getCenterAndRange(mainViewer, focusEntity);
  const heading = mainViewer.camera.heading;

  // 用 lookAt 定位，再解除 transform 让相机可自由操作
  mainViewer.camera.lookAtTransform(Cesium.Matrix4.IDENTITY);
  mainViewer.camera.lookAt(
    center,
    new Cesium.HeadingPitchRange(
      heading,
      Cesium.Math.toRadians(to2D ? -90 : -45),
      range,
    ),
  );
  mainViewer.camera.lookAtTransform(Cesium.Matrix4.IDENTITY);

  if (subViewer && !subViewer.isDestroyed?.()) {
    const sub = getCenterAndRange(subViewer, null);
    subViewer.camera.lookAtTransform(Cesium.Matrix4.IDENTITY);
    subViewer.camera.lookAt(
      sub.center,
      new Cesium.HeadingPitchRange(
        subViewer.camera.heading,
        Cesium.Math.toRadians(to2D ? -90 : -45),
        sub.range,
      ),
    );
    subViewer.camera.lookAtTransform(Cesium.Matrix4.IDENTITY);
  }
};

/**
 * @description: 更新锁定目标的 viewFrom，并由 trackedEntity 维持跟车距离
 * @param {{ resetViewFrom?: boolean }} [options] resetViewFrom 为 false 时保留 entity 上已有 viewFrom
 */
const switchTrackedView = (viewer, targetEntity, to2D, { resetViewFrom = true } = {}) => {
  if (!viewer || viewer.isDestroyed?.()) return;

  const entity = targetEntity || viewer.trackedEntity;
  if (!entity) return;

  if (resetViewFrom) {
    applyEntityTrackViewFrom(entity, to2D);
  }
  refreshTrackedEntity(viewer, entity);
};

/**
 * @description: zoom in
 * @return {*}
 */
const zoomIn = () => {
  if (isLockMode.value) {
    const locked = resolveLockedFollowEntity();
    if (locked?.entity && scaleLockedEntityViewFrom(locked.entity, 0.5)) {
      switchTrackedView(mainViewer, locked.entity, isPitch2D.value, {
        resetViewFrom: false,
      });
      return;
    }
  }
  mainViewer.camera.zoomIn(mainViewer.camera.positionCartographic.height * 0.5);
  if (subViewer && !subViewer.isDestroyed?.()) {
    subViewer.camera.zoomIn(subViewer.camera.positionCartographic.height * 0.5);
  }
};

/**
 * @description: zoom out
 * @return {*}
 */
const zoomOut = () => {
  if (isLockMode.value) {
    const locked = resolveLockedFollowEntity();
    if (locked?.entity && scaleLockedEntityViewFrom(locked.entity, 2)) {
      switchTrackedView(mainViewer, locked.entity, isPitch2D.value, {
        resetViewFrom: false,
      });
      return;
    }
  }
  mainViewer.camera.zoomOut(
    mainViewer.camera.positionCartographic.height * 0.5,
  );
  if (subViewer && !subViewer.isDestroyed?.()) {
    subViewer.camera.zoomOut(subViewer.camera.positionCartographic.height * 0.5);
  }
};

/**
 * @description: switch map mode
 * @param {*} mode
 * @return {*}
 */
const switchMapMode = (mode) => {
  if (mode === "satellite") {
    // img_w + cia_w
    if (satelliteLayer) satelliteLayer.show = true;
    if (mapConfigForm.value.showMapRoadNet) ensureSatelliteMarkLayer();
    if (satelMarkLayer)
      satelMarkLayer.show = mapConfigForm.value.showMapRoadNet;
    if (vectorLayer) vectorLayer.show = false;
    if (vectorMarkLayer) vectorMarkLayer.show = false;
    currentMode.value = "satellite";
  } else {
    // vec_w + cva_w
    ensureVectorLayer();
    if (mapConfigForm.value.showMapRoadNet) ensureVectorMarkLayer();
    if (satelliteLayer) satelliteLayer.show = false;
    if (satelMarkLayer) satelMarkLayer.show = false;
    if (vectorLayer) vectorLayer.show = true;
    if (vectorMarkLayer)
      vectorMarkLayer.show = mapConfigForm.value.showMapRoadNet;
    currentMode.value = "normal";
  }
};

/** 锁定模式下，仅刷新当前已跟随目标的位置，不因其他目标 MQTT 消息切换镜头 */
function shouldRefreshFollowOnMqtt(deviceId) {
  if (!isLockMode.value) return false;
  const incomingId = String(deviceId || "").trim();
  const followedId = String(followedVehicleDeviceId || "").trim();
  return Boolean(incomingId && followedId && incomingId === followedId);
}

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

/** 读取实体当前 viewFrom 偏移 */
function readEntityViewFromOffset(entity, viewer = mainViewer) {
  const vf = entity?.viewFrom;
  if (vf instanceof Cesium.Cartesian3) {
    return Cesium.Cartesian3.clone(vf);
  }
  if (typeof vf?.getValue === "function") {
    const value = vf.getValue(viewer?.clock?.currentTime);
    return value ? Cesium.Cartesian3.clone(value) : null;
  }
  return null;
}

/** 锁车状态下按比例缩放 viewFrom（用于 +/- 按钮，避免与 trackedEntity 冲突） */
function scaleLockedEntityViewFrom(entity, factor) {
  let offset = readEntityViewFromOffset(entity);
  if (!offset) {
    applyEntityTrackViewFrom(entity, isPitch2D.value);
    offset = readEntityViewFromOffset(entity);
  }
  if (!offset) return false;

  let next = Cesium.Cartesian3.multiplyByScalar(
    offset,
    factor,
    new Cesium.Cartesian3(),
  );
  const range = Cesium.Cartesian3.magnitude(next);
  if (!Number.isFinite(range) || range < 1) return false;
  if (range < 80 || range > 50000) {
    const clamped = Cesium.Math.clamp(range, 80, 50000);
    next = Cesium.Cartesian3.multiplyByScalar(
      Cesium.Cartesian3.normalize(next, new Cesium.Cartesian3()),
      clamped,
      new Cesium.Cartesian3(),
    );
  }
  entity.viewFrom = next;
  return true;
}

/** 按当前相机与目标距离更新 viewFrom（ENU 局部坐标） */
function syncViewFromFromCamera(viewer, entity) {
  if (!viewer || viewer.isDestroyed?.() || !entity?.position) return false;

  const entityPos = entity.position.getValue(viewer.clock.currentTime);
  if (!entityPos) return false;

  const worldOffset = Cesium.Cartesian3.subtract(
    viewer.camera.positionWC,
    entityPos,
    new Cesium.Cartesian3(),
  );
  const enu = Cesium.Transforms.eastNorthUpToFixedFrame(entityPos);
  const inv = Cesium.Matrix4.inverse(enu, new Cesium.Matrix4());
  let localOffset = Cesium.Matrix4.multiplyByPointAsVector(
    inv,
    worldOffset,
    new Cesium.Cartesian3(),
  );

  let range = Cesium.Cartesian3.magnitude(localOffset);
  if (!Number.isFinite(range) || range < 1) return false;
  if (range < 80 || range > 50000) {
    const clamped = Cesium.Math.clamp(range, 80, 50000);
    localOffset = Cesium.Cartesian3.multiplyByScalar(
      Cesium.Cartesian3.normalize(localOffset, new Cesium.Cartesian3()),
      clamped,
      new Cesium.Cartesian3(),
    );
  }

  entity.viewFrom = localOffset;
  return true;
}

let restoreLockedFollowRaf = null;

function restoreLockedFollowAfterZoom() {
  if (!isLockMode.value || !mainViewer || mainViewer.isDestroyed?.()) return;

  const locked = resolveLockedFollowEntity();
  if (!locked?.entity) {
    releaseVehicleFollow();
    return;
  }

  if (!syncViewFromFromCamera(mainViewer, locked.entity)) return;
  switchTrackedView(mainViewer, locked.entity, isPitch2D.value, {
    resetViewFrom: false,
  });
}

/** 缩放后恢复锁定跟车，并保留用户缩放后的距离 */
function scheduleRestoreLockedFollow() {
  if (restoreLockedFollowRaf != null) {
    cancelAnimationFrame(restoreLockedFollowRaf);
  }
  // 双 rAF：等相机完成缩放后再同步 viewFrom，避免滚轮缩放时尚未更新
  restoreLockedFollowRaf = requestAnimationFrame(() => {
    restoreLockedFollowRaf = requestAnimationFrame(() => {
      restoreLockedFollowRaf = null;
      restoreLockedFollowAfterZoom();
    });
  });
}

/**
 * @description: 锁定相机跟随目标（车辆 / 警员 / 机器人），使目标保持在视野中心
 * @param {{ force3D?: boolean, resetViewFrom?: boolean }} [options] resetViewFrom 为 false 时保留用户已调整的跟随距离
 */
const followVehicleEntity = (entity, deviceId, { force3D = false, resetViewFrom = true } = {}) => {
  if (!mainViewer || mainViewer.isDestroyed?.() || !entity) return;

  if (deviceId != null) {
    followedVehicleDeviceId = String(deviceId);
  }
  if (force3D) {
    isPitch2D.value = false;
  }

  if (resetViewFrom) {
    applyEntityTrackViewFrom(entity, isPitch2D.value);
  }
  isLockMode.value = true;
  switchTrackedView(mainViewer, entity, isPitch2D.value, { resetViewFrom });
};

const releaseVehicleFollow = () => {
  isLockMode.value = false;
  pendingEscortLockTargetId = null; // 用户手动解除跟随时取消待锁，避免再次自动锁回
  if (mainViewer && !mainViewer.isDestroyed?.()) {
    mainViewer.trackedEntity = undefined;
  }
};

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
 * @description: get Tianditu layer provider
 * @param {*} layerCode
 * @return {*}
 */
const getTdtLayerProvider = (layerCode, options = {}) => {
  const provider = new Cesium.WebMapTileServiceImageryProvider({
    url: `http://t${Math.floor(Math.random() * 8)}.tianditu.gov.cn/${layerCode}/wmts?service=wmts&request=GetTile&version=1.0.0&LAYER=${
      layerCode.split("_")[0]
    }&style=default&tileMatrixSet=w&TileMatrix={TileMatrix}&TileRow={TileRow}&TileCol={TileCol}&format=tiles&tk=${getTDT_TK()}`,
    layer: layerCode.split("_")[0],
    style: "default",
    format: "tiles",
    tileMatrixSetID: "w",
    maximumLevel: MAX_LEVEL,
  });

  // ===== 瓦片主题色映射（沿用原 blueTint 管道）：灰度按 MAP_TINT_RGB 比例着色，对齐 #292E38 色相 =====
  if (options.blueTint) {
    const bright = options.bright ?? 1.0;
    const { r: tintR, g: tintG, b: tintB } = MAP_TINT_RGB;
    const tintAnchor = Math.max(tintR, tintG, tintB) || 1;
    /** 与原实现同量级亮度系数，色相由 RGB 比例决定 */
    const bGain = 0.55 * bright;
    const rGain = bGain * (tintR / tintAnchor);
    const gGain = bGain * (tintG / tintAnchor);

    const origRequestImage = provider.requestImage.bind(provider);
    provider.requestImage = (x, y, level, request) => {
      if (request && request.cancelled) return undefined;

      const promise = origRequestImage(x, y, level, request);
      if (!promise) return promise;

      return promise
        .then((image) => {
          if (!image) return image;

          try {
            const w = image.width || 0;
            const h = image.height || 0;
            if (w === 0 || h === 0) return image;

            const canvas = document.createElement("canvas");
            canvas.width = w;
            canvas.height = h;
            const ctx = canvas.getContext("2d", { willReadFrequently: true });
            ctx.translate(0, h);
            ctx.scale(1, -1);
            ctx.drawImage(image, 0, 0);
            ctx.setTransform(1, 0, 0, 1, 0, 0);

            const imgData = ctx.getImageData(0, 0, w, h);
            const px = imgData.data;
            const len = px.length;
            for (let i = 0; i < len; i += 4) {
              const gray =
                px[i] * 0.299 + px[i + 1] * 0.587 + px[i + 2] * 0.114;
              px[i] = gray * rGain;
              px[i + 1] = gray * gGain;
              px[i + 2] = gray * bGain;
            }
            ctx.putImageData(imgData, 0, 0);
            return canvas;
          } catch (e) {
            console.warn(
              "mapTint tile processing failed, fallback to original:",
              e,
            );
            return image;
          }
        })
        .catch((err) => {
          console.warn("mapTint tile request failed:", err);
          return undefined;
        });
    };
  }
  // ===== 瓦片主题色映射 END =====

  return provider;
};

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
 * 根据屏幕分辨率计算 H/V FOV
 * @param {Number} dFOV 官方对角线FOV (度)
 * @param {Number} width 屏幕/视频宽像素 (如 1920)
 * @param {Number} height 屏幕/视频高像素 (如 1080)
 */
const calcFovByResolution = (dFOV, width = 16, height = 9) => {
  const radD = Cesium.Math.toRadians(dFOV);
  const r = Math.sqrt(width * width + height * height);

  const hfov = 2 * Math.atan(Math.tan(radD / 2) * (width / r));
  const vfov = 2 * Math.atan(Math.tan(radD / 2) * (height / r));

  return {
    h: Cesium.Math.toDegrees(hfov),
    v: Cesium.Math.toDegrees(vfov),
  };
};

/**
 * @description: 计算变焦后的 H/V FOV
 * @param {*} baseFov 原始对角线FOV (度)
 * @param {*} zoomFactor 变焦倍数 (如 1.5 表示 150% 变焦)
 * @param {*} w 屏幕/视频宽像素 (如 1920)
 * @param {*} h 屏幕/视频高像素 (如 1080)
 * @return {*} 变焦后的 H/V FOV (度)
 */
const calcZoomFov = (baseFov, zoomFactor, w = 16, h = 9) => {
  const aspect = w / h;
  const halfDiagBase = Cesium.Math.toRadians(baseFov / 2);

  // 计算变焦后的对角线切值
  const tanHalfDiagZoom = Math.tan(halfDiagBase) / zoomFactor;

  // 换算为水平和垂直 FOV (弧度)
  const tanHalfV = tanHalfDiagZoom / Math.sqrt(aspect * aspect + 1);
  const tanHalfH = tanHalfV * aspect;
  return {
    hfov: Math.atan(tanHalfH) * 2,
    vfov: Math.atan(tanHalfV) * 2,
  };
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
 * 根据变焦倍数计算当前的 HFOV 和 VFOV
 * @param {Number} zoomFactor 当前变焦倍数 (1.0, 2.0...)
 * @param {Number} baseDFOV 厂家标称的对角线FOV (大疆通常为 84)
 * @param {Number} aspect 宽高比 (通常 16/9)
 */
const getZoomedFOV = (zoomFactor, baseDFOV = 84, aspect = 16 / 9) => {
  const halfDiagRad = Cesium.Math.toRadians(baseDFOV / 2);
  // 变焦公式：tan(新视角/2) = tan(原视角/2) / 变焦倍数
  const tanHalfDiagZoom = Math.tan(halfDiagRad) / zoomFactor;

  const tanHalfV = tanHalfDiagZoom / Math.sqrt(aspect * aspect + 1);
  const tanHalfH = tanHalfV * aspect;

  return {
    h: Math.atan(tanHalfH) * 2, // 弧度
    v: Math.atan(tanHalfV) * 2,
  };
};

/**
 * 根据等效焦距计算 HFOV 和 VFOV
 * @param {Number} focalLength 等效焦距 (单位: mm，例如 24)
 * @param {Number} aspect 画面宽高比 (例如 16/9 ≈ 1.778)
 * @returns {Object} { h, v } 弧度制的水平和垂直视角
 */
const calcFovByFocalLength = (focalLength, aspect = 16 / 9) => {
  // 35mm 全画幅基准宽度为 36mm
  const sensorWidth = 36.0;

  // 计算水平视角 (HFOV)
  const hfov = 2 * Math.atan(sensorWidth / (2 * focalLength));

  // 根据宽高比推算垂直视角 (VFOV)
  // 原理：tan(VFOV/2) = tan(HFOV/2) / aspect
  const vfov = 2 * Math.atan(Math.tan(hfov / 2) / aspect);

  return {
    h: hfov, // 弧度
    v: vfov, // 弧度
  };
};

/**
 * @description: Focus on the car entity
 * @return {*}
 */
const toggleLockMode = () => {
  if (isLockMode.value) {
    releaseVehicleFollow();
    return;
  }

  const target = resolveManualFollowTarget();
  if (!target?.entity) {
    ElMessage.warning("暂无可跟随的目标");
    return;
  }

  followVehicleEntity(target.entity, target.deviceId, { force3D: true });
};

/**
 * @description: Toggle the allowAddLocation state
 * @return {*}
 */
const toggleAddLocation = () => {
  isAllowAddLocation.value = !isAllowAddLocation.value;
};

/**
 * @description: Draw vertical height indication lines
 * @param {*} viewer
 * @param {*} lng
 * @param {*} lat
 * @param {*} height
 * @param {*} color
 * @return {*}
 */
const drawVerticalLine = (viewer, lng, lat, height, color) => {
  const lineEntity = viewer.entities.add({
    polyline: {
      positions: Cesium.Cartesian3.fromDegreesArrayHeights([
        lng,
        lat,
        0, // Ground point
        lng,
        lat,
        height, // Aerial point
      ]),
      width: 2,
      material: new Cesium.PolylineDashMaterialProperty({
        color: color,
        dashLength: 8,
      }),
    },
  });
  verticalLines.push(lineEntity);
};

/**
 * @description: Manually invoke the drawing of the finish line
 * @param {*} viewer
 * @return {*}
 */
const drawEndPointMarker = (viewer) => {
  const { lng, lat, height } = window.lastPointData;
  drawVerticalLine(viewer, lng, lat, height, Cesium.Color.LAWNGREEN);
};

/**
 * @description: manually add position for running route
 * @return {*}
 */
const manuallyAddPosition = () => {
  if (runPointIndex > 4) return;
  // Simulation route
  const pathData = [
    { lng: 121.427, lat: 28.6528 },
    { lng: 121.428, lat: 28.6538 },
    { lng: 121.429, lat: 28.6548 },
    { lng: 121.43, lat: 28.6549 },
    { lng: 121.431, lat: 28.655 },
  ];
  const currentPoint = pathData[runPointIndex];
  // runningToPointWithTimeForCar(currentPoint.lng, currentPoint.lat);
  runPointIndex++;
};

/**
 * @description: move the car to the specified point with time
 * @param {*} lng
 * @param {*} lat
 * @param {*} speed
 * @return {*}
 */
const runningToPointWithTimeForCar = (lng, lat, speed = 15) => {
  const newPosition = Cesium.Cartesian3.fromDegrees(lng, lat, 0);
  const now = mainViewer.clock.currentTime;
  let arrivalTime;
  if (
    !lastScheduledTime ||
    Cesium.JulianDate.compare(lastScheduledTime, now) < 0
  ) {
    // When the car is stopped,start moving immediately
    // Start moving after 0.1 seconds to avoid time conflicts.
    arrivalTime = Cesium.JulianDate.addSeconds(
      now,
      1.0,
      new Cesium.JulianDate(),
    );
  } else {
    // When the car is in motion,we need to queue up and calcalate the travel time from that point to this one.
    const distance = Cesium.Cartesian3.distance(lastPosition, newPosition);
    const travelTime = Math.max(distance / speed, 1.0); // Time = Distance / Speed
    arrivalTime = Cesium.JulianDate.addSeconds(
      lastScheduledTime,
      travelTime,
      new Cesium.JulianDate(),
    );
  }
  // Update the position of the car(no height)
  carPositionProp.addSample(arrivalTime, newPosition);

  // Draw a point on the ground
  drawRoutePoint(mainViewer, newPosition);

  lastScheduledTime = arrivalTime;
  lastPosition = newPosition;

  // Draw the starting height line
  if (isFirstPoint) {
    mainViewer.trackedEntity = carEntity;
    isLockMode.value = true;
    switchTrackedView(mainViewer, carEntity, false);
    isPitch2D.value = false;
    // drawVerticalLine(mainViewer, lng, lat, DRONE_HEIGHT, Cesium.Color.LAWNGREEN);
    isFirstPoint = false;
  }

  // Automatically extend the end time to prevent the model from disappearing
  if (Cesium.JulianDate.compare(arrivalTime, mainViewer.clock.stopTime) > 0) {
    mainViewer.clock.stopTime = Cesium.JulianDate.addSeconds(
      arrivalTime,
      2,
      new Cesium.JulianDate(),
    );
  }
};

/**
 * @description: move the dronw to the specified point with time
 * @param {*} lng
 * @param {*} lat
 * @param {*} speed
 * @return {*}
 */
const runningToPointWithTimeForDrone = (lng, lat, speed = 30, height) => {
  const newPosition = Cesium.Cartesian3.fromDegrees(lng, lat, 0);
  const now = mainViewer.clock.currentTime;
  let arrivalTime;
  if (
    !lastDroneScheduledTime ||
    Cesium.JulianDate.compare(lastDroneScheduledTime, now) < 0
  ) {
    // When the car is stopped,start moving immediately
    // Start moving after 0.1 seconds to avoid time conflicts.
    arrivalTime = Cesium.JulianDate.addSeconds(now, 1, new Cesium.JulianDate());
  } else {
    // When the car is in motion,we need to queue up and calcalate the travel time from that point to this one.
    const distance = Cesium.Cartesian3.distance(lastDronePosition, newPosition);
    const travelTime = Math.max(distance / speed, 0.1); // Time = Distance / Speed
    arrivalTime = Cesium.JulianDate.addSeconds(
      lastDroneScheduledTime,
      travelTime,
      new Cesium.JulianDate(),
    );
  }

  // Update the position of the uav
  const dronePos = Cesium.Cartesian3.fromDegrees(lng, lat, height);
  dronePositionProp.addSample(arrivalTime, dronePos);

  lastDroneScheduledTime = arrivalTime;
  lastDronePosition = newPosition;

  // 每增加一个点，就顺手把时钟的停止时间往后拨，防止时间跑出范围
  if (Cesium.JulianDate.compare(arrivalTime, mainViewer.clock.stopTime) > 0) {
    mainViewer.clock.stopTime = Cesium.JulianDate.addSeconds(
      arrivalTime,
      2,
      new Cesium.JulianDate(),
    );
  }

  mainViewer.clock.clockRange = Cesium.ClockRange.CLAMPED;

  // Draw the starting height line
  // if (isFirstPoint) {
  // mainViewer.trackedEntity = carEntity;
  // switchTrackedView(mainViewer, carEntity, false);
  // isPitch2D.value = false;
  // drawVerticalLine(mainViewer, lng, lat, DRONE_HEIGHT, Cesium.Color.LAWNGREEN);
  // isFirstPoint = false;
  // }

  // Automatically extend the end time to prevent the model from disappearing
  // if (Cesium.JulianDate.compare(arrivalTime, mainViewer.clock.stopTime) > 0) {
  //   mainViewer.clock.stopTime = Cesium.JulianDate.addSeconds(arrivalTime, 2, new Cesium.JulianDate());
  // }
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
    switchTrackedView(mainViewer, carEntity, false);
    isPitch2D.value = false;
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
 * @description: draw a point on the ground
 * @param {*} viewer
 * @param {*} point
 * @return {*}
 */
const drawRoutePoint = (viewer, point) => {
  const entity = viewer.entities.add({
    position: point,
    point: {
      pixelSize: 8,
      color: Cesium.Color.WHITE,
      outlineColor: Cesium.Color.fromCssColorString("#00eeee"),
      outlineWidth: 2,
    },
    // label:{
    //   text: '我的标注',  // 要显示的文字
    //   font: '14px sans-serif',
    //   fillColor: Cesium.Color.YELLOW,
    //   outlineColor: Cesium.Color.BLACK,
    //   outlineWidth: 2,
    //   style: Cesium.LabelStyle.FILL_AND_OUTLINE,
    //   // 调整标签位置，使其居中在点上
    //   pixelOffset: new Cesium.Cartesian2(0, 0),  // 水平和垂直偏移
    //   verticalOrigin: Cesium.VerticalOrigin.CENTER,  // 垂直居中
    //   horizontalOrigin: Cesium.HorizontalOrigin.CENTER,  // 水平居中
    //   showBackground: true,  // 可选：显示背景
    //   backgroundColor: new Cesium.Color(0.1, 0.1, 0.1, 0.8),  // 背景颜色
    //   backgroundPadding: new Cesium.Cartesian2(5, 3)  // 背景内边距
    // }
  });
  routeMarkers.push(entity);
};

/**
 * @description: Initialization of click control
 * @param {*} viewer
 * @return {*}
 */
const initClickControl = (viewer) => {
  const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
  handler.setInputAction((click) => {
    if (!isAllowAddLocation.value) return;
    const ray = viewer.camera.getPickRay(click.position);
    const cartesian = viewer.scene.globe.pick(ray, viewer.scene);

    if (Cesium.defined(cartesian)) {
      const cartographic = Cesium.Cartographic.fromCartesian(cartesian);
      const lng = Cesium.Math.toDegrees(cartographic.longitude);
      const lat = Cesium.Math.toDegrees(cartographic.latitude);

      if (isFirstPoint) {
        // runningToPointWithTimeForCar(lng, lat);
        mainViewer.trackedEntity = carEntity;
        isLockMode.value = true;
        switchTrackedView(mainViewer, carEntity, false);
        isPitch2D.value = false;
        isFirstPoint = false;
      } else {
        // moveToNewPointAlongRoad(viewer, lng, lat);
      }

      droneState.attitude_head = 40.8;
      droneState.attitude_pitch = 0;
      droneState.attitude_roll = -0.6;
      droneState.gimbal_pitch = -90;
      droneState.gimbal_roll = 0;
      droneState.gimbal_yaw = 0;
      droneState.zoom_factor += 0.05;
      isAttitudeValid = true;

      systemStore.setDroneCurrentState(cloneDeep(droneState));

      updateEntityPosition(carPositionProp, lng, lat, 0);

      // !TEST: move the drone to the specified point with time
      // runningToPointWithTimeForDrone(lng, lat, 15, 30);

      updateDroneRealtime(lng, lat, 80);
    }
  }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
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
    // 当允许添加位置时，不处理车辆点击
    if (isAllowAddLocation.value) return;

    // 拾取点击的对象
    const pickedObject = viewer.scene.pick(click.position);

    if (Cesium.defined(pickedObject) && pickedObject.id) {
      const entity = pickedObject.id;

      const drone = getDroneDeviceFromEntity(entity);
      if (drone) {
        emit("open-drone-stream", drone);
        return;
      }

      const deviceId = getVehicleDeviceIdFromEntity(entity);
      const targetEntry = deviceId ? resolveTargetMapEntry(deviceId) : null;
      if (targetEntry) {
        setTargetSelected(deviceId);
        const lastPos = resolveTargetDisplayPosition(deviceId);
        if (robotManager.robots.has(deviceId)) {
          openRobotStreamForTarget(deviceId);
        }
        if (TEST_POLICE_VEHICLES.some((v) => v.id === deviceId)) {
          showTestVehicleDialog(deviceId, lastPos);
        } else {
          void showApiVehiclePopup(deviceId, lastPos);
        }
        return;
      }
    }

    clearTargetSelection();
    closePoliceVehiclePopup();
  }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
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
  const resolvedPosition = position || resolveTargetDisplayPosition(deviceId);
  if (!resolvedPosition) return;

  const vehicleData = (Array.isArray(deviceStore.targets) ? deviceStore.targets : []).find(
    (v) => String(v.id) === String(deviceId),
  );
  if (!(await ensureTargetBindAllowed(resolveVehicleTargetSn(vehicleData)))) return;

  policeVehiclePopup.deviceId = deviceId;
  policeVehiclePopup.vehicleName = vehicleData?.name || deviceId;
  policeVehiclePopup.targetTypeLabel = getTargetTypeLabel(vehicleData);
  policeVehiclePopup.alertInfo =
    String(vehicleData?.raw?.description || "").trim() || "暂无描述";
  policeVehiclePopup.coordText = `${resolvedPosition.longitude.toFixed(6)}, ${resolvedPosition.latitude.toFixed(6)}`;
  policeVehiclePopup.drones = [];
  policeVehiclePopup.selectedDroneId = "";
  policeVehiclePopup.visible = true;

  updatePolicePopupScreenPosition();
  attachPolicePopupTracker();
  loadSuggestedDronesForPopup(deviceId, resolvedPosition);
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

/**
 * @description: clear running route
 * @return {*}
 */
const clearRunningRoute = () => {
  // Reset the position attribute of the model
  carPositionProp = new Cesium.SampledPositionProperty();
  dronePositionProp = new Cesium.SampledPositionProperty();
  [carPositionProp, dronePositionProp].forEach((prop) => {
    prop.forwardExtrapolationType = Cesium.ExtrapolationType.HOLD;
    prop.setInterpolationOptions({
      interpolationDegree: 1,
      interpolationAlgorithm: Cesium.LagrangePolynomialApproximation, //HermitePolynomialApproximation
    });
  });
  droneOrientationProp = new Cesium.SampledProperty(Cesium.Quaternion);
  // Rebind the position attribute to the model
  if (carEntity) carEntity.position = carPositionProp;
  if (droneEntity) droneEntity.position = dronePositionProp;

  // Remove the point markers on the map
  routeMarkers.forEach((entity) => mainViewer.entities.remove(entity));
  routeMarkers.length = 0;

  // 清除所有车辆
  vehicleManager.clearAll();

  // 重置初始状态
  isFirstPoint = true;
  followedVehicleDeviceId = null;
  pendingEscortLockTargetId = null;
  isLockMode.value = false;
  mainViewer.trackedEntity = undefined;

  // Remove the location markers on the map
  locationMarkers.forEach((entity) => mainViewer.entities.remove(entity));
  locationMarkers.length = 0;

  // Remove the vertical lines on the map
  verticalLines.forEach((entity) => mainViewer.entities.remove(entity));
  verticalLines.length = 0;

  // Reset the logical variable
  lastScheduledTime = null;
  lastPosition = null;
  lastDroneScheduledTime = null;
  lastDronePosition = null;
  runPointIndex = 0;
  isFirstPoint = true;

  // 清除测试数据
  droneTestManager.clearAll();
  escortTimers.forEach((timer) => clearInterval(timer));
  escortTimers.clear();
  deviceStore.clearTestDevices();
};

// ========== 测试数据设置 ==========
// TEST_POLICE_VEHICLES / TEST_DRONES 从 @/config/test-devices.js 统一导入

// 伴飞跟踪定时器
const escortTimers = new Map();



/**
 * @description: 模拟伴飞 - 让指定无人机飞向并跟随指定车辆（本地模拟，不依赖后端）
 */
function startEscortSimulation(vehicleId, droneId) {
  const vehicle = vehicleManager.vehicles.get(vehicleId);
  const drone = droneTestManager.drones.get(droneId);
  if (!vehicle || !drone) {
    ElMessage.error("车辆或无人机不存在");
    return;
  }

  // 清除该无人机旧的跟踪定时器
  const oldTimer = escortTimers.get(droneId);
  if (oldTimer) clearInterval(oldTimer);

  // 立即飞向车辆当前位置
  const vehiclePos = vehicle.lastPosition;
  if (vehiclePos) {
    droneTestManager.flyToPoint(
      droneId,
      vehiclePos.longitude,
      vehiclePos.latitude,
      30,
      80,
    );
  }

  // 每2秒更新一次，让无人机持续跟随车辆
  const timer = setInterval(() => {
    const curVehiclePos = vehicle.lastPosition;
    if (curVehiclePos) {
      droneTestManager.flyToPoint(
        droneId,
        curVehiclePos.longitude,
        curVehiclePos.latitude,
        30,
        80,
      );
    }
  }, 2000);

  escortTimers.set(droneId, timer);
  deviceStore.setDroneEscorting(droneId, vehicleId);
  ElMessage.success(`无人机 ${droneId} 已开始伴飞车辆 ${vehicleId}`);
}

// 测试发送消息
let sendCarMessageTimer = null;
let sendDroneMessageTimer = null;
let sendCarMessageCount = 0;
let sendDroneMessageCount = 0;

/**
 * @description: 清理测试消息定时器
 * @return {*}
 */
const clearPublishMessageTimers = () => {
  if (sendCarMessageTimer) {
    clearInterval(sendCarMessageTimer);
    sendCarMessageTimer = null;
    sendCarMessageCount = 0;
  }
  if (sendDroneMessageTimer) {
    clearInterval(sendDroneMessageTimer);
    sendDroneMessageTimer = null;
    sendDroneMessageCount = 0;
  }
};

/**
 * @description: 开始发送测试消息
 * @return {*}
 */
const startPublishMessage = () => {
  // 先清理已有的定时器，避免重复创建
  clearPublishMessageTimers();

  const { carMessageList, droneMessageList } = testJson;
  if (!carMessageList?.length || !droneMessageList?.length) {
    console.warn("测试数据为空，无法发送消息");
    return;
  }

  // 发送消息
  sendCarMessageTimer = setInterval(() => {
    if (sendCarMessageCount < carMessageList.length) {
      const carMessage = carMessageList[sendCarMessageCount];
      mqttService.publish(targetTopic, JSON.stringify(carMessage));

      const dynamicCarMessage = new Array(10).fill(null).map((item, index) => {
        // 绘制以当前定位为圆心散开的随机10个点
        return {
          ...carMessage,
          current_longitude:
            carMessage.current_longitude + 0.001 * Math.random(),
          current_latitude: carMessage.current_latitude + 0.001 * Math.random(),
        };
      });
      drawDynamicCar(mainViewer, dynamicCarMessage);

      sendCarMessageCount++;
    } else {
      clearInterval(sendCarMessageTimer);
      sendCarMessageTimer = null;
      sendCarMessageCount = 0;
    }
  }, 1000);

  sendDroneMessageTimer = setInterval(() => {
    if (sendDroneMessageCount < droneMessageList.length) {
      const droneMessage = droneMessageList[sendDroneMessageCount];
      mqttService.publish(droneTopic, JSON.stringify(droneMessage));
      sendDroneMessageCount++;
    } else {
      clearInterval(sendDroneMessageTimer);
      sendDroneMessageTimer = null;
      sendDroneMessageCount = 0;
    }
  }, 1000);
};

/**
 * @description: get current location and set center
 * @return {*}
 */
const getCurrentLocation = () => {
  /** Notes
   * The browser, for the sake of privacy and security, makes the Geolocation API (navigator.geolocation) effective only in an HTTPS environment.
   * During local development, http://localhost or http://127.0.0.1 are usually regarded as a secure context and can be used for normal testing.
   * Once deployed to the online environment, an SSL certificate (HTTPS) must be configured; otherwise, navigator.geolocation will be undefined.
   */
  // addCustomLocationIcon(mainViewer, 121.408921, 28.654725, "您的当前位置"); //{ lng: 121.427, lat: 28.6528 }
  // return;
  if (!navigator.geolocation) {
    alert("您的浏览器不支持地理定位");
    return;
  }
  navigator.geolocation.getCurrentPosition(
    (position) => {
      const { longitude, latitude } = position.coords;

      mainViewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(longitude, latitude, 1000),
        orientation: {
          heading: Cesium.Math.toRadians(0),
          pitch: Cesium.Math.toRadians(-90),
          roll: 0,
        },
        duration: 2.0,
      });

      // Mark the location on the map
      addCustomLocationIcon(mainViewer, longitude, latitude, "您的当前位置");
    },
    (error) => {
      switch (error.code) {
        case error.PERMISSION_DENIED:
          alert("用户拒绝了地理定位请求");
          break;
        case error.POSITION_UNAVAILABLE:
          alert("位置信息不可用");
          break;
        case error.TIMEOUT:
          alert("请求用户地理定位超时");
          break;
        default:
          alert("发生未知错误");
          break;
      }
    },
    {
      // Enabling high accuracy will attempt to obtain more precise location (such as GPS), but it will be slower.
      enableHighAccuracy: true,
      timeout: 5000,
      maximumAge: 0,
    },
  );
};

/**
 * @description: add custom location icon
 * @param {*} viewer
 * @param {*} lng
 * @param {*} lat
 * @param {*} name
 * @return {*}
 */
const addCustomLocationIcon = (viewer, lng, lat, name) => {
  console.log(lng, lat, name);
  const entity = viewer.entities.add({
    name: name,
    position: Cesium.Cartesian3.fromDegrees(lng, lat, 0),
    // The Billboard property is used to display icons.
    billboard: {
      image: "/icons/location.png",
      width: 48,
      height: 48,
      scale: 1.0,
      // Set the alignment
      verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
      // Scale with distance (smaller at a distance, larger up close)
      scaleByDistance: new Cesium.NearFarScalar(100, 1.5, 5000, 0.5),
      // Solve the problem where the icons are obscured by 3D buildings or terrain.
      disableDepthTestDistance: Number.POSITIVE_INFINITY,
    },
    label: {
      text: name,
      font: "14px sans-serif bold",
      fillColor: Cesium.Color.DEEPSKYBLUE,
      style: Cesium.LabelStyle.FILL_AND_OUTLINE,
      outlineWidth: 2,
      verticalOrigin: Cesium.VerticalOrigin.TOP,
      pixelOffset: new Cesium.Cartesian2(0, 5),
    },
  });
  locationMarkers.push(entity);
};

/**
 * @description: Move to point along road
 * @param {*} viewer
 * @param {*} destinationLng
 * @param {*} destinationLat
 * @return {*}
 */
const moveToNewPointAlongRoad = async (
  viewer,
  destinationLng,
  destinationLat,
) => {
  // get start location
  const now = viewer.clock.currentTime;

  // If the car is moving, the new route should start from the lastScheduledTime moment
  // If the car is stopped, the new route should start from the current time
  let startTime;
  if (
    lastScheduledTime &&
    Cesium.JulianDate.compare(lastScheduledTime, now) > 0
  ) {
    startTime = lastScheduledTime;
  } else {
    startTime = now;
  }

  // Get the car position at the startTime moment
  // If the car is moving, this position is the car position at the lastScheduledTime moment
  // If the car is stopped, this position is the current position
  let startPosCartesian = carPositionProp.getValue(startTime);
  if (!startPosCartesian && lastPosition) {
    // If can not get the position, use the lastPosition as the backup
    startPosCartesian = lastPosition;
  }
  if (!startPosCartesian) {
    console.warn("无法获取起始位置，请先设置起始点");
    return;
  }

  const startCarto = Cesium.Cartographic.fromCartesian(startPosCartesian);
  const startLng = Cesium.Math.toDegrees(startCarto.longitude);
  const startLat = Cesium.Math.toDegrees(startCarto.latitude);

  // get destina location
  const destinaPosition = Cesium.Cartesian3.fromDegrees(
    destinationLng,
    destinationLat,
    0,
  );

  // Get the driving route (from the car position at the startTime moment to the destination)
  // const routePoints = await requestRouteFromTDT(startLng, startLat, destinationLng, destinationLat);

  // console.log("routePoints", routePoints);
  const routePoints = [
    { lng: startLng, lat: startLat },
    { lng: destinationLng, lat: destinationLat },
  ];

  if (!routePoints || routePoints.length === 0) return;
  console.log("routePoints", routePoints);

  // The new route should start from the startTime moment (if the car is moving, it should start from the lastScheduledTime moment)
  // Add a small delay to avoid conflicts with existing sampled points
  let currentTime = Cesium.JulianDate.addSeconds(
    startTime,
    0.1,
    new Cesium.JulianDate(),
  );

  // Check if the first point of the route is close to the start position
  // If the distance is greater than 10 meters, it means the route starts from a different point than the start position
  const firstRoutePoint = Cesium.Cartesian3.fromDegrees(
    routePoints[0].lng,
    routePoints[0].lat,
    0,
  );
  const distanceToFirstPoint = Cesium.Cartesian3.distance(
    startPosCartesian,
    firstRoutePoint,
  );
  // If the distance is greater than 10 meters, start from the first point; otherwise, skip the first point
  let startIndex = distanceToFirstPoint > 10 ? 0 : 1;

  // If the first point of the route is far away from the start position, add the start position as the first point to ensure smooth transition
  if (startIndex === 0 && distanceToFirstPoint > 10) {
    // Add the start position as the first point (ensuring the drone starts from the actual car position)
    carPositionProp.addSample(currentTime, startPosCartesian);
    const startDronePos = Cesium.Cartesian3.fromDegrees(
      startLng,
      startLat,
      DRONE_HEIGHT,
    );
    dronePositionProp.addSample(currentTime, startDronePos);
    // Calculate the time it takes to reach the first point (at a speed of 15 meters per second)
    // Add a small delay to avoid conflicts with existing sampled points
    const durationToFirst = Math.max(distanceToFirstPoint / CAR_SPEED, 0.1);
    currentTime = Cesium.JulianDate.addSeconds(
      currentTime,
      durationToFirst,
      new Cesium.JulianDate(),
    );
    // Add the first point of the route (ensuring the drone moves to the actual first point)
    const firstPointCartesian = Cesium.Cartesian3.fromDegrees(
      routePoints[0].lng,
      routePoints[0].lat,
      0,
    );
    carPositionProp.addSample(currentTime, firstPointCartesian);
    dronePositionProp.addSample(
      currentTime,
      Cesium.Cartesian3.fromDegrees(
        routePoints[0].lng,
        routePoints[0].lat,
        DRONE_HEIGHT,
      ),
    );
    lastPosition = firstPointCartesian;
    // Start from the second point of the route (ensuring the drone moves to the actual first point)
    startIndex = 1;
  }

  // Traverse the route points returned by the route calculation, adding each point to the path
  for (let i = startIndex; i < routePoints.length; i++) {
    const p2 = routePoints[i];
    const p2Cartesian = Cesium.Cartesian3.fromDegrees(p2.lng, p2.lat, 0);

    // Calculate the distance between the current point and the previous point
    let distance;
    if (i === startIndex && startIndex === 1) {
      // If the first point is skipped (startIndex === 1), the distance to the first point should be calculated from the start position
      distance = Cesium.Cartesian3.distance(startPosCartesian, p2Cartesian);
    } else {
      // For other points, calculate the distance from the previous point
      const p1 = routePoints[i - 1];
      const p1Cartesian = Cesium.Cartesian3.fromDegrees(p1.lng, p1.lat);
      distance = Cesium.Cartesian3.distance(p1Cartesian, p2Cartesian);
    }

    // Calculate the time it takes to walk this segment of the route (at a speed of 15 meters per second)
    const duration = Math.max(distance / CAR_SPEED, 0.1); // Minimum 0.1 seconds, avoid too short time
    currentTime = Cesium.JulianDate.addSeconds(
      currentTime,
      duration,
      new Cesium.JulianDate(),
    );

    // Add the current point to the car position sampling property
    carPositionProp.addSample(currentTime, p2Cartesian);
    // Add the current point to the drone position sampling property (with a height offset)
    // dronePositionProp.addSample(currentTime, Cesium.Cartesian3.fromDegrees(p2.lng, p2.lat, DRONE_HEIGHT));
    // Update the last recorded position
    lastPosition = p2Cartesian;
  }

  drawRoutePoint(viewer, destinaPosition);

  lastScheduledTime = currentTime;

  // Update the clock end time if necessary
  if (Cesium.JulianDate.compare(currentTime, viewer.clock.stopTime) > 0) {
    viewer.clock.stopTime = Cesium.JulianDate.addSeconds(
      currentTime,
      2,
      new Cesium.JulianDate(),
    );
  }
};

/**
 * @description: get route from Tianditu
 * @param {*} startLng
 * @param {*} startLat
 * @param {*} endLng
 * @param {*} endLat
 * @return {*}
 */
async function requestRouteFromTDT(startLng, startLat, endLng, endLat) {
  const postStr = JSON.stringify({
    orig: `${startLng},${startLat}`,
    dest: `${endLng},${endLat}`,
    style: "0", // 0:least time, 1:shortest distance 2.avoid high speed 3.walk
  });
  console.log("postStr", {
    orig: `${startLng},${startLat}`,
    dest: `${endLng},${endLat}`,
    style: "0",
  });
  const url = `https://api.tianditu.gov.cn/drive?postStr=${postStr}&type=search&tk=${getTDT_TK()}`;
  try {
    const response = await axios.get(url);
    console.log("response", response);
    if (response.status === 200) {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(response.data, "application/xml");
      console.log("xmlDoc", xmlDoc);
      let routelatlon =
        xmlDoc.getElementsByTagName("routelatlon")[0].textContent;
      routelatlon = routelatlon.substring(0, routelatlon.length - 1);
      const points = routelatlon.split(";").map((item) => {
        const parts = item.split(",");
        return { lng: parseFloat(parts[0]), lat: parseFloat(parts[1]) };
      });
      return points;
    }
  } catch (e) {
    console.warn("request route fail", e);
    return [];
  }
}

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
    followVehicleEntity(resolved.entity, id, { force3D: true });
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

/**
 * 沉浸伴飞：锁定当前视频对应伴飞目标
 * - 已锁定同一目标：忽略
 * - 未锁定：锁定
 * - 已锁定其他目标：切换到新目标
 */
let immersiveMapFocusActive = false;
let immersiveMapFocusTargetId = null;
let immersiveMapFocusDroneId = null;
let immersiveMapFocusDroneKeys = new Set();

function resolveImmersiveDroneKeys(droneId) {
  const id = String(droneId || "").trim();
  const keys = new Set();
  if (!id) return keys;

  const drone =
    deviceStore.drones.find((d) => String(d?.id || "") === id) ||
    deviceStore.drones.find((d) => String(d?.sn || "") === id) ||
    deviceStore.drones.find((d) => String(d?.mqttSn || "") === id);

  if (drone) {
    const primary = getDroneEntityKey(drone);
    if (primary) keys.add(primary);
    [drone.id, drone.sn, drone.mqttSn].forEach((alias) => {
      const key = String(alias || "").trim();
      if (key) keys.add(key);
    });
  } else {
    keys.add(id);
  }
  return keys;
}

function applyImmersiveMapEntityVisibility() {
  if (!mainViewer || mainViewer.isDestroyed?.() || !immersiveMapFocusActive) return;

  const targetId = String(immersiveMapFocusTargetId || "").trim();
  const droneKeys = immersiveMapFocusDroneKeys;

  vehicleManager.vehicles.forEach((vehicle, id) => {
    if (vehicle?.entity) vehicle.entity.show = String(id) === targetId;
  });
  officerManager.officers.forEach((officer, id) => {
    if (officer?.entity) officer.entity.show = String(id) === targetId;
  });
  robotManager.robots.forEach((robot, id) => {
    if (robot?.entity) robot.entity.show = String(id) === targetId;
  });
  droneTestManager.drones.forEach((drone, id) => {
    if (drone?.entity) drone.entity.show = droneKeys.has(String(id));
  });

  if (carEntity) carEntity.show = false;
  if (droneEntity) {
    const legacyKey = String(drone_id || "").trim();
    droneEntity.show = legacyKey && droneKeys.has(legacyKey);
  }

  lockdownEntities.forEach((entity) => {
    if (entity) entity.show = false;
  });
  companionRouteEntities.forEach((entity) => {
    if (entity) entity.show = false;
  });
  routeMarkers.forEach((entity) => {
    if (entity) entity.show = false;
  });
  verticalLines.forEach((entity) => {
    if (entity) entity.show = false;
  });
  flightPlanPolygonEntities.forEach((entity) => {
    if (entity) entity.show = false;
  });

  mainViewer?.scene?.requestRender?.();
}

function restoreMapVisibilityAfterImmersive() {
  if (!mainViewer || mainViewer.isDestroyed?.()) return;

  vehicleManager.vehicles.forEach((vehicle) => {
    if (vehicle?.entity) vehicle.entity.show = targetLayerVisibility.policeCar;
  });
  officerManager.officers.forEach((officer) => {
    if (officer?.entity) officer.entity.show = targetLayerVisibility.officer;
  });
  robotManager.robots.forEach((robot) => {
    if (robot?.entity) robot.entity.show = targetLayerVisibility.robot;
  });
  droneTestManager.drones.forEach((drone) => {
    if (drone?.entity) drone.entity.show = true;
  });

  if (carEntity) carEntity.show = targetLayerVisibility.policeCar;
  if (droneEntity) droneEntity.show = true;

  lockdownEntities.forEach((entity) => {
    if (entity) entity.show = true;
  });
  companionRouteEntities.forEach((entity) => {
    if (entity) entity.show = routeLayerVisible;
  });
  routeMarkers.forEach((entity) => {
    if (entity) entity.show = routeLayerVisible;
  });
  verticalLines.forEach((entity) => {
    if (entity) entity.show = routeLayerVisible;
  });
  flightPlanPolygonEntities.forEach((entity) => {
    if (entity) entity.show = true;
  });

  mainViewer?.scene?.requestRender?.();
}

function setImmersiveMapFocus(active, targetId = "", droneId = "") {
  if (active) {
    const tid = String(targetId || "").trim();
    const did = String(droneId || "").trim();
    if (!tid || !did) return false;

    immersiveMapFocusActive = true;
    immersiveMapFocusTargetId = tid;
    immersiveMapFocusDroneId = did;
    immersiveMapFocusDroneKeys = resolveImmersiveDroneKeys(did);
    applyImmersiveMapEntityVisibility();
    return true;
  }

  immersiveMapFocusActive = false;
  immersiveMapFocusTargetId = null;
  immersiveMapFocusDroneId = null;
  immersiveMapFocusDroneKeys = new Set();
  restoreMapVisibilityAfterImmersive();
  return true;
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

/**
 * 告警伴飞弹窗：沉浸模式下额外提供「开始伴飞并跳转」
 * @returns {Promise<null | 'follow-full' | 'follow-only' | 'follow-and-switch'>}
 */
function promptAlarmEscortAction({
  deviceId,
  vehicleName,
  targetTypeLabel,
  optionsHtml,
  isImmersive,
  hasSuggestedDrones,
}) {
  const immersiveActionsHtml =
    isImmersive && hasSuggestedDrones
      ? `<div class="alarm-dialog__immersive-btns">
        <button type="button" id="alarm-start-follow-only" class="alarm-dialog__btn alarm-dialog__btn--primary">开始伴飞</button>
        <button type="button" id="alarm-start-follow-jump" class="alarm-dialog__btn alarm-dialog__btn--jump" title="将退出当前沉浸并切换到新伴飞目标">开始伴飞并跳转</button>
      </div>`
      : "";

  const html = `<style>
      #alarm-drone-select option { color: #fff; background: #1c222a; }
    </style>
    <div style="padding: 10px;">
      <h4 style="margin: 0 0 10px 0;">接收到伴飞请求</h4>
      <p style="margin: 0 0 10px 0;">目标设备：${vehicleName}（${targetTypeLabel}）</p>
      <div style="margin-top:10px;display: flex;">
        <label for="alarm-drone-select" style="margin-left: -18px;">推荐无人机：</label>
        <select id="alarm-drone-select" style="width:250px;height:32px;padding:8px;border:1px solid #30363b;background:rgba(255,255,255,0.08);border-radius:2px;color:#fff;">
          ${optionsHtml}
        </select>
      </div>
      ${immersiveActionsHtml}
    </div>`;

  return new Promise((resolve) => {
    let settled = false;
    const finish = (action) => {
      if (settled) return;
      settled = true;
      resolve(action);
    };

    ElMessageBox({
      title: "伴飞请求",
      message: html,
      dangerouslyUseHTMLString: true,
      showConfirmButton: !isImmersive && hasSuggestedDrones,
      showCancelButton: true,
      confirmButtonText: "开始伴飞",
      cancelButtonText: "取消",
      type: "warning",
      customClass: isImmersive
        ? "alarm-dialog alarm-dialog--immersive"
        : "alarm-dialog",
      closeOnClickModal: false,
      beforeClose: (action, _instance, done) => {
        if (!settled && (action === "cancel" || action === "close")) {
          finish(null);
        }
        done();
      },
    })
      .then(() => {
        if (!isImmersive && hasSuggestedDrones) finish("follow-full");
      })
      .catch(() => finish(null));

    if (isImmersive && hasSuggestedDrones) {
      requestAnimationFrame(() => {
        const bind = (elementId, action) => {
          const btn = document.getElementById(elementId);
          if (!btn) return;
          btn.addEventListener(
            "click",
            () => {
              ElMessageBox.close();
              finish(action);
            },
            { once: true },
          );
        };
        bind("alarm-start-follow-only", "follow-only");
        bind("alarm-start-follow-jump", "follow-and-switch");
      });
    }
  });
}

function readAlarmDroneSelection(suggestedList) {
  const selectEl = document.getElementById("alarm-drone-select");
  const selectedId = selectEl?.value || "";
  const selected = suggestedList.find(
    (d) => String(d?.id ?? d?.sn ?? "") === String(selectedId),
  );
  const droneSn = String(selected?.sn || "");
  return { selectedId, droneSn };
}

/**
 * @description: 显示告警伴飞请求对话框
 */
const showAlarmDialog = async (deviceId, devicePosition, terminalPhone) => {
  const sn = String(terminalPhone ?? "").trim();
  if (!(await ensureTargetBindAllowed(sn))) return;

  const vehicleData = (Array.isArray(deviceStore.targets) ? deviceStore.targets : []).find(
    (v) => String(v.id) === String(deviceId),
  );
  const vehicleName = vehicleData?.name || deviceId;
  const targetTypeLabel = getTargetTypeLabel(vehicleData);
  const suggestedList = mapSuggestedDronesForSelect(
    await getReadySuggestedDrones(
      buildSuggestDronesQuery(deviceId, devicePosition),
      true,
    ),
  );

  const optionsHtml = suggestedList.length
    ? suggestedList
        .map(
          (d, idx) =>
            `<option value="${d.id}" data-sn="${d.sn}" ${idx === 0 ? "selected" : ""}>${d.label}</option>`,
        )
        .join("")
    : '<option value="">暂无可用无人机</option>';

  const hasSuggestedDrones = suggestedList.length > 0;
  const isImmersive = Boolean(props.immersiveFlight);
  const action = await promptAlarmEscortAction({
    deviceId,
    vehicleName,
    targetTypeLabel,
    optionsHtml,
    isImmersive,
    hasSuggestedDrones,
  });
  if (!action) return;

  const { selectedId, droneSn } = readAlarmDroneSelection(suggestedList);
  await applyEscortFollowAction(action, deviceId, droneSn, selectedId);
};

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
  // 按 SN 查找伴飞目标，统一使用 target.id 作为车辆 ID
  const target = (Array.isArray(deviceStore.targets) ? deviceStore.targets : []).find(
    (t) => String(t?.sn || "").trim() === sn,
  );
  const deviceId = String(target?.id || sn);
  if (target && sn && deviceId !== sn) {
    target.mqttSn = sn;
    vehicleManager.removeVehicle(sn);
  }

  const { alarmFlag, terminalPhone } = data;
  const latitude = toFiniteNumber(data.latitude);
  const longitude = toFiniteNumber(data.longitude);

  if (Number.isFinite(latitude) && Number.isFinite(longitude) && (latitude !== 0 || longitude !== 0)) {
    if (target) {
      target.lat = latitude;
      target.lng = longitude;
    }
    const label = target?.name || deviceId;
    const targetType = resolveTargetType(target);

    if (targetType === 2) {
      vehicleManager.removeVehicle(deviceId);
      robotManager.removeRobot(deviceId);
      officerManager.createOfficer(mainViewer, deviceId, label);
      officerManager.updateOfficerLabel(deviceId, label);
      officerManager.updateOfficerPosition(deviceId, longitude, latitude, 0);
    } else if (targetType === 3) {
      vehicleManager.removeVehicle(deviceId);
      officerManager.removeOfficer(deviceId);
      robotManager.createRobot(mainViewer, deviceId, label);
      robotManager.updateRobotLabel(deviceId, label);
      robotManager.updateRobotPosition(deviceId, longitude, latitude, 0);
    } else {
      officerManager.removeOfficer(deviceId);
      robotManager.removeRobot(deviceId);
      vehicleManager.createVehicle(mainViewer, deviceId, label);
      vehicleManager.updateVehicleLabel(deviceId, label);
      vehicleManager.updateVehiclePosition(deviceId, longitude, latitude, 0);
    }

    if (shouldRefreshFollowOnMqtt(deviceId)) {
      const locked = resolveFollowTargetEntity(deviceId);
      if (locked?.entity) {
        followVehicleEntity(locked.entity, deviceId, { resetViewFrom: false });
      }
    }

    // 伴飞待锁目标：实体刚创建或位置更新时尝试补锁
    tryApplyPendingEscortLock(deviceId);
  }

  if (alarmFlag && alarmFlag !== 0) {
    void showAlarmDialog(deviceId, { longitude, latitude }, terminalPhone);
  }

  systemStore.addCarMessage({ ...data, deviceId });
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
      robotManager.createRobot(mainViewer, id, label);
      robotManager.updateRobotLabel(id, label);
      robotManager.updateRobotPosition(id, lng, lat, 0);
      const robot = robotManager.robots.get(id);
      if (robot?.entity) robot.entity.show = targetLayerVisibility.robot;
      return;
    }

    if (targetType === 1 || !Number.isFinite(targetType)) {
      officerManager.removeOfficer(id);
      robotManager.removeRobot(id);
      vehicleManager.createVehicle(mainViewer, id, label);
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

  const droneList = Array.isArray(deviceStore.drones) ? deviceStore.drones : [];
  const activeDroneKeys = new Set();
  const currentEscortingKeys = new Set();
  droneList.forEach((drone) => {
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
  orphanIds.forEach((id) => droneTestManager.removeDrone(id));

  if (props.activeEscortDroneId) {
    syncEscortTargetHighlight(props.activeEscortDroneId);
  }

  // 仅在首屏时，根据 droneList 的经纬度自动框选无人机到一屏
  flyToInitialDroneOverview();

  if (immersiveMapFocusActive) {
    immersiveMapFocusDroneKeys = resolveImmersiveDroneKeys(
      immersiveMapFocusDroneId,
    );
    applyImmersiveMapEntityVisibility();
  }
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

const handleSend = () => {
  const payload = {
    time: new Date().toLocaleTimeString(),
    text: "Hello from Vue 3!",
  };
  mqttService.publish(targetTopic, payload);
};

/**
 * @description: 初始化右下角子窗口
 * @return {*}
 */
const initSubViewer = () => {
  subViewer = new Cesium.Viewer("subViewerContainer", {
    sceneMode: Cesium.SceneMode.SCENE3D,
    shouldAnimate: true,
    sceneModePicker: false,
    navigationHelpButton: false,
    geocoder: false,
    homeButton: false,
    baseLayerPicker: false,
    animation: false,
    timeline: false,
    fullscreenButton: false,
    // animation: false,
    // timeline: false,
    infoBox: false,
    selectionIndicator: false,
    // geocoder: false,
    // sceneModePicker: false,
    // baseLayerPicker: false,
    // navigationHelpButton: false,
    // homeButton: false,
    // fullscreenButton: false,
    creditContainer: document.createElement("div"), // 隐藏logo
  });

  viewerLoadCount.value++;

  // 设置摄像头底图（与主图一致）
  subViewer.scene.skyAtmosphere.show = false;
  subViewer.scene.fog.enabled = false;
  if (subViewer.scene.skyBox) {
    subViewer.scene.skyBox.show = false;
  }
  subViewer.scene.backgroundColor =
    Cesium.Color.fromCssColorString(MAP_BASE_COLOR_HEX);
  subViewer.scene.globe.baseColor =
    Cesium.Color.fromCssColorString(MAP_BASE_COLOR_HEX);
  subViewer.imageryLayers.removeAll();
  const ImgWLayer = getTdtLayerProvider("img_w", { blueTint: true });
  satelliteLayer = subViewer.imageryLayers.addImageryProvider(ImgWLayer);
  satelliteLayer.maximumTerrainLevel = MAX_LEVEL;
  const CiaWLayer = getTdtLayerProvider("cia_w");
  satelMarkLayer = subViewer.imageryLayers.addImageryProvider(CiaWLayer);
  satelMarkLayer.maximumTerrainLevel = MAX_LEVEL;
  applyLabelImageryTone(satelMarkLayer);
  const VecWLayer = getTdtLayerProvider("vec_w");
  vectorLayer = subViewer.imageryLayers.addImageryProvider(VecWLayer);
  vectorLayer.maximumTerrainLevel = MAX_LEVEL;
  vectorLayer.show = false;
  const CvaWLayer = getTdtLayerProvider("cva_w");
  vectorMarkLayer = subViewer.imageryLayers.addImageryProvider(CvaWLayer);
  vectorMarkLayer.maximumTerrainLevel = MAX_LEVEL;
  applyLabelImageryTone(vectorMarkLayer);
  vectorMarkLayer.show = false;

  // 将相机固定在某个坐标
  subViewer.camera.setView({
    destination: CAMERA_POS,
    // orientation: { heading: 0, pitch: Cesium.Math.toRadians(-20), roll: 0 },
    orientation: {
      heading: Cesium.Math.toRadians(0), // 正北
      pitch: Cesium.Math.toRadians(-90),
      roll: 0,
    },
  });

  // 锁定位置：禁止用户通过洗盘/拖拽改变位置，只能右键旋转视角
  subViewer.scene.screenSpaceCameraController.enableTranslate = true; // 允许平移
  subViewer.scene.screenSpaceCameraController.enableZoom = true; // 允许缩放(FOV)
  subViewer.scene.screenSpaceCameraController.enableTilt = true; // 允许倾斜
  subViewer.scene.screenSpaceCameraController.enableRotate = true; // 允许旋转

  // 调小近裁切面 ---
  subViewer.scene.camera.frustum.near = 0.1;

  setTimeout(() => {
    addCameraHUD(subViewer);
  }, 200);
};

/**
 * 在小窗中添加相机取景框（边角 HUD）
 * @param {Cesium.Viewer} subViewer 小窗实例
 */
const addCameraHUD = (subViewer) => {
  const NEAR_DIST = 40.0;
  const LINE_LEN_RATIO = 0.2; // 边角线长度比例
  const CROSS_LEN_RATIO = 0.15; // 中心十字线长度比例
  const THEME_COLOR = Cesium.Color.fromCssColorString("#ff0000"); // 科技感青色

  // 基础坐标计算函数
  const getExactCorner = (camera, hSign, vSign) => {
    const frustum = camera.frustum;
    if (!frustum || !frustum.fovy) return null;

    const aspect =
      frustum.aspect ||
      subViewer.canvas.clientWidth / subViewer.canvas.clientHeight ||
      1.0;
    const fovy = frustum.fovy;

    const halfV = Math.tan(fovy / 2) * NEAR_DIST;
    const halfH = halfV * aspect;

    const scaledH = halfH * SCOPE_RATIO;
    const scaledV = halfV * SCOPE_RATIO;

    const pos = camera.positionWC;
    const direction = camera.directionWC;
    const up = camera.upWC;
    const right = camera.rightWC;

    const center = Cesium.Cartesian3.add(
      pos,
      Cesium.Cartesian3.multiplyByScalar(
        direction,
        NEAR_DIST,
        new Cesium.Cartesian3(),
      ),
      new Cesium.Cartesian3(),
    );

    const hVec = Cesium.Cartesian3.multiplyByScalar(
      right,
      hSign * scaledH,
      new Cesium.Cartesian3(),
    );
    const vVec = Cesium.Cartesian3.multiplyByScalar(
      up,
      vSign * scaledV,
      new Cesium.Cartesian3(),
    );

    const corner = Cesium.Cartesian3.add(center, hVec, new Cesium.Cartesian3());
    return Cesium.Cartesian3.add(corner, vVec, new Cesium.Cartesian3());
  };

  // 通用线段绘制函数
  const createPolyline = (positionCallback) => {
    subViewer.entities.add({
      polyline: {
        positions: new Cesium.CallbackProperty(positionCallback, false),
        width: 2,
        material: THEME_COLOR,
        depthFailMaterial: THEME_COLOR,
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
        arcType: Cesium.ArcType.NONE,
      },
    });
  };

  // ---  绘制 4 个 L 形边角 ---

  // 左上角 (TL): 往右(+), 往下(-)
  createPolyline(() => {
    const cam = subViewer.camera;
    const corner = getExactCorner(cam, -1, 1);
    const p1 = getExactCorner(cam, -1 + LINE_LEN_RATIO, 1);
    const p2 = getExactCorner(cam, -1, 1 - LINE_LEN_RATIO);
    return corner && p1 && p2 ? [p1, corner, p2] : [];
  });

  // 右上角 (TR): 往左(-), 往下(-)
  createPolyline(() => {
    const cam = subViewer.camera;
    const corner = getExactCorner(cam, 1, 1);
    const p1 = getExactCorner(cam, 1 - LINE_LEN_RATIO, 1);
    const p2 = getExactCorner(cam, 1, 1 - LINE_LEN_RATIO);
    return corner && p1 && p2 ? [p1, corner, p2] : [];
  });

  // 左下角 (BL): 往右(+), 往上(+)
  createPolyline(() => {
    const cam = subViewer.camera;
    const corner = getExactCorner(cam, -1, -1);
    const p1 = getExactCorner(cam, -1 + LINE_LEN_RATIO, -1);
    const p2 = getExactCorner(cam, -1, -1 + LINE_LEN_RATIO);
    return corner && p1 && p2 ? [p1, corner, p2] : [];
  });

  // 右下角 (BR): 往左(-), 往上(+)
  createPolyline(() => {
    const cam = subViewer.camera;
    const corner = getExactCorner(cam, 1, -1);
    const p1 = getExactCorner(cam, 1 - LINE_LEN_RATIO, -1);
    const p2 = getExactCorner(cam, 1, -1 + LINE_LEN_RATIO);
    return corner && p1 && p2 ? [p1, corner, p2] : [];
  });

  // --- 绘制中心十字准星 ---

  // 水平线
  createPolyline(() => {
    const cam = subViewer.camera;
    const p1 = getExactCorner(cam, -CROSS_LEN_RATIO, 0);
    const p2 = getExactCorner(cam, CROSS_LEN_RATIO, 0);
    return p1 && p2 ? [p1, p2] : [];
  });

  // 垂直线
  createPolyline(() => {
    const cam = subViewer.camera;
    const p1 = getExactCorner(cam, 0, -CROSS_LEN_RATIO);
    const p2 = getExactCorner(cam, 0, CROSS_LEN_RATIO);
    return p1 && p2 ? [p1, p2] : [];
  });
};

/**
 * @description: 创建主窗口的视锥体，用于显示子窗口的可见区域（四棱台）
 * @param {*} mainViewer
 * @param {*} subViewer
 * @return {*}
 */
const createVisualFrustum = (mainViewer, subViewer, cameraPos) => {
  const FOV_H = 60; // 水平视场角
  const FOV_V = 40; // 垂直视场角
  const NEAR_DIST = 40; // 近平面距离（顶面）
  const FAR_DIST = 500.0; // 远平面距离（底面）

  const getRectCorners = (distance) => {
    const camera = subViewer.camera;
    const direction = camera.direction;
    const up = camera.up;
    const right = camera.right;

    // const halfH = Math.tan(Cesium.Math.toRadians(FOV_H) / 2) * distance;
    // const halfV = Math.tan(Cesium.Math.toRadians(FOV_V) / 2) * distance;

    const halfH =
      Math.tan(Cesium.Math.toRadians(FOV_H) / 2) * distance * SCOPE_RATIO; // 和小窗必须一致
    const halfV =
      Math.tan(Cesium.Math.toRadians(FOV_V) / 2) * distance * SCOPE_RATIO;

    const center = Cesium.Cartesian3.add(
      cameraPos,
      Cesium.Cartesian3.multiplyByScalar(
        direction,
        distance,
        new Cesium.Cartesian3(),
      ),
      new Cesium.Cartesian3(),
    );

    return [
      calculateCorner(center, right, up, -halfH, halfV),
      calculateCorner(center, right, up, halfH, halfV),
      calculateCorner(center, right, up, halfH, -halfV),
      calculateCorner(center, right, up, -halfH, -halfV),
    ];
  };

  // 创建 4 个侧面 (确保连接的是 nearCorners 和 farCorners)
  for (let i = 0; i < 4; i++) {
    mainViewer.entities.add({
      polygon: {
        hierarchy: new Cesium.CallbackProperty(() => {
          const near = getRectCorners(NEAR_DIST);
          const far = getRectCorners(FAR_DIST);
          const next = (i + 1) % 4;
          // 顺时针连线：近点i -> 近点next -> 远点next -> 远点i
          return new Cesium.PolygonHierarchy([
            near[i],
            near[next],
            far[next],
            far[i],
          ]);
        }, false),
        material: Cesium.Color.CYAN.withAlpha(0.2),
        perPositionHeight: true,
        outline: true,
        outlineColor: Cesium.Color.WHITE.withAlpha(0.5),
      },
    });
  }

  // 顶部矩形 (近平面 - 此时会显得很宽)
  mainViewer.entities.add({
    polygon: {
      hierarchy: new Cesium.CallbackProperty(() => {
        return new Cesium.PolygonHierarchy(getRectCorners(NEAR_DIST));
      }, false),
      material: Cesium.Color.CYAN.withAlpha(0.4),
      perPositionHeight: true,
      outline: true,
      outlineColor: Cesium.Color.WHITE,
    },
  });

  // 底部矩形 (远平面)
  mainViewer.entities.add({
    polygon: {
      hierarchy: new Cesium.CallbackProperty(() => {
        return new Cesium.PolygonHierarchy(getRectCorners(FAR_DIST));
      }, false),
      material: Cesium.Color.CYAN.withAlpha(0.3),
      perPositionHeight: true,
      outline: true,
      outlineColor: Cesium.Color.WHITE,
    },
  });
};

/**
 * @description: 计算视锥体的四个角点
 * @param {*} center
 * @param {*} right
 * @param {*} up
 * @param {*} hOffset
 * @param {*} vOffset
 * @return {*}
 */
function calculateCorner(center, right, up, hOffset, vOffset) {
  const hVec = Cesium.Cartesian3.multiplyByScalar(
    right,
    hOffset,
    new Cesium.Cartesian3(),
  );
  const vVec = Cesium.Cartesian3.multiplyByScalar(
    up,
    vOffset,
    new Cesium.Cartesian3(),
  );
  const result = Cesium.Cartesian3.add(center, hVec, new Cesium.Cartesian3());
  return Cesium.Cartesian3.add(result, vVec, result);
}

/**
 * 使用 CallbackProperty 实现动态同步直角四棱台
 * @param {Cesium.Viewer} mainViewer 主图
 * @param {Cesium.Viewer} subViewer 小窗
 * @param {Object} config 基础配置
 */
const addDynamicHorizontalFrustum = (mainViewer, subViewer, config) => {
  // 核心计算函数
  const getPoints = () => {
    if (!mainViewer || !subViewer || !subViewer.camera) return null;

    const camera = subViewer.camera;
    // 获取摄像头安装点的地面基础坐标系 (ENU)
    const center = Cesium.Cartesian3.fromDegrees(
      config.position[0],
      config.position[1],
    );
    const enuMatrix = Cesium.Transforms.eastNorthUpToFixedFrame(center);

    // 只取 Heading，不取 Pitch
    // 这样确保了生成的坐标系中，Z轴永远是指向天空的（垂直于地面）
    const heading = camera.heading;
    const rotation = Cesium.Matrix3.fromRotationZ(
      Cesium.Math.PI_OVER_TWO - heading,
    );
    const modelMatrix = Cesium.Matrix4.multiplyByMatrix3(
      enuMatrix,
      rotation,
      new Cesium.Matrix4(),
    );

    const { nearSize, farSize, distance } = config;
    const nW = nearSize.w * SCOPE_RATIO;
    const nH = nearSize.h * SCOPE_RATIO;
    const fW = farSize.w * SCOPE_RATIO;
    const fH = farSize.h * SCOPE_RATIO;

    // 局部坐标转世界坐标
    const compute = (x, y, z) => {
      return Cesium.Matrix4.multiplyByPoint(
        modelMatrix,
        new Cesium.Cartesian3(x, y, z),
        new Cesium.Cartesian3(),
      );
    };

    // 定义顶点坐标
    // n1-n2, f1-f2 的 Z 坐标为 0，确保它们在地面
    // n3-n4, f3-f4 的 Z 坐标为高度值，且由于矩阵没旋转 Pitch，它们在垂直上方
    return {
      n1: compute(0, -nW / 2, 0.1), // 近左下 (贴地)
      n2: compute(0, nW / 2, 0.1), // 近右下 (贴地)
      n3: compute(0, nW / 2, nH), // 近右上 (垂直向上)
      n4: compute(0, -nW / 2, nH), // 近左上 (垂直向上)
      f1: compute(distance, -fW / 2, 0.1), // 远左下 (贴地)
      f2: compute(distance, fW / 2, 0.1), // 远右下 (贴地)
      f3: compute(distance, fW / 2, fH), // 远右上 (垂直向上)
      f4: compute(distance, -fW / 2, fH), // 远左上 (垂直向上)
    };
  };

  const faces = [
    { name: "底", i: ["n1", "n2", "f2", "f1"], a: 0.4 }, // 贴地的面
    { name: "顶", i: ["n4", "n3", "f3", "f4"], a: 0.2 }, // 天空的斜面
    { name: "左", i: ["n1", "n4", "f4", "f1"], a: 0.3 }, // 垂直的墙面
    { name: "右", i: ["n2", "n3", "f3", "f2"], a: 0.3 }, // 垂直的墙面
    { name: "近", i: ["n1", "n2", "n3", "n4"], a: 0.5 }, // 垂直的镜头面
    { name: "远", i: ["f1", "f2", "f3", "f4"], a: 0.1 }, // 垂直的末端面
  ];

  faces.forEach((f) => {
    mainViewer.entities.add({
      name: `FRUSTUM_${f.name}`,
      polygon: {
        hierarchy: new Cesium.CallbackProperty(() => {
          const pts = getPoints();
          if (!pts || !pts.n1) return null;
          return new Cesium.PolygonHierarchy(f.i.map((key) => pts[key]));
        }, false),
        perPositionHeight: true,
        material: Cesium.Color.CYAN.withAlpha(f.a),
        outline: true,
        outlineColor: Cesium.Color.WHITE.withAlpha(0.6),
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
      },
    });
  });

  // 辅助标记点
  // mainViewer.entities.add({
  //   position: Cesium.Cartesian3.fromDegrees(config.position[0], config.position[1], 2),
  //   point: { pixelSize: 15, color: Cesium.Color.YELLOW },
  // });
};

/**
 * @description: 聚焦到视锥体中心
 * @param {*} viewer
 * @param {*} config
 * @return {*}
 */
const focusOnFrustum = (viewer, config) => {
  const center = Cesium.Cartesian3.fromDegrees(
    config.position[0],
    config.position[1],
    0,
  );
  viewer.camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(
      config.position[0],
      config.position[1],
      1500.0,
    ), // 飞到 1500 米高度
    orientation: {
      heading: Cesium.Math.toRadians(120), // 稍微偏转一点
      pitch: Cesium.Math.toRadians(-35), // 3D 俯视角度
      roll: 0,
    },
  });
};

/**
 * 同步相机视角：小窗 -> 主图
 */
const syncCamera = (subViewer, mainViewer) => {
  const subCamera = subViewer.camera;
  const mainCamera = mainViewer.camera;

  // 设置灵敏度：数值越小越灵敏，0.01 表示变化 1% 时触发
  subCamera.percentageChanged = 0.01;

  subCamera.changed.addEventListener(() => {
    // 获取小窗当前的相机状态
    const camera = subViewer.camera;

    // 更新主图视角
    mainCamera.setView({
      destination: camera.position.clone(),
      orientation: {
        heading: camera.heading,
        pitch: camera.pitch,
        roll: camera.roll,
      },
    });
  });
};

// 拖拽解除锁定；缩放（滚轮/双指/+/-）在锁定状态下保持跟车并保留缩放距离
let manualUnlockHandler = null;
let pinchZoomLockDetachActive = false;

const detachTrackedEntityForLockedZoom = () => {
  if (!isLockMode.value) return false;
  const locked = resolveLockedFollowEntity();
  if (!locked?.entity) {
    releaseVehicleFollow();
    return false;
  }
  if (mainViewer && !mainViewer.isDestroyed?.()) {
    mainViewer.trackedEntity = undefined;
    mainViewer.camera.lookAtTransform(Cesium.Matrix4.IDENTITY);
  }
  return true;
};

const initManualUnlock = (viewer) => {
  if (manualUnlockHandler) {
    manualUnlockHandler.destroy();
    manualUnlockHandler = null;
  }

  manualUnlockHandler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
  manualUnlockHandler.setInputAction(() => {
    if (!isLockMode.value) return;
    releaseVehicleFollow();
  }, Cesium.ScreenSpaceEventType.LEFT_DOWN);
  manualUnlockHandler.setInputAction(() => {
    if (!detachTrackedEntityForLockedZoom()) return;
    scheduleRestoreLockedFollow();
  }, Cesium.ScreenSpaceEventType.WHEEL);
  manualUnlockHandler.setInputAction(() => {
    if (!detachTrackedEntityForLockedZoom()) return;
    pinchZoomLockDetachActive = true;
  }, Cesium.ScreenSpaceEventType.PINCH_START);
  manualUnlockHandler.setInputAction(() => {
    if (!pinchZoomLockDetachActive) return;
    pinchZoomLockDetachActive = false;
    scheduleRestoreLockedFollow();
  }, Cesium.ScreenSpaceEventType.PINCH_END);
};

// 监听鼠标移动，实时更新坐标
const initCoordinateTracker = (viewer) => {
  handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);

  // 监听鼠标移动
  handler.setInputAction((movement) => {
    // 获取鼠标在屏幕上的像素位置
    const windowPosition = movement.endPosition;

    // 将像素位置转换为三维世界坐标
    // 如果有 3D 地形或模型，使用 pickPosition。如果是纯平面，可以使用 pickEllipsoid
    let cartesian;
    if (viewer.scene.mode === Cesium.SceneMode.SCENE3D) {
      // 3D 模式下捕捉地形和模型表面
      const ray = viewer.camera.getPickRay(windowPosition);
      cartesian = viewer.scene.globe.pick(ray, viewer.scene);
    } else {
      // 2D 模式或非地形模式
      cartesian = viewer.camera.pickEllipsoid(windowPosition);
    }

    if (Cesium.defined(cartesian)) {
      // 笛卡尔(Cartesian3) -> 弧度(Cartographic)
      const cartographic = Cesium.Cartographic.fromCartesian(cartesian);

      // 弧度 -> 角度 (Degrees)
      const lng = Cesium.Math.toDegrees(cartographic.longitude).toFixed(6);
      const lat = Cesium.Math.toDegrees(cartographic.latitude).toFixed(6);
      const alt = cartographic.height.toFixed(1);

      // 更新响应式变量
      coords.lng = lng;
      coords.lat = lat;
      coords.alt = alt;
    }
  }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
};

// 绘制动态车辆点位
let dynamicCarEntities = [];
const drawDynamicCar = (viewer, dynamicCarList) => {
  // 先清除已有的动态车辆点位
  dynamicCarEntities.forEach((entity) => {
    viewer.entities.remove(entity);
  });
  // const sphereRadius = new Cesium.CallbackProperty(() => {
  //   // 获取相机高度
  //   const height = viewer.camera.positionCartographic.height;
  //   // 动态计算半径：高度越高半径越大，保证始终可见
  //   // 这里的系数 0.005
  //   const r = Math.max(1.0, height * 0.02);
  //   return new Cesium.Cartesian3(r, r, r);
  // }, false);
  // 绘制点位
  dynamicCarEntities = [];
  dynamicCarList.forEach((car) => {
    const { current_longitude, current_latitude } = car;
    const position = Cesium.Cartesian3.fromDegrees(
      current_longitude,
      current_latitude,
      0,
    );

    const entity = viewer.entities.add({
      position,
      ellipsoid: {
        radii: new Cesium.Cartesian3(1.0, 1.0, 1.0),
        material: Cesium.Color.RED,
        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
      },
    });

    // const entity = viewer.entities.add({
    //   position,
    //   cylinder: {
    //     length: 1.0, // 高度（厚度）1米
    //     topRadius: 1.0, // 半径 2米
    //     bottomRadius: 1.0,
    //     material: Cesium.Color.fromCssColorString("#ff0000").withAlpha(0.8),
    //     outline: false,
    //     outlineColor: Cesium.Color.RED,
    //     heightReference: Cesium.HeightReference.RELATIVE_TO_GROUND,
    //   },
    // });
    dynamicCarEntities.push(entity);
  });
};
const { triggerLockdown, clearLockdownMarkers, lockdownEntities } = useLockdown(
  {
    getViewer: () => mainViewer,
    getDronePositionProp: () => dronePositionProp,
    defaultCenter: DEFAULT_CENTER,
    droneHeight: DRONE_HEIGHT,
    getDroneCandidates: () =>
      Array.from(droneTestManager.drones.entries()).map(([id, drone]) => ({
        id,
        lastPosition: drone.lastPosition,
      })),
    dispatchDroneToPoint: (lng, lat, speed, height, droneId) => {
      if (droneId) {
        const escortTimer = escortTimers.get(droneId);
        if (escortTimer) {
          clearInterval(escortTimer);
          escortTimers.delete(droneId);
        }
        droneTestManager.flyToPoint(droneId, lng, lat, speed, height);
        return;
      }

      runningToPointWithTimeForDrone(lng, lat, speed, height);
    },
  },
);

const toggleLayerVisibility = ({ key, active }) => {
  if (!mainViewer) return;

  const setEntitiesShow = (entities, show) => {
    entities.forEach((e) => {
      if (e && e.show !== undefined) e.show = show;
    });
  };

  switch (key) {
    case "drone":
      droneTestManager.drones.forEach((drone) => {
        if (drone.entity) drone.entity.show = active;
      });
      if (droneEntity) droneEntity.show = active;
      break;
    case "policeCar":
      targetLayerVisibility.policeCar = active;
      vehicleManager.vehicles.forEach((vehicle) => {
        if (vehicle.entity) vehicle.entity.show = active;
      });
      if (carEntity) carEntity.show = active;
      break;
    case "checkpoint":
      setEntitiesShow(lockdownEntities, active);
      break;
    case "route":
      routeLayerVisible = active;
      setEntitiesShow(routeMarkers, active); // routeMarkers 是路径标记点
      setEntitiesShow(verticalLines, active); // verticalLines 是从地面到空中某点高度的垂直高度指示线
      setEntitiesShow(companionRouteEntities, active); // companionRouteEntities是一个动态折线，在 TiandituMap.vue:1906-1922 处创建，通过 CallbackProperty 实时获取无人机位置（dronePos）和伴飞目标/警车位置（carPos）
      vehicleManager.vehicles.forEach((vehicle) => {
        if (vehicle.entity?.path) vehicle.entity.path.show = active;
      });
      officerManager.officers.forEach((officer) => {
        if (officer.entity?.path) officer.entity.path.show = active;
      });
      robotManager.robots.forEach((robot) => {
        if (robot.entity?.path) robot.entity.path.show = active;
      });
      droneTestManager.drones.forEach((drone) => {
        if (drone.entity?.path) drone.entity.path.show = active;
      });
      if (carEntity?.path) carEntity.path.show = active;
      if (droneEntity?.path) droneEntity.path.show = active;
      break;
    case "officer":
      targetLayerVisibility.officer = active;
      officerManager.officers.forEach((officer) => {
        if (officer.entity) officer.entity.show = active;
      });
      break;
    case "robot":
      targetLayerVisibility.robot = active;
      robotManager.robots.forEach((robot) => {
        if (robot.entity) robot.entity.show = active;
      });
      break;
  }
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
});

watch(
  () => props.activeEscortDroneId,
  (droneId) => syncEscortTargetHighlight(droneId),
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
    if (newVal === 2) {
      // 创建主窗口的视锥体，用于显示子窗口的可见区域
      // createVisualFrustum(mainViewer, subViewer, CAMERA_POS);

      // 绘制贴地直角四棱台（监控照射范围）
      // const config = {
      //   position: [DEFAULT_CENTER.lng, DEFAULT_CENTER.lat],
      //   nearSize: { w: 200, h: 200 },
      //   farSize: { w: 800, h: 400 },
      //   distance: 1000,
      // };
      // addDynamicHorizontalFrustum(mainViewer, subViewer, config);
      // focusOnFrustum(mainViewer, config);

      // 同步相机视角：小窗 -> 主图
      syncCamera(subViewer, mainViewer);
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

onMounted(() => {
  try {
    initViewer();
  } finally {
    isLoading.value = false;
  }
  // 地图首屏优先，MQTT 连接放到 Viewer 初始化之后再启动。
  setTimeout(() => {
    initialMqttConnect();
  }, 0);
});

onUnmounted(() => {
  syncEscortTargetHighlight("");
  mqttService.unsubscribe("carBox/+/location");
  subscribeEscortDroneOsd._subscribed = false;
  officerManager.clearAll();
  robotManager.clearAll();
  clearLockdownMarkers();
  closePoliceVehiclePopup();
  selectedTargetDeviceId = null;
  vehicleManager.selectedDeviceId = null;
  if (mainViewer) {
    mainViewer.destroy();
    mainViewer = null;
  }
  if (subViewer) {
    subViewer.destroy();
    subViewer = null;
  }
  if (handler) {
    handler.destroy();
    handler = null;
  }
  if (manualUnlockHandler) {
    manualUnlockHandler.destroy();
    manualUnlockHandler = null;
  }
  // 清理车辆点击事件处理器
  cleanupVehicleClickHandler();
  systemStore.clearCarMessageList();
  systemStore.clearDroneMessageList();
  // 清理测试消息定时器
  clearPublishMessageTimers();
});
</script>

<style lang="scss" scoped>
.map-container,
#cesiumContainer {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.map-loading-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  background: #292E38;
  z-index: 1000;
}

.map-loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(255, 255, 255, 0.15);
  border-top-color: #409eff;
  border-radius: 50%;
  animation: map-spin 0.8s linear infinite;
}

@keyframes map-spin {
  to {
    transform: rotate(360deg);
  }
}

.map-loading-text {
  color: rgba(255, 255, 255, 0.6);
  font-size: 14px;
}

:deep(.cesium-viewer-bottom) {
  display: none;
}

.custom-controls {
  position: absolute;
  bottom: 21px;
  right: 25px;
  z-index: 100;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 10px;

  button {
    width: 30px;
    height: 30px;
    background-color: #ffffff;
    color: #4e4e4e;
    pointer-events: auto;
    line-height: 30px;
    font-size: 14px;
    font-weight: bold;
    border-radius: 2px;
    box-shadow: 0 0 4px rgba(0, 0, 0, 0.6);
    text-align: center;
    border: none;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    box-sizing: border-box;
  }

  .test-data-btn {
    width: auto !important;
    padding: 0 8px;
    min-width: 30px;
    font-size: 12px !important;
    background-color: #409eff !important;
    color: #fff !important;
  }

  .test-alarm-btn {
    width: auto !important;
    padding: 0 8px;
    min-width: 30px;
    font-size: 12px !important;
    background-color: #e6a23c !important;
    color: #fff !important;
  }

  .test-robot-btn {
    width: auto !important;
    padding: 0 6px;
    min-width: 30px;
    font-size: 11px !important;
    font-weight: 600;
    background-color: #67c23a !important;
    color: #fff !important;
  }

  .group-controls {
    position: relative;
    display: flex;
    flex-direction: column;
    border-radius: 2px;
    box-shadow: 0 0 4px rgba(0, 0, 0, 0.6);
    overflow: hidden;
    box-sizing: border-box;
    width: 30px;

    button {
      &:not(:last-child) {
        border-bottom: 1px solid #dcdee2;
      }

      border-radius: 0;
      box-shadow: unset !important;
    }
  }

  .round-control {
    cursor: pointer;
    background: var(--switch-background);
    border-radius: 50%;
    justify-content: center;
    align-items: center;
    width: 34px;
    height: 34px;
    display: flex;
    border: 2px solid #ffffff;
    box-shadow: 0 0 4px rgba(0, 0, 0, 0.6);
  }
}

.mode-list {
  position: relative;
  display: flex;
  flex-direction: row;
  justify-content: center;
  gap: 10px;

  &_img {
    position: relative;
    width: 120px;
    height: 80px;
    cursor: pointer;

    &:hover {
      outline: 2px solid #1890ff;
    }

    .el-image {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .description {
      position: absolute;
      bottom: 0;
      width: 100%;
      background-color: rgba(0, 0, 0, 0.4);
      color: #ffffff;
      height: 24px;
      line-height: 24px;
      text-align: center;
      font-size: 12px;
    }

    .check-button {
      position: absolute;
      top: 3px;
      right: 3px;
      width: 18px;
      height: 18px;
      background-color: #1890ff;
    }
  }
}

.police-vehicle-popup {
  position: absolute;
  z-index: 200;
  width: 350px;
  padding: 12px 14px;
  border-radius: 6px;
  border: 1px solid #30363b;
  background: rgba(3, 6, 10, 0.65);
  color: #ffffff;
  font-size: 13px;
  line-height: 1.5;
  pointer-events: auto;
  box-sizing: border-box;
  backdrop-filter: blur(6px);

  &__header {
    margin-bottom: 10px;
    padding-bottom: 8px;
  }

  &__urgent {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 15px;
    font-weight: 600;
    color: #ff4d4f;
    margin-bottom: 8px;

    &-icon {
      width: 18px;
      height: 18px;
      flex-shrink: 0;
    }
  }

  &__row {
    display: flex;
    flex-direction: row;
    align-items: flex-start;
    gap: 6px;
    margin-bottom: 8px;

    // &--alert .police-vehicle-popup__value {
    //   color: #ffcc66;
    // }
  }

  &__field {
    display: flex;
    // flex-direction: column;
    gap: 6px;
    margin-bottom: 12px;
  }

  &__label {
    width: 80px;
    color: #FFF;
font-family: "HarmonyOS Sans SC";
font-size: 14px;
font-style: normal;
font-weight: 400;
line-height: normal;
    flex-shrink: 0;
    white-space: nowrap;
  }

  &__value {
    color: #ffffff;
    flex: 1;
    min-width: 0;
    word-break: break-all;
    overflow-wrap: anywhere;
  }

  &__select {
    width: 100%;
    padding: 6px 8px;
    border-radius: 2px;
    border: 1px solid #30363b;
    background: rgba(255, 255, 255, 0.08);
    color: #ffffff;
    font-size: 12px;
    outline: none;
    cursor: pointer;

    option {
      background: #1a1f24;
      color: #ffffff;
    }
  }

  &__empty {
    margin: 0 0 12px;
    font-size: 12px;
    color: rgba(255, 255, 255, 0.45);
  }

  &__escort {
    display: block;
    width: 100%;
    padding: 8px 0;
    border: none;
    border-radius: 2px;
    // background: #558efc;
    background: #ff4d4f;
    color: #ffffff;
    font-size: 14px;
    cursor: pointer;
    transition: opacity 0.2s;

    &:hover:not(:disabled) {
      opacity: 0.9;
    }

    &:disabled {
      opacity: 0.45;
      cursor: not-allowed;
    }

    &--primary {
      background: #409eff;
    }

    &--jump {
      background: #e6a23c;
    }
  }

  &__actions {
    display: flex;
    gap: 8px;

    .police-vehicle-popup__escort {
      flex: 1;
      width: auto;
      padding: 8px 6px;
      font-size: 13px;
    }
  }
}

.sub-view-window {
  position: fixed;
  bottom: 20px;
  right: 60px;
  width: 320px;
  height: 180px;
  border: 2px solid #00eeee;
  background: #000;
  z-index: 1000;
  box-shadow: 0 0 8px #000000;
  #subViewerContainer {
    width: 100%;
    height: 100%;
  }
}

.bottom-controls {
  position: absolute;
  width: calc(100% - 40px);
  padding: 0 20px;
  height: 30px;
  bottom: 0;
  left: 0;
  z-index: 100;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  background-color: rgba(0, 0, 0, 0.4);
  .icon-button {
    color: #ffffff;
    font-size: 18px;
    &:hover {
      color: #1890ff;
    }
  }
  .location-text {
    color: #ffffff;
    font-size: 14px;
  }
}
.mouse-operation {
  position: relative;
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
  .mouse-operation-list {
    position: relative;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    .mouse-operation-item {
      position: relative;
      display: flex;
      flex-direction: row;
      justify-content: center;
      align-items: center;
      font-size: 14px;
      color: #ffffff;
      line-height: 30px;
    }
    &:last-child {
      flex: auto;
      width: 0;
    }
  }
}
</style>
<style lang="scss">
.mouse-operation-popover {
  background-color: rgba(0, 0, 0, 0.8) !important;
  background: rgba(0, 0, 0, 0.8) !important;
}

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
