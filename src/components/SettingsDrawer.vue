<!--
 * @Description: 系统设置抽屉 — 低电量阈值 / 无人设备状态
-->
<template>
  <Teleport to="body">
    <Transition name="settings-drawer-fade">
      <div
        v-if="visible"
        class="settings-drawer-overlay"
        role="presentation"
        @click.self="onClose"
      >
        <aside
          class="settings-drawer"
          role="dialog"
          aria-modal="true"
          aria-labelledby="settings-drawer-title"
        >
          <header class="settings-drawer__head">
            <h2 id="settings-drawer-title" class="settings-drawer__title">设置</h2>
            <button
              type="button"
              class="settings-drawer__close"
              aria-label="关闭"
              @click="onClose"
            >
              <i class="ri-close-line" />
            </button>
          </header>

          <div v-loading="loading" class="settings-drawer__body">
            <section class="settings-sec settings-sec--status">
              <div class="settings-sec__title-row">
                <h3 class="settings-sec__title">请修改无人设备参数修改</h3>
              </div>

              <el-tabs v-model="statusTab" class="settings-el-tabs settings-el-tabs--status">
                <el-tab-pane
                  v-for="tab in SETTINGS_DEVICE_TABS"
                  :key="`status-${tab.key}`"
                  :label="tab.label"
                  :name="tab.key"
                >
                  <div class="settings-table-wrap">
                    <el-table
                      :data="deviceForms[tab.key]"
                      class="settings-device-table"
                      empty-text="暂无设备"
                      row-key="id"
                      @selection-change="onDeviceSelectionChange"
                    >
                      <el-table-column type="selection" width="40" :selectable="isDroneRowSelectable" />
                      <el-table-column prop="sn" label="SN" min-width="180">
                        <template #default="{ row }">
                          <el-tooltip
                            :content="row.sn || '-'"
                            placement="top"
                            :popper-options="TABLE_TOOLTIP_POPPER_OPTIONS"
                            :teleported="false"
                            popper-class="settings-table-tooltip"
                          >
                            <span class="settings-table-ellipsis">{{ row.sn || "-" }}</span>
                          </el-tooltip>
                        </template>
                      </el-table-column>
                      <el-table-column prop="id" label="ID" min-width="100">
                        <template #default="{ row }">
                          <el-tooltip
                            :content="row.id || '-'"
                            placement="top"
                            :popper-options="TABLE_TOOLTIP_POPPER_OPTIONS"
                            :teleported="false"
                            popper-class="settings-table-tooltip"
                          >
                            <span class="settings-table-ellipsis">{{ row.id || "-" }}</span>
                          </el-tooltip>
                        </template>
                      </el-table-column>
                      <el-table-column
                        :label="tab.nameLabel"
                        prop="name"
                        min-width="100"
                      >
                        <template #default="{ row }">
                          <el-tooltip
                            :content="row.name || '-'"
                            placement="top"
                            :popper-options="TABLE_TOOLTIP_POPPER_OPTIONS"
                            :teleported="false"
                            popper-class="settings-table-tooltip"
                          >
                            <span class="settings-table-ellipsis">{{ row.name || "-" }}</span>
                          </el-tooltip>
                        </template>
                      </el-table-column>
                      <el-table-column label="状态" width="80" align="center">
                        <template #default="{ row }">
                          <span
                            class="settings-status-tag"
                            :class="resolveStatusTagClass(row)"
                          >
                            {{ resolveStatusLabel(row) }}
                          </span>
                        </template>
                      </el-table-column>
                      <el-table-column width="100" align="center">
                        <template #header>
                          <span class="settings-table-head-with-tip">
                            电量设置
                            <el-tooltip
                              effect="dark"
                              content="设备电量下降至当前阈值或不大于此阈值时不参与无人机任务"
                              placement="top"
                              teleported
                              popper-class="settings-tooltip-popper"
                            >
                              <span class="settings-sec__info settings-sec__info--small" tabindex="0" role="button" aria-label="说明">
                                <i class="ri-information-line" />
                              </span>
                            </el-tooltip>
                          </span>
                        </template>
                        <template #default="{ row }">
                          <el-input-number
                            v-if="statusTab === 'drone'"
                            v-model="row.batteryThreshold"
                            class="settings-threshold-input"
                            :min="BATTERY_THRESHOLD_MIN"
                            :max="BATTERY_THRESHOLD_MAX"
                            :step="1"
                            :controls="true"
                            controls-position="right"
                            @change="() => handleRowBatteryThresholdChange(row)"
                          />
                          <span v-else class="settings-status-placeholder">—</span>
                        </template>
                      </el-table-column>
                      <el-table-column label="算法配置" min-width="150" align="center">
                        <template #default="{ row }">
                          <el-tooltip
                            v-if="statusTab === 'drone' && row.algorithmIds.length"
                            effect="dark"
                            :content="resolveAlgorithmTooltip(row.algorithmIds)"
                            placement="top"
                            teleported
                            popper-class="settings-tooltip-popper"
                          >
                            <span class="settings-algorithm-display">
                              <span class="settings-algorithm-display__main">
                                {{ resolveAlgorithmLabel(row.algorithmIds[0]) }}
                              </span>
                              <span v-if="row.algorithmIds.length > 1" class="settings-algorithm-display__more">
                                +{{ row.algorithmIds.length - 1 }}
                              </span>
                            </span>
                          </el-tooltip>
                          <span v-else-if="statusTab === 'drone'" class="settings-status-placeholder">—</span>
                          <span v-else class="settings-status-placeholder">—</span>
                        </template>
                      </el-table-column>
                      <el-table-column label="操作" width="80" align="center">
                        <template #default="{ row }">
                          <el-switch
                            v-if="statusTab === 'drone'"
                            v-model="row.enabled"
                            class="settings-device-switch"
                            inline-prompt
                            active-text="启用"
                            inactive-text="禁用"
                            size="small"
                            :before-change="() => confirmDeviceEnabledChange(row)"
                          />
                          <span v-else class="settings-status-placeholder">—</span>
                        </template>
                      </el-table-column>
                    </el-table>
                  </div>
                  <div v-if="statusTab === 'drone'" class="settings-batch-bar">
                    <button
                      type="button"
                      class="settings-batch-btn"
                      :disabled="!selectedDeviceRows.length"
                      @click="applyBatchThreshold"
                    >
                      电量设置
                    </button>
                    <el-input-number
                      v-model="batchThreshold"
                      class="settings-threshold-input settings-threshold-input--batch"
                      :min="BATTERY_THRESHOLD_MIN"
                      :max="BATTERY_THRESHOLD_MAX"
                      :step="1"
                      :controls="true"
                      controls-position="right"
                      :disabled="!selectedDeviceRows.length"
                      placeholder=""
                      @change="batchBatteryTouched = true"
                    />
                    <button
                      type="button"
                      class="settings-batch-btn settings-batch-btn--primary"
                      :disabled="!selectedDeviceRows.length"
                      @click="confirmBatchDeviceEnabled(true)"
                    >
                      启用
                    </button>
                    <button
                      type="button"
                      class="settings-batch-btn"
                      :disabled="!selectedDeviceRows.length"
                      @click="confirmBatchDeviceEnabled(false)"
                    >
                      禁用
                    </button>
                    <span class="settings-batch-label">算法设置</span>
                    <el-select
                      v-model="batchAlgorithmIds"
                      class="settings-batch-algorithm"
                      multiple
                      clearable
                      collapse-tags
                      collapse-tags-tooltip
                      :max-collapse-tags="1"
                      :loading="algorithmListLoading"
                      :disabled="!selectedDeviceRows.length"
                      placeholder="请设置无人机监测算法"
                      popper-class="settings-algorithm-popper"
                      @change="markBatchAlgorithmsChanged"
                    >
                      <el-option
                        v-for="item in algorithmList"
                        :key="item.algorithmId"
                        :label="item.algorithmName || item.algorithmCode || item.algorithmId"
                        :value="item.algorithmId"
                      />
                    </el-select>
                    <button
                      type="button"
                      class="settings-save-btn"
                      :disabled="saving"
                      @click="onSave"
                    >
                      {{ saving ? "保存中…" : "保存" }}
                    </button>
                    <button type="button" class="settings-cancel-btn" @click="onClose">取消</button>
                  </div>
                </el-tab-pane>
              </el-tabs>
            </section>
          </div>
        </aside>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { reactive, ref, watch } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { AlgorithmService } from "@/api/algorithm.js";
