/*
 * @Author: ml
 * @Date: 2026-02-06 11:14:56
 * @LastEditTime: 2026-02-07 10:03:14
 * @FilePath: /accompanying-fly-project/src/utils/cameraFrustum.js
 * @Description: 动态视椎体类(从无人机视角出发，方向是根据无人机前进方向计算的)
 */
import * as Cesium from "cesium";

/**
 * 动态视椎体类
 */
export class CameraFrustum {
  constructor(viewer, droneEntity, fovH = 60, fovV = 40) {
    this.viewer = viewer;
    this.drone = droneEntity;
    this.fovH = Cesium.Math.toRadians(fovH); // 水平视场角
    this.fovV = Cesium.Math.toRadians(fovV); // 垂直视场角
    this.sides = []; // 存储四个侧面的 Entity

    this._init();
  }

  _init() {
    // 每一个侧面是一个三角形（由 顶点 + 地面点A + 地面点B 组成）
    for (let i = 0; i < 4; i++) {
      const side = this.viewer.entities.add({
        // 可用性设为无限，确保在任何时间都可见
        availability: new Cesium.TimeIntervalCollection([
          new Cesium.TimeInterval({
            start: Cesium.JulianDate.fromIso8601("1970-01-01T00:00:00Z"),
            stop: Cesium.JulianDate.fromIso8601("9999-12-31T23:59:59Z"),
          }),
        ]),
        polygon: {
          hierarchy: new Cesium.CallbackProperty(() => this._updateSideHierarchy(i), false),
          material: Cesium.Color.CYAN.withAlpha(0.3),
          perPositionHeight: true, // 必须开启，支持 3D 坐标
          outline: true,
          outlineColor: Cesium.Color.WHITE.withAlpha(0.5),
        },
      });
      this.sides.push(side);
    }
  }

  _updateSideHierarchy(index) {
    const time = this.viewer.clock.currentTime;
    // 获取位置和方向
    const position = this.drone.position.getValue(time);
    const orientation = this.drone.orientation.getValue(time);

    // 如果此时拿不到无人机数据，返回一个空的层次结构，而不是 null
    if (!Cesium.defined(position) || !Cesium.defined(orientation)) {
      return new Cesium.PolygonHierarchy([]);
    }

    // 获取地面四个交点
    const groundPoints = this._getGroundPoints(position, orientation);

    // 如果没算出来交点（比如无人机还在初始化），也返回空
    if (!groundPoints || groundPoints.length < 4) {
      return new Cesium.PolygonHierarchy([]);
    }

    // 构造三角形：顶点 -> 地面点 i -> 地面点 i+1
    const p1 = groundPoints[index];
    const p2 = groundPoints[(index + 1) % 4];

    return new Cesium.PolygonHierarchy([position, p1, p2]);
  }

  _getGroundPoints(apex, orientation) {
    const corners = [];
    // 射线方向的本地坐标（假设 X 为前进方向，Z 为高度方向）
    const halfH = Math.tan(this.fovH / 2);
    const halfV = Math.tan(this.fovV / 2);

    // 定义四个角的方向向量 (在本地坐标系下)
    const localDirs = [
      new Cesium.Cartesian3(1, -halfH, halfV), // 左上
      new Cesium.Cartesian3(1, halfH, halfV), // 右上
      new Cesium.Cartesian3(1, halfH, -halfV), // 右下
      new Cesium.Cartesian3(1, -halfH, -halfV), // 左下
    ];

    const matrix = Cesium.Matrix3.fromQuaternion(orientation);

    for (const dir of localDirs) {
      // 将本地向量转为世界坐标方向
      const worldDir = Cesium.Matrix3.multiplyByVector(matrix, dir, new Cesium.Cartesian3());
      Cesium.Cartesian3.normalize(worldDir, worldDir);

      // 发射射线求交点
      const ray = new Cesium.Ray(apex, worldDir);
      let intersection = this.viewer.scene.globe.pick(ray, this.viewer.scene);

      // 如果没有射到地面（比如看向天空），则取固定距离的一个点
      if (!intersection) {
        intersection = Cesium.Ray.getPoint(ray, 500);
      }
      corners.push(intersection);
    }
    return corners;
  }
}
