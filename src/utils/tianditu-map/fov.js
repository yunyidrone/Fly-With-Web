import * as Cesium from "cesium";

/**
 * 根据屏幕分辨率计算 H/V FOV
 * @param {number} dFOV 官方对角线 FOV（度）
 * @param {number} width 屏幕/视频宽像素
 * @param {number} height 屏幕/视频高像素
 */
export function calcFovByResolution(dFOV, width = 16, height = 9) {
  const radD = Cesium.Math.toRadians(dFOV);
  const r = Math.sqrt(width * width + height * height);

  const hfov = 2 * Math.atan(Math.tan(radD / 2) * (width / r));
  const vfov = 2 * Math.atan(Math.tan(radD / 2) * (height / r));

  return {
    h: Cesium.Math.toDegrees(hfov),
    v: Cesium.Math.toDegrees(vfov),
  };
}

/**
 * 计算变焦后的 H/V FOV
 * @param {number} baseFov 原始对角线 FOV（度）
 * @param {number} zoomFactor 变焦倍数
 * @param {number} w 屏幕/视频宽像素
 * @param {number} h 屏幕/视频高像素
 */
export function calcZoomFov(baseFov, zoomFactor, w = 16, h = 9) {
  const aspect = w / h;
  const halfDiagBase = Cesium.Math.toRadians(baseFov / 2);
  const tanHalfDiagZoom = Math.tan(halfDiagBase) / zoomFactor;
  const tanHalfV = tanHalfDiagZoom / Math.sqrt(aspect * aspect + 1);
  const tanHalfH = tanHalfV * aspect;
  return {
    hfov: Math.atan(tanHalfH) * 2,
    vfov: Math.atan(tanHalfV) * 2,
  };
}

/**
 * 根据变焦倍数计算当前的 HFOV 和 VFOV
 * @param {number} zoomFactor 当前变焦倍数
 * @param {number} baseDFOV 厂家标称的对角线 FOV
 * @param {number} aspect 宽高比
 */
export function getZoomedFOV(zoomFactor, baseDFOV = 84, aspect = 16 / 9) {
  const halfDiagRad = Cesium.Math.toRadians(baseDFOV / 2);
  const tanHalfDiagZoom = Math.tan(halfDiagRad) / zoomFactor;
  const tanHalfV = tanHalfDiagZoom / Math.sqrt(aspect * aspect + 1);
  const tanHalfH = tanHalfV * aspect;

  return {
    h: Math.atan(tanHalfH) * 2,
    v: Math.atan(tanHalfV) * 2,
  };
}

/**
 * 根据等效焦距计算 HFOV 和 VFOV
 * @param {number} focalLength 等效焦距，单位 mm
 * @param {number} aspect 画面宽高比
 */
export function calcFovByFocalLength(focalLength, aspect = 16 / 9) {
  const sensorWidth = 36.0;
  const hfov = 2 * Math.atan(sensorWidth / (2 * focalLength));
  const vfov = 2 * Math.atan(Math.tan(hfov / 2) / aspect);

  return {
    h: hfov,
    v: vfov,
  };
}
