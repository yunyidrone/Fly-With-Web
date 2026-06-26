<!--
 * @Author: ml
 * @Date: 2026-03-12 09:09:07
 * @FilePath: /accompanying-fly-project/src/components/DroneStream.vue
 * @Description: 无人机视频流卡片（伴飞任务 / 遥测 / 视频 / 操作）
-->
<template>
  <div
    class="drone-stream-card"
    :class="{
      'drone-stream-card--immersive': immersiveFlight,
      'video-pseudo-fullscreen-host': isPseudoFullscreen,
    }"
  >
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
        <span class="card-topline__battery">电量：{{ batteryDisplay }}</span>
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
          <span>伴飞任务：{{ showNoTask ? "暂无伴飞任务" : companionTitle }}</span>
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
    <div
      ref="videoWrapRef"
      class="video-wrap"
      :class="{ 'video-pseudo-fullscreen': isPseudoFullscreen }"
    >
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
        <!-- <div class="video-view-switch" role="group" aria-label="视角切换">
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
        </div> -->
        <div v-if="aiPlayUrl" class="video-source-toggle">
          <button
            type="button"
            class="source-opt"
            :class="{ 'source-opt--active': streamSource === 'raw' }"
            @click="streamSource = 'raw'"
          >
            原始流
          </button>
          <button
            type="button"
            class="source-opt"
            :class="{ 'source-opt--active': streamSource === 'ai' }"
            @click="streamSource = 'ai'"
          >
            AI 流
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
        <div v-if="isOffline" class="video-offline-overlay">设备离线</div>
        <video
          v-show="!isOffline"
          ref="videoPlayerRef"
          :muted="true"
          autoplay
          controls
          playsinline
          webkit-playsinline
          x5-video-player-type="h5"
          x5-video-player-fullscreen="true"
          class="video-element"
        />
      </div>
      <button
        v-if="isPseudoFullscreen"
        type="button"
        class="video-pseudo-fullscreen__exit"
        @click="exitVideoFullscreen"
      >
        退出全屏
      </button>
    </div>

    <footer class="card-footer">
      <!-- <button
        type="button"
        class="footer-btn btn-neutral"
        :class="{ 'btn-neutral--active': props.manualControlVisible }"
        @click="handleManualControlToggle"
      >
        {{ props.manualControlVisible ? "退出操控" : "手动操控" }}
      </button> -->
      <button
        type="button"
        class="footer-btn btn-neutral"
        @click="enterVideoFullscreen"
      >
        全局展示
        <img class="footer-btn__icon-img" :src="qjxsPng" alt="" aria-hidden="true" />
      </button>
      <button
        v-if="hasEscortTarget"
        type="button"
        class="footer-btn btn-primary"
        @click="handleImmersiveToggle"
      >
        {{ immersiveBtnLabel }}
        <img class="footer-btn__icon-img" :src="cjbfPng" alt="" aria-hidden="true" />
      </button>
      <!-- v-if="showRecall" -->
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
import { ref, onMounted, onUnmounted, computed, watch } from "vue";
import { useSystemStore } from "@/stores/index.js";
import { AccompanyingFlyService } from "@/api";
import { ElMessage, ElMessageBox } from "element-plus";
import { VIDEO_CONFIG } from "@/config/app-config.js";
import arrowRightPng from "@/assets/images/arrow_right.png";
import sjWrjPng from "@/assets/images/sj_wrj.png";
import sjJcPng from "@/assets/images/sj_jc.png";
import screenshotPng from "@/assets/images/screenshot.png";
import qjxsPng from "@/assets/images/qjxs.png";
import cjbfPng from "@/assets/images/cjbf.png";
import yjzhPng from "@/assets/images/yjzh.png";
import { useVideoFullscreen } from "@/composables/useVideoFullscreen.js";

