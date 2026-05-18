<!--
 * @Author: ml
 * @Date: 2026-03-12 09:09:07
 * @FilePath: /accompanying-fly-project/src/components/DroneStream.vue
 * @Description: 无人机视频流卡片（伴飞任务 / 遥测 / 视频 / 操作）
-->
<template>
  <div class="drone-stream-card">
    <header class="card-header">
      <!-- 顶行：箭头图 + 名称 | 状态（紧挨） + 右侧电量 -->
      <div class="card-topline">
        <div class="card-topline__identity">
          <img
            :src="arrowRightPng"
            alt=""
            class="card-arrow-icon card-topline__chev-img"
            width="16"
            height="16"
            aria-hidden="true"
          />
          <span class="card-topline__name">{{ displayDroneName }}</span>
          <span class="card-topline__pipe" aria-hidden="true">|</span>
          <span class="card-topline__status" :class="toplineStatusClass">{{
            statusLabel
          }}</span>
        </div>
        <span class="card-topline__battery">电量:{{ batteryDisplay }}</span>
      </div>

      <div class="telemetry-grid">
        <div class="tel-cell">
          <span class="tel-label">经度</span>
          <span class="tel-value">{{ formatCoord(lng) }}</span>
        </div>
        <div class="tel-sep" aria-hidden="true" />
        <div class="tel-cell">
          <span class="tel-label">纬度</span>
          <span class="tel-value">{{ formatCoord(lat) }}</span>
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
          <span class="tel-value">{{ headText }}</span>
        </div>
        <div class="tel-sep" aria-hidden="true" />
        <div class="tel-cell">
          <span class="tel-label">PITCH</span>
          <span class="tel-value">{{ pitchText }}</span>
        </div>
        <div class="tel-sep" aria-hidden="true" />
        <div class="tel-cell">
          <span class="tel-label">ROLL</span>
          <span class="tel-value">{{ rollText }}</span>
        </div>
      </div>

      <div class="task-block">
        <div class="task-block__title">
          <img
            :src="arrowRightPng"
            alt=""
            class="card-arrow-icon"
            width="16"
            height="16"
            aria-hidden="true"
          />
          <span>伴飞任务:{{ companionTitle }}</span>
        </div>
        <div class="task-block__lines">
          <div class="task-block__line">
            <span class="meta-k">伴飞开始时间：</span>{{ escortStartText }}
          </div>
          <div class="task-block__line">
            <span class="meta-k">伴飞目标设备：</span>{{ targetDeviceLabel }}
          </div>
        </div>
      </div>
    </header>

    <div class="header-divider" />

    <!-- 视频区：标题在左，操作在右（关闭仍使用外壳上的按钮） -->
    <div ref="videoWrapRef" class="video-wrap">
      <div class="video-overlay-top">
        <span class="perspective-hint">
          <img
            :src="arrowRightPng"
            alt=""
            class="card-arrow-icon"
            width="16"
            height="16"
            aria-hidden="true"
          />
          {{ perspectiveVideoText }}
        </span>
        <div class="video-view-switch" role="group" aria-label="视角切换">
          <button
            type="button"
            class="view-tile"
            :class="{ active: viewMode === 'drone' }"
            :aria-pressed="viewMode === 'drone'"
            @click="viewMode = 'drone'"
          >
            <span class="view-tile__icon-frame">
              <img class="view-tile__icon" :src="sjWrjPng" alt="" aria-hidden="true" />
            </span>
            <span class="view-tile__label">无人机视角</span>
          </button>
          <button
            type="button"
            class="view-tile"
            :class="{ active: viewMode === 'airport' }"
            :aria-pressed="viewMode === 'airport'"
            @click="viewMode = 'airport'"
          >
            <span class="view-tile__icon-frame">
              <img class="view-tile__icon" :src="sjJcPng" alt="" aria-hidden="true" />
            </span>
            <span class="view-tile__label">机场视角</span>
          </button>
        </div>
      </div>
      <button
        type="button"
        class="video-shot-btn"
        @click="handleScreenshot"
      >
        <span class="video-shot-btn__icon-frame">
          <img class="video-shot-btn__icon" :src="screenshotPng" alt="" aria-hidden="true" />
        </span>
        <span class="video-shot-btn__label">截图</span>
      </button>
      <div class="video-inner">
        <video
          ref="videoPlayerRef"
          :muted="true"
          controls
          playsinline
          class="video-element"
        />
      </div>
    </div>

    <footer class="card-footer">
      <button
        type="button"
        class="footer-btn btn-neutral"
        @click="enterVideoFullscreen"
      >
        全局展示
        <img class="footer-btn__icon-img" :src="qjxsPng" alt="" aria-hidden="true" />
      </button>
      <button
        type="button"
        class="footer-btn btn-primary"
        @click="handleImmersiveToggle"
      >
        {{ immersiveBtnLabel }}
        <img class="footer-btn__icon-img" :src="cjbfPng" alt="" aria-hidden="true" />
      </button>
      <button
        type="button"
        class="footer-btn btn-neutral"
        :disabled="isLoading"
        @click="handleRecall"
      >
        一键召回
        <img class="footer-btn__icon-img" :src="yjzhPng" alt="" aria-hidden="true" />
      </button>
    </footer>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from "vue";
