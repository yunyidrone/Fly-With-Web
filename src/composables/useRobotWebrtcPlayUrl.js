import { ref, watch, onUnmounted } from "vue";

/**
 * ZLMediaKit / 星树 WebRTC 播放
 * 与 useWebrtcPlayUrl 基本一致，区别是 answer 为 JSON：{ code, sdp, type }
 * @param {import('vue').Ref<string> | (() => string)} playUrlSource
 */
export function useRobotWebrtcPlayUrl(playUrlSource) {
  const videoRef = ref(null);
  /** @type {RTCPeerConnection | null} */
  let pc = null;

  function readSource() {
    return typeof playUrlSource === "function" ? playUrlSource() : playUrlSource?.value;
  }

  function resolveUrl() {
    return String(readSource() || "").trim();
  }

  function teardown() {
    if (pc) {
      try {
        pc.getReceivers?.().forEach((receiver) => receiver.track?.stop());
        pc.getSenders?.().forEach((sender) => sender.track?.stop());
        pc.close();
      } catch (_) {
        /* ignore */
      }
      pc = null;
    }
    const video = videoRef.value;
    if (video) {
      if (video.srcObject) {
        video.srcObject.getTracks?.().forEach((track) => track.stop());
        video.srcObject = null;
      }
      try {
        video.pause();
      } catch (_) {
        /* ignore */
      }
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
      const json = await res.json();
      if (json.code !== 0) throw new Error(json.msg || json.message || `code=${json.code}`);
      await pc.setRemoteDescription({ type: "answer", sdp: json.sdp });
    } catch (e) {
      console.warn("[RobotWebRTC] 播放失败", url, e);
    }
  }

  watch(readSource, () => startPlay());

  watch(videoRef, (el) => {
    if (el && resolveUrl()) startPlay();
  });

  onUnmounted(teardown);

  return { videoRef, startPlay, teardown, resolveUrl };
}
