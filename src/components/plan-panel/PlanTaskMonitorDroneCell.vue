<template>
  <article class="ptm-cell" :class="{ 'ptm-cell--collapsed': hidden }">
    <header class="ptm-cell__head">
      <div class="ptm-cell__title">
        <span class="ptm-cell__id">【ID:{{ display.sn }}】</span>
        <span class="ptm-cell__name">{{ display.name }}</span>
      </div>
      <div class="ptm-cell__head-actions">
        <button type="button" class="ptm-cell__recall" :disabled="recallLoading" @click="emit('recall')">
          一键召回
        </button>
        <button
          type="button"
          class="ptm-cell__eye"
          :class="{ 'ptm-cell__eye--off': hidden }"
          :aria-pressed="hidden"
          aria-label="隐藏或显示视频与航线信息"
          @click="emit('toggle-visible')"
        >
          <i :class="hidden ? 'ri-eye-off-line' : 'ri-eye-line'" />
        </button>
      </div>
    </header>

    <div class="ptm-cell__telemetry">
      <div class="ptm-cell__tel-row">
        <span>经度 {{ formatCoord(display.lng) }}</span>
        <span>纬度 {{ formatCoord(display.lat) }}</span>
      </div>
      <div class="ptm-cell__tel-row">
        <span>HEAD {{ formatAngle(display.attitudeHead) }}</span>
        <span>PITCH {{ formatAngle(display.attitudePitch) }}</span>
      </div>
      <div v-if="taskProgressText || targetDeviceLabel" class="ptm-cell__task-meta">
        <span v-if="taskProgressText">任务开始时间：{{ taskProgressText }}</span>
        <span v-if="targetDeviceLabel">任务目标设备：{{ targetDeviceLabel }}</span>
      </div>
    </div>

    <div v-show="!hidden" class="ptm-cell__lower">
      <div ref="videoWrapRef" class="ptm-cell__video">
        <video
          ref="videoRef"
          class="ptm-cell__video-el"
          muted
          autoplay
          playsinline
          webkit-playsinline
        />
        <div v-if="!effectivePlayUrl" class="ptm-cell__video-placeholder">暂无视频流</div>
      </div>

      <footer class="ptm-cell__foot">
        <!-- <div class="ptm-cell__route">航线信息：{{ routeLabel || "—" }}</div> -->
        <ul v-if="events.length" class="ptm-cell__events">
          <li v-for="ev in events" :key="ev.id" class="ptm-cell__event">
            <span class="ptm-cell__event-type">{{ ev.warnType }}</span>
            <span class="ptm-cell__event-time">{{ ev.eventTime }}</span>
            <span v-if="ev.label" class="ptm-cell__event-label">{{ ev.label }}</span>
          </li>
        </ul>
        <div v-else class="ptm-cell__events-empty">暂无 AI 事件</div>
        <button type="button" class="ptm-cell__global" @click="enterVideoFullscreen">
          全局展示
          <i class="ri-fullscreen-line" aria-hidden="true" />
        </button>
      </footer>
    </div>
  </article>
</template>

<script setup>
import { ref, computed } from "vue";
import { useWebrtcPlayUrl } from "@/composables/useWebrtcPlayUrl.js";
import { useLiveDroneTelemetry } from "@/composables/useLiveDroneTelemetry.js";

const props = defineProps({
  slotKey: { type: String, required: true },
  droneId: { type: String, default: "" },
  mqttSn: { type: String, default: "" },
  playUrl: { type: String, default: "" },
  routeLabel: { type: String, default: "" },
  /** planDetail.planAlgorithmDataDTO[i] 解析出的展示信息 */
  droneInfo: { type: Object, default: null },
  /** MQTT 匹配用，与 droneInfo 一致 */
  drone: { type: Object, default: null },
  /** @type {Array<Record<string, any>>} */
  events: { type: Array, default: () => [] },
  taskProgressText: { type: String, default: "" },
  targetDeviceLabel: { type: String, default: "" },
  hidden: { type: Boolean, default: false },
  recallLoading: { type: Boolean, default: false },
});

const emit = defineEmits(["recall", "toggle-visible"]);

const videoWrapRef = ref(null);

const effectivePlayUrl = computed(() => String(props.playUrl || "").trim());

const { videoRef } = useWebrtcPlayUrl(() => effectivePlayUrl.value, {
  allowEnvFallback: false,
});