import { useSystemStore } from "@/stores/index.js";
import { AccompanyingFlyService } from "@/api";
import { ElMessageBox, ElMessage } from "element-plus";
import { VIDEO_CONFIG, DEVICE_CONFIG } from "@/config/app-config.js";
import arrowRightPng from "@/assets/images/arrow_right.png";
import sjWrjPng from "@/assets/images/sj_wrj.png";
import sjJcPng from "@/assets/images/sj_jc.png";
import screenshotPng from "@/assets/images/screenshot.png";
import qjxsPng from "@/assets/images/qjxs.png";
import cjbfPng from "@/assets/images/cjbf.png";
import yjzhPng from "@/assets/images/yjzh.png";

const props = defineProps({
  droneId: { type: String, default: "" },
  droneName: { type: String, default: "" },
  targetDeviceLabel: { type: String, default: "警车0001号" },
  /** 电量 0–100，与左侧列表一致 */
  battery: { type: Number, default: undefined },
  /** 顶行状态：伴飞中 / 就绪 / 离线 */
  statusLabel: { type: String, default: "就绪" },
  /** 「伴飞任务:xxx」中的 xxx */
  companionTaskTitle: { type: String, default: "" },
  /** 由父页控制：沉浸伴飞时仅显示地图 + 本视频 */
  immersiveFlight: { type: Boolean, default: false },
  /** 设备级拉流地址（接口 streamUrl），为空时用环境变量 VIDEO_CONFIG */
  streamUrl: { type: String, default: "" },
});

const emit = defineEmits(["toggle-immersive", "recall"]);

let pc;
const systemStore = useSystemStore();
const videoPlayerRef = ref(null);
const videoWrapRef = ref(null);
const resolvedStreamUrl = computed(() => {
  const u = props.streamUrl?.trim?.() ? props.streamUrl.trim() : "";
  return u || VIDEO_CONFIG.streamUrl;
});
const isLoading = ref(false);
const viewMode = ref("drone");

const lastPosition = computed(
  () =>
    systemStore?.droneMessageList?.[systemStore.droneMessageList.length - 1] ||
    {},
);
const droneCurrentState = computed(() => systemStore?.droneCurrentState || {});

const displayDroneName = computed(() => props.droneName || "无人机名称");

const batteryDisplay = computed(() => {
  const b = props.battery;
  if (b == null || Number.isNaN(Number(b))) return "—";
  return `${Math.round(Number(b))}%`;
});

const companionTitle = computed(
  () =>
    props.companionTaskTitle || props.droneName || props.droneId || "任务一号",
);

const toplineStatusClass = computed(() => {
  const s = props.statusLabel;
  if (s === "伴飞中") return "is-escorting";
  if (s === "离线") return "is-offline";
  return "is-ready";
});

const perspectiveVideoText = computed(() =>
  viewMode.value === "airport" ? "当前机场视角" : "当前无人机视角",
);

const immersiveBtnLabel = computed(() =>
  props.immersiveFlight ? "退出沉浸" : "沉浸伴飞",
);

