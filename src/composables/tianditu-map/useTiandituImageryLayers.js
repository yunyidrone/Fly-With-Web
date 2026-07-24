import * as Cesium from "cesium";

const MAP_TINT_RGB = { r: 0x29, g: 0x2e, b: 0x38 };

/**
 * 天地图影像/矢量图层管理。
 *
 * 这里只负责 Cesium ImageryLayer 层面的基础地图能力：
 * - 创建天地图 WMTS provider，并沿用原来的瓦片染色和标注层压暗策略；
 * - 缓存卫星底图、卫星标注、矢量底图、矢量标注四个基础图层；
 * - 处理“卫星/矢量”模式切换和路网标注显隐。
 *
 * 不负责 Viewer 创建时序、不创建业务实体，也不参与伴飞、点击、MQTT 或 store 同步。
 */
export function useTiandituImageryLayers(options = {}) {
  const {
    getViewer,
    keyList = [],
    maxLevel,
    getCurrentMode,
    setCurrentMode,
    getRoadNetVisible,
  } = options;

  let satelliteLayer = null;
  let satelliteMarkLayer = null;
  let vectorLayer = null;
  let vectorMarkLayer = null;

  const getTdtKey = () =>
    keyList[Math.floor(Math.random() * keyList.length)] || "";

  /**
   * 标注层（cia / cva）：略压暗，减轻过亮刺眼。
   */
  function applyLabelImageryTone(layer) {
    if (!layer) return;
    layer.alpha = 0.9;
    layer.brightness = 0.6;
    layer.saturation = 0.85;
    layer.contrast = 0.94;
    layer.gamma = 1.0;
    layer.hue = 0.0;
  }

  function applyDarkMapTone(layer, layerCode) {
    if (!layer) return;

    const isBaseLayer = layerCode === "img_w" || layerCode === "vec_w";
    const isLabelLayer = layerCode === "cia_w" || layerCode === "cva_w";
    if (isBaseLayer) {
      // 底图颜色走瓦片内 mapTint（原 blueTint 路径）；此处不再叠加重滤镜，以免发灰发紫。
      layer.alpha = 1.0;
      layer.brightness = 1.0;
      layer.contrast = 1.0;
      layer.saturation = 1.0;
      layer.gamma = 1.0;
      layer.hue = 0.0;
    }
    if (isLabelLayer) {
      applyLabelImageryTone(layer);
    }
  }

  function getTdtLayerProvider(layerCode, providerOptions = {}) {
    const provider = new Cesium.WebMapTileServiceImageryProvider({
      url: `http://t${Math.floor(Math.random() * 8)}.tianditu.gov.cn/${layerCode}/wmts?service=wmts&request=GetTile&version=1.0.0&LAYER=${
        layerCode.split("_")[0]
      }&style=default&tileMatrixSet=w&TileMatrix={TileMatrix}&TileRow={TileRow}&TileCol={TileCol}&format=tiles&tk=${getTdtKey()}`,
      layer: layerCode.split("_")[0],
      style: "default",
      format: "tiles",
      tileMatrixSetID: "w",
      maximumLevel: maxLevel,
    });

    if (providerOptions.blueTint) {
      const bright = providerOptions.bright ?? 1.0;
      const { r: tintR, g: tintG, b: tintB } = MAP_TINT_RGB;
      const tintAnchor = Math.max(tintR, tintG, tintB) || 1;
      /** 与原实现同量级亮度系数，色相由 RGB 比例决定。 */
      const bGain = 0.55 * bright;
      const rGain = bGain * (tintR / tintAnchor);
      const gGain = bGain * (tintG / tintAnchor);

      const origRequestImage = provider.requestImage.bind(provider);
      provider.requestImage = (x, y, level, request) => {
        if (request && request.cancelled) return undefined;

        const promise = origRequestImage(x, y, level, request);
        if (!promise) return promise;

        return promise
          .then((image) => {
            if (!image) return image;

            try {
              const w = image.width || 0;
              const h = image.height || 0;
              if (w === 0 || h === 0) return image;

              const canvas = document.createElement("canvas");
              canvas.width = w;
              canvas.height = h;
              const ctx = canvas.getContext("2d", { willReadFrequently: true });
              ctx.translate(0, h);
              ctx.scale(1, -1);
              ctx.drawImage(image, 0, 0);
              ctx.setTransform(1, 0, 0, 1, 0, 0);

              const imgData = ctx.getImageData(0, 0, w, h);
              const px = imgData.data;
              const len = px.length;
              for (let i = 0; i < len; i += 4) {
                const gray =
                  px[i] * 0.299 + px[i + 1] * 0.587 + px[i + 2] * 0.114;
                px[i] = gray * rGain;
                px[i + 1] = gray * gGain;
                px[i + 2] = gray * bGain;
              }
              ctx.putImageData(imgData, 0, 0);
              return canvas;
            } catch (e) {
              console.warn(
                "mapTint tile processing failed, fallback to original:",
                e,
              );
              return image;
            }
          })
          .catch((err) => {
            console.warn("mapTint tile request failed:", err);
            return undefined;
          });
      };
    }

    return provider;
  }

  function createMainImageryLayer(layerCode, layerOptions = {}, show = true) {
    const viewer = getViewer?.();
    if (!viewer) return null;

    const layer = viewer.imageryLayers.addImageryProvider(
      getTdtLayerProvider(layerCode, layerOptions),
    );
    layer.maximumTerrainLevel = maxLevel;
    layer.show = show;
    applyDarkMapTone(layer, layerCode);
    return layer;
  }

  function ensureSatelliteLayer() {
    if (!satelliteLayer) {
      satelliteLayer = createMainImageryLayer("img_w", { blueTint: true });
    }
    return satelliteLayer;
  }

  function ensureSatelliteMarkLayer() {
    if (!satelliteMarkLayer) {
      satelliteMarkLayer = createMainImageryLayer(
        "cia_w",
        {},
        Boolean(getRoadNetVisible?.()) && getCurrentMode?.() === "satellite",
      );
    }
    return satelliteMarkLayer;
  }

  function ensureVectorLayer() {
    if (!vectorLayer) {
      vectorLayer = createMainImageryLayer(
        "vec_w",
        { blueTint: true },
        getCurrentMode?.() === "normal",
      );
    }
    return vectorLayer;
  }

  function ensureVectorMarkLayer() {
    if (!vectorMarkLayer) {
      vectorMarkLayer = createMainImageryLayer(
        "cva_w",
        { blueTint: false, bright: 1.7 },
        Boolean(getRoadNetVisible?.()) && getCurrentMode?.() === "normal",
      );
    }
    return vectorMarkLayer;
  }

  function handleMapRoadNetVisible(visible) {
    if (visible) {
      if (getCurrentMode?.() === "satellite") {
        ensureSatelliteMarkLayer();
        satelliteMarkLayer.show = true;
      } else {
        ensureVectorMarkLayer();
        vectorMarkLayer.show = true;
      }
      return;
    }

    if (getCurrentMode?.() === "satellite") {
      if (satelliteMarkLayer) satelliteMarkLayer.show = false;
    } else if (vectorMarkLayer) {
      vectorMarkLayer.show = false;
    }
  }

  function switchMapMode(mode) {
    if (mode === "satellite") {
      if (satelliteLayer) satelliteLayer.show = true;
      if (getRoadNetVisible?.()) ensureSatelliteMarkLayer();
      if (satelliteMarkLayer) {
        satelliteMarkLayer.show = Boolean(getRoadNetVisible?.());
      }
      if (vectorLayer) vectorLayer.show = false;
      if (vectorMarkLayer) vectorMarkLayer.show = false;
      setCurrentMode?.("satellite");
      return;
    }

    ensureVectorLayer();
    if (getRoadNetVisible?.()) ensureVectorMarkLayer();
    if (satelliteLayer) satelliteLayer.show = false;
    if (satelliteMarkLayer) satelliteMarkLayer.show = false;
    if (vectorLayer) vectorLayer.show = true;
    if (vectorMarkLayer) {
      vectorMarkLayer.show = Boolean(getRoadNetVisible?.());
    }
    setCurrentMode?.("normal");
  }

  return {
    ensureSatelliteLayer,
    ensureSatelliteMarkLayer,
    ensureVectorLayer,
    ensureVectorMarkLayer,
    handleMapRoadNetVisible,
    switchMapMode,
  };
}
