<template>
  <Teleport to="body">
    <Transition name="ptm-fade">
      <div
        v-if="visible"
        class="plan-task-monitor"
        :class="{ 'plan-task-monitor--wide-left': wideLeft }"
        role="dialog"
        aria-modal="true"
        aria-label="任务监控"
      >
        <div
          v-loading="loading"
          element-loading-text="正在加载中"
          class="plan-task-monitor__inner"
        >
          
          <div v-if="planScenarioTitle && cells.length" class="plan-task-monitor__head-wrap">
            <header class="plan-task-monitor__plan-head">
              <div class="plan-task-monitor__plan-head-left">
                <span v-if="planScenarioKey === 'mountain'" class="plan-task-monitor__plan-icon" aria-hidden="true">
                  <MountainRescueIcon :width="18" :height="18" />
                </span>
                <span v-else-if="planScenarioKey === 'water'" class="plan-task-monitor__plan-icon" aria-hidden="true">
                  <WaterObservationIcon :width="18" :height="18" />
                </span>
                <span v-else-if="planScenarioKey === 'security'" class="plan-task-monitor__plan-icon" aria-hidden="true">
                  <SecurityProtectionIcon :width="18" :height="18" />
                </span>
                <i v-else class="ri-shield-check-line plan-task-monitor__plan-icon-fallback" aria-hidden="true" />
                <span class="plan-task-monitor__plan-type">{{ planScenarioTitle }}</span>
                <span class="plan-task-monitor__plan-sep" aria-hidden="true">|</span>
                <span class="plan-task-monitor__plan-mode">{{ planStartModeLabel }}</span>
              </div>
              <div class="plan-task-monitor__plan-head-right">
                <span class="plan-task-monitor__plan-status">
                  <i class="plan-task-monitor__plan-status-dot" aria-hidden="true" />
                  执行中
                </span>
                <button type="button" class="plan-task-monitor__plan-close" aria-label="关闭" @click="close">
                  <img :src="tableClosePng" class="plan-task-monitor__close-icon" alt="" aria-hidden="true" />
                </button>
              </div>
            </header>
          </div>
          <p v-if="errorText" class="plan-task-monitor__error">{{ errorText }}</p>
          <p v-else-if="!cells.length && !loading" class="plan-task-monitor__error">
            暂无 planAlgorithmDataDTO 伴飞数据
          </p>
          <div
            v-else
            class="plan-task-monitor__grid"
            :style="gridStyle"
          >
            <PlanTaskMonitorDroneCell
              v-for="cell in cells"
              :key="cell.key"
              :slot-key="cell.key"
              :drone-id="cell.droneId"
              :mqtt-sn="cell.mqttSn"
              :play-url="cell.playUrl"
              :route-label="cell.routeLabel"
              :drone-info="cell.droneInfo"
              :drone="cell.drone"
              :events="cell.events"
              :task-progress-text="cell.taskProgressText"
              :target-device-label="cell.targetDeviceLabel"
              :hidden="hiddenKeys.has(cell.key)"
              :recall-loading="recallLoadingKey === cell.key"
              @recall="onRecall(cell)"
              @toggle-visible="toggleVisible(cell.key)"
            />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { FlightPlanService } from "@/api/plan.js";
