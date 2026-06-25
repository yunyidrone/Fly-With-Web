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
            <!-- 低电量阈值 -->
            <section class="settings-sec">
              <div class="settings-sec__title-row">
                <h3 class="settings-sec__title">请设置低电量阈值</h3>
                <el-tooltip
                  effect="dark"
                  :content="BATTERY_THRESHOLD_TIP"
                  placement="top"
                  teleported
                  popper-class="settings-tooltip-popper"
                >
                  <span class="settings-sec__info" tabindex="0" role="button" aria-label="说明">
                    <i class="ri-information-line" />
                  </span>
                </el-tooltip>
              </div>

              <el-tabs v-model="thresholdTab" class="settings-el-tabs">
                <el-tab-pane
                  v-for="tab in SETTINGS_DEVICE_TABS"
                  :key="`threshold-${tab.key}`"
                  :label="tab.label"
                  :name="tab.key"
                >
                  <div class="settings-threshold-list">
                    <template v-if="thresholdForms[tab.key].length">
                      <div
                        v-for="item in thresholdForms[tab.key]"
                        :key="item.modelId"
                        class="settings-threshold-row"
                      >
                        <span class="settings-threshold-row__label">型号：{{ item.modelName }}</span>
                        <el-input-number
                          v-model="item.threshold"
                          class="settings-threshold-input"
                          :min="BATTERY_THRESHOLD_MIN"
                          :max="BATTERY_THRESHOLD_MAX"
                          :step="1"
                          :controls="true"
                          controls-position="right"
                        />
                        <span class="settings-threshold-row__hint">
                          请输入{{ BATTERY_THRESHOLD_MIN }}~{{ BATTERY_THRESHOLD_MAX }}之间的数字
                        </span>
                      </div>
                    </template>
                    <div v-else class="settings-threshold-empty">
                      <img
                        :src="thresholdEmptyIcon[tab.key]"
                        :alt="`${tab.label}空状态`"
                        class="settings-threshold-empty__img"
                      />
                      <span class="settings-threshold-empty__title">空空如也</span>
                      <span class="settings-threshold-empty__desc">暂无{{ tab.label }}型号数据</span>
                    </div>
                  </div>
                </el-tab-pane>
              </el-tabs>
            </section>

            <!-- 无人设备状态 -->
            <section class="settings-sec settings-sec--status">
              <h3 class="settings-sec__title">请修改无人设备状态</h3>

              <el-tabs v-model="statusTab" class="settings-el-tabs settings-el-tabs--status">
                <el-tab-pane
                  v-for="tab in SETTINGS_DEVICE_TABS"
                  :key="`status-${tab.key}`"
                  :label="tab.label"
                  :name="tab.key"
                >
                  <div class="settings-status-toolbar">
                    <button
                      type="button"
                      class="settings-status-btn settings-status-btn--primary"
                      @click="confirmSetAllDeviceEnabled(true)"
                    >
                      全部启用
                    </button>
                    <button
                      type="button"
                      class="settings-status-btn settings-status-btn--ghost"
                      @click="confirmSetAllDeviceEnabled(false)"
                    >
                      全部禁用
                    </button>
                  </div>

                  <div class="settings-table-wrap">
                    <el-table
                      :data="deviceForms[tab.key]"
                      class="settings-device-table"
                      empty-text="暂无设备"
                    >
                      <el-table-column prop="sn" label="SN" min-width="120" show-overflow-tooltip />
                      <el-table-column prop="id" label="ID" min-width="120" show-overflow-tooltip />
                      <el-table-column
                        :label="tab.nameLabel"
                        prop="name"
                        min-width="100"
                        show-overflow-tooltip
                      />
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
                      <el-table-column label="操作" width="80" align="center">
                        <template #default="{ row }">
                          <el-switch
                            v-model="row.enabled"
                            class="settings-device-switch"
                            inline-prompt
                            active-text="启用"
                            inactive-text="禁用"
                            :before-change="() => confirmDeviceEnabledChange(row)"
                          />
                        </template>
                      </el-table-column>
                    </el-table>
                  </div>
                </el-tab-pane>
              </el-tabs>
            </section>
          </div>

          <footer class="settings-drawer__foot">
            <button
              type="button"
              class="settings-save-btn"
              :disabled="saving"
              @click="onSave"
            >
              {{ saving ? "保存中…" : "保存" }}
            </button>
          </footer>
        </aside>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { reactive, ref, watch } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { SettingsService } from "@/api/settings.js";
