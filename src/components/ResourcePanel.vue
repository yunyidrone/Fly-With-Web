<!--
 * @Author: ml
 * @Date: 2026-05-13
 * @FilePath: /accompanying-fly-project/src/components/ResourcePanel.vue
 * @Description: left-side resource panels (drone / robot dog / unmanned boat)
-->
<template>
  <div
    class="resource-panels"
    :class="{ 'resource-panels--embedded': embedded }"
  >
    <div
      v-for="panel in panels"
      :key="panel.key"
      class="resource-panel"
      :class="{ expanded: panel.expanded }"
    >
      <div class="panel-header" @click="togglePanel(panel.key)">
        <!-- <div class="panel-header__icon"> -->
          <div
            class="panel-icon-rings"
            :class="{ 'panel-icon-rings--open': panel.expanded }"
          >
            <span
              class="panel-icon-ring panel-icon-ring--outer"
              aria-hidden="true"
            />
            <span
              class="panel-icon-ring panel-icon-ring--inner"
              aria-hidden="true"
            />
            <div class="panel-icon-photo">
              <img
                :src="panel.iconSrc"
                :alt="panel.label"
                class="panel-icon-img"
              />
            </div>
          <!-- </div> -->
        </div>
        <div class="panel-header__main">
          <div class="panel-header__title-row">
            <span class="panel-title">{{ panel.label }}</span>
            <span
              class="panel-title-triangle"
              :class="{ 'panel-title-triangle--expanded': panel.expanded }"
              aria-hidden="true"
            />
          </div>
          <div class="panel-header__ratio">
            {{ escortingCount(panel.devices) }}/{{ panel.devices.length }}
          </div>
        </div>
      </div>
      <div class="panel-content">
        <div class="panel-body">
          <!-- 统计概览 -->
          <div class="stats-row">
            <div class="stat-item">
              <span class="stat-label">伴飞中</span>
              <span class="stat-num">{{ escortingCount(panel.devices) }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">已就绪</span>
              <span class="stat-num">{{ readyCount(panel.devices) }}</span>
            </div>
          </div>

          <!-- 空状态 -->
          <div class="empty-hint" v-if="!panel.devices.length">
            <img
              v-if="panel.emptyImageSrc"
              :src="panel.emptyImageSrc"
              :alt="`${panel.label}空状态`"
              class="empty-hint__img"
            />
            <span class="empty-hint__title">空空如也</span>
            <span class="empty-hint__desc">暂无{{ panel.emptyResourceName }}资源展示</span>
          </div>

          <!-- 设备卡片列表（无人机卡片可点击打开视频） -->
          <div
            v-for="device in panel.devices"
            :key="device.id"
            class="device-card"
            :class="{
              'device-card--clickable': panel.key === 'drone',
              'device-card--stream-active':
                streamActiveDeviceId && streamActiveDeviceId === device.id,
            }"
            @click="handleDeviceCardClick(panel, device)"
          >
            <div class="device-card__main">
              <div class="device-card__icon-wrap">
                <img :src="panel.iconSrc" alt="" class="device-card__icon-img" />
              </div>
              <div class="device-card__info">
                <div class="device-card__title-line">
                  <span class="device-card__name">{{ device.name }}</span>
                  <span
                    class="device-card__status"
                    :class="`device-card__status--${deviceCardTone(device)}`"
                  >
                    {{ deviceCardStatusLabel(device) }}
                  </span>
                </div>
                <div class="device-card__meta">
                  <span>{{ device.commOk ? "在线" : "离线" }}</span>
                  <span class="device-card__meta-sep">|</span>
                  <span>ID:{{ formatDeviceListId(device) }}</span>
                  <span class="device-card__meta-sep">|</span>
                  <span>电量 {{ formatDeviceBattery(device) }}</span>
                  <span class="device-card__meta-sep">|</span>
                  <span>续航 {{ formatDeviceEndurance(device) }}</span>
                </div>
              </div>
            </div>
            <div v-if="device.isEscorting" class="device-card__recall-row">
              <button
                type="button"
                class="action-btn recall-btn"
                @click.stop="handleRecall(device)"
              >
                一键召回
              </button>
            </div>
          </div>
        </div>
      </div>
      <div
        v-if="panel.expanded"
        class="panel-foldup"
        @click="collapsePanel(panel.key)"
      >
        <img class="panel-foldup__icon" :src="foldupPng" alt="收起" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import { useDeviceStore } from "@/stores/device.js";
