<!--
 * @Author: ml
 * @Date: 2026-03-12 09:09:07
 * @LastEditTime: 2026-03-16 09:34:57
 * @FilePath: /accompanying-fly-project/src/components/DroneStream.vue
 * @Description: drone stream
-->
<template>
  <div class="drone-stream-container">
    <div class="top-container">
      <RiSendPlaneLine size="18" />
      <span class="location-text" v-if="lastPosition?.current_longitude && lastPosition?.current_latitude && lastPosition?.current_height">
        {{ "经度: " + lastPosition.current_longitude.toFixed(6) }}, {{ "纬度: " + lastPosition.current_latitude.toFixed(6) }}, {{ "高度: " + lastPosition.current_height.toFixed(2) }}m
      </span>
    </div>
    <div class="center-container">
      <video ref="videoPlayerRef" :muted="true" controls autoplay playsinline class="video-element"></video>
    </div>
    <div class="bottom-container">
      <div class="attitude-text" v-if="droneCurrentState">
        <span v-if="isNumber(droneCurrentState.attitude_head)">HEAD: {{ droneCurrentState.attitude_head }}°</span>
        <span v-if="isNumber(droneCurrentState.attitude_pitch)">PITCH: {{ droneCurrentState.attitude_pitch }}°</span>
        <span v-if="isNumber(droneCurrentState.attitude_roll)">ROLL: {{ droneCurrentState.attitude_roll }}°</span>
      </div>
      <div class="button-area">
        <el-button class="custom-button" type="primary" :loading="isLoading" :icon="FileUploadRound" @click="handleTakeOff">一键伴飞</el-button>
        <el-button class="custom-button" type="primary" :loading="isLoading" :icon="FileDownloadRound" @click="handleReturnHome">一键返航</el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import { RiGpsLine, RiUploadFill, RiDownloadFill, RiSendPlaneLine } from "@remixicon/vue";
import { useSystemStore } from "@/stores";
import { AccompanyingFlyService } from "@/api";
import { FileUploadRound, FileDownloadRound } from "@vicons/material";
import { ElMessageBox } from "element-plus";
import { VIDEO_CONFIG, DEVICE_CONFIG } from "@/config/app-config.js";

let pc;
const systemStore = useSystemStore();
const currentPlayUrl = ref(VIDEO_CONFIG.streamUrl);
const videoPlayerRef = ref(null);
const lastPosition = computed(() => systemStore?.droneMessageList?.[systemStore?.droneMessageList?.length - 1] || {});
const droneStatus = computed(() => systemStore?.droneStatus ?? 0);
const droneCurrentState = computed(() => systemStore?.droneCurrentState || {});
const isLoading = ref(false);

function isNumber(value) {
  return !isNaN(parseFloat(value)) && isFinite(value);
}

/**
 * @description: 加载视频
 * @return {*}
 */
const initPlayVideo = async () => {
  if (!currentPlayUrl.value) return;
  // 创建 PeerConnection
  pc = new RTCPeerConnection({
    iceServers: [{ urls: "stun:stun.aliyungf.com:3478" }],
    bundlePolicy: "max-bundle",
  });
  // 添加一个空的视频轨道（触发 SDP 生成）
  pc.addTransceiver("video", { direction: "recvonly" });
  // 监听视频轨道并附加到 video 标签
  pc.ontrack = (event) => {
    if (event.track.kind === "video") {
      videoPlayerRef.value.srcObject = event.streams[0];
    }
  };
  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);
  // 手动确保 SDP 包含 BUNDLE
  let sdp = offer.sdp;
  if (!sdp.includes("a=group:BUNDLE")) {
    sdp = sdp.replace("m=video", "a=group:BUNDLE 0\nm=video");
  }
  try {
    const res = await fetch(currentPlayUrl.value, {
      method: "POST",
      headers: {
        "Content-Type": "application/sdp",
      },
      body: sdp,
    });
    console.log(res);
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    } else {
      // 处理服务器返回的 SDP Answer
      const answerSdp = await res.text();
      console.log(answerSdp);
      await pc.setRemoteDescription({
        type: "answer",
        sdp: answerSdp,
      });
    }
  } catch (error) {
    console.log("播放错误", error);
  }
};

