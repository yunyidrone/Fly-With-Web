/*
 * @Author: ml
 * @Date: 2026-02-06 13:47:33
 * @LastEditTime: 2026-03-11 17:25:05
 * @FilePath: /accompanying-fly-project/src/utils/companionFrustum.js
 * @Description:  companion frustum class(从 companion 视角出发，方向是根据 companion 前进方向计算的)
 */
import * as Cesium from "cesium";

export class CompanionFrustum {
  constructor(viewer, droneEntity, carEntity) {
    this.viewer = viewer;
    this.drone = droneEntity;
    this.car = carEntity;

    // 配置尺寸
    this.droneBox = { l: 4.0, w: 4.0 }; // 无人机端矩形大小
    this.carBox = { l: 15.0, w: 10.0 }; // 汽车端矩形大小

    this.sides = [];
    this._init();
  }

  _init() {
    // 创建 4 个侧面（前、后、左、右）
    for (let i = 0; i < 4; i++) {
      const side = this.viewer.entities.add({
        polygon: {
          hierarchy: new Cesium.CallbackProperty(() => this._updateSideHierarchy(i), false),
          material: Cesium.Color.CYAN.withAlpha(0.3),
          perPositionHeight: true,
          outline: true,
          outlineColor: Cesium.Color.WHITE.withAlpha(0.5),
        },
      });
      this.sides.push(side);
    }

    // 增加底部矩形面 (封底)
    this.viewer.entities.add({
      polygon: {
        hierarchy: new Cesium.CallbackProperty(() => {
          const corners = this._getFourCorners(this.car, this.carBox);
          return corners ? new Cesium.PolygonHierarchy(corners) : null;
        }, false),
        material: Cesium.Color.CYAN.withAlpha(0.4), // 底部深一些，更显眼
        perPositionHeight: true,
      },
    });

    // 增加顶部矩形面 (封顶 - 可选)
    this.viewer.entities.add({
      polygon: {
        hierarchy: new Cesium.CallbackProperty(() => {
          const corners = this._getFourCorners(this.drone, this.droneBox);
          return corners ? new Cesium.PolygonHierarchy(corners) : null;
        }, false),
        material: Cesium.Color.CYAN.withAlpha(0.5),
        perPositionHeight: true,
      },
    });
  }

  // 计算一个物体（车或无人机）的四个角点坐标
  _getFourCorners(entity, box, referenceOri) {
    const time = this.viewer.clock.currentTime;
    const pos = entity.position.getValue(time);
    // const ori = entity.orientation.getValue(time);

    // 不再使用 entity 自身的 orientation，而是传入统一的朝向
    const ori = referenceOri;

    if (!pos || !ori) return null;

    // 获取旋转矩阵
    const matrix = Cesium.Matrix3.fromQuaternion(ori);

    // 定义本地四个角点 (假设 X 为车头方向)
    const localPoints = [
      new Cesium.Cartesian3(box.l / 2, -box.w / 2, 0), // 右前
      new Cesium.Cartesian3(box.l / 2, box.w / 2, 0), // 左前
      new Cesium.Cartesian3(-box.l / 2, box.w / 2, 0), // 左后
      new Cesium.Cartesian3(-box.l / 2, -box.w / 2, 0), // 右后
    ];

    // 转换到世界坐标
    return localPoints.map((lp) => {
      // 计算出基于旋转的世界坐标偏移
      const worldOffset = Cesium.Matrix3.multiplyByVector(matrix, lp, new Cesium.Cartesian3());
      const finalPos = Cesium.Cartesian3.add(pos, worldOffset, new Cesium.Cartesian3());
      // 判断当前是否在为汽车计算底部角点
      if (box === this.carBox) {
        // 将 Cartesian3 转为 经纬度/高度 结构
        const cartographic = Cesium.Cartographic.fromCartesian(finalPos);

        // 强行设置高度为 0（即贴在椭球体表面）
        // 如果你开启了 3D 地形，可以设置为一个小数值如 0.5 避免闪烁
        cartographic.height = 0.0;

        // 再转回世界坐标 Cartesian3
        return Cesium.Cartographic.toCartesian(cartographic);
      }

      // 如果是无人机端，直接返回计算出的位置
      return finalPos;
      // return Cesium.Cartesian3.add(pos, worldOffset, new Cesium.Cartesian3());
    });
  }

  _updateSideHierarchy(index) {
    const time = this.viewer.clock.currentTime;
    // 获取无人机的朝向作为“标准朝向”
    const droneOri = this.drone.orientation.getValue(time);
    if (!droneOri) return new Cesium.PolygonHierarchy([]);

    const droneCorners = this._getFourCorners(this.drone, this.droneBox, droneOri);
    const carCorners = this._getFourCorners(this.car, this.carBox, droneOri);

    if (!droneCorners || !carCorners) return new Cesium.PolygonHierarchy([]);

    // 构造侧面的四个顶点 (梯形的四个角)
    // 侧面连接逻辑：无人机点i -> 无人机点i+1 -> 汽车点i+1 -> 汽车点i
    const nextIdx = (index + 1) % 4;
    return new Cesium.PolygonHierarchy([droneCorners[index], droneCorners[nextIdx], carCorners[nextIdx], carCorners[index]]);
  }
}