import { AccompanyingFlyService } from "@/api/index.js";
import { useDeviceStore } from "@/stores/device.js";
import { unwrapApiList } from "@/utils/request.js";
import {
  BATTERY_THRESHOLD_MAX,
  BATTERY_THRESHOLD_MIN,
  SETTINGS_DEVICE_TABS,
} from "@/config/settings-defaults.js";

const visible = defineModel("visible", { type: Boolean, default: false });

const deviceStore = useDeviceStore();
const loading = ref(false);
const saving = ref(false);
const statusTab = ref("drone");
const algorithmList = ref([]);
const algorithmListLoading = ref(false);
const selectedDeviceRows = ref([]);
const batchThreshold = ref(null);
const batchAlgorithmIds = ref([]);
const batchBatteryTouched = ref(false);
const batchAlgorithmTouched = ref(false);
const deviceBaselineMap = new Map();
const TABLE_TOOLTIP_POPPER_OPTIONS = {
  modifiers: [
    { name: "flip", enabled: false },
    { name: "preventOverflow", options: { boundary: "viewport", padding: 8 } },
  ],
};

/** @type {Record<string, Array<{ id: string, sn: string, name: string, modelId: string, batteryThreshold: number, algorithmIds: string[], switchStatus: 0|1, enabled: boolean }>>} */
const deviceForms = reactive({
  drone: [],
  boat: [],
  dog: [],
});

