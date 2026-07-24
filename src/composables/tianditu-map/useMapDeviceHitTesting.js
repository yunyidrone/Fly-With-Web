import * as Cesium from "cesium";

const OVERLAP_DEVICE_HIT_WIDTH = 40;
const OVERLAP_DEVICE_HIT_HEIGHT = 40;

/**
 * 地图设备命中检测。
 *
 * 这部分只负责把 Cesium 屏幕坐标转换成业务可用的设备项：
 * - 用屏幕热区补足模型空隙导致的 pick 不稳定；
 * - 用 drillPick 收集同一位置下重叠的无人机/目标设备；
 * - 输出标准化 popup item，交给弹窗模块展示。
 *
 * 它不负责弹窗显示状态，也不负责打开视频、锁定目标或下发伴飞。
 */
export function useMapDeviceHitTesting(options = {}) {
  const {
    getViewer,
    getDrones,
    getTargets,
    getDroneEntityKey,
    getDroneDeviceFromEntity,
    getVehicleDeviceIdFromEntity,
    resolveTargetMapEntry,
    resolveTargetType,
    isBoatTarget,
    isDroneOffline,
    droneTestManager,
    vehicleManager,
    officerManager,
    robotManager,
    shoulderLightManager,
    icons,
  } = options;

  const getCurrentViewer = () => getViewer?.();

  function getEntityScreenPosition(entity) {
    const viewer = getCurrentViewer();
    if (!viewer || viewer.isDestroyed?.() || !entity?.position) return null;
    const pos =
      typeof entity.position.getValue === "function"
        ? entity.position.getValue(viewer.clock.currentTime)
        : entity.position;
    if (!Cesium.defined(pos)) return null;
    return Cesium.SceneTransforms.worldToWindowCoordinates(viewer.scene, pos);
  }

  function isMapEntityVisible(entity) {
    return Boolean(entity && entity.show !== false);
  }

  function isPointerInDeviceHitRect(pointer, center, anchor = "center") {
    if (!pointer || !center) return false;
    const halfW = OVERLAP_DEVICE_HIT_WIDTH / 2;
    const left = center.x - halfW;
    const right = center.x + halfW;
    let top;
    let bottom;
    if (anchor === "bottom") {
      bottom = center.y + 4;
      top = center.y - OVERLAP_DEVICE_HIT_HEIGHT;
    } else {
      const halfH = OVERLAP_DEVICE_HIT_HEIGHT / 2;
      top = center.y - halfH;
      bottom = center.y + halfH;
    }
    return (
      pointer.x >= left &&
      pointer.x <= right &&
      pointer.y >= top &&
      pointer.y <= bottom
    );
  }

  function resolveStoreDroneByEntityKey(entityKey) {
    const key = String(entityKey || "").trim();
    if (!key) return null;
    const drones = Array.isArray(getDrones?.()) ? getDrones() : [];
    return (
      drones.find((drone) => getDroneEntityKey(drone) === key) ||
      drones.find((drone) => String(drone?.mqttSn || "") === key) ||
      drones.find((drone) => String(drone?.id || "") === key) ||
      drones.find((drone) => String(drone?.sn || "") === key) ||
      null
    );
  }

  function resolveEntityHitAnchor(entity) {
    if (entity?.billboard && !entity?.model) return "bottom";
    return "center";
  }

  function addOverlapPopupItem(dedup, item) {
    if (item && !dedup.has(item.key)) dedup.set(item.key, item);
  }

  function getTargetPopupItem(deviceId) {
    const id = String(deviceId || "").trim();
    if (!id) return null;
    const targets = Array.isArray(getTargets?.()) ? getTargets() : [];
    const target = targets.find((item) => String(item?.id || "") === id);
    const type = resolveTargetType(target);
    const iconSrc = isBoatTarget(target)
      ? icons.boat
      : type === 2
        ? icons.officer
        : type === 3
          ? icons.robot
          : type === 6
            ? icons.shoulderLight
            : icons.policeCar;
    return {
      key: `target:${id}`,
      kind: "target",
      id,
      iconSrc,
      name: String(target?.name || id),
    };
  }

  function getDronePopupItem(drone) {
    if (!drone || isDroneOffline(drone)) return null;
    const id = String(drone?.id || drone?.sn || drone?.mqttSn || "").trim();
    if (!id) return null;
    return {
      key: `drone:${id}`,
      kind: "drone",
      id,
      iconSrc: icons.drone,
      name: String(drone?.name || drone?.sn || id),
      drone,
    };
  }

  function collectOverlapItemsByScreenHit(screenPosition) {
    const dedup = new Map();
    const viewer = getCurrentViewer();
    if (!viewer || viewer.isDestroyed?.() || !screenPosition) return [];

    droneTestManager.drones.forEach((drone, entityKey) => {
      const entity = drone?.entity;
      if (!isMapEntityVisible(entity)) return;
      const center = getEntityScreenPosition(entity);
      if (!isPointerInDeviceHitRect(screenPosition, center, "center")) return;
      addOverlapPopupItem(
        dedup,
        getDronePopupItem(resolveStoreDroneByEntityKey(entityKey)),
      );
    });

    [
      vehicleManager.vehicles,
      officerManager.officers,
      robotManager.robots,
      shoulderLightManager.shoulderLights,
    ].forEach((managerMap) => {
      managerMap.forEach((entry, deviceId) => {
        const entity = entry?.entity;
        if (!isMapEntityVisible(entity)) return;
        const center = getEntityScreenPosition(entity);
        if (
          !isPointerInDeviceHitRect(
            screenPosition,
            center,
            resolveEntityHitAnchor(entity),
          )
        ) {
          return;
        }
        addOverlapPopupItem(dedup, getTargetPopupItem(deviceId));
      });
    });

    return [...dedup.values()];
  }

  /** 屏幕热区命中唯一设备时，用于 pick 未命中（如模型空隙）的点击兜底。 */
  function resolveDeviceClickByScreenHit(screenPosition) {
    const items = collectOverlapItemsByScreenHit(screenPosition);
    if (items.length !== 1) return null;
    const item = items[0];
    if (item.kind === "drone") {
      return { kind: "drone", drone: item.drone };
    }
    if (item.kind === "target") {
      return { kind: "target", deviceId: item.id };
    }
    return null;
  }

  function collectOverlapPopupItems(screenPosition) {
    const viewer = getCurrentViewer();
    if (!viewer || viewer.isDestroyed?.() || !screenPosition) return [];

    const dedup = new Map();
    collectOverlapItemsByScreenHit(screenPosition).forEach((item) =>
      addOverlapPopupItem(dedup, item),
    );

    const picked = viewer.scene.drillPick(screenPosition, 20) || [];
    picked.forEach((entry) => {
      const entity = entry?.id;
      if (!entity || !isMapEntityVisible(entity)) return;
      const drone = getDroneDeviceFromEntity(entity);
      if (drone) {
        addOverlapPopupItem(dedup, getDronePopupItem(drone));
        return;
      }
      const deviceId = getVehicleDeviceIdFromEntity(entity);
      const targetEntry = deviceId ? resolveTargetMapEntry(deviceId) : null;
      if (!targetEntry) return;
      addOverlapPopupItem(dedup, getTargetPopupItem(deviceId));
    });

    return [...dedup.values()];
  }

  return {
    collectOverlapPopupItems,
    resolveDeviceClickByScreenHit,
  };
}
