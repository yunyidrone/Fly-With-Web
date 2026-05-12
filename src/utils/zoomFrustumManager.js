import * as Cesium from "cesium";
// 变焦对比视场
export class ZoomFrustumManager {
  constructor(viewer, droneEntity, baseDFOV = 84) {
    this.viewer = viewer;
    this.drone = droneEntity;
    this.baseDFOV = baseDFOV; // 原始对角线FOV
    this.currentZoom = 1.0; // 当前变焦倍数

    this.baseFrustum = null;
    this.zoomedFrustum = null;

    this._init();
  }

  // 计算特定焦距/变焦倍数下的 H/V FOV
  _getFOV(zoomFactor) {
    const aspect = this.viewer.camera.frustum.aspect || 16 / 9;
    const halfDiagBase = Cesium.Math.toRadians(this.baseDFOV / 2);

    // 计算变焦后的对角线切值
    const tanHalfDiagZoom = Math.tan(halfDiagBase) / zoomFactor;

    // 换算为水平和垂直 FOV (弧度)
    const tanHalfV = tanHalfDiagZoom / Math.sqrt(aspect * aspect + 1);
    const tanHalfH = tanHalfV * aspect;

    return {
      h: Math.atan(tanHalfH) * 2,
      v: Math.atan(tanHalfV) * 2,
    };
  }

  _init() {
    // 绘制基准视场 (灰色/半透明/虚线轮廓)
    this.baseFrustum = this._createFrustumEntity(1.0, Cesium.Color.WHITE.withAlpha(0.1), Cesium.Color.GRAY);

    // 绘制当前变焦视场 (青色/较亮)
    this.zoomedFrustum = this._createFrustumEntity(this.currentZoom, Cesium.Color.CYAN.withAlpha(0.3), Cesium.Color.CYAN);
  }

  _createFrustumEntity(zoom, fillColor, outlineColor) {
    const getCorners = (time) => {
      const pos = this.drone.position.getValue(time);
      const ori = this.drone.orientation.getValue(time);
      if (!pos || !ori) return null;

      const fov = this._getFOV(zoom);
      const matrix = Cesium.Matrix3.fromQuaternion(ori);
      const tanH = Math.tan(fov.h / 2);
      const tanV = Math.tan(fov.v / 2);

      // 视场射线方向
      const directions = [new Cesium.Cartesian3(-tanH, 1, tanV), new Cesium.Cartesian3(tanH, 1, tanV), new Cesium.Cartesian3(tanH, 1, -tanV), new Cesium.Cartesian3(-tanH, 1, -tanV)];

      const corners = directions.map((dir) => {
        const worldDir = Cesium.Matrix3.multiplyByVector(matrix, dir, new Cesium.Cartesian3());
        const ray = new Cesium.Ray(pos, worldDir);
        let intersect = this.viewer.scene.globe.pick(ray, this.viewer.scene);
        return intersect || Cesium.Ray.getPoint(ray, 1000.0);
      });

      return { apex: pos, corners };
    };

    // 绘制 4 个侧面
    for (let i = 0; i < 4; i++) {
      this.viewer.entities.add({
        polygon: {
          hierarchy: new Cesium.CallbackProperty((time) => {
            const res = getCorners(time);
            if (!res || !res.apex || res.corners.length < 4) {
              // 返回一个空的对象，而不是 null，这样实体不会消失，只是暂时不画
              return new Cesium.PolygonHierarchy([]);
            }
            return new Cesium.PolygonHierarchy([res.apex, res.corners[i], res.corners[(i + 1) % 4]]);
          }, false),
          material: fillColor,
          outline: true,
          outlineColor: outlineColor,
          perPositionHeight: true,
        },
      });
    }

    // 为该 zoom 级别添加 4 条侧棱线
    for (let i = 0; i < 4; i++) {
      this.viewer.entities.add({
        polyline: {
          positions: new Cesium.CallbackProperty((time) => {
            const res = getCorners(time);
            if (!res) return [];
            return [res.apex, res.corners[i]];
          }, false),
          width: 1,
          material: outlineColor.withAlpha(0.5),
        },
      });
    }
    // return entity;
  }

  // 动态更新变焦倍数
  updateZoom(factor) {
    this.currentZoom = factor;
    // 重新触发 CallbackProperty 更新
  }
}