import planePng from "@/assets/images/plane.png";
import dogPng from "@/assets/images/dog.png";
import boatPng from "@/assets/images/boat.png";
import emptyPlanePng from "@/assets/images/empty_plane.png";
import emptyDogPng from "@/assets/images/empty_dog.png";
import emptyBoatPng from "@/assets/images/empty_boat.png";
import foldupPng from "@/assets/images/foldup.png";

defineProps({
  embedded: {
    type: Boolean,
    default: false,
  },
  /** 右侧视频正在展示的设备 id，用于列表高亮 */
  streamActiveDeviceId: {
    type: String,
    default: "",
  },
});

const deviceStore = useDeviceStore();

const escortingCount = (devices) => devices.filter((d) => d.isEscorting).length;
const readyCount = (devices) =>
  devices.filter((d) => d.status === "standby").length;

const droneExpanded = ref(false);
const dogExpanded = ref(false);
const boatExpanded = ref(false);

const STATIC_ROBOT_DOGS = [];

const STATIC_BOATS = [];

const panels = computed(() => [
  {
    key: "drone",
    iconSrc: planePng,
    label: "无人机资源",
    expanded: droneExpanded.value,
    devices: deviceStore.drones,
    emptyResourceName: "无人机",
    emptyImageSrc: emptyPlanePng,
  },
  {
    key: "robotDog",
    iconSrc: dogPng,
    label: "无人狗资源",
    expanded: dogExpanded.value,
    devices: STATIC_ROBOT_DOGS,
    emptyResourceName: "无人狗",
    emptyImageSrc: emptyDogPng,
  },
  {
    key: "boat",
    iconSrc: boatPng,
    label: "无人艇资源",
    expanded: boatExpanded.value,
    devices: STATIC_BOATS,
    emptyResourceName: "无人艇",
    emptyImageSrc: emptyBoatPng,
  },
]);

const expandedMap = {
  drone: droneExpanded,
  robotDog: dogExpanded,
  boat: boatExpanded,
};
const togglePanel = (key) => {
  expandedMap[key].value = !expandedMap[key].value;
};

const collapsePanel = (key) => {
  expandedMap[key].value = false;
};

const emit = defineEmits(["recall", "open-drone-stream"]);

const handleRecall = (device) => {
  emit("recall", device);
};

const handleDeviceCardClick = (panel, device) => {
  if (panel?.key !== "drone") return;
  emit("open-drone-stream", device);
};

/** 列表里 ID 展示为简短数字，如 DRONE-001 → 1 */
function formatDeviceListId(device) {
  const raw = device?.id;
  if (raw == null || raw === "") return "—";
  const id = String(raw);
  const nums = id.match(/\d+/g);
  if (nums?.length) {
    const n = parseInt(nums[nums.length - 1], 10);
    return Number.isFinite(n) ? String(n) : nums[nums.length - 1];
  }
  return id;
}

function formatDeviceBattery(device) {
  const b = device?.battery;
  if (b == null || b === "") return "—";
  const n = Number(b);
  return Number.isFinite(n) ? `${n}%` : String(b);
}

function formatDeviceEndurance(device) {
  const e = device?.endurance;
  if (e == null || e === "") return "—";
  return String(e);
}

/** 右侧状态配色：escorting | ready | offline */
function deviceCardTone(device) {
  if (!device?.commOk) return "offline";
  if (device.isEscorting) return "escorting";
  return "ready";
}

function deviceCardStatusLabel(device) {
  if (!device?.commOk) return "离线";
  if (device.isEscorting) return "伴飞中";
  if (device.status === "flying") return device.statusText || "飞行中";
  return "就绪";
}
</script>

<style lang="scss" scoped>
.resource-panels {
  position: absolute;
  left: 16px;
  top: 96px;
  z-index: 100;
  display: flex;
  flex-direction: column;
  gap: 6px;
  &--embedded {
    position: relative;
    left: auto;
    top: auto;
    z-index: auto;
    width: 100%;
  }
}

