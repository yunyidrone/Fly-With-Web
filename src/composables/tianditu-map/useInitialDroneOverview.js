import * as Cesium from "cesium";

const INITIAL_DRONE_VIEW_MIN_SPAN = 0.01;
const INITIAL_DRONE_VIEW_PADDING_RATIO = 0.2;
const DEFAULT_FLY_DURATION = 0.8;

/**
 * 初始无人机视野聚合。
 *
 * 只负责首屏加载后，把当前在线且有有效经纬度的无人机框选到地图视野内：
 * - 内部维护“只执行一次”的状态，避免后续 store 同步时反复打断用户视角；
 * - 只读取无人机经纬度并驱动 Cesium camera.flyTo；
 * - 不创建/删除无人机实体，不修改无人机状态，也不参与伴飞、点击或图层开关。
 */
export function useInitialDroneOverview(options = {}) {
  const {
    getViewer,
    getDrones,
    isDroneOffline,
    mapDefaultRange,
  } = options;

  let hasAppliedInitialDroneOverview = false;

  function collectInitialDroneOverviewCoords() {
    const droneList = Array.isArray(getDrones?.()) ? getDrones() : [];
    return droneList
      .filter((drone) => !isDroneOffline?.(drone))
      .map((drone) => {
        const lng = Number(drone?.longitude ?? drone?.lng);
        const lat = Number(drone?.latitude ?? drone?.lat);
        if (!Number.isFinite(lng) || !Number.isFinite(lat)) return null;
        if (lng === 0 && lat === 0) return null;
        return { lng, lat };
      })
      .filter(Boolean);
  }

  function flyToInitialDroneOverview() {
    if (hasAppliedInitialDroneOverview) return;

    const viewer = getViewer?.();
    if (!viewer || viewer.isDestroyed?.()) return;

    const coords = collectInitialDroneOverviewCoords();
    if (!coords.length) return;

    hasAppliedInitialDroneOverview = true;

    if (coords.length === 1) {
      const { lng, lat } = coords[0];
      viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(lng, lat, mapDefaultRange),
        orientation: {
          heading: Cesium.Math.toRadians(0),
          pitch: Cesium.Math.toRadians(-90),
          roll: 0,
        },
        duration: DEFAULT_FLY_DURATION,
      });
      return;
    }

    let west = Number.POSITIVE_INFINITY;
    let east = Number.NEGATIVE_INFINITY;
    let south = Number.POSITIVE_INFINITY;
    let north = Number.NEGATIVE_INFINITY;
    coords.forEach(({ lng, lat }) => {
      west = Math.min(west, lng);
      east = Math.max(east, lng);
      south = Math.min(south, lat);
      north = Math.max(north, lat);
    });

    const lngSpan = Math.max(east - west, INITIAL_DRONE_VIEW_MIN_SPAN);
    const latSpan = Math.max(north - south, INITIAL_DRONE_VIEW_MIN_SPAN);
    const padLng = lngSpan * INITIAL_DRONE_VIEW_PADDING_RATIO;
    const padLat = latSpan * INITIAL_DRONE_VIEW_PADDING_RATIO;

    const clampedWest = Math.max(-180, west - padLng);
    const clampedEast = Math.min(180, east + padLng);
    const clampedSouth = Math.max(-85, south - padLat);
    const clampedNorth = Math.min(85, north + padLat);

    viewer.camera.flyTo({
      destination: Cesium.Rectangle.fromDegrees(
        clampedWest,
        clampedSouth,
        clampedEast,
        clampedNorth,
      ),
      orientation: {
        heading: Cesium.Math.toRadians(0),
        pitch: Cesium.Math.toRadians(-90),
        roll: 0,
      },
      duration: DEFAULT_FLY_DURATION,
    });
  }

  return {
    flyToInitialDroneOverview,
  };
}
