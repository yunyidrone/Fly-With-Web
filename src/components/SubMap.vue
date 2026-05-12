<!--
 * @Author: ml
 * @Date: 2026-03-14 10:10:38
 * @LastEditTime: 2026-03-14 14:27:40
 * @FilePath: /accompanying-fly-project/src/components/SubMap.vue
 * @Description: 小窗地图
-->
<template>
  <div class="sub-map-container">
    <div id="subCesiumContainer"></div>
    <div class="sub-map-tag">无人机视角</div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import * as Cesium from "cesium";
import { useSystemStore } from "@/stores/index";
import {
  getViewerDefaultOptions,
  setupMapLayers,
  setupCameraController,
  setDefaultCameraView,
} from "@/composables/useCesiumConfig.js";
import { MAP_CONFIG } from "@/config/app-config.js";

const systemStore = useSystemStore();

let subViewer;
let layers;
const SCOPE_RATIO = MAP_CONFIG.scopeRatio;

/**
 * @description: 初始化右下角子窗口
 * @return {*}
 */
const initSubViewer = () => {
  // 使用通用配置创建 Viewer
  const options = getViewerDefaultOptions(false);
  subViewer = new Cesium.Viewer("subCesiumContainer", options);

  // 设置相机参数
  setupCameraController(subViewer, { nearPlane: 0.1 });

  // --- 关闭大气层效果（可选） ---
  subViewer.scene.skyAtmosphere.show = false;
  subViewer.scene.fog.enabled = false;

  // 设置地图图层
  layers = setupMapLayers(subViewer);

  // 设置默认视角
  setDefaultCameraView(subViewer, MAP_CONFIG.defaultCenter, 1000);

  // 延迟添加 HUD
  setTimeout(() => {
    addCameraHUD(subViewer);
  }, 200);

  // 每一帧渲染前执行同步
  subViewer.scene.preRender.addEventListener(() => {
    // droneState 是你存储 MQTT 数据的响应式对象或全局变量
    // syncSubViewer(subViewer, systemStore.droneState);
  });
};

/**
 * 在小窗中添加相机取景框（边角 HUD）
 * @param {Cesium.Viewer} subViewer 小窗实例
 */
const addCameraHUD = (subViewer) => {
  const NEAR_DIST = 40.0;
  const LINE_LEN_RATIO = 0.2; // 边角线长度比例
  const CROSS_LEN_RATIO = 0.15; // 中心十字线长度比例
  const THEME_COLOR = Cesium.Color.fromCssColorString("#ff0000"); // 科技感青色

  // 基础坐标计算函数
  const getExactCorner = (camera, hSign, vSign) => {
    const frustum = camera.frustum;
    if (!frustum || !frustum.fovy) return null;

    const aspect = frustum.aspect || subViewer.canvas.clientWidth / subViewer.canvas.clientHeight || 1.0;
    const fovy = frustum.fovy;

    const halfV = Math.tan(fovy / 2) * NEAR_DIST;
    const halfH = halfV * aspect;

    const scaledH = halfH * SCOPE_RATIO;
    const scaledV = halfV * SCOPE_RATIO;

    const pos = camera.positionWC;
    const direction = camera.directionWC;
    const up = camera.upWC;
    const right = camera.rightWC;

    const center = Cesium.Cartesian3.add(pos, Cesium.Cartesian3.multiplyByScalar(direction, NEAR_DIST, new Cesium.Cartesian3()), new Cesium.Cartesian3());

    const hVec = Cesium.Cartesian3.multiplyByScalar(right, hSign * scaledH, new Cesium.Cartesian3());
    const vVec = Cesium.Cartesian3.multiplyByScalar(up, vSign * scaledV, new Cesium.Cartesian3());

    const corner = Cesium.Cartesian3.add(center, hVec, new Cesium.Cartesian3());
    return Cesium.Cartesian3.add(corner, vVec, new Cesium.Cartesian3());
  };

  // 通用线段绘制函数
  const createPolyline = (positionCallback) => {
    subViewer.entities.add({
      polyline: {
        positions: new Cesium.CallbackProperty(positionCallback, false),
        width: 2,
        material: THEME_COLOR,
        depthFailMaterial: THEME_COLOR,
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
        arcType: Cesium.ArcType.NONE,
      },
    });
  };

  // ---  绘制 4 个 L 形边角 ---

  // 左上角 (TL): 往右(+), 往下(-)
  createPolyline(() => {
    const cam = subViewer.camera;
    const corner = getExactCorner(cam, -1, 1);
    const p1 = getExactCorner(cam, -1 + LINE_LEN_RATIO, 1);
    const p2 = getExactCorner(cam, -1, 1 - LINE_LEN_RATIO);
    return corner && p1 && p2 ? [p1, corner, p2] : [];
  });

  // 右上角 (TR): 往左(-), 往下(-)
  createPolyline(() => {
    const cam = subViewer.camera;
    const corner = getExactCorner(cam, 1, 1);
    const p1 = getExactCorner(cam, 1 - LINE_LEN_RATIO, 1);
    const p2 = getExactCorner(cam, 1, 1 - LINE_LEN_RATIO);
    return corner && p1 && p2 ? [p1, corner, p2] : [];
  });

  // 左下角 (BL): 往右(+), 往上(+)
  createPolyline(() => {
    const cam = subViewer.camera;
    const corner = getExactCorner(cam, -1, -1);
    const p1 = getExactCorner(cam, -1 + LINE_LEN_RATIO, -1);
    const p2 = getExactCorner(cam, -1, -1 + LINE_LEN_RATIO);
    return corner && p1 && p2 ? [p1, corner, p2] : [];
  });

  // 右下角 (BR): 往左(-), 往上(+)
  createPolyline(() => {
    const cam = subViewer.camera;
    const corner = getExactCorner(cam, 1, -1);
    const p1 = getExactCorner(cam, 1 - LINE_LEN_RATIO, -1);
    const p2 = getExactCorner(cam, 1, -1 + LINE_LEN_RATIO);
    return corner && p1 && p2 ? [p1, corner, p2] : [];
  });

  // --- 绘制中心十字准星 ---

  // 水平线
  createPolyline(() => {
    const cam = subViewer.camera;
    const p1 = getExactCorner(cam, -CROSS_LEN_RATIO, 0);
    const p2 = getExactCorner(cam, CROSS_LEN_RATIO, 0);
    return p1 && p2 ? [p1, p2] : [];
  });

  // 垂直线
  createPolyline(() => {
    const cam = subViewer.camera;
    const p1 = getExactCorner(cam, 0, -CROSS_LEN_RATIO);
    const p2 = getExactCorner(cam, 0, CROSS_LEN_RATIO);
    return p1 && p2 ? [p1, p2] : [];
  });
};

