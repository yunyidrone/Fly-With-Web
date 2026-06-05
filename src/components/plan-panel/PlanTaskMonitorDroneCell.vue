<template>
  <article class="ptm-cell" :class="{ 'ptm-cell--collapsed': hidden }">
    <header class="ptm-cell__subhead">
      <div class="ptm-cell__drone-title">
        <img :src="sjWrjPng" class="ptm-cell__drone-icon" alt="" aria-hidden="true" />
        <span class="ptm-cell__drone-name">
          {{ display.name }}<template v-if="display.id">【ID：{{ display.id }}】</template>
        </span>
      </div>
      <button
        type="button"
        class="ptm-cell__monitor-toggle"
        :class="{ 'ptm-cell__monitor-toggle--off': hidden }"
        :aria-pressed="!hidden"
        @click="emit('toggle-visible')"
      >
        <span class="ptm-cell__monitor-label">{{ hidden ? "已关闭监控" : "已打开监控" }}</span>
        <i :class="hidden ? 'ri-eye-off-line' : 'ri-eye-line'" aria-hidden="true" />
      </button>
    </header>

    <div class="ptm-cell__telemetry" :class="{ 'ptm-cell__telemetry--compact': hidden }">
      <div class="telemetry-grid">
        <div class="tel-cell">
          <span class="tel-label">经度</span>
          <span class="tel-value">{{ formatCoord(display.lng) }}</span>
        </div>
        <div class="tel-sep" aria-hidden="true" />
        <div class="tel-cell">
          <span class="tel-label">纬度</span>
          <span class="tel-value">{{ formatCoord(display.lat) }}</span>
        </div>
        <div class="tel-sep" aria-hidden="true" />
        <div class="tel-cell">
          <span class="tel-label">高度</span>
          <span class="tel-value">{{ altText }}</span>
        </div>
      </div>
      <div class="telemetry-grid telemetry-row2">
        <div class="tel-cell">
          <span class="tel-label">HEAD</span>
          <span class="tel-value">{{ formatAngle(display.attitudeHead) }}</span>
        </div>
        <div class="tel-sep" aria-hidden="true" />
        <div class="tel-cell">
          <span class="tel-label">PITCH</span>
          <span class="tel-value">{{ formatAngle(display.attitudePitch) }}</span>
        </div>
        <div class="tel-sep" aria-hidden="true" />
        <div class="tel-cell">
          <span class="tel-label">ROLL</span>
          <span class="tel-value">{{ formatAngle(display.attitudeRoll) }}</span>
        </div>
      </div>
    </div>

    <div v-show="!hidden" class="ptm-cell__lower">
      <div ref="videoWrapRef" class="ptm-cell__video">
        <div class="ptm-cell__video-overlay">
          <span class="ptm-cell__perspective">
            <img :src="arrowRightPng" alt="" class="ptm-cell__chev" width="16" height="16" aria-hidden="true" />
            {{ perspectiveVideoText }}
          </span>
          <!-- <div class="ptm-cell__view-switch" role="group" aria-label="视角切换">
            <button
              type="button"
              class="ptm-cell__view-tile"
              :class="{ 'ptm-cell__view-tile--active': viewMode === 'drone' }"
              :aria-pressed="viewMode === 'drone'"
              @click="viewMode = 'drone'"
            >
              <span class="ptm-cell__view-icon-frame">
                <img class="ptm-cell__view-icon" :src="sjWrjPng" alt="" aria-hidden="true" />
              </span>
              <span class="ptm-cell__view-label">无人机视角</span>
            </button>
            <button
              type="button"
              class="ptm-cell__view-tile"
              :class="{ 'ptm-cell__view-tile--active': viewMode === 'airport' }"
              :aria-pressed="viewMode === 'airport'"
              @click="viewMode = 'airport'"
            >
              <span class="ptm-cell__view-icon-frame">
                <img class="ptm-cell__view-icon" :src="sjJcPng" alt="" aria-hidden="true" />
              </span>
              <span class="ptm-cell__view-label">机场视角</span>
            </button>
          </div> -->
        </div>
        <button type="button" class="ptm-cell__shot-btn" aria-label="截图" @click.stop>
          <span class="ptm-cell__shot-icon-frame">
            <img class="ptm-cell__shot-icon" :src="screenshotPng" alt="" aria-hidden="true" />
          </span>
          <span class="ptm-cell__shot-label">截图</span>
        </button>
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

      <div class="ptm-cell__info">
        <p class="ptm-cell__route">航线信息：系统设定</p>
        <ul class="ptm-cell__ai-list">
          <template v-if="hasAiEvents">
            <li v-for="(ev, idx) in aiEventSlots" :key="idx" class="ptm-cell__ai-line" v-show="ev">
              <span class="ptm-cell__ai-k">ai事件：</span>
              {{ ev.warnType }}
              <span v-if="ev.eventTime" class="ptm-cell__ai-time">{{ ev.eventTime }}</span>
            </li>
          </template>
          <li v-else class="ptm-cell__ai-line">
            <span class="ptm-cell__ai-k">AI事件：</span>暂无AI事件
          </li>
        </ul>
      </div>
    </div>

    <footer class="ptm-cell__foot">
      <button type="button" class="ptm-cell__foot-btn ptm-cell__foot-btn--outline" @click="enterVideoFullscreen">
        全局展示
        <img class="ptm-cell__foot-icon" :src="qjxsPng" alt="" aria-hidden="true" />
      </button>
      <button
        type="button"
        class="ptm-cell__foot-btn ptm-cell__foot-btn--primary"
        :disabled="recallLoading"
        @click="emit('recall')"
      >
        一键召回
        <img class="ptm-cell__foot-icon" :src="yjzhPng" alt="" aria-hidden="true" />
      </button>
    </footer>
  </article>
