<!--
 * @Description: 机器人视频流卡片（名称 + 视频 + 重试 / 全局显示）
-->
<template>
  <div class="drone-stream-card robot-stream-card">
    <header class="card-header">
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
          <span class="card-topline__name">{{ displayRobotName }}</span>
        </div>
      </div>
    </header>

    <div class="header-divider" />

    <div ref="videoWrapRef" class="video-wrap">
      <div
        v-if="loadingVisible"
        class="video-loading"
        :class="{ 'video-loading--failed': isStreamFailed }"
      >
        {{ loadingText }}
      </div>
      <div class="video-inner">
        <video
          ref="videoPlayerRef"
          :muted="true"
          autoplay
          controls
          playsinline
          webkit-playsinline
          class="video-element"
        />
      </div>
    </div>

    <footer class="card-footer card-footer--robot">
      <button
        type="button"
        class="footer-btn btn-neutral"
        :disabled="loadingVisible && !isStreamFailed"
        @click="handleRetry"
      >
        点击重试
        <img class="footer-btn__icon-img" :src="hfmrPng" alt="" aria-hidden="true" />
      </button>
      <button type="button" class="footer-btn btn-neutral" @click="enterVideoFullscreen">
        全局显示
        <img class="footer-btn__icon-img" :src="qjxsPng" alt="" aria-hidden="true" />
      </button>
    </footer>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from "vue";
import { ElMessage } from "element-plus";
import { useRobotWebrtcPlayUrl } from "@/composables/useRobotWebrtcPlayUrl.js";
import { RobotService } from "@/api/robot.js";
import arrowRightPng from "@/assets/images/arrow_right.png";
import hfmrPng from "@/assets/images/hfmr.png";
import qjxsPng from "@/assets/images/qjxs.png";

/** 从开始拉流到出画面的超时时长，超时触发重连 */
const LOAD_TIMEOUT_MS = 15000;
/** 最大重连次数（超过后显示失败并关闭） */
const MAX_ATTEMPTS = 3;
const FAIL_CLOSE_DELAY_MS = 2000;

const props = defineProps({
  robotId: { type: [String, Number], default: "" },
  robotName: { type: String, default: "" },
  communityId: { type: [String, Number], default: "" },
});

const emit = defineEmits(["close"]);

const videoWrapRef = ref(null);
const loadingVisible = ref(false);
const loadingText = ref("正在拉流...");
const isStreamFailed = ref(false);
const playUrl = ref("");

let loadSession = 0;
/** @type {ReturnType<typeof setTimeout> | null} */
let loadWatchdogTimer = null;
/** @type {ReturnType<typeof setTimeout> | null} */
let failCloseTimer = null;
/** 当前已尝试次数（含首次） */
let attempt = 0;
/** @type {((event: Event) => void) | null} */
let videoReadyHandler = null;

const displayRobotName = computed(
  () => props.robotName || String(props.robotId || "") || "机器人",
);

const { videoRef: videoPlayerRef, startPlay, teardown } = useRobotWebrtcPlayUrl(playUrl);

watch(playUrl, (url) => {
  if (url) {
    startPlay();
  } else {
    teardown();
  }
});

watch(videoPlayerRef, (el) => {
  unbindVideoMonitor();
  if (el) bindVideoMonitor();
});

function isVideoDisplayReady(video) {
  if (!video) return false;
  if (video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) return false;
  if (video.videoWidth > 0 && video.videoHeight > 0) return true;

  const stream = video.srcObject;
  if (!(stream instanceof MediaStream)) return false;
  return stream.getVideoTracks().some((track) => track.readyState === "live");
}

function clearLoadWatchdog() {
  if (loadWatchdogTimer) {
    clearTimeout(loadWatchdogTimer);
    loadWatchdogTimer = null;
  }
}

function clearFailCloseTimer() {
  if (failCloseTimer) {
    clearTimeout(failCloseTimer);
    failCloseTimer = null;
  }
}