const lng = computed(() => lastPosition.value?.current_longitude);
const lat = computed(() => lastPosition.value?.current_latitude);
const alt = computed(() => lastPosition.value?.current_height);

const escortStartText = computed(() => {
  if (systemStore.droneStatus === 1) {
    const first = systemStore.droneMessageList?.[0];
    if (first?.timestamp) return String(first.timestamp);
    return "进行中";
  }
  return "—";
});

function isNumber(value) {
  return !isNaN(parseFloat(value)) && isFinite(value);
}

function formatCoord(v) {
  if (!isNumber(v)) return "—";
  return Number(v).toFixed(2);
}

const altText = computed(() => {
  if (!isNumber(alt.value)) return "—";
  return `${Number(alt.value).toFixed(0)}m`;
});

const headText = computed(() =>
  isNumber(droneCurrentState.value.attitude_head)
    ? `${Number(droneCurrentState.value.attitude_head).toFixed(1)}°`
    : "—",
);
const pitchText = computed(() =>
  isNumber(droneCurrentState.value.attitude_pitch)
    ? `${Number(droneCurrentState.value.attitude_pitch).toFixed(1)}°`
    : "—",
);
const rollText = computed(() =>
  isNumber(droneCurrentState.value.attitude_roll)
    ? `${Number(droneCurrentState.value.attitude_roll).toFixed(1)}°`
    : "—",
);

const initPlayVideo = async () => {
  if (!resolvedStreamUrl.value || !videoPlayerRef.value) return;
  pc = new RTCPeerConnection({
    iceServers: [{ urls: "stun:stun.aliyungf.com:3478" }],
    bundlePolicy: "max-bundle",
  });
  pc.addTransceiver("video", { direction: "recvonly" });
  pc.ontrack = (event) => {
    if (event.track.kind === "video" && videoPlayerRef.value) {
      videoPlayerRef.value.srcObject = event.streams[0];
    }
  };
  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);
  let sdp = offer.sdp;
  if (!sdp.includes("a=group:BUNDLE")) {
    sdp = sdp.replace("m=video", "a=group:BUNDLE 0\nm=video");
  }
  try {
    const res = await fetch(resolvedStreamUrl.value, {
      method: "POST",
      headers: { "Content-Type": "application/sdp" },
      body: sdp,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const answerSdp = await res.text();
    await pc.setRemoteDescription({ type: "answer", sdp: answerSdp });
  } catch (error) {
    console.warn("DroneStream 播放错误", error);
  }
};

const handleScreenshot = () => {
  const video = videoPlayerRef.value;
  if (!video || !video.videoWidth) {
    ElMessage.warning("暂无视频画面");
    return;
  }
  const canvas = document.createElement("canvas");
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(video, 0, 0);
  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `drone-screenshot-${Date.now()}.png`;
    a.click();
    URL.revokeObjectURL(url);
    ElMessage.success("截图已下载");
  }, "image/png");
};

const promptMode = () =>
  ElMessageBox.prompt("请输入 mode（1 或 5）", "提示", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    inputPattern: /^[15]$/,
    inputErrorMessage: "请输入 1 或 5",
  }).then(({ value }) => Number(value));

const requestReturnHome = async (mode) => {
  isLoading.value = true;
  try {
    const res = await AccompanyingFlyService.returnHome({
      target_id: DEVICE_CONFIG.targetId,
      mode: String(mode),
    });
    if (res?.code === 200 || res?.code === 404) {
      systemStore.setDroneStatus(0);
      ElMessage.success("召回指令已下发");
    }
  } catch (e) {
    console.warn(e);
  } finally {
    isLoading.value = false;
  }
};

const enterVideoFullscreen = async () => {
  const el = videoWrapRef.value || videoPlayerRef.value;
  if (!el) return;
  try {
    if (document.fullscreenElement === el) {
      await document.exitFullscreen();
      return;
    }
    if (el.requestFullscreen) {
      await el.requestFullscreen();
      return;
    }
    if (videoPlayerRef.value?.webkitEnterFullscreen) {
      videoPlayerRef.value.webkitEnterFullscreen();
      return;
    }
    ElMessage.warning("当前环境不支持全屏");
  } catch (e) {
    console.warn(e);
    ElMessage.warning("无法进入全屏");
  }
};

