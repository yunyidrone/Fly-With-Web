import * as Cesium from "cesium";
import yjfcPng from "@/assets/images/yjfc.png";

// 封城点预设坐标（围绕默认中心点的关键路口/区域）
const DEFAULT_LOCKDOWN_POINTS = [
  { lng: 121.41, lat: 28.67 },
  { lng: 121.448, lat: 28.668 },
  { lng: 121.452, lat: 28.65 },
  { lng: 121.445, lat: 28.633 },
  { lng: 121.415, lat: 28.635 },
  { lng: 121.405, lat: 28.652 },
];

const LOCKDOWN_FOCUS_PADDING_RATIO = 1.8;
const MIN_LOCKDOWN_FOCUS_HEIGHT = 4500;
const MAX_LOCKDOWN_FOCUS_HEIGHT = 15000;

export function useLockdown({
  getViewer,
  getDronePositionProp,
  defaultCenter,
  droneHeight,
  dispatchDroneToPoint,
  getDroneCandidates,
  lockdownPoints = DEFAULT_LOCKDOWN_POINTS,
}) {
  const lockdownEntities = [];

  const clearLockdownMarkers = () => {
    const viewer = getViewer?.();
    lockdownEntities.forEach((entity) => {
      if (viewer) viewer.entities.remove(entity);
    });
    lockdownEntities.length = 0;
  };

  const addLockdownMarkers = (viewer) => {
    lockdownPoints.forEach((point) => {
      const position = Cesium.Cartesian3.fromDegrees(point.lng, point.lat, 30);

      const markerEntity = viewer.entities.add({
        position,
        // 暂时注释红色柱体顶点，后续若需要可恢复
        // ellipsoid: {
        //   radii: new Cesium.Cartesian3(8, 8, 8),
        //   material: Cesium.Color.RED.withAlpha(0.8),
        //   outline: true,
        //   outlineColor: Cesium.Color.RED,
        //   heightReference: Cesium.HeightReference.RELATIVE_TO_GROUND,
        //   disableDepthTestDistance: Number.POSITIVE_INFINITY,
        // },
        billboard: {
          image: yjfcPng,
          width: 40,
          height: 48,
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
          // 底部中心锚定到经纬度点位，不做额外上移
          pixelOffset: new Cesium.Cartesian2(0, 0),
          heightReference: Cesium.HeightReference.RELATIVE_TO_GROUND,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        },
      });

      // 暂时注释红色立柱，后续若需要可恢复
      // const poleEntity = viewer.entities.add({
      //   polyline: {
      //     positions: [
      //       Cesium.Cartesian3.fromDegrees(point.lng, point.lat, 0),
      //       Cesium.Cartesian3.fromDegrees(point.lng, point.lat, 30),
      //     ],
      //     width: 2,
      //     material: Cesium.Color.RED.withAlpha(0.5),
      //     disableDepthTestDistance: Number.POSITIVE_INFINITY,
      //     clampToGround: true,
      //   },
      // });

      lockdownEntities.push(markerEntity);
      // lockdownEntities.push(markerEntity, poleEntity);
    });
  };

  const getLockdownBounds = () => {
    const lngs = lockdownPoints.map((point) => point.lng);
    const lats = lockdownPoints.map((point) => point.lat);
    return {
      west: Math.min(...lngs),
      east: Math.max(...lngs),
      south: Math.min(...lats),
      north: Math.max(...lats),
    };
  };

  const getFocusView = (viewer) => {
    const { west, east, south, north } = getLockdownBounds();
    const centerLng = (west + east) / 2;
    const centerLat = (south + north) / 2;
    const lngSpanMeters = (east - west) * 111000 * Math.cos(Cesium.Math.toRadians(centerLat));
    const latSpanMeters = (north - south) * 111000;
    const fovy = viewer.camera.frustum.fovy || Cesium.Math.toRadians(60);
    const aspect = viewer.canvas.clientWidth / viewer.canvas.clientHeight || 1;
    const halfVerticalFov = Math.tan(fovy / 2);
    const fitHeight = Math.max(
      latSpanMeters / (2 * halfVerticalFov),
      lngSpanMeters / (2 * halfVerticalFov * aspect),
    ) * LOCKDOWN_FOCUS_PADDING_RATIO;
    const height = Cesium.Math.clamp(fitHeight, MIN_LOCKDOWN_FOCUS_HEIGHT, MAX_LOCKDOWN_FOCUS_HEIGHT);

    return {
      centerLng,
      centerLat,
      height,
    };
  };

  const focusLockdownArea = (viewer) => {
    const { centerLng, centerLat, height } = getFocusView(viewer);

    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(centerLng, centerLat, height),
      orientation: {
        heading: Cesium.Math.toRadians(0),
        pitch: Cesium.Math.toRadians(-90),
        roll: 0,
      },
      duration: 0.8,
    });
  };

  const getNearestPoint = (startPos, points) => {
    return points
      .map((point) => {
        const pointPos = Cesium.Cartesian3.fromDegrees(point.lng, point.lat, droneHeight);
        const distance = Cesium.Cartesian3.distance(startPos, pointPos);
        return { ...point, distance };
      })
      .sort((a, b) => a.distance - b.distance)[0];
  };

  const getFallbackDroneCandidate = (viewer) => {
    const dronePositionProp = getDronePositionProp?.();
    if (!dronePositionProp) return null;

    const dronePos = dronePositionProp.getValue(viewer.clock.currentTime);
    if (!dronePos) {
      return {
        id: null,
        position: Cesium.Cartesian3.fromDegrees(defaultCenter.lng, defaultCenter.lat, droneHeight),
      };
    }

    return {
      id: null,
      position: dronePos,
    };
  };

  const getAvailableDroneCandidates = (viewer) => {
    const candidates = getDroneCandidates?.() || [];
    if (candidates.length > 0) {
      return candidates
        .filter((drone) => drone?.lastPosition)
        .map((drone) => ({
          id: drone.id,
          position: Cesium.Cartesian3.fromDegrees(
            drone.lastPosition.lng,
            drone.lastPosition.lat,
            drone.lastPosition.height || droneHeight,
          ),
        }));
    }

    const fallback = getFallbackDroneCandidate(viewer);
    return fallback ? [fallback] : [];
  };

  const dispatchDronesToNearestLockdownPoints = () => {
    const viewer = getViewer?.();
    if (!viewer) return;

    const droneCandidates = getAvailableDroneCandidates(viewer);
    if (droneCandidates.length === 0) return;

    const availablePoints = [...lockdownPoints];
    const assignments = [];

    droneCandidates.forEach((drone) => {
      if (availablePoints.length === 0) return;

      const nearestPoint = getNearestPoint(drone.position, availablePoints);
      const pointIndex = availablePoints.findIndex(
        (point) => point.lng === nearestPoint.lng && point.lat === nearestPoint.lat,
      );

      if (pointIndex >= 0) availablePoints.splice(pointIndex, 1);

      dispatchDroneToPoint(nearestPoint.lng, nearestPoint.lat, 30, droneHeight, drone.id);
      assignments.push({ droneId: drone.id || "default", point: nearestPoint });
    });

    console.log(
      "一键封城：无人机已调度，飞行序列",
      assignments.map(({ droneId, point }) => `${droneId} -> (${point.lng}, ${point.lat})`),
    );
  };

  const triggerLockdown = () => {
    const viewer = getViewer?.();
    if (!viewer) return;

    clearLockdownMarkers();
    addLockdownMarkers(viewer);
    viewer.scene.requestRender();
    focusLockdownArea(viewer);
    dispatchDronesToNearestLockdownPoints();
  };

  return {
    triggerLockdown,
    clearLockdownMarkers,
    lockdownEntities,
  };
}