</template>

<script setup>
import { ref, computed } from "vue";
import { useWebrtcPlayUrl } from "@/composables/useWebrtcPlayUrl.js";
import { useLiveDroneTelemetry } from "@/composables/useLiveDroneTelemetry.js";
import arrowRightPng from "@/assets/images/arrow_right.png";
import sjWrjPng from "@/assets/images/sj_wrj.png";
import sjJcPng from "@/assets/images/sj_jc.png";
import screenshotPng from "@/assets/images/screenshot.png";
import qjxsPng from "@/assets/images/qjxs.png";
import yjzhPng from "@/assets/images/yjzh.png";

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

const AI_EVENT_SLOT_COUNT = 5;

const hasAiEvents = computed(() => (props.events || []).length > 0);

const aiEventSlots = computed(() => {
  const list = (props.events || []).slice(0, AI_EVENT_SLOT_COUNT);
  return Array.from({ length: AI_EVENT_SLOT_COUNT }, (_, i) => list[i] || null);
});

const videoWrapRef = ref(null);
const viewMode = ref("drone");

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
    if (v == null) continue;
    const n = Number(v);
    if (Number.isFinite(n) && n !== 0) return n;
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
  const id = String(
    props.droneId ?? detail.id ?? detail.sn ?? live?.id ?? live?.sn ?? props.mqttSn ?? "",
  ).trim();
  const name =
    String(detail.name ?? live?.name ?? "无人机").trim() || "无人机";
  return {
    sn: sn || "—",
    id: id && id !== name ? id : "",
    name,
    lng: pickNumber(live?.lng, live?.longitude, detail.lng, detail.longitude),
    lat: pickNumber(live?.lat, live?.latitude, detail.lat, detail.latitude),
    altitude: pickNumber(
      live?.height,
      live?.alt,
      live?.altitude,
      detail.height,
      detail.alt,
      detail.altitude,
    ),
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
    attitudeRoll: pickNumber(
      live?.attitudeRoll,
      live?.roll,
      detail.attitudeRoll,
      detail.roll,
    ),
  };
});

const altText = computed(() => {
  const n = display.value.altitude;
  if (!Number.isFinite(n)) return "—";
  return `${n.toFixed(0)}m`;
});

const perspectiveVideoText = computed(() =>
  viewMode.value === "airport" ? "当前机场视角" : "当前无人机视角",
);

function formatCoord(v) {
  if (v == null) return "—";
  const n = Number(v);
  if (!Number.isFinite(n)) return "—";
  return n.toFixed(2);
}

function formatAngle(v) {
  if (v == null) return "—";
  const n = Number(v);
  if (!Number.isFinite(n)) return "—";
  return `${n.toFixed(0)}°`;
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
  border: 1px solid #30363B;
  border-radius: 6px;
  background: rgba(3, 6, 10, 0.65);
  overflow: hidden;

  &--collapsed {
    align-self: start;
    height: auto;
    flex: 0 0 auto;
  }
}

.ptm-cell__subhead {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  border-radius: 2px;
  background: #1C222A;
  margin: 10px 10px 0 10px;
}

.ptm-cell__drone-title {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  font-size: 13px;
  font-weight: 600;
  color: #fff;
}

.ptm-cell__drone-icon {
  width: 18px;
  height: 18px;
  object-fit: contain;
  flex-shrink: 0;
}

.ptm-cell__drone-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ptm-cell__monitor-toggle {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
  border: none;
  background: transparent;
  color: rgba(255, 255, 255, 0.85);
  font-size: 12px;
  cursor: pointer;
  padding: 0;

  i {
    font-size: 16px;
  }

  &--off {
    color: rgba(255, 255, 255, 0.45);
  }
}

.ptm-cell__monitor-label {
  white-space: nowrap;
}

.ptm-cell__telemetry {
  padding: 8px 10px 0;

  &--compact {
    padding-bottom: 10px;
  }
}

