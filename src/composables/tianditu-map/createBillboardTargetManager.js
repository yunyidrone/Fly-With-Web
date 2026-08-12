import * as Cesium from "cesium";

/**
 * 创建 billboard 类目标实体管理器（警员 / 机器人 / 肩灯）。
 * 调用方通过 context 注入运行态，避免 manager 持有跨地图实例的全局状态。
 */
export function createBillboardTargetManager(config, context) {
  const records = new Map();

  function shouldShowPath(deviceId) {
    return Boolean(
      context.getRouteLayerVisible?.() &&
        context.isEscortingTarget?.(deviceId),
    );
  }

  function _removeAllPositionSamples(record) {
    record.positionProp.removeSamples(
      new Cesium.TimeInterval({
        start: Cesium.JulianDate.fromIso8601("1970-01-01T00:00:00Z"),
        stop: Cesium.JulianDate.fromIso8601("9999-12-31T23:59:59Z"),
      }),
    );
  }

  function _refreshPath(record) {
    if (!record?.entity?.path) return;
    record.entity.path.show = false;
    record.entity.path.show = shouldShowPath(
      record.entity.properties?.deviceId ?? "",
    );
  }

  function create(viewer, deviceId, labelText = deviceId) {
    if (records.has(deviceId)) {
      return records.get(deviceId);
    }

    const positionProp = new Cesium.SampledPositionProperty();
    positionProp.forwardExtrapolationType = Cesium.ExtrapolationType.HOLD;
    positionProp.backwardExtrapolationType = Cesium.ExtrapolationType.HOLD;
    positionProp.setInterpolationOptions({
      interpolationDegree: 1,
      interpolationAlgorithm: Cesium.HermitePolynomialApproximation,
    });

    const defaultPathMaterial = new Cesium.PolylineGlowMaterialProperty({
      glowPower: 0.2,
      taperPower: 0.7,
      color: config.pathColor,
    });
    const billboardSize = config.getBillboardSize?.(false) || {
      width: 34,
      height: 34,
    };
    const labelOffsetY = config.getLabelOffsetY?.(billboardSize) ?? -38;

    const entity = viewer.entities.add({
      availability: new Cesium.TimeIntervalCollection([
        new Cesium.TimeInterval({
          start: viewer.clock.startTime,
          stop: Cesium.JulianDate.fromIso8601("9999-12-31T23:59:59Z"),
        }),
      ]),
      position: positionProp,
      properties: {
        deviceId,
        deviceName: labelText || deviceId,
        targetType: config.targetType,
      },
      billboard: {
        image: config.icon,
        width: billboardSize.width,
        height: billboardSize.height,
        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
        heightReference: Cesium.HeightReference.RELATIVE_TO_GROUND,
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
      },
      label: {
        text: labelText || deviceId,
        font: "14px sans-serif",
        fillColor: config.labelColor,
        outlineColor: Cesium.Color.BLACK,
        outlineWidth: 2,
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
        pixelOffset: new Cesium.Cartesian2(0, labelOffsetY),
        heightReference: Cesium.HeightReference.RELATIVE_TO_GROUND,
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
      },
      path: {
        show: shouldShowPath(deviceId),
        width: 4,
        material: defaultPathMaterial,
        leadTime: 0,
        trailTime: 999999,
      },
      viewFrom: context.getVehicleViewFrom(false),
      show: context.getTargetLayerVisibility()[config.visibilityKey],
    });

    records.set(deviceId, {
      entity,
      positionProp,
      lastPosition: null,
      defaultPathMaterial,
      baseLabel: labelText || deviceId,
    });
    return records.get(deviceId);
  }

  function updatePosition(deviceId, longitude, latitude, height = 0) {
    const record = records.get(deviceId);
    if (!record) return;

    const viewer = context.getViewer();
    if (!viewer || viewer.isDestroyed?.()) return;

    const currentTime = viewer.clock.currentTime;
    const newPosition = Cesium.Cartesian3.fromDegrees(
      longitude,
      latitude,
      height,
    );
    record.positionProp.addSample(currentTime, newPosition);
    record.lastPosition = { longitude, latitude, height };
  }

  function updateLabel(deviceId, labelText) {
    const record = records.get(deviceId);
    if (!record?.entity?.label) return;
    record.baseLabel = labelText || deviceId;
    record.entity.label.text = context.formatTargetDisplayLabel(
      record.baseLabel,
      context.escortTargetHighlight.targetId === String(deviceId)
        ? context.escortTargetHighlight.droneName
        : "",
    );
    if (record.entity.properties?.deviceName) {
      record.entity.properties.deviceName = labelText || deviceId;
    }
  }

  function clearTrajectory(deviceId) {
    const record = records.get(deviceId);
    if (!record) return;

    _removeAllPositionSamples(record);

    const viewer = context.getViewer();
    if (
      viewer &&
      !viewer.isDestroyed?.() &&
      record.lastPosition?.longitude != null &&
      record.lastPosition?.latitude != null
    ) {
      const now = viewer.clock.currentTime;
      record.positionProp.addSample(
        now,
        Cesium.Cartesian3.fromDegrees(
          record.lastPosition.longitude,
          record.lastPosition.latitude,
          record.lastPosition.height ?? 0,
        ),
      );
    }

    _refreshPath(record);
  }

  function setPathVisible(deviceId, show) {
    const record = records.get(deviceId);
    if (record?.entity?.path) record.entity.path.show = show;
  }

  function remove(deviceId) {
    const record = records.get(deviceId);
    if (!record) return;
    context.getViewer()?.entities?.remove(record.entity);
    records.delete(deviceId);
  }

  function clearAll() {
    const viewer = context.getViewer();
    records.forEach((record) => {
      viewer?.entities?.remove(record.entity);
    });
    records.clear();
  }

  return {
    records,
    create,
    updatePosition,
    updateLabel,
    clearTrajectory,
    setPathVisible,
    remove,
    clearAll,
  };
}
