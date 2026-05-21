import * as Cesium from "cesium";
import { ref } from "vue";

const CIRCLE_SEGMENTS = 64;

/**
 * @param {number} lng
 * @param {number} lat
 * @param {number} distanceMeters
 * @param {number} bearingRadians
 * @returns {[number, number]} [lng, lat]
 */
function pointAtDistanceAndBearing(lng, lat, distanceMeters, bearingRadians) {
  const ellipsoid = Cesium.Ellipsoid.WGS84;
  const centerCarto = Cesium.Cartographic.fromDegrees(lng, lat);
  const centerCart = ellipsoid.cartographicToCartesian(centerCarto);

  const enuDir = new Cesium.Cartesian3(
    Math.sin(bearingRadians) * distanceMeters,
    Math.cos(bearingRadians) * distanceMeters,
    0,
  );

  const transform = Cesium.Transforms.eastNorthUpToFixedFrame(centerCart);
  const rotation = new Cesium.Matrix4();
  Cesium.Matrix4.getRotation(transform, rotation);
  const worldDir = new Cesium.Cartesian3();
  Cesium.Matrix4.multiplyByPointAsVector(rotation, enuDir, worldDir);

  const worldPoint = new Cesium.Cartesian3();
  Cesium.Cartesian3.add(centerCart, worldDir, worldPoint);

  const result = Cesium.Cartographic.fromCartesian(worldPoint);
  return [
    Cesium.Math.toDegrees(result.longitude),
    Cesium.Math.toDegrees(result.latitude),
  ];
}

/**
 * @param {object} options
 * @param {()=>import('cesium').Viewer|null} options.getViewer
 */
