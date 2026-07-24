import * as Cesium from "cesium";

const DRONE_SELECTION_CIRCLE_COLOR = Cesium.Color.fromCssColorString("#FFC300");

/**
 * 无人机选中圈。
 *
 * 只负责地图上的无人机选中高亮表现：
 * - 点击/外部同步选中无人机时，创建一个跟随无人机位置的固定像素圆环；
 * - 无人机取消选中或实体被移除时，清理圆环实体；
 * - 不负责打开无人机视频、不负责伴飞、不修改无人机业务状态。
 */
export function useDroneSelectionCircle(options = {}) {
  const {
    getViewer,
    getDrones,
    getDroneEntityKey,
    droneTestManager,
  } = options;

  let selectedDroneKey = null;
  let selectionCircleEntity = null;

  const getCurrentViewer = () => getViewer?.();

  function clearDroneSelectionCircle() {
    const viewer = getCurrentViewer();
    if (selectionCircleEntity) {
      viewer?.entities?.remove(selectionCircleEntity);
      selectionCircleEntity = null;
    }
    selectedDroneKey = null;
  }

  function applyDroneSelectionCircle(entityKey) {
    clearDroneSelectionCircle();
    const viewer = getCurrentViewer();
    const drone = droneTestManager.drones.get(entityKey);
    if (!drone?.entity?.position || !viewer) return;

    selectionCircleEntity = viewer.entities.add({
      // 用 CallbackProperty 让圆圈始终跟随无人机当前位置。
      position: new Cesium.CallbackProperty(() => {
        const currentDrone = droneTestManager.drones.get(entityKey);
        return currentDrone?.entity?.position?.getValue(Cesium.JulianDate.now());
      }, false),
      // 固定像素空心圆环，不随地图缩放改变大小，并始终位于顶层。
      point: {
        pixelSize: 56,
        color: DRONE_SELECTION_CIRCLE_COLOR.withAlpha(0.0),
        outlineColor: DRONE_SELECTION_CIRCLE_COLOR,
        outlineWidth: 4,
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
      },
    });
    selectedDroneKey = entityKey;
  }

  function syncActiveDroneSelectionCircle(droneId) {
    const viewer = getCurrentViewer();
    const id = String(droneId || "").trim();
    if (!id) {
      clearDroneSelectionCircle();
      viewer?.scene?.requestRender?.();
      return;
    }

    const drones = Array.isArray(getDrones?.()) ? getDrones() : [];
    const drone =
      drones.find((item) => String(item?.id || "") === id) ||
      drones.find((item) => String(item?.sn || "") === id) ||
      drones.find((item) => String(item?.mqttSn || "") === id);
    if (!drone) {
      clearDroneSelectionCircle();
      viewer?.scene?.requestRender?.();
      return;
    }

    const key = getDroneEntityKey(drone);
    if (!key) {
      clearDroneSelectionCircle();
      viewer?.scene?.requestRender?.();
      return;
    }

    if (selectedDroneKey !== key) {
      applyDroneSelectionCircle(key);
    }
    viewer?.scene?.requestRender?.();
  }

  function isDroneSelected(entityKey) {
    return Boolean(entityKey && selectedDroneKey === entityKey);
  }

  return {
    applyDroneSelectionCircle,
    clearDroneSelectionCircle,
    syncActiveDroneSelectionCircle,
    isDroneSelected,
  };
}
