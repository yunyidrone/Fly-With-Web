import { onMounted, onActivated, onDeactivated } from "vue";
import { tryOnScopeDispose } from "@vueuse/core";

/**
 * 页面级轮询：激活时启动，失活/卸载时停止；标签页隐藏时暂停
 * @param {() => Promise<void>|void} fn
 * @param {number} intervalMs
 */
export function usePolling(fn, intervalMs = 10000) {
  let timer = null;
  let running = false;

  async function tick() {
    if (running) return;
    running = true;
    try {
      await fn();
    } finally {
      running = false;
    }
  }

  function start() {
    stop();
    tick();
    timer = window.setInterval(tick, intervalMs);
  }

  function stop() {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  }

  function onVisibilityChange() {
    if (document.hidden) {
      stop();
    } else {
      start();
    }
  }

  onMounted(() => {
    document.addEventListener("visibilitychange", onVisibilityChange);
    start();
  });

  onActivated(() => start());
  onDeactivated(() => stop());

  tryOnScopeDispose(() => {
    stop();
    document.removeEventListener("visibilitychange", onVisibilityChange);
  });

  return { start, stop, refresh: tick };
}
