import { ref } from "vue";
import * as Cesium from "cesium";
import { MAP_CONFIG } from "@/config/app-config.js";

export function useMapControls(options = {}) {
  const {
    getViewer,
    resolveLockedFollowEntity,
    resolveManualFollowTarget,
    getFollowedVehicleDeviceId,
    setFollowedVehicleDeviceId,
    clearPendingEscortLock,
    onVehicleDisplayModeChange,
    onMissingFollowTarget,
  } = options;

  const vehicleDisplayMode = ref("model");
  const isPitch2D = ref(true);
  const isLockMode = ref(false);

  let restoreLockedFollowRaf = null;
  let manualUnlockHandler = null;
  let pinchZoomLockDetachActive = false;

  const getCurrentViewer = () => getViewer?.();

  const getVehicleViewFrom = (to2D = false) => {
    const range = to2D
      ? MAP_CONFIG.vehicleFollowRange2D
      : MAP_CONFIG.vehicleFollowRange3D;
    if (to2D) {
      return new Cesium.Cartesian3(0, 0, range);
    }
    const pitchRad = Cesium.Math.toRadians(45);
    return new Cesium.Cartesian3(
      0,
      -range * Math.cos(pitchRad),
      range * Math.sin(pitchRad),
    );
  };

  const applyEntityTrackViewFrom = (entity, to2D = isPitch2D.value) => {
    if (!entity) return;
    entity.viewFrom = getVehicleViewFrom(to2D);
  };

  const refreshTrackedEntity = (viewer, entity) => {
    if (!viewer || viewer.isDestroyed?.() || !entity) return;
    if (viewer.trackedEntity === entity) {
      viewer.trackedEntity = undefined;
    }
    viewer.trackedEntity = entity;
  };

  const getCenterAndRange = (viewer, focusEntity = null) => {
    const cameraPos = viewer.camera.positionWC;

    if (focusEntity?.position) {
      const target = focusEntity.position.getValue(viewer.clock.currentTime);
      if (target) {
        const range = Cesium.Cartesian3.distance(cameraPos, target);
        return { center: target, range };
      }
    }

    const canvas = viewer.scene.canvas;
    const ray = viewer.camera.getPickRay(
      new Cesium.Cartesian2(
        canvas.clientWidth / 2,
        canvas.clientHeight / 2,
      ),
    );
    const picked = viewer.scene.globe.pick(ray, viewer.scene);
    if (picked) {
      const range = Cesium.Cartesian3.distance(cameraPos, picked);
      return { center: picked, range };
    }

    const carto = viewer.camera.positionCartographic;
    const fallbackCenter = Cesium.Cartesian3.fromRadians(
      carto.longitude,
      carto.latitude,
      0,
    );
    const fallbackRange = Cesium.Math.clamp(
      carto.height || MAP_CONFIG.mapDefaultRange,
      100,
      50000,
    );
    return { center: fallbackCenter, range: fallbackRange };
  };

  const toggleDisplayMode = () => {
    vehicleDisplayMode.value =
      vehicleDisplayMode.value === "model" ? "point" : "model";
    onVehicleDisplayModeChange?.(vehicleDisplayMode.value);
  };

  const switchTrackedView = (
    viewer,
    targetEntity,
    to2D,
    { resetViewFrom = true } = {},
  ) => {
    if (!viewer || viewer.isDestroyed?.()) return;

    const entity = targetEntity || viewer.trackedEntity;
    if (!entity) return;

    if (resetViewFrom) {
      applyEntityTrackViewFrom(entity, to2D);
    }
    refreshTrackedEntity(viewer, entity);
  };

  const toggleSceneMode = () => {
    const viewer = getCurrentViewer();
    if (!viewer || viewer.isDestroyed?.()) return;

    let focusEntity = null;
    if (isLockMode.value) {
      focusEntity =
        viewer.trackedEntity || resolveLockedFollowEntity?.()?.entity;
    }

    isPitch2D.value = !isPitch2D.value;
    const to2D = isPitch2D.value;

    if (isLockMode.value && focusEntity) {
      applyEntityTrackViewFrom(focusEntity, to2D);
      refreshTrackedEntity(viewer, focusEntity);
      return;
    }

    const { center, range } = getCenterAndRange(viewer, focusEntity);
    const heading = viewer.camera.heading;

    viewer.camera.lookAtTransform(Cesium.Matrix4.IDENTITY);
    viewer.camera.lookAt(
      center,
      new Cesium.HeadingPitchRange(
        heading,
        Cesium.Math.toRadians(to2D ? -90 : -45),
        range,
      ),
    );
    viewer.camera.lookAtTransform(Cesium.Matrix4.IDENTITY);
  };

  function readEntityViewFromOffset(entity, viewer = getCurrentViewer()) {
    const vf = entity?.viewFrom;
    if (vf instanceof Cesium.Cartesian3) {
      return Cesium.Cartesian3.clone(vf);
    }
    if (typeof vf?.getValue === "function") {
      const value = vf.getValue(viewer?.clock?.currentTime);
      return value ? Cesium.Cartesian3.clone(value) : null;
    }
    return null;
  }

  function scaleLockedEntityViewFrom(entity, factor) {
    let offset = readEntityViewFromOffset(entity);
    if (!offset) {
      applyEntityTrackViewFrom(entity, isPitch2D.value);
      offset = readEntityViewFromOffset(entity);
    }
    if (!offset) return false;

    let next = Cesium.Cartesian3.multiplyByScalar(
      offset,
      factor,
      new Cesium.Cartesian3(),
    );
    const range = Cesium.Cartesian3.magnitude(next);
    if (!Number.isFinite(range) || range < 1) return false;
    if (range < 80 || range > 50000) {
      const clamped = Cesium.Math.clamp(range, 80, 50000);
      next = Cesium.Cartesian3.multiplyByScalar(
        Cesium.Cartesian3.normalize(next, new Cesium.Cartesian3()),
        clamped,
        new Cesium.Cartesian3(),
      );
    }
    entity.viewFrom = next;
    return true;
  }

  const zoomIn = () => {
    const viewer = getCurrentViewer();
    if (!viewer || viewer.isDestroyed?.()) return;

    if (isLockMode.value) {
      const locked = resolveLockedFollowEntity?.();
      if (locked?.entity && scaleLockedEntityViewFrom(locked.entity, 0.5)) {
        switchTrackedView(viewer, locked.entity, isPitch2D.value, {
          resetViewFrom: false,
        });
        return;
      }
    }
    viewer.camera.zoomIn(viewer.camera.positionCartographic.height * 0.5);
  };

  const zoomOut = () => {
    const viewer = getCurrentViewer();
    if (!viewer || viewer.isDestroyed?.()) return;

    if (isLockMode.value) {
      const locked = resolveLockedFollowEntity?.();
      if (locked?.entity && scaleLockedEntityViewFrom(locked.entity, 2)) {
        switchTrackedView(viewer, locked.entity, isPitch2D.value, {
          resetViewFrom: false,
        });
        return;
      }
    }
    viewer.camera.zoomOut(viewer.camera.positionCartographic.height * 0.5);
  };

  function shouldRefreshFollowOnMqtt(deviceId) {
    if (!isLockMode.value) return false;
    const incomingId = String(deviceId || "").trim();
    const followedId = String(getFollowedVehicleDeviceId?.() || "").trim();
    return Boolean(incomingId && followedId && incomingId === followedId);
  }

  function syncViewFromFromCamera(viewer, entity) {
    if (!viewer || viewer.isDestroyed?.() || !entity?.position) return false;

    const entityPos = entity.position.getValue(viewer.clock.currentTime);
    if (!entityPos) return false;

    const worldOffset = Cesium.Cartesian3.subtract(
      viewer.camera.positionWC,
      entityPos,
      new Cesium.Cartesian3(),
    );
    const enu = Cesium.Transforms.eastNorthUpToFixedFrame(entityPos);
    const inv = Cesium.Matrix4.inverse(enu, new Cesium.Matrix4());
    let localOffset = Cesium.Matrix4.multiplyByPointAsVector(
      inv,
      worldOffset,
      new Cesium.Cartesian3(),
    );

    let range = Cesium.Cartesian3.magnitude(localOffset);
    if (!Number.isFinite(range) || range < 1) return false;
    if (range < 80 || range > 50000) {
      const clamped = Cesium.Math.clamp(range, 80, 50000);
      localOffset = Cesium.Cartesian3.multiplyByScalar(
        Cesium.Cartesian3.normalize(localOffset, new Cesium.Cartesian3()),
        clamped,
        new Cesium.Cartesian3(),
      );
    }

    entity.viewFrom = localOffset;
    return true;
  }

  function releaseVehicleFollow() {
    isLockMode.value = false;
    clearPendingEscortLock?.();
    const viewer = getCurrentViewer();
    if (viewer && !viewer.isDestroyed?.()) {
      viewer.trackedEntity = undefined;
    }
  }

  function restoreLockedFollowAfterZoom() {
    const viewer = getCurrentViewer();
    if (!isLockMode.value || !viewer || viewer.isDestroyed?.()) return;

    const locked = resolveLockedFollowEntity?.();
    if (!locked?.entity) {
      releaseVehicleFollow();
      return;
    }

    if (!syncViewFromFromCamera(viewer, locked.entity)) return;
    switchTrackedView(viewer, locked.entity, isPitch2D.value, {
      resetViewFrom: false,
    });
  }

  function scheduleRestoreLockedFollow() {
    if (restoreLockedFollowRaf != null) {
      cancelAnimationFrame(restoreLockedFollowRaf);
    }
    restoreLockedFollowRaf = requestAnimationFrame(() => {
      restoreLockedFollowRaf = requestAnimationFrame(() => {
        restoreLockedFollowRaf = null;
        restoreLockedFollowAfterZoom();
      });
    });
  }

  function followVehicleEntity(entity, deviceId, { resetViewFrom = true } = {}) {
    const viewer = getCurrentViewer();
    if (!viewer || viewer.isDestroyed?.() || !entity) return;

    if (deviceId != null) {
      setFollowedVehicleDeviceId?.(String(deviceId));
    }

    if (resetViewFrom) {
      applyEntityTrackViewFrom(entity, isPitch2D.value);
    }
    isLockMode.value = true;
    switchTrackedView(viewer, entity, isPitch2D.value, { resetViewFrom });
  }

  const toggleLockMode = () => {
    if (isLockMode.value) {
      releaseVehicleFollow();
      return;
    }

    const target = resolveManualFollowTarget?.();
    if (!target?.entity) {
      onMissingFollowTarget?.();
      return;
    }

    followVehicleEntity(target.entity, target.deviceId);
  };

  const detachTrackedEntityForLockedZoom = () => {
    if (!isLockMode.value) return false;
    const locked = resolveLockedFollowEntity?.();
    if (!locked?.entity) {
      releaseVehicleFollow();
      return false;
    }
    const viewer = getCurrentViewer();
    if (viewer && !viewer.isDestroyed?.()) {
      viewer.trackedEntity = undefined;
      viewer.camera.lookAtTransform(Cesium.Matrix4.IDENTITY);
    }
    return true;
  };

  const initManualUnlock = (viewer) => {
    cleanupManualUnlock();

    manualUnlockHandler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
    manualUnlockHandler.setInputAction(() => {
      if (!isLockMode.value) return;
      releaseVehicleFollow();
    }, Cesium.ScreenSpaceEventType.LEFT_DOWN);
    manualUnlockHandler.setInputAction(() => {
      if (!detachTrackedEntityForLockedZoom()) return;
      scheduleRestoreLockedFollow();
    }, Cesium.ScreenSpaceEventType.WHEEL);
    manualUnlockHandler.setInputAction(() => {
      if (!detachTrackedEntityForLockedZoom()) return;
      pinchZoomLockDetachActive = true;
    }, Cesium.ScreenSpaceEventType.PINCH_START);
    manualUnlockHandler.setInputAction(() => {
      if (!pinchZoomLockDetachActive) return;
      pinchZoomLockDetachActive = false;
      scheduleRestoreLockedFollow();
    }, Cesium.ScreenSpaceEventType.PINCH_END);
  };

  function cleanupManualUnlock() {
    if (manualUnlockHandler) {
      manualUnlockHandler.destroy();
      manualUnlockHandler = null;
    }
    if (restoreLockedFollowRaf != null) {
      cancelAnimationFrame(restoreLockedFollowRaf);
      restoreLockedFollowRaf = null;
    }
    pinchZoomLockDetachActive = false;
  }

  return {
    vehicleDisplayMode,
    isPitch2D,
    isLockMode,
    getVehicleViewFrom,
    applyEntityTrackViewFrom,
    refreshTrackedEntity,
    toggleDisplayMode,
    toggleSceneMode,
    switchTrackedView,
    zoomIn,
    zoomOut,
    shouldRefreshFollowOnMqtt,
    followVehicleEntity,
    releaseVehicleFollow,
    toggleLockMode,
    initManualUnlock,
    cleanupManualUnlock,
  };
}
