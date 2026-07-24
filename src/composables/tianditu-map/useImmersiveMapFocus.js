/**
 * 沉浸伴飞地图聚焦。
 *
 * 这不是普通图层开关，而是沉浸模式里的临时可见范围控制：
 * - 进入沉浸伴飞时，只保留当前伴飞目标和对应无人机可见；
 * - 路线、封控点、任务区域等辅助实体临时隐藏，减少沉浸画面的干扰；
 * - 退出沉浸时，根据普通图层开关状态恢复地图实体显隐。
 */
export function useImmersiveMapFocus(options = {}) {
  const {
    getViewer,
    getDrones,
    getDroneEntityKey,
    droneTestManager,
    vehicleManager,
    officerManager,
    robotManager,
    shoulderLightManager,
    getCarEntity,
    getDroneEntity,
    getLegacyDroneId,
    getLockdownEntities,
    getCompanionRouteEntities,
    getRouteMarkers,
    getVerticalLines,
    getFlightPlanPolygonEntities,
    getRouteLayerVisible,
    targetLayerVisibility,
  } = options;

  let active = false;
  let focusTargetId = null;
  let focusDroneId = null;
  let focusDroneKeys = new Set();

  const setEntityShow = (entity, show) => {
    if (entity) entity.show = show;
  };

  const setEntitiesShow = (entities, show) => {
    entities?.forEach((entity) => setEntityShow(entity, show));
  };

  function resolveDroneKeys(droneId) {
    const id = String(droneId || "").trim();
    const keys = new Set();
    if (!id) return keys;

    const drones = Array.isArray(getDrones?.()) ? getDrones() : [];
    const drone =
      drones.find((d) => String(d?.id || "") === id) ||
      drones.find((d) => String(d?.sn || "") === id) ||
      drones.find((d) => String(d?.mqttSn || "") === id);

    if (drone) {
      const primary = getDroneEntityKey?.(drone);
      if (primary) keys.add(primary);
      [drone.id, drone.sn, drone.mqttSn].forEach((alias) => {
        const key = String(alias || "").trim();
        if (key) keys.add(key);
      });
    } else {
      keys.add(id);
    }
    return keys;
  }

  /**
   * 应用沉浸聚焦状态。
   * 目标设备只显示当前伴飞目标；无人机只显示当前视频/伴飞无人机。
   */
  function applyFocusVisibility() {
    const viewer = getViewer?.();
    if (!viewer || viewer.isDestroyed?.() || !active) return;

    const targetId = String(focusTargetId || "").trim();
    const droneKeys = focusDroneKeys;

    vehicleManager.vehicles.forEach((vehicle, id) => {
      setEntityShow(vehicle?.entity, String(id) === targetId);
    });
    officerManager.officers.forEach((officer, id) => {
      setEntityShow(officer?.entity, String(id) === targetId);
    });
    robotManager.robots.forEach((robot, id) => {
      setEntityShow(robot?.entity, String(id) === targetId);
    });
    shoulderLightManager.shoulderLights.forEach((shoulderLight, id) => {
      setEntityShow(shoulderLight?.entity, String(id) === targetId);
    });
    droneTestManager.drones.forEach((drone, id) => {
      setEntityShow(drone?.entity, droneKeys.has(String(id)));
    });

    setEntityShow(getCarEntity?.(), false);
    const legacyDroneEntity = getDroneEntity?.();
    if (legacyDroneEntity) {
      const legacyKey = String(getLegacyDroneId?.() || "").trim();
      legacyDroneEntity.show = Boolean(legacyKey && droneKeys.has(legacyKey));
    }

    setEntitiesShow(getLockdownEntities?.(), false);
    setEntitiesShow(getCompanionRouteEntities?.(), false);
    setEntitiesShow(getRouteMarkers?.(), false);
    setEntitiesShow(getVerticalLines?.(), false);
    setEntitiesShow(getFlightPlanPolygonEntities?.(), false);

    viewer.scene?.requestRender?.();
  }

  /**
   * 退出沉浸聚焦后恢复普通地图显隐。
   * 目标设备按 targetLayerVisibility 恢复；路线实体按普通路线图层开关恢复。
   */
  function restoreNormalVisibility() {
    const viewer = getViewer?.();
    if (!viewer || viewer.isDestroyed?.()) return;

    vehicleManager.vehicles.forEach((vehicle) => {
      setEntityShow(vehicle?.entity, targetLayerVisibility.policeCar);
    });
    officerManager.officers.forEach((officer) => {
      setEntityShow(officer?.entity, targetLayerVisibility.officer);
    });
    robotManager.robots.forEach((robot) => {
      setEntityShow(robot?.entity, targetLayerVisibility.robot);
    });
    shoulderLightManager.shoulderLights.forEach((shoulderLight) => {
      setEntityShow(shoulderLight?.entity, targetLayerVisibility.shoulderLight);
    });
    droneTestManager.drones.forEach((drone) => {
      setEntityShow(drone?.entity, true);
    });

    setEntityShow(getCarEntity?.(), targetLayerVisibility.policeCar);
    setEntityShow(getDroneEntity?.(), true);

    setEntitiesShow(getLockdownEntities?.(), true);
    setEntitiesShow(getCompanionRouteEntities?.(), getRouteLayerVisible?.());
    setEntitiesShow(getRouteMarkers?.(), getRouteLayerVisible?.());
    setEntitiesShow(getVerticalLines?.(), getRouteLayerVisible?.());
    setEntitiesShow(getFlightPlanPolygonEntities?.(), true);

    viewer.scene?.requestRender?.();
  }

  function setImmersiveMapFocus(nextActive, targetId = "", droneId = "") {
    if (nextActive) {
      const tid = String(targetId || "").trim();
      const did = String(droneId || "").trim();
      if (!tid || !did) return false;

      active = true;
      focusTargetId = tid;
      focusDroneId = did;
      focusDroneKeys = resolveDroneKeys(did);
      applyFocusVisibility();
      return true;
    }

    active = false;
    focusTargetId = null;
    focusDroneId = null;
    focusDroneKeys = new Set();
    restoreNormalVisibility();
    return true;
  }

  function refreshImmersiveMapFocus() {
    if (!active) return;
    focusDroneKeys = resolveDroneKeys(focusDroneId);
    applyFocusVisibility();
  }

  return {
    setImmersiveMapFocus,
    refreshImmersiveMapFocus,
  };
}