.resource-panel {
  width: 381px;
  padding: 10px;
  box-sizing: border-box;
  background: #03060a;
  border: 1px solid #30363b;
  border-radius: 6px;
  overflow: hidden;
  flex-shrink: 0;
}

.resource-panels--embedded .resource-panel {
  width: 100%;
}

.panel-header {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 16px;
  // min-height: 56px;
  aspect-ratio: 361/84;
  padding: 10px 12px 10px 12px;
  box-sizing: border-box;
  cursor: pointer;
  user-select: none;
  box-sizing: border-box;
  border-radius: 6px;
  background: url("../assets/images/card_bg.png") center / 100% 100% no-repeat;

  .resource-panel.expanded & {
    background: url("../assets/images/card_bg_selected.png") center / 100% 100%
      no-repeat;
  }

  &__icon {
    flex-shrink: 0;
  }

  &__main {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }

  &__title-row {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 6px;
  }

  &__ratio {
    font-size: 12px;
    font-weight: 500;
    color: rgba(255, 255, 255, 0.38);
    font-variant-numeric: tabular-nums;
    line-height: 1.2;
  }

  &__deco {
    flex-shrink: 0;
    width: 56px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    opacity: 0.95;
    pointer-events: none;
  }
}

.panel-title {
  font-size: 16px;
  font-weight: 500;
  color: #fff;
}

.panel-title-triangle {
  flex-shrink: 0;
  width: 0;
  height: 0;
  margin-top: 1px;
  border-left: 5px solid transparent;
  border-right: 5px solid transparent;
  border-top: 6px solid rgba(255, 255, 255, 0.58);
  border-bottom: 0;
  transition:
    transform 0.22s ease,
    border-top-color 0.2s ease;
  transform-origin: 50% 35%;

  &--expanded {
    transform: rotate(180deg);
  }
}

.panel-deco-svg {
  width: 100%;
  height: 100%;
  display: block;
}

.panel-icon-rings {
  position: relative;
  width: 52px;
  height: 52px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #25272B;
  background: rgba(3, 6, 10, 0.60);
  border-radius: 50%;
  box-sizing: border-box;
}

.panel-icon-ring {
  position: absolute;
  border-radius: 50%;
  box-sizing: border-box;
  pointer-events: none;
  transition:
    border-color 0.28s ease,
    box-shadow 0.28s ease,
    opacity 0.2s ease;

  &--outer {
    border: 1px solid #25272B;
    background: rgba(3, 6, 10, 0.60);
  }

  &--inner {
    width: 40px;
    height: 40px;
    left: 50%;
    top: 50%;
    margin-left: -20px;
    margin-top: -20px;
    border: 1px solid #25272B;
    background: rgba(0, 0, 0, 0.65);
    box-shadow: 4px -1px 4px 0 rgba(0, 52, 152, 0.25) inset, -5px 0 4px 0 rgba(0, 52, 152, 0.25) inset;
  }
}
.panel-icon-rings--open{
  border: 2px solid #4564c9;
  background: rgba(3, 6, 10, 0.6);
  border-radius: 50%;
}

.panel-icon-rings--open .panel-icon-ring--outer {
  border: 2px solid #4564c9;
  background: rgba(3, 6, 10, 0.6);

  // box-shadow:
  //   0 0 14px rgba(64, 158, 255, 0.42),
  //   0 0 4px rgba(64, 158, 255, 0.25) inset;
}

.panel-icon-rings--open .panel-icon-ring--inner {
  
}

.panel-icon-photo {
  position: relative;
  z-index: 1;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.panel-icon-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
}

.panel-content {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows 0.3s ease;
  background: #03060a;
  border-top: none;

  .resource-panel.expanded & {
    grid-template-rows: 1fr;
  }

  > .panel-body {
    overflow: hidden;
    overflow-y: auto;
    max-height: calc(100vh - 400px);
    min-height: 0;
  }
}

.panel-foldup {
  height: 32px;
  width: calc(100% + 20px);
  margin: 0 -10px -10px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  user-select: none;
  border-radius: 0 0 6px 6px;
  background: #0d1014;

  &__icon {
    width: 28px;
    height: 18px;
    object-fit: contain;
    display: block;
    opacity: 0.92;
  }
}

