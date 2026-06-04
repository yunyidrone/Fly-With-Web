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
        <div v-loading="loading" class="plan-task-monitor__inner">
          <p v-if="errorText" class="plan-task-monitor__error">{{ errorText }}</p>
          <p v-else-if="!cells.length && !loading" class="plan-task-monitor__error">
            暂无 planAlgorithmDataDTO 伴飞数据
          </p>
          <div
            v-else
            class="plan-task-monitor__grid"
            :class="`plan-task-monitor__grid--${gridMode}`"
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
        <footer class="plan-task-monitor__exit-wrap">
          <button type="button" class="plan-task-monitor__exit" @click="close">退出查看</button>
        </footer>
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
import PlanTaskMonitorDroneCell from "@/components/plan-panel/PlanTaskMonitorDroneCell.vue";
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
const loading = ref(false);
const errorText = ref("");
/** @type {import('vue').Ref<Array<Record<string, any>>>} */
const cells = ref([]);
const hiddenKeys = ref(new Set());
const recallLoadingKey = ref("");

const gridMode = computed(() => {
  const n = cells.value.length;
  if (n <= 1) return "1";
  if (n === 2) return "2";
  return "4";
});

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
    await deviceStore.fetchDroneList();
    const [detail, warnData] = await Promise.all([
      FlightPlanService.planDetail({ id: planId }),
      FlightPlanService.planWarnData({ id: planId }).catch(() => null),
    ]);
    const droneEventsMap = warnData ? normalizeWarnDataToDroneEvents(warnData) : {};
    const ctx = buildPlanMonitorContext(detail || {});
    const slots = unwrapPlanAlgorithmDataList(detail)
      .map((raw, index) => normalizePlanAlgorithmSlot(raw, index))
      .slice(0, 4);
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
  // border-radius: 10px;
  // border: 1px solid #30363b;
  // background: rgba(3, 6, 10, 0.92);
  // backdrop-filter: blur(8px);
  overflow: hidden;

  &--wide-left {
    left: min(calc(100vw - 420px), 72vw);
  }
}

.plan-task-monitor__inner {
  flex: 1;
  min-height: 0;
  // padding: 12px;
  overflow: hidden;
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
  height: 100%;
  min-height: 0;

  &--1 {
    grid-template-columns: 1fr;
    grid-template-rows: 1fr;
  }

  &--2 {
    grid-template-columns: 1fr 1fr;
    grid-template-rows: 1fr;
  }

  &--4 {
    grid-template-columns: 1fr 1fr;
    grid-template-rows: 1fr 1fr;
  }
}

.plan-task-monitor__exit-wrap {
  flex-shrink: 0;
  display: flex;
  justify-content: center;
  padding: 10px 16px 14px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  border: 1px solid #30363b;
  background: rgba(3, 6, 10, 0.92);
  backdrop-filter: blur(8px);
}

.plan-task-monitor__exit {
  border: none;
  background: none;
  color: #ff5c5c;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  padding: 4px 12px;

  &:hover {
    text-decoration: underline;
  }
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