/**
 * @description: 一键起飞
 * @return {*}
 */
const handleTakeOff = async () => {
  ElMessageBox.prompt("请输入mode,1或5", "Tip", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    inputPattern: /^[0-9]+$/,
    inputErrorMessage: "Invalid Number",
  })
    .then(({ value }) => {
      requestTakeOff(value);
    })
    .catch(() => {});
};

/**
 * @description: 一键返航
 * @return {*}
 */
const handleReturnHome = async () => {
  ElMessageBox.prompt("请输入mode,1或5", "Tip", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    inputPattern: /^[0-9]+$/,
    inputErrorMessage: "Invalid Number",
  })
      .then(({ value }) => {
        requestReturnHome(value);
      })
      .catch(() => {});
};

const requestTakeOff = async (mode) => {
  let params = {
    target_id: DEVICE_CONFIG.targetId,
    mode: Number(mode),
  };
  isLoading.value = true;
  try {
    const res = await AccompanyingFlyService.takeOff(params);
    console.log("res", res);
    const { code } = res;
    if (code === 200 || code === 201) {
      systemStore.setDroneStatus(1);
    }
  } catch (error) {
    console.log(error);
  } finally {
    isLoading.value = false;
  }
};

/**
 * @description: 一键返航
 * @return {*}
 */
const requestReturnHome = async (mode) => {
  let params = {
    target_id: DEVICE_CONFIG.targetId,
    mode,
  };
  isLoading.value = true;
  try {
    const res = await AccompanyingFlyService.returnHome(params);
    const { code } = res;
    if (code === 200 || code === 404) {
      systemStore.setDroneStatus(0);
    }
  } catch (error) {
    console.log(error);
  } finally {
    isLoading.value = false;
  }
};

onMounted(() => {
  initPlayVideo();
});
</script>

<style lang="scss" scoped>
.drone-stream-container {
  position: relative;
  width: 100%;
  height: 100%;
  background-color: #000;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  .top-container {
    position: relative;
    margin: 10px 20px;
    background-color: #1f1f1f;
    border: 1px solid rgba(255, 255, 255, 0.08);
    padding: 8px 10px;
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;
    border-radius: 4px;
    font-size: 14px;
    color: #ffffff;
    .location-text {
      margin-left: 5px;
    }
  }
  .center-container {
    flex: auto;
    height: 0;
    margin: 0 20px;
    .video-element {
      width: 100% !important;
      height: 100% !important;
      border-radius: 4px;
      object-fit: cover;
      display: block;
      margin: 0;
      padding: 0;
      border: none;
      position: relative;
      top: 0;
      left: 0;
      background-color: #000;
    }
  }
  .bottom-container {
    position: relative;
    margin: 10px 20px 16px 20px;
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;

    .attitude-text {
      font-size: 12px;
      color: #ffffff;
      display: flex;
      flex-direction: row;
      justify-content: flex-start;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
    }

    .button-area {
      display: flex;
      flex-direction: row;
      justify-content: flex-end;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
      flex: auto;
      width: 0;
      .custom-button {
        padding: 10px 20px;
        font-size: 14px;
        text-transform: uppercase;
        letter-spacing: 2.5px;
        font-weight: 500;
        color: #ffffff;
        background-color: #0076ff;
        border: none;
        border-radius: 45px;
        box-shadow: 0px 8px 15px rgba(0, 0, 0, 0.1);
        transition: all 0.3s ease 0s;
        cursor: pointer;
        outline: none;
        :deep(.el-icon) {
          font-size: 16px;
        }
      }

      .custom-button:hover {
        background-color: #268aff;
        box-shadow: 0px 15px 20px rgba(38, 138, 255, 0.4);
        color: #fff;
        transform: translateY(-7px);
      }

      .custom-button:active {
        transform: translateY(-1px);
      }
    }
  }
}
</style>