function clampThreshold(value) {
  if (!Number.isFinite(value)) return 40;
  return Math.min(BATTERY_THRESHOLD_MAX, Math.max(BATTERY_THRESHOLD_MIN, Math.round(value)));
}

function parseSwitchStatus(raw) {
  const value = raw?.switchStatus;
  if (value === 1 || value === "1") return 1;
  if (value === 0 || value === "0") return 0;
  if (raw?.enabled === false || raw?.enabled === 0) return 1;
  return 0;
}

function switchStatusFromEnabled(enabled) {
  return enabled ? 0 : 1;
}

function normalizeAlgorithmItem(raw) {
  const id = raw?.algorithmId ?? raw?.id;
  if (id == null || id === "") return null;
  return {
    algorithmId: String(id),
    algorithmCode: String(raw?.algorithmCode ?? "").trim(),
    algorithmName: String(raw?.algorithmName ?? raw?.name ?? "").trim(),
  };
}

async function loadAlgorithmList() {
  if (algorithmListLoading.value) return;
  algorithmListLoading.value = true;
  try {
    const data = await AlgorithmService.list();
    algorithmList.value = unwrapApiList(data)
      .map(normalizeAlgorithmItem)
      .filter(Boolean);
  } catch {
    algorithmList.value = [];
  } finally {
    algorithmListLoading.value = false;
  }
}

function parseAlgorithmIds(raw) {
  const value = raw?.algorithmIds ?? raw?.algorithmIdList ?? raw?.algorithms ?? [];
  if (typeof value === "string") {
    return value.split(",").map((item) => item.trim()).filter(Boolean);
  }
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (item == null) return "";
      if (typeof item === "object") {
        return String(item.algorithmId ?? item.id ?? "").trim();
      }
      return String(item).trim();
    })
    .filter(Boolean);
}

function serializeAlgorithmIds(ids) {
  return Array.isArray(ids) ? ids.map((id) => String(id).trim()).filter(Boolean).join(",") : "";
}

function resolveDroneModelId(drone) {
  return String(drone.modelId ?? drone.model ?? drone.modelName ?? drone.deviceModel ?? "").trim();
}

function resolveDroneThreshold(drone) {
  return clampThreshold(
    Number(drone.batteryThreshold ?? drone.threshold ?? drone.lowBatteryThreshold ?? 40),
  );
}

