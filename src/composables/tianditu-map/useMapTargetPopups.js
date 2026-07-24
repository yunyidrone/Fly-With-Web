import { computed, reactive } from "vue";
import * as Cesium from "cesium";

const POLICE_POPUP_WIDTH = 280;
const POLICE_POPUP_OFFSET = 16;
const OVERLAP_POPUP_WIDTH = 230;
const OVERLAP_POPUP_OFFSET = 12;
const OVERLAP_HIDE_DELAY_MS = 300;
const OVERLAP_POPUP_SAFE_PADDING = 16;
const OVERLAP_MOVE_THROTTLE_MS = 50;
const OVERLAP_POPUP_ITEM_HEIGHT = 36;

/**
 * 管理地图目标交互弹窗。
 *
 * 这里负责“弹窗本身”的状态和位置：
 * - 目标详情弹窗随地图实体 postRender 重新定位；
 * - 多个设备重叠时显示悬浮列表，并处理 hover 安全区和延迟隐藏；
 * - 不负责判断点击的是哪个业务设备，也不负责打开视频/下发伴飞。
 */
export function useMapTargetPopups(options = {}) {
  const {
    getViewer,
    resolveTargetMapPositionProp,
    collectOverlapPopupItems,
  } = options;

  const policeVehiclePopup = reactive({
    visible: false,
    deviceId: "",
    vehicleName: "",
    targetTypeLabel: "警车",
    alertInfo: "",
    coordText: "",
    drones: [],
    selectedDroneId: "",
    loadingDrones: false,
    left: 0,
    top: 0,
  });

  const policeVehiclePopupStyle = computed(() => ({
    left: `${policeVehiclePopup.left}px`,
    top: `${policeVehiclePopup.top}px`,
    transform: "translateY(-50%)",
  }));

  const overlapDevicePopup = reactive({
    visible: false,
    left: 0,
    top: 0,
    hovering: false,
    items: [],
  });

  const overlapDevicePopupStyle = computed(() => ({
    left: `${overlapDevicePopup.left}px`,
    top: `${overlapDevicePopup.top}px`,
  }));

  let policePopupPostRenderRemove = null;
  let overlapHideTimer = null;
  let lastOverlapPointer = { x: 0, y: 0 };
  let lastOverlapPickAt = 0;

  const getCurrentViewer = () => getViewer?.();

  const updatePolicePopupScreenPosition = () => {
    const viewer = getCurrentViewer();
    if (!policeVehiclePopup.visible || !viewer || viewer.isDestroyed?.()) {
      return;
    }
    const positionProp = resolveTargetMapPositionProp?.(
      policeVehiclePopup.deviceId,
    );
    if (!positionProp) return;

    const pos = positionProp.getValue(viewer.clock.currentTime);
    if (!Cesium.defined(pos)) return;

    const canvasPos = Cesium.SceneTransforms.worldToWindowCoordinates(
      viewer.scene,
      pos,
    );
    if (!Cesium.defined(canvasPos)) {
      policeVehiclePopup.visible = false;
      return;
    }

    const w = viewer.canvas.clientWidth;
    const h = viewer.canvas.clientHeight;
    let left = canvasPos.x + POLICE_POPUP_OFFSET;
    let top = canvasPos.y;

    if (left + POLICE_POPUP_WIDTH > w - 8) {
      left = canvasPos.x - POLICE_POPUP_WIDTH - POLICE_POPUP_OFFSET;
    }
    left = Math.max(8, Math.min(left, w - POLICE_POPUP_WIDTH - 8));
    top = Math.max(80, Math.min(top, h - 100));

    policeVehiclePopup.left = left;
    policeVehiclePopup.top = top;
  };

  const attachPolicePopupTracker = () => {
    const viewer = getCurrentViewer();
    if (policePopupPostRenderRemove || !viewer) return;
    policePopupPostRenderRemove = viewer.scene.postRender.addEventListener(
      updatePolicePopupScreenPosition,
    );
  };

  const detachPolicePopupTracker = () => {
    if (typeof policePopupPostRenderRemove === "function") {
      policePopupPostRenderRemove();
    }
    policePopupPostRenderRemove = null;
  };

  const closePoliceVehiclePopup = () => {
    policeVehiclePopup.visible = false;
    detachPolicePopupTracker();
  };

  function clearOverlapHideTimer() {
    if (overlapHideTimer) {
      clearTimeout(overlapHideTimer);
      overlapHideTimer = null;
    }
  }

  function hideOverlapDevicePopup() {
    clearOverlapHideTimer();
    overlapDevicePopup.visible = false;
    overlapDevicePopup.hovering = false;
    overlapDevicePopup.items = [];
  }

  function getOverlapPopupHeight() {
    const count = overlapDevicePopup.items.length || 0;
    return Math.min(count * OVERLAP_POPUP_ITEM_HEIGHT + 12, 240);
  }

  function isPointerInOverlapPopupSafeZone(pointer) {
    if (!overlapDevicePopup.visible || !pointer) return false;
    const pad = OVERLAP_POPUP_SAFE_PADDING;
    const left = overlapDevicePopup.left - pad;
    const top = overlapDevicePopup.top - pad;
    const width = OVERLAP_POPUP_WIDTH + pad * 2;
    const height = getOverlapPopupHeight() + pad * 2;
    return (
      pointer.x >= left &&
      pointer.x <= left + width &&
      pointer.y >= top &&
      pointer.y <= top + height
    );
  }

  function scheduleHideOverlapDevicePopup() {
    clearOverlapHideTimer();
    overlapHideTimer = setTimeout(() => {
      overlapHideTimer = null;
      if (overlapDevicePopup.hovering) return;
      if (isPointerInOverlapPopupSafeZone(lastOverlapPointer)) return;
      hideOverlapDevicePopup();
    }, OVERLAP_HIDE_DELAY_MS);
  }

  function onOverlapPopupMouseEnter() {
    overlapDevicePopup.hovering = true;
    clearOverlapHideTimer();
  }

  function onOverlapPopupMouseLeave() {
    overlapDevicePopup.hovering = false;
    scheduleHideOverlapDevicePopup();
  }

  function updateOverlapDevicePopupPosition(screenPosition) {
    const viewer = getCurrentViewer();
    if (!viewer || !screenPosition) return;
    const w = viewer.canvas.clientWidth;
    const h = viewer.canvas.clientHeight;
    let left = Number(screenPosition.x || 0) + OVERLAP_POPUP_OFFSET;
    let top = Number(screenPosition.y || 0) + OVERLAP_POPUP_OFFSET;
    if (left + OVERLAP_POPUP_WIDTH > w - 8) {
      left =
        Number(screenPosition.x || 0) -
        OVERLAP_POPUP_WIDTH -
        OVERLAP_POPUP_OFFSET;
    }
    left = Math.max(8, Math.min(left, w - OVERLAP_POPUP_WIDTH - 8));
    top = Math.max(64, Math.min(top, h - 120));
    overlapDevicePopup.left = left;
    overlapDevicePopup.top = top;
  }

  function showOverlapDevicePopup(screenPosition, items) {
    if (!items?.length) return;
    overlapDevicePopup.items = items;
    overlapDevicePopup.visible = true;
    updateOverlapDevicePopupPosition(screenPosition);
    if (screenPosition) {
      lastOverlapPointer = {
        x: Number(screenPosition.x || 0),
        y: Number(screenPosition.y || 0),
      };
    }
    clearOverlapHideTimer();
  }

  function updateOverlapPopupFromPointer(screenPosition, { force = false } = {}) {
    if (!screenPosition) return;
    lastOverlapPointer = {
      x: Number(screenPosition.x || 0),
      y: Number(screenPosition.y || 0),
    };

    if (overlapDevicePopup.hovering) return;
    if (
      overlapDevicePopup.visible &&
      isPointerInOverlapPopupSafeZone(lastOverlapPointer)
    ) {
      clearOverlapHideTimer();
      return;
    }

    const now = Date.now();
    if (!force && now - lastOverlapPickAt < OVERLAP_MOVE_THROTTLE_MS) {
      return;
    }
    lastOverlapPickAt = now;

    const items = collectOverlapPopupItems?.(screenPosition) || [];
    if (items.length >= 2) {
      showOverlapDevicePopup(screenPosition, items);
      return;
    }

    if (overlapDevicePopup.visible) {
      scheduleHideOverlapDevicePopup();
    } else {
      clearOverlapHideTimer();
    }
  }

  function cleanupTargetPopups() {
    closePoliceVehiclePopup();
    hideOverlapDevicePopup();
  }

  return {
    policeVehiclePopup,
    policeVehiclePopupStyle,
    overlapDevicePopup,
    overlapDevicePopupStyle,
    updatePolicePopupScreenPosition,
    attachPolicePopupTracker,
    detachPolicePopupTracker,
    closePoliceVehiclePopup,
    hideOverlapDevicePopup,
    showOverlapDevicePopup,
    updateOverlapPopupFromPointer,
    onOverlapPopupMouseEnter,
    onOverlapPopupMouseLeave,
    cleanupTargetPopups,
  };
}
