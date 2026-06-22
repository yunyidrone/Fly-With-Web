import { ref, onMounted, onUnmounted } from "vue";

/** 视频全屏设备类型 */
export const VIDEO_FULLSCREEN_DEVICE = {
  IOS: "ios",
  ANDROID: "android",
  DESKTOP: "desktop",
};

function getFullscreenElement() {
  return (
    document.fullscreenElement ||
    document.webkitFullscreenElement ||
    document.mozFullScreenElement ||
    document.msFullscreenElement ||
    null
  );
}

function getRequestElementFullscreen(el) {
  const fn =
    el.requestFullscreen ||
    el.webkitRequestFullscreen ||
    el.webkitRequestFullScreen ||
    el.mozRequestFullScreen ||
    el.msRequestFullscreen;
  return fn ? fn.bind(el) : null;
}

async function exitNativeFullscreen() {
  const fn =
    document.exitFullscreen ||
    document.webkitExitFullscreen ||
    document.webkitCancelFullScreen ||
    document.mozCancelFullScreen ||
    document.msExitFullscreen;
  if (fn) await fn.call(document);
}

/**
 * 识别当前设备，用于选择全屏策略
 * @returns {'ios' | 'android' | 'desktop'}
 */
export function detectVideoFullscreenDevice() {
  if (typeof window === "undefined") return VIDEO_FULLSCREEN_DEVICE.DESKTOP;
  const ua = navigator.userAgent || "";
  const hasTouch = navigator.maxTouchPoints > 0;
  const isIOS =
    /iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  if (isIOS) return VIDEO_FULLSCREEN_DEVICE.IOS;
  if (/Android/i.test(ua)) return VIDEO_FULLSCREEN_DEVICE.ANDROID;
  if (/Mobile|HUAWEI|HONOR|Xiaomi|MiuiBrowser/i.test(ua) || hasTouch) {
    return VIDEO_FULLSCREEN_DEVICE.ANDROID;
  }
  return VIDEO_FULLSCREEN_DEVICE.DESKTOP;
}

async function tryNativeFullscreen(el) {
  if (!el) return false;
  const request = getRequestElementFullscreen(el);
  if (!request) return false;
  try {
    const maybePromise = request();
    if (maybePromise && typeof maybePromise.then === "function") {
      await maybePromise;
      return true;
    }
    await Promise.resolve();
    const fsEl = getFullscreenElement();
    return fsEl === el;
  } catch (e) {
    console.warn("[useVideoFullscreen] requestFullscreen failed", e);
    return false;
  }
}

async function tryIOSVideoFullscreen(video) {
  if (!video?.webkitEnterFullscreen) return false;
  try {
    video.webkitEnterFullscreen();
    await new Promise((resolve) => window.setTimeout(resolve, 60));
    return Boolean(video.webkitDisplayingFullscreen);
  } catch (e) {
    console.warn("[useVideoFullscreen] webkitEnterFullscreen failed", e);
    return false;
  }
}

/**
 * 按设备类型执行进入全屏
 * @param {'ios' | 'android' | 'desktop'} device
 * @param {HTMLElement | null} wrap
 * @param {HTMLVideoElement | null} video
 * @param {() => void} enterPseudoFullscreen
 */
async function enterFullscreenByDevice(device, wrap, video, enterPseudoFullscreen) {
  switch (device) {
    case VIDEO_FULLSCREEN_DEVICE.IOS:
      if (await tryIOSVideoFullscreen(video)) return true;
      if (await tryNativeFullscreen(video)) return true;
      if (wrap) {
        enterPseudoFullscreen();
        return true;
      }
      return false;

    case VIDEO_FULLSCREEN_DEVICE.ANDROID:
      if (await tryNativeFullscreen(video)) return true;
      if (await tryNativeFullscreen(wrap)) return true;
      if (wrap) {
        enterPseudoFullscreen();
        return true;
      }
      return false;

    case VIDEO_FULLSCREEN_DEVICE.DESKTOP:
    default:
      if (await tryNativeFullscreen(wrap)) return true;
      if (await tryNativeFullscreen(video)) return true;
      if (wrap) {
        enterPseudoFullscreen();
        return true;
      }
      return false;
  }
}

/**
 * 视频全局展示：先识别设备，再按设备走对应全屏策略
 * @param {import('vue').Ref<HTMLElement | null>} wrapRef
 * @param {import('vue').Ref<HTMLVideoElement | null>} videoRef
 */
export function useVideoFullscreen(wrapRef, videoRef) {
  const isPseudoFullscreen = ref(false);
  const deviceType = detectVideoFullscreenDevice();
  const BODY_LOCK_CLASS = "video-pseudo-fullscreen-lock";

  function enterPseudoFullscreen() {
    document.body?.classList?.add(BODY_LOCK_CLASS);
    isPseudoFullscreen.value = true;
  }

  function exitPseudoFullscreen() {
    document.body?.classList?.remove(BODY_LOCK_CLASS);
    isPseudoFullscreen.value = false;
  }

  async function exitVideoFullscreen() {
    if (isPseudoFullscreen.value) {
      exitPseudoFullscreen();
      return;
    }
    if (getFullscreenElement()) {
      try {
        await exitNativeFullscreen();
      } catch (_) {
        /* ignore */
      }
    }
  }

  async function enterVideoFullscreen() {
    const wrap = wrapRef.value;
    const video = videoRef.value;
    if (!wrap && !video) return false;

    if (isPseudoFullscreen.value) {
      exitPseudoFullscreen();
      return true;
    }

    const fsEl = getFullscreenElement();
    if (fsEl === wrap || fsEl === video) {
      await exitVideoFullscreen();
      return true;
    }

    return enterFullscreenByDevice(
      deviceType,
      wrap,
      video,
      enterPseudoFullscreen,
    );
  }

  function onKeydown(e) {
    if (e.key === "Escape" && isPseudoFullscreen.value) {
      exitPseudoFullscreen();
    }
  }

  onMounted(() => {
    document.addEventListener("keydown", onKeydown);
  });

  onUnmounted(() => {
    document.removeEventListener("keydown", onKeydown);
    exitPseudoFullscreen();
    void exitVideoFullscreen();
  });

  return {
    isPseudoFullscreen,
    deviceType,
    enterVideoFullscreen,
    exitVideoFullscreen,
  };
}