function mapDroneToStatusRow(drone) {
  const switchStatus = parseSwitchStatus(drone);
  const modelId = resolveDroneModelId(drone);
  return {
    id: String(drone.id || ""),
    sn: String(drone.sn || ""),
    name: String(drone.name || drone.sn || drone.id || ""),
    modelId,
    batteryThreshold: resolveDroneThreshold(drone),
    algorithmIds: parseAlgorithmIds(drone),
    switchStatus,
    enabled: switchStatus === 0,
  };
}

function buildDroneStatusFallback() {
  return (deviceStore.drones || []).map(mapDroneToStatusRow);
}

function resetDeviceForms() {
  deviceForms.drone = buildDroneStatusFallback();
  deviceForms.boat = [];
  deviceForms.dog = [];
}

async function loadDeviceStatus() {
  resetDeviceForms();
  await deviceStore.fetchDroneList().catch(() => {});
  deviceForms.drone = buildDroneStatusFallback();
  resetDeviceBaseline();
}

function resetDeviceBaseline() {
  deviceBaselineMap.clear();
  deviceForms.drone.forEach((row) => {
    deviceBaselineMap.set(row.id, {
      batteryThreshold: clampThreshold(Number(row.batteryThreshold)),
      algorithmIds: serializeAlgorithmIds(row.algorithmIds),
    });
  });
}

function patchDroneSwitchStatus(ids, enabled, { patchEnabled = true } = {}) {
  const switchStatus = switchStatusFromEnabled(enabled);
  const idSet = new Set(ids.map((id) => String(id || "").trim()).filter(Boolean));

  deviceForms.drone.forEach((row) => {
    if (idSet.has(String(row.id))) {
      row.switchStatus = switchStatus;
      if (patchEnabled) {
        row.enabled = enabled;
      }
    }
  });

  deviceStore.drones.forEach((drone) => {
    if (idSet.has(String(drone.id))) {
      drone.switchStatus = switchStatus;
    }
  });
}

async function applyDroneSwitch(ids, enabled, options = {}) {
  const validIds = [...new Set(ids.map((id) => String(id || "").trim()).filter(Boolean))];
  if (!validIds.length) {
    ElMessage.warning("缺少设备 ID");
    throw new Error("missing drone id");
  }
  await AccompanyingFlyService.droneSwitch({
    ids: validIds,
    switchStatus: switchStatusFromEnabled(enabled),
  });
  patchDroneSwitchStatus(validIds, enabled, options);
}

async function loadSettings() {
  loading.value = true;
  try {
    await loadAlgorithmList();
    await loadDeviceStatus();
  } finally {
    loading.value = false;
  }
}

function resolveStatusLabel(row) {
  return row.switchStatus === 0 ? "启用" : "禁用";
}

function resolveStatusTagClass(row) {
  return row.switchStatus === 0
    ? "settings-status-tag--enabled"
    : "settings-status-tag--disabled";
}

function resolveAlgorithmLabel(id) {
  const item = algorithmList.value.find((algorithm) => algorithm.algorithmId === id);
  return item?.algorithmName || item?.algorithmCode || id || "-";
}

function resolveAlgorithmTooltip(ids) {
  return ids.map(resolveAlgorithmLabel).join("、");
}

const SETTINGS_CONFIRM_Z_INDEX = 4000;

function isDroneRowSelectable() {
  return statusTab.value === "drone";
}

function onDeviceSelectionChange(rows) {
  selectedDeviceRows.value = statusTab.value === "drone" ? rows : [];
}

function applyBatchThreshold() {
  if (!selectedDeviceRows.value.length) {
    ElMessage.warning("请先选择设备");
    return;
  }
  const value = Number(batchThreshold.value);
  if (!Number.isFinite(value)) {
    ElMessage.warning("请先输入电量阈值");
    return;
  }
  batchThreshold.value = clampThreshold(value);
  batchBatteryTouched.value = true;
  ElMessage.success("电量设置已暂存，保存后生效");
}

function markBatchAlgorithmsChanged() {
  batchAlgorithmTouched.value = true;
}

