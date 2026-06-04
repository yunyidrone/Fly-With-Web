import { ref, watch, onUnmounted } from "vue";

/**
 * 仅用于「即将执行」展示倒计时（MM:SS），不触发接口请求
 * @param {import('vue').Ref<boolean> | import('vue').ComputedRef<boolean>} active 有即将执行任务时启用
 */
export function usePlanCountdownNow(active) {
  const now = ref(Date.now());
  let timerId = null;

  function start() {
    if (timerId != null) return;
    now.value = Date.now();
    timerId = setInterval(() => {
      now.value = Date.now();
    }, 1000);
  }

  function stop() {
    if (timerId == null) return;
    clearInterval(timerId);
    timerId = null;
  }

  watch(
    active,
    (on) => {
      if (on) start();
      else stop();
    },
    { immediate: true },
  );

  onUnmounted(stop);

  return now;
}