const props = defineProps({
  droneId: { type: String, default: "" },
  droneName: { type: String, default: "" },
  targetDeviceLabel: { type: String, default: "警车0001号" },
  /** 电量 0–100，与左侧列表一致 */
  battery: { type: Number, default: undefined },
  /** 顶行状态：伴飞中 / 就绪 / 离线 */
  statusLabel: { type: String, default: "就绪" },
  /** 伴飞开始时间，来自无人机详情 executeTiem */
  escortStartTime: { type: String, default: "" },
  /** 「伴飞任务:xxx」中的 xxx */
  companionTaskTitle: { type: String, default: "" },
  /** 由父页控制：沉浸伴飞时仅显示地图 + 本视频 */
  immersiveFlight: { type: Boolean, default: false },
  /** 由父页控制：地图上的手动操控面板显隐 */
  manualControlVisible: { type: Boolean, default: false },
  /** 设备级拉流地址（接口 streamUrl），为空时用环境变量 VIDEO_CONFIG */
  streamUrl: { type: String, default: "" },
  playUrl: { type: String, default: "" },
  /** 算法 AI 结果流地址 */
  aiPlayUrl: { type: String, default: "" },
  /** 伴飞目标 id，用于 stopFollow 的 id 参数 */
  targetDeviceId: { type: String, default: "" },
  lng: { type: [Number, String], default: undefined },
  lat: { type: [Number, String], default: undefined },
  height: { type: [Number, String], default: undefined },
  head: { type: [Number, String], default: undefined },
  pitch: { type: [Number, String], default: undefined },
  roll: { type: [Number, String], default: undefined },
});

const emit = defineEmits([
  "toggle-immersive",
  "toggle-manual-control",
  "recording-change",
  "recall",
]);

let pc;
const systemStore = useSystemStore();
const videoPlayerRef = ref(null);
const videoWrapRef = ref(null);
const streamSource = ref("raw");
const mediaRecorderRef = ref(null);
const recordedChunksRef = ref([]);
const isRecording = ref(false);

const resolvedStreamUrl = computed(() => {
  if (streamSource.value === "ai" && props.aiPlayUrl) {
    return props.aiPlayUrl;
  }
  return props.playUrl || VIDEO_CONFIG.streamUrl;
});
const isLoading = ref(false);
const viewMode = ref("drone");

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
  if (s === "返航中") return "is-escorting";
  if (s === "离线") return "is-offline";
  return "is-ready";
});

const isOffline = computed(() => props.statusLabel === "离线");
const isStandby = computed(() => props.statusLabel === "就绪");
const isEscorting = computed(() => props.statusLabel === "伴飞中" || props.statusLabel === "返航中");
const showRecall = computed(() => isEscorting.value);
const showNoTask = computed(() => isOffline.value || isStandby.value);

const perspectiveVideoText = computed(() =>
  viewMode.value === "airport" ? "当前机场视角" : "无人机视角",
);

const immersiveBtnLabel = computed(() =>
  props.immersiveFlight ? "退出沉浸" : "沉浸伴飞",
);

const hasEscortTarget = computed(() => {
  const id = String(props.targetDeviceId || "").trim();
  return Boolean(id && id !== "—");
});

const lng = computed(() => props.lng);
const lat = computed(() => props.lat);
const alt = computed(() => props.height);

const escortStartText = computed(() => {
  if (props.escortStartTime) return props.escortStartTime;
  return "—";
});

function isNumber(value) {
  return !isNaN(parseFloat(value)) && isFinite(value);
}

function formatCoord(v) {
  if (!isNumber(v)) return "—";
  return Number(v).toFixed(6);
}

const altText = computed(() => {
  if (!isNumber(alt.value)) return "—";
  return `${Number(alt.value).toFixed(0)}m`;
});

const headText = computed(() =>
  isNumber(props.head)
    ? `${Number(props.head).toFixed(1)}°`
    : "—",
);
const pitchText = computed(() =>
  isNumber(props.pitch)
    ? `${Number(props.pitch).toFixed(1)}°`
    : "—",
);
const rollText = computed(() =>
  isNumber(props.roll)
    ? `${Number(props.roll).toFixed(1)}°`
    : "—",
);