function confirmDeviceEnabledChange(row) {
  if (statusTab.value !== "drone") {
    ElMessage.warning("当前设备类型暂未接入");
    return false;
  }
  const nextEnabled = !row.enabled;
  const action = nextEnabled ? "启用" : "禁用";
  const deviceName = row.name || row.sn || row.id || "该设备";
  return ElMessageBox.confirm(
    `确定${action}设备「${deviceName}」吗？`,
    `${action}设备`,
    {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning",
      zIndex: SETTINGS_CONFIRM_Z_INDEX,
    },
  )
    .then(async () => {
      await applyDroneSwitch([row.id], nextEnabled, { patchEnabled: false });
      ElMessage.success(`${action}成功`);
      return true;
    })
    .catch(() => false);
}

async function confirmBatchDeviceEnabled(enabled) {
  if (!selectedDeviceRows.value.length) {
    ElMessage.warning("请先选择设备");
    return;
  }
  const action = enabled ? "启用" : "禁用";
  try {
    await ElMessageBox.confirm(
      `确定${action}选中的 ${selectedDeviceRows.value.length} 台设备吗？`,
      `批量${action}`,
      {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
        zIndex: SETTINGS_CONFIRM_Z_INDEX,
      },
    );
    await applyDroneSwitch(
      selectedDeviceRows.value.map((row) => row.id),
      enabled,
    );
    ElMessage.success(`${action}成功`);
  } catch {
    /* 用户取消或接口失败 */
  }
}

async function handleRowBatteryThresholdChange(row) {
  const id = String(row?.id || "").trim();
  if (!id) {
    ElMessage.warning("缺少设备 ID");
    return;
  }
  const baseline = deviceBaselineMap.get(id);
  const prevValue = baseline?.batteryThreshold;
  const nextValue = clampThreshold(Number(row.batteryThreshold));
  if (prevValue === nextValue) return;
  try {
    await AccompanyingFlyService.droneBatterySet({
      ids: [id],
      batteryThreshold: nextValue,
    });
    patchBatteryThreshold([id], nextValue);
    ElMessage.success("电量设置已更新");
  } catch (err) {
    if (prevValue != null) {
      row.batteryThreshold = prevValue;
    }
    ElMessage.error(err?.message || "电量设置更新失败");
  }
}

function normalizeIds(rows) {
  return [...new Set(rows.map((row) => String(row?.id || "").trim()).filter(Boolean))];
}

function patchBatteryThreshold(ids, batteryThreshold) {
  const idSet = new Set(ids);
  deviceForms.drone.forEach((row) => {
    if (idSet.has(String(row.id))) {
      row.batteryThreshold = batteryThreshold;
      const baseline = deviceBaselineMap.get(row.id) || {};
      deviceBaselineMap.set(row.id, {
        ...baseline,
        batteryThreshold,
      });
    }
  });
}

function patchAlgorithmIds(ids, algorithmIds) {
  const idSet = new Set(ids);
  const nextIds = [...algorithmIds];
  const serialized = serializeAlgorithmIds(nextIds);
  deviceForms.drone.forEach((row) => {
    if (idSet.has(String(row.id))) {
      row.algorithmIds = [...nextIds];
      const baseline = deviceBaselineMap.get(row.id) || {};
      deviceBaselineMap.set(row.id, {
        ...baseline,
        algorithmIds: serialized,
      });
    }
  });
}

async function saveBatchBatteryThreshold() {
  if (!batchBatteryTouched.value) return 0;
  const ids = normalizeIds(selectedDeviceRows.value);
  if (!ids.length) {
    ElMessage.warning("请先选择要设置电量的设备");
    return 0;
  }
  const value = Number(batchThreshold.value);
  if (!Number.isFinite(value)) {
    ElMessage.warning("请先输入电量阈值");
    return 0;
  }
  const batteryThreshold = clampThreshold(value);
  await AccompanyingFlyService.droneBatterySet({
    ids,
    batteryThreshold,
  });
  patchBatteryThreshold(ids, batteryThreshold);
  return 1;
}

