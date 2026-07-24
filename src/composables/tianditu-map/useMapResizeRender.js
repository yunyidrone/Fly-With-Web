/**
 * 地图尺寸与渲染循环管理。
 *
 * 只负责 Cesium canvas 尺寸和渲染循环这类基础生命周期：
 * - Viewer 初始化前等待容器具备非 0 尺寸，避免 WebGL framebuffer 异常；
 * - Viewer 创建后触发 resize/requestRender；
 * - 根据外部 renderSuspended 状态暂停或恢复 Cesium 默认渲染循环。
 *
 * 不创建 Viewer，不初始化图层/实体，也不参与点击、伴飞、MQTT 或 store 同步。
 */
export function useMapResizeRender(options = {}) {
  const {
    getViewer,
    isRenderSuspended,
  } = options;

  const getCurrentViewer = () => getViewer?.();

  /** 等待 Cesium 容器具备有效尺寸后再初始化，避免 0×0 framebuffer 触发 WebGL 报错。 */
  function waitForNonZeroSize(el, timeoutMs = 3000) {
    return new Promise((resolve) => {
      if (!el) {
        resolve(false);
        return;
      }
      const hasSize = () => el.clientWidth > 0 && el.clientHeight > 0;
      if (hasSize()) {
        resolve(true);
        return;
      }

      let settled = false;
      const finish = (ok) => {
        if (settled) return;
        settled = true;
        ro?.disconnect();
        clearTimeout(timer);
        resolve(ok);
      };

      const ro =
        typeof ResizeObserver !== "undefined"
          ? new ResizeObserver(() => {
              if (hasSize()) finish(true);
            })
          : null;
      ro?.observe(el);

      const timer = setTimeout(() => finish(hasSize()), timeoutMs);
    });
  }

  /** 尺寸就绪后再等两帧，避免 flex/过渡首帧 canvas 仍为 0×0。 */
  async function waitForStableSize(el, timeoutMs = 3000) {
    const ok = await waitForNonZeroSize(el, timeoutMs);
    if (!ok) return false;
    await new Promise((resolve) => requestAnimationFrame(resolve));
    await new Promise((resolve) => requestAnimationFrame(resolve));
    return Boolean(el && el.clientWidth > 0 && el.clientHeight > 0);
  }

  function resizeMapView() {
    const viewer = getCurrentViewer();
    if (!viewer || viewer.isDestroyed?.()) return;
    viewer.resize();
    viewer.scene.requestRender();
  }

  function startRenderLoop() {
    const viewer = getCurrentViewer();
    if (!viewer || viewer.isDestroyed?.()) return;
    if (isRenderSuspended?.()) return;
    viewer.useDefaultRenderLoop = true;
    viewer.scene.requestRender();
  }

  function applyRenderSuspended(suspended) {
    const viewer = getCurrentViewer();
    if (!viewer || viewer.isDestroyed?.()) return;
    viewer.useDefaultRenderLoop = !suspended;
    if (!suspended) resizeMapView();
  }

  return {
    waitForStableSize,
    resizeMapView,
    startRenderLoop,
    applyRenderSuspended,
  };
}