import { AccompanyingFlyService } from "@/api/index.js";
import { useDeviceStore } from "@/stores/device.js";
import { normalizeDroneRecord } from "@/stores/device.js";
import { useFlightPlanStore, normalizeFlightPlanRecord } from "@/stores/flightPlan.js";
import PlanTaskMonitorDroneCell from "@/components/plan-panel/PlanTaskMonitorDroneCell.vue";
import MountainRescueIcon from "@/components/icons/MountainRescueIcon.vue";
import WaterObservationIcon from "@/components/icons/WaterObservationIcon.vue";
import SecurityProtectionIcon from "@/components/icons/SecurityProtectionIcon.vue";
import { SCENARIO_TITLE_BY_KEY } from "@/components/plan-panel/plan-scenarios.js";
import { resolvePlanStartModeLabel } from "@/utils/plan-task.js";
import tableClosePng from "@/assets/images/table_close.png";
import {
  unwrapPlanAlgorithmDataList,
  normalizePlanAlgorithmSlot,
  normalizePlanMonitorEvent,
  buildPlanMonitorContext,
  buildSlotDroneInfoFromDetail,
  buildSlotTaskMeta,
  mergeMonitorDroneInfo,
  resolveDroneMqttSn,
  normalizeWarnDataToDroneEvents,
} from "@/utils/plan-algorithm-data.js";
import { findDroneInStore } from "@/composables/useLiveDroneTelemetry.js";
import { ensureDroneOsdMqtt } from "@/composables/useDroneOsdMqtt.js";

const visible = defineModel("visible", { type: Boolean, default: false });

const props = defineProps({
  planId: { type: String, default: "" },
  /** 左侧 dock 是否为宽屏（含历史记录） */
  wideLeft: { type: Boolean, default: false },
});

const emit = defineEmits(["exit", "recall"]);

const deviceStore = useDeviceStore();
const flightPlanStore = useFlightPlanStore();
const loading = ref(false);
const errorText = ref("");
/** @type {import('vue').Ref<Array<Record<string, any>>>} */
const cells = ref([]);
const hiddenKeys = ref(new Set());
const recallLoadingKey = ref("");
const planScenarioKey = ref("");
const planStartModeLabel = ref("");

const planScenarioTitle = computed(
  () => SCENARIO_TITLE_BY_KEY[planScenarioKey.value] || "飞行计划",
);

function applyPlanMetaFromSources(planId, detail) {
  const id = String(planId || "").trim();
  const fromStore =
    flightPlanStore.executingPlans.find((p) => p.id === id) ||
    flightPlanStore.upcomingPlans.find((p) => p.id === id) ||
    null;
  const normalized = fromStore || normalizeFlightPlanRecord(detail || {});
  planScenarioKey.value = normalized.scenarioKey || "";
  planStartModeLabel.value = resolvePlanStartModeLabel(normalized);
}

const gridColumnCount = computed(() => {
  const n = cells.value.length;
  if (n <= 1) return 1;
  if (n <= 4) return 2;
  if (n <= 9) return 3;
  return 4;
});

const gridStyle = computed(() => ({
  "--ptm-grid-columns": String(gridColumnCount.value),
}));

function close() {
  visible.value = false;
  emit("exit");
}

function toggleVisible(key) {
  const next = new Set(hiddenKeys.value);
  if (next.has(key)) next.delete(key);
  else next.add(key);
  hiddenKeys.value = next;
}

/** 保证 MQTT 能按 sn/id 命中 store 中的响应式对象 */
function ensureDroneEntryInStore(droneId, detail) {
  if (!detail || typeof detail !== "object") return null;
  const normalized = normalizeDroneRecord({
    ...detail,
    id: droneId || detail.id,
  });
  normalized.mqttSn = resolveDroneMqttSn(normalized, droneId);
  const existing = findDroneInStore(droneId, normalized, deviceStore.drones);
  if (existing) {
    if (normalized.sn) existing.sn = normalized.sn;
    existing.mqttSn = normalized.mqttSn;
    if (normalized.playUrl) existing.playUrl = normalized.playUrl;
    if (normalized.streamUrl) existing.streamUrl = normalized.streamUrl;
    if (normalized.name) existing.name = normalized.name;
    return existing;
  }
  deviceStore.drones.push(normalized);
  return normalized;
}

function resolveCellDrone(droneId, detail) {
  ensureDroneEntryInStore(droneId, detail);
  const fallback =
    detail && typeof detail === "object"
      ? normalizeDroneRecord({ ...detail, id: droneId || detail.id })
      : { id: droneId, name: droneId };
  if (fallback && !fallback.mqttSn) {
    fallback.mqttSn = resolveDroneMqttSn(fallback, droneId);
  }
  return findDroneInStore(droneId, fallback, deviceStore.drones) ?? fallback;
}