// 统计概览
.stats-row {
  display: flex;
  flex-direction: row;
  align-items: stretch;
  justify-content: stretch;
  gap: 0;
  margin: 10px 0;
  padding: 12px 0;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.04);
  margin-top: 8px;
}

.stat-item {
  flex: 1;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-width: 0;
  padding: 0 6px;

  &:first-child {
    border-right: 1px solid rgba(48, 54, 59, 0.65);
  }

  .stat-num {
    color: #54EDCE;
    font-family: "Alibaba PuHuiTi 3.0";
    font-size: 16px;
    font-size: 20px;
    font-weight: 700;
  }

  .stat-label {
    color: rgba(255, 255, 255, 0.85);
    font-family: "HarmonyOS Sans SC";
    font-size: 16px;
    font-style: normal;
    font-weight: 400;
  }
}

.empty-hint {
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

// 设备卡片（三栏：图标盒 | 名称+在线|ID | 状态字色）
.device-card {
  display: flex;
  flex-direction: column;
  gap: 0;
  margin-top: 8px;
  padding: 0;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 6px;
  overflow: hidden;

  &:first-of-type {
    margin-top: 10px;
  }

  &:last-child {
    margin-bottom: 14px;
  }

  &__main {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 16px;
    padding: 12px;
    min-width: 0;
  }

  &__icon-wrap {
    flex-shrink: 0;
    width: 48px;
    height: 48px;
    border-radius: 4px;
    background: #1c1f26;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &__icon-img {
    width: 30px;
    height: 30px;
    object-fit: contain;
    display: block;
  }

  &__info {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 6px;
  }

  &__title-line {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: center;
    column-gap: 8px;
    min-width: 0;
    width: 100%;
  }

  &__name {
    min-width: 0;
    font-size: 15px;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.94);
    line-height: 1.25;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__meta {
    font-size: 12px;
    font-weight: 400;
    color: rgba(255, 255, 255, 0.42);
    line-height: 1.2;
    display: flex;
    flex-direction: row;
    align-items: center;
    flex-wrap: wrap;
    gap: 0 6px;
  }

  &__meta-sep {
    color: rgba(255, 255, 255, 0.28);
    user-select: none;
  }

  &__status {
    flex-shrink: 0;
    font-size: 14px;
    font-weight: 400;
    line-height: 1.2;
    white-space: nowrap;

    &--escorting {
      color: #4965C9;
    }

    &--ready {
      color: #37EADB;
      
    }

    &--offline {
      color: #EA375F;
    }
  }

  &__recall-row {
    padding: 0 12px 10px;
    display: flex;
    justify-content: flex-end;
  }

  &--clickable {
    cursor: pointer;
    transition:
      border-color 0.2s,
      background 0.2s;

    &:hover:not(.device-card--stream-active) {
      border-color: rgba(64, 158, 255, 0.45);
      background: rgba(64, 158, 255, 0.06);
    }
  }

  &--stream-active {
    border: 1px solid #4965c9;
    border-left-width: 4px;
    /* 合法属性名：top-left / bottom-left；并覆盖父级四角 6px，仅右侧圆角 */
    border-radius: 0 6px 6px 0;
    background: linear-gradient(90deg, rgba(73, 101, 201, 0.45) 0%, #03060a 100%);

    &:hover {
      border-color: #5b74d8;
      background: linear-gradient(90deg, rgba(73, 101, 201, 0.52) 0%, #03060a 100%);
    }
    .device-card__icon-wrap{
      background: rgba(255, 255, 255, 0.10);
    }
  }
}

.action-btn {
  padding: 8px 16px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition:
    background 0.2s,
    border-color 0.2s,
    color 0.2s;
  letter-spacing: 0.5px;
  white-space: nowrap;
}

.recall-btn {
  border: 1px solid #4965c9;
  background: transparent;
  color: rgba(255, 255, 255, 0.92);

  &:hover:not(:disabled) {
    background: rgba(73, 101, 201, 0.2);
    border-color: #5b74d8;
    color: #fff;
  }
}

// 滚动条
.panel-body {
  &::-webkit-scrollbar {
    width: 4px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.15);
    border-radius: 2px;

    &:hover {
      background: rgba(255, 255, 255, 0.25);
    }
  }
}
</style>
