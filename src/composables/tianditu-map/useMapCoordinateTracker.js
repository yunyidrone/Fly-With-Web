import { reactive } from "vue";
import * as Cesium from "cesium";

/**
 * 鼠标坐标追踪。
 *
 * 负责在鼠标移动时，把屏幕位置转换成地图经纬度和高度。
 * 这里只维护坐标状态和 Cesium ScreenSpaceEventHandler 生命周期，
 * 不参与实体选择、地图点击或业务逻辑。
 */
export function useMapCoordinateTracker() {
  const coords = reactive({
    lng: null,
    lat: null,
    alt: null,
  });

  let handler = null;

  const cleanupCoordinateTracker = () => {
    if (handler) {
      handler.destroy();
      handler = null;
    }
  };

  const initCoordinateTracker = (viewer) => {
    cleanupCoordinateTracker();
    handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);

    handler.setInputAction((movement) => {
      const windowPosition = movement.endPosition;
      let cartesian;
      if (viewer.scene.mode === Cesium.SceneMode.SCENE3D) {
        const ray = viewer.camera.getPickRay(windowPosition);
        cartesian = viewer.scene.globe.pick(ray, viewer.scene);
      } else {
        cartesian = viewer.camera.pickEllipsoid(windowPosition);
      }

      if (!Cesium.defined(cartesian)) return;
      const cartographic = Cesium.Cartographic.fromCartesian(cartesian);
      coords.lng = Cesium.Math.toDegrees(cartographic.longitude).toFixed(6);
      coords.lat = Cesium.Math.toDegrees(cartographic.latitude).toFixed(6);
      coords.alt = cartographic.height.toFixed(1);
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
  };

  return {
    coords,
    initCoordinateTracker,
    cleanupCoordinateTracker,
  };
}