async function fetchDroneDetail(droneId) {
  if (!droneId) return null;
  try {
    const data = await AccompanyingFlyService.droneDetail({ id: droneId });
    return data && typeof data === "object" ? data : null;
  } catch {
    return null;
  }
}

function eventsForSlot(slot, planEvents, droneEventsMap = {}) {
  const did = String(slot.droneId || "");
  // 优先使用 /plan/warnData 按无人机分组后的告警
  const fromWarn = droneEventsMap[did];
  if (fromWarn && fromWarn.length) return fromWarn;

  const local = (slot.events || []).map(normalizePlanMonitorEvent).filter(Boolean);
  if (local.length) return local;
  return (planEvents || [])
    .filter((ev) => {
      const eid = String(ev?.droneId ?? ev?.deviceId ?? ev?.uavId ?? "");
      return !eid || !did || eid === did;
    })
    .map(normalizePlanMonitorEvent)
    .filter(Boolean);
}

async function loadMonitorData() {
  const planId = String(props.planId || "").trim();
  if (!planId) {
    errorText.value = "无效的计划 ID";
    cells.value = [];
    return;
  }
  loading.value = true;
  errorText.value = "";
  cells.value = [];
  hiddenKeys.value = new Set();
  await ensureDroneOsdMqtt();
  try {
    const [detail, warnData] = await Promise.all([
      FlightPlanService.planDetail({ id: planId }),
      FlightPlanService.planWarnData({ id: planId }).catch(() => null),
    ]);
    const droneEventsMap = warnData ? normalizeWarnDataToDroneEvents(warnData) : {};
    const ctx = buildPlanMonitorContext(detail || {});
    applyPlanMetaFromSources(planId, detail);
    const slots = unwrapPlanAlgorithmDataList(detail)
      .map((raw, index) => normalizePlanAlgorithmSlot(raw, index))
      .filter(Boolean);
    if (!slots.length) {
      errorText.value = "";
      cells.value = [];
      return;
    }

    const built = await Promise.all(
      slots.map(async (slot) => {
        const slotInfo = buildSlotDroneInfoFromDetail(slot.raw, detail);
        const droneId = slot.droneId || slotInfo.id;
        const droneRaw = droneId ? await fetchDroneDetail(droneId) : null;
        const droneInfo = mergeMonitorDroneInfo(slotInfo, droneRaw);
        ensureDroneEntryInStore(droneId, droneRaw ?? droneInfo);
        const drone = resolveCellDrone(droneId, droneRaw ?? droneInfo);
        const taskMeta = buildSlotTaskMeta(slot.raw, detail, ctx);
        const mqttSn = resolveDroneMqttSn(droneRaw ?? droneInfo, droneId);
        return {
          key: slot.key,
          droneId,
          mqttSn,
          playUrl: slot.playUrl,
          routeLabel: droneInfo.routeLabel || slot.routeLabel,
          droneInfo,
          drone,
          events: eventsForSlot(slot, ctx.planEvents, droneEventsMap),
          taskProgressText: taskMeta.taskProgressText,
          targetDeviceLabel: taskMeta.targetDeviceLabel,
          targetId: droneInfo.targetId,
        };
      }),
    );
    cells.value = built.filter((c) => c.droneId || c.playUrl);
    // 测试代码，测试一下多台无人机显示情况
    // cells.value = [...cells.value, ...cells.value, ...cells.value, cells.value[0]];
  } catch (e) {
    errorText.value = e?.message || "加载计划详情失败";
    cells.value = [];
  } finally {
    loading.value = false;
  }
}

