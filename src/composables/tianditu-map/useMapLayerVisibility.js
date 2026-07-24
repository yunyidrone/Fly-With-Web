/**
 * 统一管理地图工具里的图层显隐。
 *
 * 这里的“图层”不是 Cesium ImageryLayer 的狭义图层，而是业务上可开关的一组实体：
 * - 无人机、警车、警员、机器人、肩灯等目标设备实体；
 * - 封控点实体；
 * - 路线相关实体，包括路径点、高度指示线、伴飞连接线以及各设备的 path 轨迹。
 *
 * 主组件只负责提供 entity/manager 的访问入口，本 composable 只负责把开关状态同步到 Cesium 实体。
 */
export function useMapLayerVisibility(options = {}) {
  const {
    getViewer,
    droneTestManager,
    vehicleManager,
    officerManager,
    robotManager,
    shoulderLightManager,
    getCarEntity,
    getDroneEntity,
    getRouteMarkers,
    getVerticalLines,
    getCompanionRouteEntities,
    setRouteLayerVisible,
    targetLayerVisibility,
    ensureCheckpointLayer,
    setCheckpointVisibility,
    notify,
  } = options;

  const setEntitiesShow = (entities, show) => {
    entities?.forEach((entity) => {
      if (entity && entity.show !== undefined) entity.show = show;
    });
  };

  const setEntityPathShow = (entity, show) => {
    if (entity?.path) entity.path.show = show;
  };

  /**
   * 地图工具栏/资源面板触发的统一图层开关。
   * route 分支负责“路线”层：伴飞连接线、路径点、高度线和各类设备轨迹都在这里统一显隐。
   */
  const toggleLayerVisibility = async ({ key, active }) => {
    if (!getViewer?.()) return;

    switch (key) {
      case "drone":
        droneTestManager.drones.forEach((drone) => {
          if (drone.entity) drone.entity.show = active;
        });
        if (getDroneEntity?.()) getDroneEntity().show = active;
        break;

      case "policeCar":
        targetLayerVisibility.policeCar = active;
        vehicleManager.vehicles.forEach((vehicle) => {
          if (vehicle.entity) vehicle.entity.show = active;
        });
        if (getCarEntity?.()) getCarEntity().show = active;
        break;

      case "checkpoint":
        if (!active) {
          setCheckpointVisibility(false);
          break;
        }
        {
          const result = await ensureCheckpointLayer();
          if (!result.ok) {
            notify?.error?.("获取封控点失败");
            return { revert: true };
          }
          if (!result.hasPoints) {
            notify?.warning?.("暂无封控点");
            return { revert: true };
          }
          setCheckpointVisibility(true);
          notify?.success?.("已开启卡点");
        }
        break;

      case "route":
        setRouteLayerVisible(active);
        setEntitiesShow(getRouteMarkers?.(), active); // 路径点
        setEntitiesShow(getVerticalLines?.(), active); // 地面到空中目标点的高度指示线
        setEntitiesShow(getCompanionRouteEntities?.(), active); // 伴飞连接线/动态路线
        vehicleManager.vehicles.forEach((vehicle) =>
          setEntityPathShow(vehicle.entity, active),
        );
        officerManager.officers.forEach((officer) =>
          setEntityPathShow(officer.entity, active),
        );
        robotManager.robots.forEach((robot) =>
          setEntityPathShow(robot.entity, active),
        );
        shoulderLightManager.shoulderLights.forEach((shoulderLight) =>
          setEntityPathShow(shoulderLight.entity, active),
        );
        droneTestManager.drones.forEach((drone) =>
          setEntityPathShow(drone.entity, active),
        );
        setEntityPathShow(getCarEntity?.(), active);
        setEntityPathShow(getDroneEntity?.(), active);
        break;

      case "officer":
        targetLayerVisibility.officer = active;
        officerManager.officers.forEach((officer) => {
          if (officer.entity) officer.entity.show = active;
        });
        break;

      case "robot":
        targetLayerVisibility.robot = active;
        robotManager.robots.forEach((robot) => {
          if (robot.entity) robot.entity.show = active;
        });
        break;

      case "shoulderLight":
        targetLayerVisibility.shoulderLight = active;
        shoulderLightManager.shoulderLights.forEach((shoulderLight) => {
          if (shoulderLight.entity) shoulderLight.entity.show = active;
        });
        break;
    }
  };

  return {
    toggleLayerVisibility,
  };
}