import { useDeviceStore } from "@/stores/device.js";
import { unwrapApiList } from "@/utils/request.js";
import {
  BATTERY_THRESHOLD_MAX,
  BATTERY_THRESHOLD_MIN,
  BATTERY_THRESHOLD_TIP,
  DEFAULT_BATTERY_THRESHOLDS,
  SETTINGS_DEVICE_TABS,
} from "@/config/settings-defaults.js";
import emptyPlanePng from "@/assets/images/empty_plane.png";
import emptyBoatPng from "@/assets/images/empty_boat.png";
import emptyDogPng from "@/assets/images/empty_dog.png";

const visible = defineModel("visible", { type: Boolean, default: false });

const thresholdEmptyIcon = {
  drone: emptyPlanePng,
  boat: emptyBoatPng,
  dog: emptyDogPng,
};

const deviceStore = useDeviceStore();
const loading = ref(false);
const saving = ref(false);
const thresholdTab = ref("drone");
const statusTab = ref("drone");

/** @type {Record<string, Array<{ modelId: string, modelName: string, threshold: number }>>} */
const thresholdForms = reactive({
  drone: [],
  boat: [],
  dog: [],
});

/** @type {Record<string, Array<{ id: string, sn: string, name: string, enabled: boolean, abnormal: boolean }>>} */
const deviceForms = reactive({
  drone: [],
  boat: [],
  dog: [],
});

function cloneThresholdDefaults() {
  for (const tab of SETTINGS_DEVICE_TABS) {
    thresholdForms[tab.key] = DEFAULT_BATTERY_THRESHOLDS[tab.key].map((item) => ({
      ...item,
    }));
  }
}

function normalizeThresholdList(payload, deviceType) {
  const list = unwrapApiList(payload);
  if (!list.length) return null;
  return list.map((item) => ({
    modelId: String(item.modelId ?? item.id ?? item.model ?? "").trim(),
    modelName: String(item.modelName ?? item.name ?? item.model ?? "未知型号").trim(),
    threshold: clampThreshold(Number(item.threshold ?? item.value ?? 40)),
  }));
}

function clampThreshold(value) {
  if (!Number.isFinite(value)) return 40;
  return Math.min(BATTERY_THRESHOLD_MAX, Math.max(BATTERY_THRESHOLD_MIN, Math.round(value)));
}

function mapDroneToStatusRow(drone) {
  const abnormal = drone.rawStatus === 0 || drone.status === "offline";
  return {
    id: String(drone.id || ""),
    sn: String(drone.sn || ""),
    name: String(drone.name || drone.sn || drone.id || ""),
    enabled: drone.enabled !== false,
    abnormal,
  };
}