async function onRecall(cell) {
  const droneId = String(cell?.droneId || "").trim();
  if (!droneId) return;
  const name = cell?.droneInfo?.name || cell?.drone?.name || droneId;
  try {
    await ElMessageBox.confirm(`确定召回「${name}」？`, "一键召回", {
      confirmButtonText: "召回",
      cancelButtonText: "取消",
      type: "warning",
    });
  } catch {
    return;
  }
  recallLoadingKey.value = cell.key;
  try {
    await FlightPlanService.droneReturn({ planId: String(props.planId), droneId });
    deviceStore.setDroneStandby(droneId);
    await deviceStore.fetchDroneList();
    ElMessage.success("已召回");
    emit("recall", { droneId, planId: props.planId });
  } catch (e) {
    ElMessage.warning(e?.message || "召回失败");
  } finally {
    recallLoadingKey.value = "";
  }
}

watch(
  () => [visible.value, props.planId],
  ([v, id]) => {
    if (v && id) loadMonitorData();
    if (!v) {
      cells.value = [];
      errorText.value = "";
      planScenarioKey.value = "";
      planStartModeLabel.value = "";
    }
  },
);
</script>

<style lang="scss" scoped>
.plan-task-monitor {
  position: fixed;
  top: 88px;
  right: 16px;
  bottom: 16px;
  left: 417px;
  z-index: 2400;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  overflow: hidden;

  &--wide-left {
    left: min(calc(100vw - 420px), 72vw);
  }
}

.plan-task-monitor__inner {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;

  :deep(.el-loading-mask) {
    background-color: rgba(3, 6, 10, 0.7);
  }

  :deep(.el-loading-spinner .circular) {
    circle {
      stroke: rgba(255, 255, 255, 0.55);
    }

    .path {
      stroke: #1890ff;
    }
  }

  :deep(.el-loading-text) {
    color: rgba(255, 255, 255, 0.65);
  }
}

.plan-task-monitor__head-wrap {
  flex-shrink: 0;
  margin-bottom: 1px;
  padding: 10px;
  border-radius: 6px;
  border: 1px solid #30363B;
  background: rgba(3, 6, 10, 0.65);
}

.plan-task-monitor__plan-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 14px;
  border-radius: 6px;
  background: #1C222A;
}

.plan-task-monitor__plan-head-left {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  font-size: 14px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.92);
}

.plan-task-monitor__plan-icon {
  flex-shrink: 0;
  display: inline-flex;
  color: #fff;
}

.plan-task-monitor__plan-icon-fallback {
  font-size: 18px;
  color: #fff;
}

.plan-task-monitor__plan-type,
.plan-task-monitor__plan-mode {
  white-space: nowrap;
}
.plan-task-monitor__plan-mode{
  color: rgba(255, 255, 255, 0.65);
}
.plan-task-monitor__plan-sep {
  margin: 0 6px;
  color: rgba(255, 255, 255, 0.28);
  font-weight: 400;
}

.plan-task-monitor__plan-head-right {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

.plan-task-monitor__plan-status {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 600;
  color: #4cd964;
  white-space: nowrap;
}

.plan-task-monitor__plan-status-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #4cd964;
  box-shadow: 0 0 6px rgba(76, 217, 100, 0.55);
}

.plan-task-monitor__plan-close {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 4px;
  background: transparent;
  cursor: pointer;

  &:hover {
    background: rgba(255, 255, 255, 0.08);
  }
}

.plan-task-monitor__close-icon {
  width: 20px;
  height: 20px;
  object-fit: contain;
  display: block;
}

.plan-task-monitor__error {
  margin: 24px;
  text-align: center;
  color: rgba(255, 255, 255, 0.55);
  font-size: 14px;
}

.plan-task-monitor__grid {
  display: grid;
  gap: 10px;
  flex: 1;
  min-height: 0;
  overflow: auto;
  align-content: start;
  grid-template-columns: repeat(var(--ptm-grid-columns, 1), minmax(0, 1fr));
  grid-auto-rows: minmax(420px, 1fr);
}

.ptm-fade-enter-active,
.ptm-fade-leave-active {
  transition: opacity 0.2s ease;
}

.ptm-fade-enter-from,
.ptm-fade-leave-to {
  opacity: 0;
}
</style>