/**
 * 根据焦距和宽高比计算 Cesium 相机的 fovy
 * @param {Number} focalLength 等效焦距 (mm)
 * @param {Number} aspect 窗口宽高比 (width/height)
 */
const getFovyFromFocalLength = (focalLength, aspect) => {
  const sensorHeight = 24.0;
  const hfov = 2 * Math.atan(36.0 / (2 * focalLength));
  const vfov = 2 * Math.atan(Math.tan(hfov / 2) / aspect);
  return vfov;
};

/**
 * @description: 同步 Cesium 子地图视图与无人机状态
 * @param {*} subViewer Cesium 子地图实例
 * @param {*} droneState 无人机状态对象
 * @return {*}
 */
const syncSubViewer = (subViewer, droneState) => {
  if (!subViewer || !droneState?.position) return;

  const { position, attitude_head, attitude_pitch, attitude_roll, gimbal_pitch, focal_length } = droneState;

  const hpr = new Cesium.HeadingPitchRoll(
    Cesium.Math.toRadians(attitude_head),
    Cesium.Math.toRadians(attitude_pitch + (gimbal_pitch || -90)),
    Cesium.Math.toRadians(attitude_roll),
  );

  subViewer.camera.setView({
    destination: position,
    orientation: hpr,
  });

  const aspect = subViewer.camera.frustum.aspect;
  const targetFovy = getFovyFromFocalLength(focal_length || 24, aspect);
  subViewer.camera.frustum.fovy = targetFovy;
};

onMounted(() => {
  if (typeof window.T !== "undefined") {
    initSubViewer();
  } else {
    console.error("地图尚未加载完成");
  }
});

onUnmounted(() => {
  if (subViewer) {
    subViewer.destroy();
    subViewer = null;
  }
});
</script>

<style lang="scss" scoped>
.sub-map-container {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background-color: #000;
  .sub-map-tag {
    position: absolute;
    top: 10px;
    left: 0;
    color: #fff;
    font-size: 14px;
    background-color: rgba(0, 0, 0, 0.4);
    padding: 5px;
  }
}
#subCesiumContainer {
  position: relative;
  width: 100%;
  height: calc(100% - 20px);
  margin: 10px 0;
}
</style>