async function saveAlgorithmChanges() {
  if (!batchAlgorithmTouched.value) return 0;
  const ids = normalizeIds(selectedDeviceRows.value);
  if (!ids.length) {
    ElMessage.warning("请先选择要配置算法的设备");
    return 0;
  }
  const algorithmIds = Array.isArray(batchAlgorithmIds.value)
    ? batchAlgorithmIds.value.map((id) => String(id).trim()).filter(Boolean)
    : [];
  await AccompanyingFlyService.droneAlgorithmSet({
    ids,
    algorithmIds: serializeAlgorithmIds(algorithmIds),
  });
  patchAlgorithmIds(ids, algorithmIds);
  return 1;
}

async function onSave() {
  saving.value = true;
  try {
    const [batteryCount, algorithmCount] = await Promise.all([
      saveBatchBatteryThreshold(),
      saveAlgorithmChanges(),
    ]);
    if (!batteryCount && !algorithmCount) {
      ElMessage.warning("暂无需要保存的设置");
      return;
    }
    batchBatteryTouched.value = false;
    batchAlgorithmTouched.value = false;
    batchThreshold.value = null;
    batchAlgorithmIds.value = [];
    ElMessage.success("设置已保存");
  } catch (err) {
    ElMessage.error(err?.message || "保存失败，请稍后重试");
  } finally {
    saving.value = false;
  }
}

function onClose() {
  visible.value = false;
}

watch(visible, (open) => {
  if (open) {
    statusTab.value = "drone";
    selectedDeviceRows.value = [];
    batchThreshold.value = null;
    batchAlgorithmIds.value = [];
    batchBatteryTouched.value = false;
    batchAlgorithmTouched.value = false;
    loadSettings();
  }
});

watch(statusTab, () => {
  selectedDeviceRows.value = [];
  batchThreshold.value = null;
  batchAlgorithmIds.value = [];
  batchBatteryTouched.value = false;
  batchAlgorithmTouched.value = false;
});
</script>

<style lang="scss" scoped>
.settings-drawer-overlay {
  position: fixed;
  inset: 0;
  z-index: 3600;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  // background: rgba(0, 0, 0, 0.55);
  // backdrop-filter: blur(4px);
  box-sizing: border-box;
}

.settings-drawer {
  width: min(1100px, calc(100vw - 48px));
  max-height: min(82vh, 760px);
  display: flex;
  flex-direction: column;
  color: #fff;
  border-radius: 6px;
  background: rgba(3, 6, 10, 0.65);
  border: 1px solid #30363b;
  backdrop-filter: blur(0.375rem);
  overflow: hidden;
}

.settings-drawer__head {
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  flex-shrink: 0;
  padding: 16px 48px;
  border-bottom: 1px solid #30363b;
}

.settings-drawer__title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #fff;
}

.settings-drawer__close {
  position: absolute;
  right: 16px;
  top: 50%;
  transform: translateY(-50%);
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: rgba(255, 255, 255, 0.7);
  font-size: 22px;
  cursor: pointer;

  &:hover {
    background: rgba(255, 255, 255, 0.08);
    color: #fff;
  }
}

.settings-drawer__body {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  padding: 20px 24px;

  &::-webkit-scrollbar {
    width: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.15);
    border-radius: 2px;
  }
}

.settings-sec {
  flex-shrink: 0;
  margin-bottom: 28px;

  &--status {
    flex: 1;
    min-height: 300px;
    display: flex;
    flex-direction: column;
    overflow: visible;
    margin-bottom: 0;
  }
}

.settings-sec__title-row {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 14px;
}

.settings-sec__title {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: #fff;
}

.settings-sec__info {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  color: #4965c9;
  font-size: 18px;
  cursor: help;
  outline: none;

  &:hover {
    color: #5a74d0;
  }

  &--small {
    width: 18px;
    height: 18px;
    font-size: 15px;
  }
}

.settings-table-head-with-tip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

