/**
 * Cesium 通用配置组合式函数
 * 提供天地图图层配置、默认地图设置等共享逻辑
 */

import * as Cesium from "cesium";
import { TIANDITU_CONFIG, MAP_CONFIG } from "@/config/app-config.js";

// 天地图 Key 列表
const TK_LIST = TIANDITU_CONFIG.keyList.length > 0 
  ? TIANDITU_CONFIG.keyList 
  : ["97f84a3949b68123fc89e54758d5cd08"];

/**
 * 获取随机天地图 Key
 * @returns {string} 天地图 Key
 */
export const getTDT_TK = () => TK_LIST[Math.floor(Math.random() * TK_LIST.length)];

/**
 * 创建天地图图层提供者
 * @param {string} layerCode 图层代码 (img_w, cia_w, vec_w, cva_w)
 * @returns {Cesium.WebMapTileServiceImageryProvider} 图层提供者
 */
export const getTdtLayerProvider = (layerCode) => {
  const provider = new Cesium.WebMapTileServiceImageryProvider({
    url: `http://t${Math.floor(Math.random() * 8)}.tianditu.gov.cn/${layerCode}/wmts?service=wmts&request=GetTile&version=1.0.0&LAYER=${
      layerCode.split("_")[0]
    }&style=default&tileMatrixSet=w&TileMatrix={TileMatrix}&TileRow={TileRow}&TileCol={TileCol}&format=tiles&tk=${getTDT_TK()}`,
    layer: layerCode.split("_")[0],
    style: "default",
    format: "tiles",
    tileMatrixSetID: "w",
    maximumLevel: MAP_CONFIG.maxLevel,
  });
  return provider;
};

/**
 * 获取 Cesium Viewer 默认配置
 * @param {boolean} isMainViewer 是否为主视图
 * @returns {Object} Viewer 配置对象
 */
export const getViewerDefaultOptions = (isMainViewer = true) => {
  const commonOptions = {
    resolutionScale: window.devicePixelRatio || 1,
    sceneMode: Cesium.SceneMode.SCENE3D,
    shouldAnimate: true,
    sceneModePicker: false,
    navigationHelpButton: false,
    geocoder: false,
    homeButton: false,
    baseLayerPicker: false,
    animation: false,
    timeline: false,
    fullscreenButton: false,
  };

  if (isMainViewer) {
    return {
      ...commonOptions,
      contextOptions: {
        webgl: {
          alpha: true,
          depth: true,
          stencil: true,
          antialias: true,
        },
      },
    };
  }

  // 子视图配置
  return {
    ...commonOptions,
    infoBox: false,
    selectionIndicator: false,
    scene3DOnly: true,
    creditContainer: document.createElement("div"),
  };
};

/**
 * 设置 Cesium 地图图层
 * @param {Cesium.Viewer} viewer Cesium Viewer 实例
 * @returns {Object} 图层引用对象
 */
export const setupMapLayers = (viewer) => {
  // 隐藏默认地图
  viewer.imageryLayers.removeAll();

  // 设置背景色
  viewer.scene.globe.baseColor = Cesium.Color.fromCssColorString("#2f3542");

  // 加载天地图影像底图
  const ImgWLayer = getTdtLayerProvider("img_w");
  const satelliteLayer = viewer.imageryLayers.addImageryProvider(ImgWLayer);
  satelliteLayer.maximumTerrainLevel = MAP_CONFIG.maxLevel;

  // 加载天地图影像标注
  const CiaWLayer = getTdtLayerProvider("cia_w");
  const satelMarkLayer = viewer.imageryLayers.addImageryProvider(CiaWLayer);
  satelMarkLayer.maximumTerrainLevel = MAP_CONFIG.maxLevel;

  // 加载天地图矢量底图（默认隐藏）
  const VecWLayer = getTdtLayerProvider("vec_w");
  const vectorLayer = viewer.imageryLayers.addImageryProvider(VecWLayer);
  vectorLayer.maximumTerrainLevel = MAP_CONFIG.maxLevel;
  vectorLayer.show = false;

  // 加载天地图矢量标注（默认隐藏）
  const CvaWLayer = getTdtLayerProvider("cva_w");
  const vectorMarkLayer = viewer.imageryLayers.addImageryProvider(CvaWLayer);
  vectorMarkLayer.maximumTerrainLevel = MAP_CONFIG.maxLevel;
  vectorMarkLayer.show = false;

  return {
    satelliteLayer,
    satelMarkLayer,
    vectorLayer,
    vectorMarkLayer,
  };
};

/**
 * 设置地图相机控制器
 * @param {Cesium.Viewer} viewer Cesium Viewer 实例
 * @param {Object} options 配置选项
 */
export const setupCameraController = (viewer, options = {}) => {
  const {
    enableTranslate = true,
    enableZoom = true,
    enableTilt = true,
    enableRotate = true,
    nearPlane = 0.1,
  } = options;

  viewer.scene.screenSpaceCameraController.enableTranslate = enableTranslate;
  viewer.scene.screenSpaceCameraController.enableZoom = enableZoom;
  viewer.scene.screenSpaceCameraController.enableTilt = enableTilt;
  viewer.scene.screenSpaceCameraController.enableRotate = enableRotate;

  // 设置近裁剪面
  if (nearPlane) {
    viewer.scene.camera.frustum.near = nearPlane;
  }
};

/**
 * 切换地图图层显示
 * @param {Object} layers 图层对象
 * @param {string} mode 地图模式 ('satellite' | 'normal')
 */
export const switchMapLayers = (layers, mode) => {
  const { satelliteLayer, satelMarkLayer, vectorLayer, vectorMarkLayer } = layers;
  
  if (mode === "satellite") {
    satelliteLayer.show = true;
    satelMarkLayer.show = true;
    vectorLayer.show = false;
    vectorMarkLayer.show = false;
  } else {
    satelliteLayer.show = false;
    satelMarkLayer.show = false;
    vectorLayer.show = true;
    vectorMarkLayer.show = true;
  }
};

/**
 * 设置默认相机视角
 * @param {Cesium.Viewer} viewer Cesium Viewer 实例
 * @param {Object} center 中心坐标 {lng, lat}
 * @param {number} height 相机高度
 */
export const setDefaultCameraView = (viewer, center = MAP_CONFIG.defaultCenter, height = 1000) => {
  viewer.camera.setView({
    destination: Cesium.Cartesian3.fromDegrees(center.lng, center.lat, height),
    orientation: {
      heading: Cesium.Math.toRadians(0),
      pitch: Cesium.Math.toRadians(-90),
      roll: 0,
    },
  });
};