function mapApiDeviceRow(raw) {
  const abnormal = raw.abnormal === true || Number(raw.healthStatus) === 2 || raw.status === "abnormal";
  const enabled =
    raw.enabled === true ||
    raw.enabled === 1 ||
    (raw.enabled !== false && raw.enabled !== 0 && raw.status !== "disabled");
  return {
    id: String(raw.id ?? raw.deviceId ?? ""),
    sn: String(raw.sn ?? ""),
    name: String(raw.name ?? raw.deviceName ?? raw.sn ?? raw.id ?? ""),
    enabled,
    abnormal,
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

async function loadThresholds() {
  cloneThresholdDefaults();
  await Promise.all(
    SETTINGS_DEVICE_TABS.map(async (tab) => {
      try {
        const data = await SettingsService.getBatteryThresholdList(
          { deviceType: tab.key },
          { silent: true },
        );
        const normalized = normalizeThresholdList(data, tab.key);
        if (normalized?.length) {
          thresholdForms[tab.key] = normalized;
        }
      } catch (_) {
        /* 使用默认型号 */
      }
    }),
  );
}

async function loadDeviceStatus() {
  resetDeviceForms();
  await Promise.all(
    SETTINGS_DEVICE_TABS.map(async (tab) => {
      try {
        const data = await SettingsService.getDeviceStatusList(
          { deviceType: tab.key },
          { silent: true },
        );
        const list = unwrapApiList(data).map(mapApiDeviceRow);
        if (list.length) {
          deviceForms[tab.key] = list;
        }
      } catch (_) {
        if (tab.key === "drone" && !deviceForms.drone.length) {
          deviceForms.drone = buildDroneStatusFallback();
        }
      }
    }),
  );
}

async function loadSettings() {
  loading.value = true;
  try {
    if (!deviceStore.drones.length) {
      await deviceStore.fetchDroneList().catch(() => {});
    }
    await Promise.all([loadThresholds(), loadDeviceStatus()]);
  } finally {
    loading.value = false;
  }
}

function resolveStatusLabel(row) {
  if (row.abnormal) return "异常";
  return row.enabled ? "启用" : "禁用";
}

function resolveStatusTagClass(row) {
  if (row.abnormal) return "settings-status-tag--abnormal";
  return row.enabled ? "settings-status-tag--enabled" : "settings-status-tag--disabled";
}

const SETTINGS_CONFIRM_Z_INDEX = 4000;

function getStatusTabLabel(tabKey = statusTab.value) {
  return SETTINGS_DEVICE_TABS.find((t) => t.key === tabKey)?.label || "设备";
}

function confirmDeviceEnabledChange(row) {
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
    .then(() => true)
    .catch(() => false);
}

async function confirmSetAllDeviceEnabled(enabled) {
  const list = deviceForms[statusTab.value];
  if (!list.length) {
    ElMessage.warning("当前列表暂无设备");
    return;
  }
  const action = enabled ? "启用" : "禁用";
  const tabLabel = getStatusTabLabel();
  try {
    await ElMessageBox.confirm(
      `确定${action}当前${tabLabel}列表下的全部设备吗？`,
      `全部${action}`,
      {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
        zIndex: SETTINGS_CONFIRM_Z_INDEX,
      },
    );
    list.forEach((row) => {
      row.enabled = enabled;
    });
  } catch {
    /* 用户取消 */
  }
}

function validateThresholds() {
  for (const tab of SETTINGS_DEVICE_TABS) {
    for (const item of thresholdForms[tab.key]) {
      const value = Number(item.threshold);
      if (!Number.isFinite(value) || value < BATTERY_THRESHOLD_MIN || value > BATTERY_THRESHOLD_MAX) {
        ElMessage.warning(
          `${tab.label}「${item.modelName}」阈值需在 ${BATTERY_THRESHOLD_MIN}~${BATTERY_THRESHOLD_MAX} 之间`,
        );
        return false;
      }
    }
  }
  return true;
}

function buildSavePayload() {
  return {
    thresholds: SETTINGS_DEVICE_TABS.map((tab) => ({
      deviceType: tab.key,
      items: thresholdForms[tab.key].map((item) => ({
        modelId: item.modelId,
        threshold: clampThreshold(Number(item.threshold)),
      })),
    })),
    deviceStatus: SETTINGS_DEVICE_TABS.map((tab) => ({
      deviceType: tab.key,
      items: deviceForms[tab.key].map((row) => ({
        id: row.id,
        enabled: Boolean(row.enabled),
      })),
    })),
  };
}

async function onSave() {
  if (!validateThresholds()) return;
  saving.value = true;
  const payload = buildSavePayload();
  try {
    await SettingsService.saveAll(payload);
    ElMessage.success("设置已保存");
    visible.value = false;
  } catch (_) {
    try {
      await Promise.all([
        ...payload.thresholds.map((block) => SettingsService.saveBatteryThreshold(block)),
        ...payload.deviceStatus.map((block) => SettingsService.saveDeviceStatus(block)),
      ]);
      ElMessage.success("设置已保存");
      visible.value = false;
    } catch (err) {
      ElMessage.error(err?.message || "保存失败，请稍后重试");
    }
  } finally {
    saving.value = false;
  }
}

function onClose() {
  visible.value = false;
}

watch(visible, (open) => {
  if (open) {
    thresholdTab.value = "drone";
    statusTab.value = "drone";
    loadSettings();
  }
});
</script>

<style lang="scss" scoped>
.settings-drawer-overlay {
  position: fixed;
  inset: 0;
  z-index: 3600;
  display: flex;
  justify-content: flex-end;
  background: rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(4px);
}

.settings-drawer {
  width: min(680px, 100vw);
  height: 100%;
  display: flex;
  flex-direction: column;
  border-left: 1px solid #30363b;
  // background: #1c222a;
  background: rgba(3, 6, 10, 0.65);
  color: #fff;
  box-shadow: -12px 0 40px rgba(0, 0, 0, 0.45);
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
    overflow: hidden;
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
    overflow: hidden;
  }

  .el-tab-pane {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
}

.settings-threshold-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.settings-threshold-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.settings-threshold-row__label {
  flex-shrink: 0;
  width: 120px;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.88);
}

.settings-threshold-row__hint {
  flex: 1;
  min-width: 0;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.45);
  white-space: nowrap;
}