.settings-table-ellipsis {
  display: block;
  width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

:deep(.settings-el-tabs) {
  .el-tabs__header {
    margin: 0 0 16px;
  }

  .el-tabs__nav-wrap::after {
    height: 1px;
    background-color: rgba(255, 255, 255, 0.12);
  }

  .el-tabs__nav-scroll {
    padding: 0;
  }

  .el-tabs__nav {
    transform: none !important;
  }

  .el-tabs__item {
    height: 40px;
    padding: 0 16px;
    color: rgba(255, 255, 255, 0.55);
    font-size: 14px;
    font-weight: 500;

    &:hover {
      color: rgba(255, 255, 255, 0.85);
    }

    &.is-active {
      color: #4965c9;
    }
  }

  .el-tabs__active-bar {
    height: 2px;
    background-color: #4965c9;
  }

  .el-tabs__content {
    overflow: visible;
  }
}

:deep(.settings-el-tabs--status) {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;

  .el-tabs__header {
    flex-shrink: 0;
  }

  .el-tabs__content {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    overflow: visible;
  }

  .el-tab-pane {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    overflow: visible;
  }
}

.settings-table-wrap {
  flex: 0 0 auto;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 4px;
  overflow: visible;
  display: flex;
  flex-direction: column;
}

.settings-status-tag {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 2px;
  font-size: 12px;
  line-height: 1.5;

  &--enabled {
    color: #52c41a;
    background: rgba(82, 196, 26, 0.12);
  }

  &--disabled {
    color: rgba(255, 255, 255, 0.45);
    background: rgba(255, 255, 255, 0.06);
  }
}

.settings-status-placeholder {
  color: rgba(255, 255, 255, 0.35);
  font-size: 13px;
}

.settings-batch-bar {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
  margin-top: 14px;
  padding: 14px 16px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 4px;
  background: rgba(3, 6, 10, 0.28);
}

.settings-batch-btn {
  min-width: 72px;
  height: 32px;
  padding: 0 14px;
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 4px;
  background: transparent;
  color: rgba(255, 255, 255, 0.85);
  font-size: 13px;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s, opacity 0.15s;

  &:hover:not(:disabled) {
    border-color: rgba(255, 255, 255, 0.35);
  }

  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }

  &--primary {
    border-color: #4965c9;
    background: #4965c9;
    color: #fff;

    &:hover:not(:disabled) {
      background: #5a74d0;
    }
  }
}

.settings-batch-label {
  flex-shrink: 0;
  margin-left: 8px;
  color: rgba(255, 255, 255, 0.85);
  font-size: 13px;
}

.settings-batch-algorithm {
  width: 280px;
  flex-shrink: 0;
}

.settings-save-btn {
  min-width: 64px;
  height: 36px;
  padding: 0 20px;
  border: none;
  border-radius: 4px;
  background: #4965c9;
  color: #fff;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s;

  &:hover:not(:disabled) {
    background: #5a74d0;
  }

  &:disabled {
    opacity: 0.65;
    cursor: not-allowed;
  }
}

.settings-batch-bar .settings-save-btn {
  margin-left: auto;
}

.settings-cancel-btn {
  min-width: 64px;
  height: 36px;
  padding: 0 20px;
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 4px;
  background: transparent;
  color: rgba(255, 255, 255, 0.85);
  font-size: 14px;
  cursor: pointer;

  &:hover {
    border-color: rgba(255, 255, 255, 0.35);
    color: #fff;
  }
}

.settings-drawer-fade-enter-active,
.settings-drawer-fade-leave-active {
  transition: opacity 0.22s ease;

  .settings-drawer {
    transition: transform 0.22s ease;
  }
}

.settings-drawer-fade-enter-from,
.settings-drawer-fade-leave-to {
  opacity: 0;

  .settings-drawer {
    transform: translateY(12px) scale(0.98);
  }
}

:deep(.settings-threshold-input.el-input-number.is-controls-right) {
  --el-input-number-control-height: 18px;
  width: 88px;
  height: 36px;
  flex-shrink: 0;

  .el-input__wrapper {
    height: 36px;
    padding-right: 32px;
    background: #03060a;
    box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.12) inset;
  }

  .el-input__inner {
    color: #fff;
    text-align: left;
    font-size: 14px;
    line-height: 36px;
  }

  .el-input-number__decrease,
  .el-input-number__increase {
    width: 30px;
    height: 50%;
    background: #15191e;
    border-color: rgba(255, 255, 255, 0.12);
    color: rgba(255, 255, 255, 0.65);

    &:hover:not(.is-disabled) {
      color: #fff;
      background: #252a33;
    }

    .el-icon {
      font-size: 12px;
    }
  }

  .el-input-number__decrease {
    top: calc(50% + 1px);
    border-left: 1px solid rgba(255, 255, 255, 0.12);
  }

  .el-input-number__increase {
    top: 1px;
    border-left: 1px solid rgba(255, 255, 255, 0.12);
  }
}