const handleImmersiveToggle = () => {
  emit("toggle-immersive");
};

const handleRecall = async () => {
  try {
    const mode = await promptMode();
    await requestReturnHome(mode);
    emit("recall", { mode });
  } catch {
    /* cancel */
  }
};

onMounted(() => {
  initPlayVideo();
});

onUnmounted(() => {
  try {
    if (pc) {
      pc.getSenders?.()?.forEach((s) => s.track?.stop());
      pc.close();
    }
  } catch (_) {}
  pc = null;
  if (videoPlayerRef.value) {
    videoPlayerRef.value.srcObject = null;
  }
});
</script>

<style lang="scss" scoped>
.drone-stream-card {
  display: flex;
  flex-direction: column;
  width: 100%;
  max-height: 100%;
  border-radius: 6px;
  border: 1px solid #30363b;
  background: rgba(3, 6, 10, 0.65);
  overflow: hidden;
  color: rgba(255, 255, 255, 0.88);
}

.card-header {
  padding: 10px;
  flex-shrink: 0;
}

.card-topline {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
  font-size: 14px;
  min-width: 0;
  border-radius: 2px;
  background: #1c222a;
  padding: 6px 10px;

  &__identity {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: flex-start;
    gap: 8px;
    min-width: 0;
    flex: 1 1 auto;
    overflow: hidden;
  }

  &__chev-img {
    flex-shrink: 0;
    display: block;
  }

  &__name {
    flex: 0 1 auto;
    min-width: 0;
    max-width: 100%;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.94);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    line-height: 1.2;
  }

  &__pipe {
    flex-shrink: 0;
    color: rgba(255, 255, 255, 0.28);
    user-select: none;
    line-height: 1.2;
  }

  &__status {
    flex-shrink: 0;
    font-weight: 500;
    line-height: 1.2;
    color: rgba(255, 255, 255, 0.52);

    &.is-escorting {
      color: rgba(201, 184, 255, 0.92);
    }

    &.is-ready {
      color: rgba(84, 237, 206, 0.88);
    }

    &.is-offline {
      color: rgba(242, 139, 154, 0.92);
    }
  }

  &__battery {
    flex-shrink: 0;
    margin-left: auto;
    color: rgba(255, 255, 255, 0.72);
    font-variant-numeric: tabular-nums;
    line-height: 1.2;
  }
}

