import * as Cesium from "cesium";
import yjfcPng from "@/assets/images/dt_kd.png";
import { CommonService } from "@/api/common.js";
import { unwrapApiList } from "@/utils/request.js";

// 封控点数据（由 ensureLockdownPointsFetched 从接口拉取填充，全局只请求一次）
const DEFAULT_LOCKDOWN_POINTS = [];
let lockdownPointsFetchPromise = null;

/**
 * 拉取封控点列表（并发安全、成功后可复用，失败时允许重试）
 * @returns {Promise<{ ok: boolean, count: number }>}
 */
async function ensureLockdownPointsFetched() {
  if (!lockdownPointsFetchPromise) {
    lockdownPointsFetchPromise = (async () => {
      try {
        const data = await CommonService.controlPointListQuery();
        const list = unwrapApiList(data);
        const points = list
          .map((item) => ({
            id: item?.id ?? "",
            lng: Number(item?.longitude),
            lat: Number(item?.latitude),
            name: item?.name ?? "",
            address: item?.description ?? "",
          }))
          .filter((point) => Number.isFinite(point.lng) && Number.isFinite(point.lat));
        DEFAULT_LOCKDOWN_POINTS.splice(0, DEFAULT_LOCKDOWN_POINTS.length, ...points);
        return { ok: true, count: points.length };
      } catch {
        lockdownPointsFetchPromise = null;
        return { ok: false, count: 0 };
      }
    })();
  }
  return lockdownPointsFetchPromise;
}

/** @deprecated 请使用 ensureLockdownPointsFetched */
export async function fetchLockdownPoints() {
  const { ok } = await ensureLockdownPointsFetched();
  return ok;
}

const LOCKDOWN_FOCUS_PADDING_RATIO = 1.2; // 边距系数 计算出的理想视野高度乘以 1.8，让所有封控点周围留出一定的空白边距，避免点位紧贴屏幕边缘
const MIN_LOCKDOWN_FOCUS_HEIGHT = 4500; // 相机最小高度 4500 米。如果封控点分布很集中，计算出的高度可能过低（太近），用这个下限兜底，防止视角过度拉近
const MAX_LOCKDOWN_FOCUS_HEIGHT = 55000; // 相机最大高度 55000 米。如果封控点分布极广，计算出的高度可能过高（太远），用这个上限兜底，防止视角过度拉远。

export function useLockdown({
  getViewer,
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
    if (lockdownPoints.length === 0) return null;
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
    const bounds = getLockdownBounds();
    if (!bounds) return null;
    const { west, east, south, north } = bounds;
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
    const focusView = getFocusView(viewer);
    if (!focusView) return;
    const { centerLng, centerLat, height } = focusView;

    const pitchRad = Cesium.Math.toRadians(-80);
    // 补偿 pitch 倾斜带来的视线偏移：相机向北看，需向南挪动相机使画面中心对准地理中心
    const pitchOffsetMeters = height * Math.tan(Math.PI / 2 - Math.abs(pitchRad));
    const latOffset = pitchOffsetMeters / 111000;

    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(centerLng, centerLat - latOffset, height),
      orientation: {
        heading: Cesium.Math.toRadians(0),
        pitch: pitchRad,
        roll: 0,
      },
      duration: 0.8,
    });
  };

  const setCheckpointVisibility = (show) => {
    lockdownEntities.forEach((entity) => {
      if (entity) entity.show = show;
    });
    getViewer?.()?.scene?.requestRender?.();
  };

  /** 拉取封控点并创建 marker（不重复请求、不拉视角） */
  const ensureCheckpointLayer = async () => {
    const viewer = getViewer?.();
    if (!viewer) return { ok: false, hasPoints: false };

    const { ok, count } = await ensureLockdownPointsFetched();
    if (!ok) return { ok: false, hasPoints: false };
    if (count === 0) return { ok: true, hasPoints: false };

    if (lockdownEntities.length === 0) {
      addLockdownMarkers(viewer);
    }
    viewer.scene.requestRender();
    return { ok: true, hasPoints: true };
  };

  const triggerLockdown = async () => {
    const viewer = getViewer?.();
    if (!viewer) return { ok: false, hasPoints: false };

    const result = await ensureCheckpointLayer();
    if (!result.hasPoints) return result;

    setCheckpointVisibility(true);
    focusLockdownArea(viewer);
    return result;
  };

  return {
    triggerLockdown,
    ensureCheckpointLayer,
    setCheckpointVisibility,
    clearLockdownMarkers,
    lockdownEntities,
  };
}