async function tryAutoPlayVideo() {
  const video = videoPlayerRef.value;
  if (!video) return;
  video.muted = true;
  video.autoplay = true;
  video.playsInline = true;
  try {
    await video.play();
  } catch (error) {
    console.warn("视频自动播放被浏览器拦截，可手动点击播放", error);
  }
}

const initPlayVideo = async () => {
  console.log('视频流地址', resolvedStreamUrl.value)
  if (!resolvedStreamUrl.value || !videoPlayerRef.value) return;
  pc = new RTCPeerConnection({
    iceServers: [{ urls: "stun:stun.aliyungf.com:3478" }],
    bundlePolicy: "max-bundle",
  });
  pc.addTransceiver("video", { direction: "recvonly" });
  pc.ontrack = (event) => {
    if (event.track.kind === "video" && videoPlayerRef.value) {
      videoPlayerRef.value.srcObject = event.streams[0];
      videoPlayerRef.value.onloadedmetadata = () => {
        tryAutoPlayVideo();
      };
      tryAutoPlayVideo();
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

function resolveRecordingMimeType() {
  const candidates = [
    "video/webm;codecs=vp9",
    "video/webm;codecs=vp8",
    "video/webm",
  ];
  for (const type of candidates) {
    if (window.MediaRecorder?.isTypeSupported?.(type)) {
      return type;
    }
  }
  return "";
}

const startLocalRecording = () => {
  if (isRecording.value) {
    ElMessage.warning("录像已在进行中");
    return false;
  }
  const stream = videoPlayerRef.value?.srcObject;
  if (!(stream instanceof MediaStream) || !stream.getVideoTracks().length) {
    ElMessage.warning("暂无可录制视频流");
    return false;
  }
  if (!window.MediaRecorder) {
    ElMessage.error("当前浏览器不支持录像");
    return false;
  }
  try {
    recordedChunksRef.value = [];
    const mimeType = resolveRecordingMimeType();
    const recorder = mimeType
      ? new MediaRecorder(stream, { mimeType })
      : new MediaRecorder(stream);
    recorder.ondataavailable = (evt) => {
      if (evt.data && evt.data.size > 0) {
        recordedChunksRef.value.push(evt.data);
      }
    };
    recorder.onstop = () => {
      const chunks = recordedChunksRef.value;
      recordedChunksRef.value = [];
      mediaRecorderRef.value = null;
      isRecording.value = false;
      emit("recording-change", false);
      if (!chunks.length) return;
      const blobType = recorder.mimeType || "video/webm";
      const blob = new Blob(chunks, { type: blobType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `drone-record-${Date.now()}.webm`;
      a.click();
      URL.revokeObjectURL(url);
      ElMessage.success("录像已保存");
    };
    recorder.start(1000);
    mediaRecorderRef.value = recorder;
    isRecording.value = true;
    emit("recording-change", true);
    ElMessage.success("开始录像");
    return true;
  } catch (error) {
    console.warn("开始录像失败", error);
    ElMessage.error("开始录像失败");
    mediaRecorderRef.value = null;
    recordedChunksRef.value = [];
    isRecording.value = false;
    emit("recording-change", false);
    return false;
  }
};

const stopLocalRecording = ({ silent = false } = {}) => {
  const recorder = mediaRecorderRef.value;
  if (!recorder || recorder.state === "inactive") {
    if (isRecording.value) {
      isRecording.value = false;
      emit("recording-change", false);
    }
    if (!silent) ElMessage.warning("当前没有进行中的录像");
    return false;
  }
  try {
    isRecording.value = false;
    emit("recording-change", false);
    recorder.stop();
    if (!silent) ElMessage.info("录像结束，正在导出");
    return true;
  } catch (error) {
    console.warn("停止录像失败", error);
    if (!silent) ElMessage.error("结束录像失败");
    return false;
  }
};

const requestStopFollow = async () => {
  const id = String(props.targetDeviceId || "").trim();
  const droneId = String(props.droneId || "").trim();
  if (!id) {
    ElMessage.warning("未找到伴飞目标");
    return false;
  }
  if (!droneId) {
    ElMessage.warning("未找到无人机ID");
    return false;
  }
  isLoading.value = true;
  try {
    await AccompanyingFlyService.stopFollow({
      id,
      droneId,
    });
    systemStore.setDroneStatus(0);
    ElMessage.success("已结束伴飞");
    emit("recall", { id, droneId });
    return true;
  } catch (e) {
    console.warn(e);
    ElMessage.error(e?.message || "结束伴飞失败");
    return false;
  } finally {
    isLoading.value = false;
  }
};

const {
  isPseudoFullscreen,
  enterVideoFullscreen,
  exitVideoFullscreen,
} = useVideoFullscreen(videoWrapRef, videoPlayerRef);

defineExpose({
  exitVideoFullscreen,
  captureCurrentFrame: handleScreenshot,
  startLocalRecording,
  stopLocalRecording,
});

const handleImmersiveToggle = () => {
  emit("toggle-immersive");
};

const handleManualControlToggle = () => {
  emit("toggle-manual-control", !props.manualControlVisible);
};

const handleRecall = async () => {
  try {
    await ElMessageBox.confirm(
      `确定召回「${props.droneName || props.droneId || "该无人机"}」并结束伴飞？`,
      "一键召回确认",
      {
        confirmButtonText: "确认召回",
        cancelButtonText: "取消",
        type: "warning",
      },
    );
    await requestStopFollow();
  } catch {
    /* cancel */
  }
};

watch(
  () => props.immersiveFlight,
  (val) => {
    if (val && props.manualControlVisible) {
      emit("toggle-manual-control", false);
    }
  },
);

onMounted(() => {
  if (!isOffline.value) initPlayVideo();
});

watch(resolvedStreamUrl, () => {
  if (isOffline.value) return;
  stopLocalRecording({ silent: true });
  // 切换播放源时关闭旧连接，重新拉流
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
  initPlayVideo();
});

onUnmounted(() => {
  stopLocalRecording({ silent: true });
  if (props.manualControlVisible) {
    emit("toggle-manual-control", false);
  }
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

.drone-stream-card--immersive {
  flex: 1 1 auto;
  min-height: 0;
  max-height: 100%;
  overflow-y: auto;
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

  &__no-task {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 16px 10px;
    font-size: 14px;
    color: rgba(255, 255, 255, 0.45);
  }
}

.header-divider {
  height: 1px;
  background: rgba(255, 255, 255, 0.08);
  margin: 0 14px;
  flex-shrink: 0;
}

.video-source-toggle {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
  pointer-events: auto;
}

.source-opt {
  padding: 4px 12px;
  border: 1px solid rgba(255, 255, 255, 0.4);
  border-radius: 2px;
  background: transparent;
  color: #fff;
  font-size: 12px;
  cursor: pointer;
  opacity: 0.75;
  pointer-events: auto;
  transition: opacity 0.18s ease, border-color 0.18s ease;

  &:hover {
    opacity: 0.88;
  }

  &--active {
    opacity: 1;
    border-color: #fff;
  }
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
  .video-view-switch,
  .video-source-toggle {
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
  min-height: 324px;
}

.video-offline-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 15px;
  font-weight: 600;
  color: #f44;
  z-index: 2;
}

.video-element {
  display: block;
  width: 100%;
  height: 100%;
  min-height: 324px;
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
  height: 36px;
  flex: 0 0 149px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 0 10px;
  font-family: "HarmonyOS Sans SC";
  font-size: 16px;
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

  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }

  &__icon-img {
    width: 16px;
    height: 16px;
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

.btn-neutral--active {
  background: rgba(85, 142, 252, 0.18);
  border-color: #80aaff;
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
