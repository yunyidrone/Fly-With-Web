import * as Cesium from "cesium";
import yjfcPng from "@/assets/images/dt_kd.png";

// 封城点预设坐标（围绕默认中心点的关键路口/区域）
const DEFAULT_LOCKDOWN_POINTS = [
  { lng: 121.34, lat: 28.69, name: '联华科技门口', id: '1' },
  { lng: 121.32, lat: 28.58, name: '城南所对面', id: '2' },
  { lng: 121.26, lat: 28.67, name: '黄土岭隧道口（南向北）', id: '3' },
  { lng: 121.14, lat: 28.63, name: '头陀滨江路振兴路桥头', id: '4' },
  { lng: 121.23, lat: 28.67, name: '北院大道-拱东医疗门前主道西', id: '5' },
  { lng: 121.00, lat: 28.60, name: '快乐村36号鹿鸣潭路口', id: '6' },
  { lng: 121.57, lat: 28.30, name: '沙埠三角路口', id: '7' },
];

const LOCKDOWN_FOCUS_PADDING_RATIO = 1.8;
const MIN_LOCKDOWN_FOCUS_HEIGHT = 4500;
const MAX_LOCKDOWN_FOCUS_HEIGHT = 55000;

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
          width: 52,
          height: 65,
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
          pixelOffset: new Cesium.Cartesian2(0, 0),
          heightReference: Cesium.HeightReference.RELATIVE_TO_GROUND,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        },
        label: {
          text: point.name || "封锁",
          font: "14px sans-serif",
          fillColor: Cesium.Color.RED,
          // outlineColor: Cesium.Color.BLACK,
          outlineWidth: 2,
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
          pixelOffset: new Cesium.Cartesian2(0, -70),
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
        pitch: Cesium.Math.toRadians(-80),
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
    // dispatchDronesToNearestLockdownPoints();
  };

  return {
    triggerLockdown,
    clearLockdownMarkers,
    lockdownEntities,
  };
}