export function useAreaDraw({ getViewer }) {
  const isDrawing = ref(false);
  const drawMode = ref(null);

  let _viewer = null;
  let _handler = null;
  let _previewEntity = null;
  let _finalizedEntity = null;
  let _doneCallback = null;
  let _startCartesian = null;
  let _startCartographic = null;
  let _cameraRestore = null;

  function getV() {
    return getViewer?.() || _viewer;
  }

  /** 在鼠标按下时禁用相机控制（必须在事件处理链中执行，而非提前设置） */
  function disableCamera(v) {
    const ctrl = v.scene.screenSpaceCameraController;
    _cameraRestore = {
      enableInputs: ctrl.enableInputs,
      enableTranslate: ctrl.enableTranslate,
      enableZoom: ctrl.enableZoom,
      enableRotate: ctrl.enableRotate,
      enableTilt: ctrl.enableTilt,
      enableLook: ctrl.enableLook,
    };
    ctrl.enableInputs = false;
    ctrl.enableTranslate = false;
    ctrl.enableZoom = false;
    ctrl.enableRotate = false;
    ctrl.enableTilt = false;
    ctrl.enableLook = false;

    // 清除 CameraEventAggregator 中已累积的 LEFT_DRAG 状态，防止惯性旋转
    const agg = ctrl._aggregator;
    if (agg) {
      const isDown = agg._isDown;
      if (isDown && isDown["0"]) {
        agg._buttonsDown = Math.max((agg._buttonsDown || 1) - 1, 0);
        isDown["0"] = false;
        if (agg._releaseTime) agg._releaseTime["0"] = new Date();
      }
    }
  }

  function restoreCamera() {
    const v = getV();
    if (!v || !_cameraRestore) return;
    const ctrl = v.scene.screenSpaceCameraController;
    ctrl.enableInputs = _cameraRestore.enableInputs;
    ctrl.enableTranslate = _cameraRestore.enableTranslate;
    ctrl.enableZoom = _cameraRestore.enableZoom;
    ctrl.enableRotate = _cameraRestore.enableRotate;
    ctrl.enableTilt = _cameraRestore.enableTilt;
    ctrl.enableLook = _cameraRestore.enableLook;
    _cameraRestore = null;
  }

  function pickGlobe(viewer, windowPosition) {
    const ray = viewer.camera.getPickRay(windowPosition);
    if (!ray) return null;
    return viewer.scene.globe.pick(ray, viewer.scene);
  }

  function clearAllDrawEntities() {
    const v = getV();
    if (_previewEntity && v) {
      v.entities.remove(_previewEntity);
    }
    _previewEntity = null;
    if (_finalizedEntity && v) {
      v.entities.remove(_finalizedEntity);
    }
    _finalizedEntity = null;
  }

  function clampPoint(cartesian) {
    const v = getV();
    if (!v) return cartesian;
    const carto = Cesium.Cartographic.fromCartesian(cartesian);
    const height = v.scene.globe.getHeight(carto);
    if (height != null && height > 0) {
      carto.height = height;
    } else {
      carto.height = 0;
    }
    return Cesium.Ellipsoid.WGS84.cartographicToCartesian(carto);
  }

  // ===== Rectangle =====
  function onRectDown(click) {
    const v = getV();
    if (!v) return;
    disableCamera(v);
    const cart = pickGlobe(v, click.position);
    if (!cart) return;
    _startCartesian = clampPoint(cart);
    _startCartographic = Cesium.Cartographic.fromCartesian(_startCartesian);

    _previewEntity = v.entities.add({
      polygon: {
        hierarchy: new Cesium.CallbackProperty(() => {
          if (!_startCartesian) return new Cesium.PolygonHierarchy([]);
          return new Cesium.PolygonHierarchy([
            _startCartesian,
            _startCartesian,
            _startCartesian,
          ]);
        }, false),
        material: Cesium.Color.fromCssColorString("#4965c9").withAlpha(0.25),
        outline: true,
        outlineColor: Cesium.Color.fromCssColorString("#4965c9"),
        outlineWidth: 2,
        perPositionHeight: false,
        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
      },
    });
  }

  function onRectMove(movement) {
    if (!_startCartesian || !_previewEntity) return;
    const v = getV();
    if (!v) return;
    const curCart = pickGlobe(v, movement.endPosition);
    if (!curCart) return;
    const clampedCur = clampPoint(curCart);
    const curCarto = Cesium.Cartographic.fromCartesian(clampedCur);

    const w = Cesium.Math.toDegrees(_startCartographic.longitude);
    const s = Cesium.Math.toDegrees(curCarto.latitude);
    const e = Cesium.Math.toDegrees(curCarto.longitude);
    const n = Cesium.Math.toDegrees(_startCartographic.latitude);

    const sw = Cesium.Cartesian3.fromDegrees(w, s, curCarto.height || 0);
    const se = Cesium.Cartesian3.fromDegrees(e, s, curCarto.height || 0);
    const ne = Cesium.Cartesian3.fromDegrees(e, n, curCarto.height || 0);
    const nw = Cesium.Cartesian3.fromDegrees(w, n, curCarto.height || 0);

    _previewEntity.polygon.hierarchy = new Cesium.PolygonHierarchy([sw, se, ne, nw]);
    v.scene.requestRender();
  }

  function onRectUp() {
    restoreCamera();
    _handler.removeInputAction(Cesium.ScreenSpaceEventType.MOUSE_MOVE);
    const result = finishRect();
    endDraw(result);
  }

  function finishRect() {
    if (!_startCartographic) return null;
    const v = getV();
    if (!v) return null;

    const poly = _previewEntity?.polygon;
    if (!poly) return null;
    const hierarchy = poly.hierarchy;
    if (!hierarchy || !hierarchy.positions || hierarchy.positions.length < 4) return null;

    const positions = hierarchy.positions;
    const ring = [];
    const cartoArr = [];
    for (const p of positions) {
      const c = Cesium.Cartographic.fromCartesian(p);
      ring.push(Cesium.Math.toDegrees(c.longitude), Cesium.Math.toDegrees(c.latitude));
      cartoArr.push(c);
    }
    ring.push(ring[0], ring[1]);

    const centerLng = Cesium.Math.toDegrees(
      (_startCartographic.longitude + cartoArr[2].longitude) / 2,
    );
    const centerLat = Cesium.Math.toDegrees(
      (_startCartographic.latitude + cartoArr[2].latitude) / 2,
    );

    return { ring, center: { lng: centerLng, lat: centerLat }, type: "rectangle" };
  }

  // ===== Circle =====
  function onCircleDown(click) {
    const v = getV();
    if (!v) return;
    disableCamera(v);
    const cart = pickGlobe(v, click.position);
    if (!cart) return;
    _startCartesian = clampPoint(cart);
    _startCartographic = Cesium.Cartographic.fromCartesian(_startCartesian);

    _previewEntity = v.entities.add({
      polygon: {
        hierarchy: new Cesium.CallbackProperty(() => {
          return new Cesium.PolygonHierarchy([]);
        }, false),
        material: Cesium.Color.fromCssColorString("#4965c9").withAlpha(0.25),
        outline: true,
        outlineColor: Cesium.Color.fromCssColorString("#4965c9"),
        outlineWidth: 2,
        perPositionHeight: false,
        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
      },
    });
  }

  function onCircleMove(movement) {
    if (!_startCartographic || !_previewEntity) return;
    const v = getV();
    if (!v) return;
    const curCart = pickGlobe(v, movement.endPosition);
    if (!curCart) return;
    const clampedCur = clampPoint(curCart);

    const centerLng = Cesium.Math.toDegrees(_startCartographic.longitude);
    const centerLat = Cesium.Math.toDegrees(_startCartographic.latitude);
    const dist = Cesium.Cartesian3.distance(_startCartesian, clampedCur);

    if (dist < 1) return;

    const positions = [];
    for (let i = 0; i < CIRCLE_SEGMENTS; i++) {
      const bearing = (Math.PI * 2 * i) / CIRCLE_SEGMENTS;
      const [lng, lat] = pointAtDistanceAndBearing(centerLng, centerLat, dist, bearing);
      positions.push(Cesium.Cartesian3.fromDegrees(lng, lat, _startCartographic.height || 0));
    }

    _previewEntity.polygon.hierarchy = new Cesium.PolygonHierarchy(positions);
    v.scene.requestRender();
  }

  function onCircleUp() {
    restoreCamera();
    _handler.removeInputAction(Cesium.ScreenSpaceEventType.MOUSE_MOVE);
    const result = finishCircle();
    endDraw(result);
  }

  function finishCircle() {
    if (!_startCartographic) return null;
    const v = getV();
    if (!v) return null;

    const poly = _previewEntity?.polygon;
    if (!poly) return null;
    const hierarchy = poly.hierarchy;
    if (!hierarchy || !hierarchy.positions || hierarchy.positions.length < 3) return null;

    const ring = [];
    for (const p of hierarchy.positions) {
      const c = Cesium.Cartographic.fromCartesian(p);
      ring.push(Cesium.Math.toDegrees(c.longitude), Cesium.Math.toDegrees(c.latitude));
    }
    ring.push(ring[0], ring[1]);

    const centerLng = Cesium.Math.toDegrees(_startCartographic.longitude);
    const centerLat = Cesium.Math.toDegrees(_startCartographic.latitude);

    return { ring, center: { lng: centerLng, lat: centerLat }, type: "circle" };
  }

  // ===== Public API =====
  function startDraw(mode) {
    const v = getV();
    if (!v) return;
    if (isDrawing.value) cancelDraw();

    // 清除上一轮绘制残留的最终结果 entity，便于重绘
    if (_finalizedEntity && v) {
      v.entities.remove(_finalizedEntity);
      _finalizedEntity = null;
    }

    _viewer = v;
    drawMode.value = mode;
    isDrawing.value = true;

    _handler = new Cesium.ScreenSpaceEventHandler(v.scene.canvas);

    if (mode === "rectangle") {
      _handler.setInputAction(onRectDown, Cesium.ScreenSpaceEventType.LEFT_DOWN);
      _handler.setInputAction(onRectMove, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
      _handler.setInputAction(onRectUp, Cesium.ScreenSpaceEventType.LEFT_UP);
    } else if (mode === "circle") {
      _handler.setInputAction(onCircleDown, Cesium.ScreenSpaceEventType.LEFT_DOWN);
      _handler.setInputAction(onCircleMove, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
      _handler.setInputAction(onCircleUp, Cesium.ScreenSpaceEventType.LEFT_UP);
    }
  }

  function endDraw(result) {
    // 拖拽结束：把动态预览 entity“冻结”为静态结果 entity，保留在地图上
    if (_previewEntity && result?.ring && result.ring.length >= 6) {
      const positions = [];
      for (let i = 0; i < result.ring.length - 2; i += 2) {
        positions.push(Cesium.Cartesian3.fromDegrees(result.ring[i], result.ring[i + 1], 0));
      }
      _previewEntity.polygon.hierarchy = new Cesium.PolygonHierarchy(positions);
      _previewEntity.polygon.material = Cesium.Color.fromCssColorString("#4965c9").withAlpha(0.3);
      _previewEntity.polygon.outlineColor = Cesium.Color.fromCssColorString("#67c23a");
      _finalizedEntity = _previewEntity;
      _previewEntity = null;
    } else if (_previewEntity) {
      // 无有效区域时清理残留预览
      const v = getV();
      if (v) v.entities.remove(_previewEntity);
      _previewEntity = null;
    }
    restoreCamera();
    if (_handler) {
      _handler.destroy();
      _handler = null;
    }
    _startCartesian = null;
    _startCartographic = null;
    isDrawing.value = false;
    drawMode.value = null;
    _viewer = null;

    if (_doneCallback && result) {
      _doneCallback(result);
      _doneCallback = null;
    }
  }

  function cancelDraw() {
    clearAllDrawEntities();
    restoreCamera();
    if (_handler) {
      _handler.destroy();
      _handler = null;
    }
    _startCartesian = null;
    _startCartographic = null;
    isDrawing.value = false;
    drawMode.value = null;
    _viewer = null;
    _doneCallback = null;
  }

  function onDone(callback) {
    _doneCallback = callback;
  }

  return {
    isDrawing,
    drawMode,
    startDraw,
    cancelDraw,
    onDone,
  };
}