function bindVideoMonitor() {
  const video = videoPlayerRef.value;
  if (!video || videoReadyHandler) return;

  videoReadyHandler = () => {
    if (isVideoDisplayReady(video)) {
      markStreamReady();
    }
  };
  ["loadeddata", "playing", "canplay", "resize"].forEach((eventName) => {
    video.addEventListener(eventName, videoReadyHandler);
  });
}

function unbindVideoMonitor() {
  const video = videoPlayerRef.value;
  if (!video || !videoReadyHandler) return;
  ["loadeddata", "playing", "canplay", "resize"].forEach((eventName) => {
    video.removeEventListener(eventName, videoReadyHandler);
  });
  videoReadyHandler = null;
}

function markStreamReady() {
  clearLoadWatchdog();
  clearFailCloseTimer();
  loadingVisible.value = false;
  isStreamFailed.value = false;
  loadingText.value = "";
  attempt = 0;
}

function failStreamAndClose() {
  isStreamFailed.value = true;
  loadingVisible.value = true;
  loadingText.value = "设备拉流失败，请检查设备是否正常在线";
  teardown();
  playUrl.value = "";
  scheduleStreamFailureClose();
}

function handleLoadTimeout(session) {
  if (session !== loadSession || isStreamFailed.value) return;
  if (isVideoDisplayReady(videoPlayerRef.value)) {
    markStreamReady();
    return;
  }

  if (attempt >= MAX_ATTEMPTS) {
    failStreamAndClose();
    return;
  }

  attempt += 1;
  loadingText.value = "正在重新连接...";
  doFetchAndConnect(session);
}

function scheduleStreamFailureClose() {
  clearFailCloseTimer();
  failCloseTimer = setTimeout(() => {
    failCloseTimer = null;
    emit("close");
  }, FAIL_CLOSE_DELAY_MS);
}

function armLoadWatchdog(session) {
  clearLoadWatchdog();
  loadWatchdogTimer = setTimeout(() => {
    loadWatchdogTimer = null;
    handleLoadTimeout(session);
  }, LOAD_TIMEOUT_MS);
}

/**
 * 启动一次完整的拉流+连接流程：
 * 同时开始 15s 倒计时，异步请求拉流地址，地址返回后自动触发 WebRTC 连接。
 * 超时后由 handleLoadTimeout 决定重连或失败。
 */
function doFetchAndConnect(session) {
  teardown();
  playUrl.value = "";
  armLoadWatchdog(session);

  RobotService.getPlayUrl({
    communityId: props.communityId,
    robotId: props.robotId,
  })
    .then((url) => {
      if (session !== loadSession) return;
      playUrl.value = url;
    })
    .catch((err) => {
      console.warn("[RobotStream] 获取拉流地址失败", err);
    });
}

async function fetchAndPlay() {
  const robotId = props.robotId;
  const communityId = props.communityId;
  if (robotId === "" || robotId == null || communityId === "" || communityId == null) {
    ElMessage.warning("缺少 robotId 或 communityId，无法拉取视频");
    return;
  }

  loadSession += 1;
  const session = loadSession;
  attempt = 1;
  isStreamFailed.value = false;
  loadingVisible.value = true;
  loadingText.value = "正在拉流...";
  clearLoadWatchdog();
  clearFailCloseTimer();

  doFetchAndConnect(session);
}

const handleRetry = () => {
  void fetchAndPlay();
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

onMounted(() => {
  bindVideoMonitor();
  void fetchAndPlay();
});

onBeforeUnmount(() => {
  loadSession += 1;
  clearLoadWatchdog();
  clearFailCloseTimer();
  unbindVideoMonitor();
  teardown();
});

defineExpose({ teardown });
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
}

.card-arrow-icon {
  width: 16px;
  height: 16px;
  object-fit: contain;
  flex-shrink: 0;
  display: block;
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

.video-loading {
  position: absolute;
  inset: 0;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.72);
  font-size: 14px;
  background: rgba(0, 0, 0, 0.45);
  pointer-events: none;

  &--failed {
    padding: 0 24px;
    text-align: center;
    line-height: 1.6;
    color: rgba(255, 255, 255, 0.88);
  }
}

.video-inner {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 324px;
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
</style>