:deep(.settings-threshold-input--batch.el-input-number.is-controls-right) {
  width: 92px;
}

:deep(.settings-device-table) {
  --el-table-bg-color: transprent;
  --el-table-tr-bg-color: transprent;
  --el-table-header-bg-color: #1c222a;
  --el-table-row-hover-bg-color: rgba(255, 255, 255, 0.04);
  --el-table-border-color: rgba(255, 255, 255, 0.08);
  --el-table-text-color: rgba(255, 255, 255, 0.88);
  --el-table-header-text-color: rgba(255, 255, 255, 0.65);
  background: transparent;

  .el-table__empty-text {
    color: rgba(255, 255, 255, 0.45);
  }

  .el-table__row {
    position: relative;
    z-index: 1;
  }

  .el-table__row:hover {
    z-index: 20;
  }

  .el-table__cell,
  .cell,
  .el-table__inner-wrapper,
  .el-table__header-wrapper,
  .el-table__body,
  .el-table__row,
  .el-table__body-wrapper,
  .el-scrollbar,
  .el-scrollbar__wrap,
  .el-scrollbar__view {
    overflow: visible;
  }
}

.settings-algorithm-display {
  max-width: 160px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  min-width: 0;
  cursor: default;
}

.settings-algorithm-display__main,
.settings-algorithm-display__more {
  display: inline-flex;
  align-items: center;
  height: 22px;
  padding: 0 7px;
  border: 1px solid rgba(73, 101, 201, 0.45);
  border-radius: 3px;
  background: rgba(73, 101, 201, 0.16);
  color: #dbe3ff;
  font-size: 12px;
  line-height: 1;
}

.settings-algorithm-display__main {
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.settings-algorithm-display__more {
  flex-shrink: 0;
  color: #8fa4ff;
}

:deep(.settings-batch-algorithm) {
  .el-select__wrapper {
    min-height: 32px;
    background: #03060a;
    box-shadow: 0 0 0 1px rgba(73, 101, 201, 0.38) inset;

    &.is-focused,
    &:hover {
      box-shadow: 0 0 0 1px #4965c9 inset;
    }
  }

  .el-select__placeholder,
  .el-select__selected-item,
  .el-select__input {
    color: rgba(255, 255, 255, 0.85);
  }

  .el-tag {
    border-color: rgba(73, 101, 201, 0.45);
    background: rgba(73, 101, 201, 0.16);
    color: #dbe3ff;
  }
}

:deep(.settings-device-switch) {
  --el-switch-on-color: #4965c9;
  --el-switch-off-color: rgba(255, 255, 255, 0.2);

  .el-switch__core {
    min-width: 52px;
  }
}

:deep(.settings-drawer__body .el-loading-mask) {
  background-color: rgba(28, 34, 42, 0.72);
}
</style>

<style lang="scss">
.settings-tooltip-popper {
  z-index: 4000 !important;
  max-width: 280px;
  line-height: 1.5;
  font-size: 13px;
}

.settings-table-tooltip {
  z-index: 5000 !important;
  max-width: none !important;
  white-space: nowrap !important;
  pointer-events: none;
}

.settings-algorithm-popper {
  z-index: 4000 !important;
  border-color: rgba(73, 101, 201, 0.45) !important;
  background: #03060a !important;

  .el-select-dropdown {
    background: #03060a;
  }

  .el-select-dropdown__item {
    color: rgba(255, 255, 255, 0.78);

    &.is-hovering,
    &:hover {
      background: rgba(73, 101, 201, 0.18);
      color: #fff;
    }

    &.is-selected {
      color: #8fa4ff;
      font-weight: 600;
    }
  }

  .el-select-dropdown__item.is-selected::after {
    background-color: #4965c9;
  }

  .el-popper__arrow::before {
    border-color: rgba(73, 101, 201, 0.45) !important;
    background: #03060a !important;
  }
}
</style>