/** MQTT 写入 deviceStore 后此处自动刷新（勿 spread store 对象） */
const liveDrone = useLiveDroneTelemetry(
  () => props.droneId,
  () => props.droneInfo ?? props.drone,
  () => props.mqttSn,
);

function pickNumber(...values) {
  for (const v of values) {
    const n = Number(v);
    if (Number.isFinite(n)) return n;
  }
  return null;
}

/** 详情为底稿，MQTT 有值时覆盖经纬度与姿态 */
const display = computed(() => {
  const detail = props.droneInfo && typeof props.droneInfo === "object" ? props.droneInfo : {};
  const live = liveDrone.value;
  const sn = String(
    detail.sn ?? detail.mqttSn ?? live?.sn ?? props.mqttSn ?? props.droneId ?? "",
  ).trim();
  console.log('detail', detail, props.droneInfo)
  return {
    sn: sn || "—",
    name:
      String(detail.name ?? live?.name ?? props.droneId ?? "无人机").trim() || "无人机",
    lng: pickNumber(live?.lng, live?.longitude, detail.lng, detail.longitude),
    lat: pickNumber(live?.lat, live?.latitude, detail.lat, detail.latitude),
    attitudeHead: pickNumber(
      live?.attitudeHead,
      live?.head,
      detail.attitudeHead,
      detail.head,
    ),
    attitudePitch: pickNumber(
      live?.attitudePitch,
      live?.pitch,
      detail.attitudePitch,
      detail.pitch,
    ),
  };
});

function formatCoord(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return "—";
  return n.toFixed(2);
}

function formatAngle(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return "—";
  return `${n.toFixed(1)}°`;
}

async function enterVideoFullscreen() {
  const el = videoWrapRef.value || videoRef.value;
  if (!el) return;
  try {
    if (document.fullscreenElement === el) {
      await document.exitFullscreen();
      return;
    }
    await el.requestFullscreen?.();
  } catch {
    /* ignore */
  }
}

</script>

<style lang="scss" scoped>
.ptm-cell {
  display: flex;
  flex-direction: column;
  min-height: 0;
  min-width: 0;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  background: #1a1f26;
  overflow: hidden;

  &--collapsed {
    align-self: start;
    height: auto;
    flex: 0 0 auto;
  }
}

.ptm-cell__lower {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
}

.ptm-cell__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
  padding: 10px 12px 8px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.ptm-cell__title {
  min-width: 0;
  font-size: 13px;
  font-weight: 600;
  color: #fff;
}

.ptm-cell__id {
  color: rgba(255, 255, 255, 0.75);
}

.ptm-cell__name {
  margin-left: 4px;
}

.ptm-cell__head-actions {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.ptm-cell__recall {
  height: 28px;
  padding: 0 10px;
  border: 1px solid #3b6fd8;
  border-radius: 4px;
  background: transparent;
  color: #fff;
  font-size: 12px;
  cursor: pointer;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.ptm-cell__eye {
  width: 28px;
  height: 28px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 4px;
  background: transparent;
  color: rgba(255, 255, 255, 0.8);
  cursor: pointer;

  &--off {
    color: rgba(255, 255, 255, 0.35);
  }
}

.ptm-cell__telemetry {
  padding: 8px 12px;
  font-size: 12px;
  line-height: 1.5;
  color: rgba(255, 255, 255, 0.78);
}

.ptm-cell__tel-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12px 16px;
}

.ptm-cell__task-meta {
  margin-top: 6px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  color: rgba(255, 255, 255, 0.65);
}

.ptm-cell__video {
  position: relative;
  flex: 1;
  min-height: 120px;
  margin: 0 10px;
  border-radius: 6px;
  background: #000;
  overflow: hidden;
}

.ptm-cell__video-el {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
  min-height: 140px;
}

.ptm-cell__video-placeholder {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.35);
}

.ptm-cell__foot {
  flex-shrink: 0;
  padding: 8px 12px 10px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.ptm-cell__route {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.65);
}

.ptm-cell__events {
  margin: 0;
  padding: 0;
  list-style: none;
  max-height: 72px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.ptm-cell__event {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.75);
  padding: 4px 6px;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.04);
}

.ptm-cell__events-empty {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.35);
}

.ptm-cell__global {
  align-self: flex-end;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  border: none;
  background: none;
  color: #6b9fff;
  font-size: 12px;
  cursor: pointer;
  padding: 0;

  &:hover {
    text-decoration: underline;
  }
}
</style>