.settings-threshold-empty {
  padding: 20px 0 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  text-align: center;

  &__img {
    width: 86px;
    height: 86px;
    object-fit: contain;
    display: block;
    margin-bottom: 2px;
    opacity: 0.9;
  }

  &__title {
    color: rgba(255, 255, 255, 0.88);
    font-size: 16px;
    font-weight: 500;
    line-height: 1.25;
  }

  &__desc {
    color: rgba(255, 255, 255, 0.38);
    font-size: 13px;
    line-height: 1.3;
  }
}

.settings-status-toolbar {
  flex-shrink: 0;
  display: flex;
  gap: 10px;
  margin-bottom: 12px;
}

.settings-status-btn {
  min-width: 88px;
  height: 32px;
  padding: 0 16px;
  border-radius: 4px;
  font-size: 13px;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s;

  &--primary {
    border: none;
    background: #4965c9;
    color: #fff;

    &:hover {
      background: #5a74d0;
    }
  }

  &--ghost {
    border: 1px solid rgba(255, 255, 255, 0.2);
    background: transparent;
    color: rgba(255, 255, 255, 0.85);

    &:hover {
      border-color: rgba(255, 255, 255, 0.35);
    }
  }
}

.settings-table-wrap {
  flex: 1;
  min-height: 0;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 4px;
  overflow: hidden;
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

  &--abnormal {
    color: #ff4d4f;
    background: rgba(255, 77, 79, 0.12);
  }

  &--disabled {
    color: rgba(255, 255, 255, 0.45);
    background: rgba(255, 255, 255, 0.06);
  }
}

.settings-drawer__foot {
  flex-shrink: 0;
  display: flex;
  justify-content: center;
  padding: 16px 24px 24px;
  border-top: 1px solid #30363b;
}

.settings-save-btn {
  min-width: 200px;
  height: 40px;
  padding: 0 32px;
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
    transform: translateX(100%);
  }
}

:deep(.settings-threshold-input.el-input-number.is-controls-right) {
  --el-input-number-control-height: 18px;
  width: 132px;
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

:deep(.settings-device-table) {
  --el-table-bg-color: #15191e;
  --el-table-tr-bg-color: #15191e;
  --el-table-header-bg-color: #1c222a;
  --el-table-row-hover-bg-color: rgba(255, 255, 255, 0.04);
  --el-table-border-color: rgba(255, 255, 255, 0.08);
  --el-table-text-color: rgba(255, 255, 255, 0.88);
  --el-table-header-text-color: rgba(255, 255, 255, 0.65);
  background: transparent;
  height: 100%;

  .el-table__empty-text {
    color: rgba(255, 255, 255, 0.45);
  }
}

:deep(.settings-device-switch) {
  --el-switch-on-color: #4965c9;
  --el-switch-off-color: rgba(255, 255, 255, 0.2);

  .el-switch__core {
    min-width: 52px;
  }

  .el-switch__inner .is-text {
    font-size: 11px;
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
</style>
