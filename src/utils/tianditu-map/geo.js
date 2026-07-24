import * as Cesium from "cesium";

export function toFiniteNumber(v) {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() !== "") {
    const n = Number(v);
    if (Number.isFinite(n)) return n;
  }
  return null;
}

export function horizontalDistanceMeters(lng1, lat1, lng2, lat2) {
  const c1 = Cesium.Cartesian3.fromDegrees(lng1, lat1, 0);
  const c2 = Cesium.Cartesian3.fromDegrees(lng2, lat2, 0);
  return Cesium.Cartesian3.distance(c1, c2);
}