.telemetry-grid {
  display: flex;
  align-items: stretch;
  justify-content: space-between;
  gap: 4px;
  margin-bottom: 8px;
  font-size: 13px;

  &.telemetry-row2 {
    margin-bottom: 10px;
  }
}

.tel-cell {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-width: 0;
  padding: 8px 4px;
  border-radius: 2px;
  background: #1c222a;
}

.tel-label {
  color: rgba(255, 255, 255, 0.45);
  font-size: 12px;
}

.tel-value {
  color: rgba(255, 255, 255, 0.92);
  font-weight: 500;
  font-variant-numeric: tabular-nums;
}

.tel-sep {
  width: 0;
  margin: 0;
  padding: 0;
  overflow: hidden;
  flex-shrink: 0;
  align-self: stretch;
  opacity: 0;
}

.ptm-cell__lower {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
}

.ptm-cell__video {
  position: relative;
  flex: 1;
  min-height: 140px;
  margin: 0 10px;
  border-radius: 6px;
  background: #000;
  overflow: hidden;
}

.ptm-cell__video-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  z-index: 2;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
  padding: 8px 10px 0;
  pointer-events: none;

  .ptm-cell__perspective,
  .ptm-cell__view-switch {
    pointer-events: auto;
  }
}

.ptm-cell__chev {
  width: 16px;
  height: 16px;
  object-fit: contain;
  flex-shrink: 0;
}

.ptm-cell__perspective {
  flex: 1;
  min-width: 0;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.95);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
}

.ptm-cell__view-switch {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  flex-shrink: 0;
}

.ptm-cell__view-tile {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 2px 4px;
  border: none;
  background: transparent;
  color: #fff;
  cursor: pointer;
  opacity: 0.75;

  &--active {
    opacity: 1;
  }
}

.ptm-cell__view-icon-frame {
  width: 26px;
  height: 26px;
  border-radius: 2px;
  border: 1px solid #fff;
  background: rgba(28, 34, 42, 0.65);
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.ptm-cell__view-icon {
  width: 18px;
  height: 18px;
  object-fit: contain;
}

.ptm-cell__view-label {
  font-size: 11px;
  white-space: nowrap;
}

.ptm-cell__shot-btn {
  position: absolute;
  right: 8px;
  top: 72px;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  border: none;
  background: transparent;
  color: #fff;
  cursor: pointer;
  padding: 0;
}

.ptm-cell__shot-icon-frame {
  width: 26px;
  height: 26px;
  border-radius: 2px;
  background: rgba(28, 34, 42, 0.65);
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.ptm-cell__shot-icon {
  width: 18px;
  height: 18px;
  object-fit: contain;
}

.ptm-cell__shot-label {
  font-size: 12px;
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
  z-index: 1;
}

.ptm-cell__info {
  flex-shrink: 0;
  padding: 8px 12px 4px;
  font-size: 12px;
  line-height: 1.55;
  color: rgba(255, 255, 255, 0.72);
}

.ptm-cell__route {
  margin: 0 0 4px;
  padding: 6px 10px;
  border-radius: 2px 2px 0 0;
  background: #1C222A;
}

.ptm-cell__ai-list {
  margin: 0;
  padding: 0;
  padding-left: 10px;
  list-style: none;
  min-height: calc(5 * 1.55em);
}

.ptm-cell__ai-line {
  margin: 0 0 2px;
  min-height: 1.55em;
}

.ptm-cell__ai-k {
  color: rgba(255, 255, 255, 0.55);
}

.ptm-cell__ai-time {
  margin-left: 6px;
  color: rgba(255, 255, 255, 0.45);
}

.ptm-cell__foot {
  flex-shrink: 0;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 8px;
  padding: 8px 12px 12px;
}

.ptm-cell__foot-btn {
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 6px 24px 6px 24.5px;
  border-radius: 44px;
  font-family: "Segoe UI", sans-serif;
  font-size: 14px;
  font-style: normal;
  font-weight: 600;
  line-height: 20px;
  cursor: pointer;
  transition:
    background 0.15s,
    border-color 0.15s,
    opacity 0.15s;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.ptm-cell__foot-icon {
  width: 14px;
  height: 14px;
  object-fit: contain;
  flex-shrink: 0;
}

.ptm-cell__foot-btn--outline {
  border: 1px solid #558efc;
  background: rgba(255, 255, 255, 0.02);
  color: #fff;

  &:hover:not(:disabled) {
    background: rgba(85, 142, 252, 0.14);
  }
}

.ptm-cell__foot-btn--primary {
  border: 1px solid #558efc;
  background: linear-gradient(180deg, #3d6fd8 0%, #2a4fa8 100%);
  color: #fff;

  &:hover:not(:disabled) {
    filter: brightness(1.08);
  }
}
</style>
