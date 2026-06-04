import { ref, watch, onUnmounted } from "vue";
import { VIDEO_CONFIG } from "@/config/app-config.js";

/**
 * SRS WebRTC 播放（与 DroneStream 一致）
 * @param {import('vue').Ref<string> | (() => string)} playUrlSource
 * @param {{ allowEnvFallback?: boolean }} [options]
 */
export function useWebrtcPlayUrl(playUrlSource, options = {}) {
  const { allowEnvFallback = true } = options;
  const videoRef = ref(null);
  /** @type {RTCPeerConnection | null} */
  let pc = null;

  function readSource() {
    return typeof playUrlSource === "function" ? playUrlSource() : playUrlSource?.value;
  }

  function resolveUrl() {
    const trimmed = String(readSource() || "").trim();
    if (trimmed) return trimmed;
    return allowEnvFallback ? String(VIDEO_CONFIG.streamUrl || "").trim() : "";
  }

  function teardown() {
    if (pc) {
      pc.close();
      pc = null;
    }
    const video = videoRef.value;
    if (video?.srcObject) {
      video.srcObject.getTracks?.().forEach((t) => t.stop());
      video.srcObject = null;
    }
  }

  async function tryAutoPlay() {
    const video = videoRef.value;
    if (!video) return;
    video.muted = true;
    try {
      await video.play();
    } catch {
      /* 浏览器策略 */
    }
  }

  async function startPlay() {
    const url = resolveUrl();
    console.log('视频url', url)
    // const url = "http://srs.vlaigo.cn:12360/rtc/v1/whep/?app=live&stream=banfei-che"
    if (!url) {
      teardown();
      return;
    }
    if (!videoRef.value) return;

    teardown();

    pc = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.aliyungf.com:3478" }],
      bundlePolicy: "max-bundle",
    });
    pc.addTransceiver("video", { direction: "recvonly" });
    pc.ontrack = (event) => {
      if (event.track.kind === "video" && videoRef.value) {
        videoRef.value.srcObject = event.streams[0];
        videoRef.value.onloadedmetadata = () => tryAutoPlay();
        tryAutoPlay();
      }
    };
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    let sdp = offer.sdp;
    if (sdp && !sdp.includes("a=group:BUNDLE")) {
      sdp = sdp.replace("m=video", "a=group:BUNDLE 0\nm=video");
    }
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/sdp" },
        body: sdp,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const answerSdp = await res.text();
      await pc.setRemoteDescription({ type: "answer", sdp: answerSdp });
    } catch (e) {
      console.warn("[WebRTC] 播放失败", url, e);
    }
  }

  watch(readSource, () => startPlay());

  watch(videoRef, (el) => {
    if (el && resolveUrl()) startPlay();
  });

  onUnmounted(teardown);

  return { videoRef, startPlay, teardown, resolveUrl };
}