.telemetry-grid {
  display: flex;
  align-items: stretch;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 8px;
  font-size: 13px;

  &.telemetry-row2 {
    margin-bottom: 12px;
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

.task-block {
  font-size: 12px;
  line-height: 1.55;
  color: rgba(255, 255, 255, 0.72);
  border-radius: 2px;
  background: #1c222a;
  &__title {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 6px;
    font-size: 14px;
    font-weight: 500;
    color: #fff;
    border-radius: 2px 2px 0 0;
    border-bottom: 1px solid #535860;
    background: #1c222a;
    padding: 8px 10px;
  }

  &__lines {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 8px 31px;
  }

  &__line {
    min-width: 0;
    color: #fff;
    font-family: "Alibaba PuHuiTi 3.0";
    font-size: 14px;
  }

  .meta-k {
    // color: rgba(255, 255, 255, 0.45);
  }
}

.header-divider {
  height: 1px;
  background: rgba(255, 255, 255, 0.08);
  margin: 0 14px;
  flex-shrink: 0;
}

.video-wrap {
  position: relative;
  flex: 1;
  min-height: 200px;
  background: #000;
  margin: 0 12px 12px;
  border-radius: 6px;
  overflow: hidden;
}

.video-overlay-top {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  z-index: 2;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: flex-start;
  gap: 10px;
  padding: 8px 10px 0;
  pointer-events: none;

  .perspective-hint,
  .video-view-switch {
    pointer-events: auto;
  }
}

.card-arrow-icon {
  width: 16px;
  height: 16px;
  object-fit: contain;
  flex-shrink: 0;
  display: block;
}

.perspective-hint {
  flex: 1;
  min-width: 0;
  display: inline-flex;
  flex-direction: row;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.95);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
  padding-top: 2px;
}

.video-view-switch {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  justify-content: flex-end;
  flex-shrink: 0;
}

.view-tile {
  position: relative;
  min-width: 74px;
  padding: 0;
  border: 0;
  border-radius: 0;
  background: transparent;
  color: #fff;
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 5px;
  padding: 2px 4px;
  cursor: pointer;
  transition: opacity 0.18s ease;

  &__icon-frame {
    position: relative;
    width: 26px;
    height: 26px;
    border-radius: 2px;
    border: 1px solid #fff;
    background: rgba(28, 34, 42, 0.65);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;
  }

  &__icon {
    width: 18px;
    height: 18px;
    object-fit: contain;
    display: block;
  }

  &__label {
    color: #fff;
    font-family: "Alibaba PuHuiTi 3.0";
    font-size: 12px;
    font-style: normal;
    font-weight: 400;
    line-height: normal;
    white-space: nowrap;
  }

  &:hover {
    opacity: 0.88;
  }

  &.active {
    opacity: 1;

    .view-tile__icon-frame {
      background: #1c222a;
    }

    .view-tile__icon-frame::after {
      content: "";
      position: absolute;
      inset: -4px;
      pointer-events: none;
      background:
        linear-gradient(#fff, #fff) left top / 8px 2px no-repeat,
        linear-gradient(#fff, #fff) left top / 2px 8px no-repeat,
        linear-gradient(#fff, #fff) right top / 8px 2px no-repeat,
        linear-gradient(#fff, #fff) right top / 2px 8px no-repeat,
        linear-gradient(#fff, #fff) left bottom / 8px 2px no-repeat,
        linear-gradient(#fff, #fff) left bottom / 2px 8px no-repeat,
        linear-gradient(#fff, #fff) right bottom / 8px 2px no-repeat,
        linear-gradient(#fff, #fff) right bottom / 2px 8px no-repeat;
    }
  }
}

.video-shot-btn {
  position: absolute;
  right: 10px;
  top: 94px;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  width: 52px;
  padding: 2px 0;
  border: 0;
  border-radius: 0;
  background: transparent;
  color: #fff;
  cursor: pointer;
  transition: opacity 0.18s ease;

  &__icon {
    width: 18px;
    height: 18px;
    object-fit: contain;
    display: block;
  }

  &__icon-frame {
    width: 26px;
    height: 26px;
    border-radius: 2px;
    background: rgba(28, 34, 42, 0.65);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;
  }

  &__label {
    color: #fff;
    font-family: "Alibaba PuHuiTi 3.0";
    font-size: 12px;
    font-style: normal;
    font-weight: 400;
    line-height: normal;
    white-space: nowrap;
  }

  &:hover {
    opacity: 0.88;
  }
}

.video-inner {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 220px;
}

.video-element {
  display: block;
  width: 100%;
  height: 100%;
  min-height: 220px;
  object-fit: contain;
  vertical-align: top;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  gap: 0;
  padding: 0 12px 14px;
  flex-shrink: 0;
}

.footer-btn {
  width: 149px;
  height: 44px;
  flex: 0 0 149px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 0 10px;
  font-family: "HarmonyOS Sans SC";
  font-size: 20px;
  font-style: normal;
  font-weight: 500;
  line-height: normal;
  border-radius: 44px;
  cursor: pointer;
  background: rgba(255, 255, 255, 0.02);
  color: #fff;
  border: 1px solid #558efc;
  transition:
    background 0.15s,
    border-color 0.15s,
    color 0.15s;

  i {
    font-size: 16px;
  }

  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }

  &__icon-img {
    width: 24px;
    height: 24px;
    object-fit: contain;
    display: block;
    flex-shrink: 0;
  }
}

.btn-neutral {
  border: 1px solid #558efc;
  color: #fff;

  &:hover:not(:disabled) {
    background: rgba(85, 142, 252, 0.14);
    border-color: #6d9fff;
  }
}

.btn-primary {
  border: 1px solid #558efc;
  color: #fff;

  &:hover:not(:disabled) {
    background: rgba(85, 142, 252, 0.14);
    border-color: #6d9fff;
  }
}
</style>
