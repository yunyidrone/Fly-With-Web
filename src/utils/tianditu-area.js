import { MAP_CONFIG } from "@/config/app-config.js";

/** @typedef {{ lng: number, lat: number }} LngLatPoint */
/** @typedef {{ type: 'rectangle'|'circle'|'polygon', ring: number[], points?: LngLatPoint[], center?: LngLatPoint, radius?: number }} AreaData */

export function pointAtDistanceAndBearing(lng, lat, dist, bearing) {
  const R = 6378137;
  const dLat = (dist * Math.cos(bearing)) / R;
  const dLng = (dist * Math.sin(bearing)) / (R * Math.cos((lat * Math.PI) / 180));
  return [lng + (dLng * 180) / Math.PI, lat + (dLat * 180) / Math.PI];
}

export function haversineDistance(lng1, lat1, lng2, lat2) {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180)
    * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function circleToRing(lng, lat, radiusMeters, segments = 64) {
  const ring = [];
  for (let i = 0; i < segments; i++) {
    const bearing = (Math.PI * 2 * i) / segments;
    const [dlng, dlat] = pointAtDistanceAndBearing(lng, lat, radiusMeters, bearing);
    ring.push(dlng, dlat);
  }
  ring.push(ring[0], ring[1]);
  return ring;
}

export function ringToLngLats(ring, T) {
  const result = [];
  for (let i = 0; i < ring.length - 2; i += 2) {
    result.push(new T.LngLat(ring[i], ring[i + 1]));
  }
  return result;
}

export function isValidRing(ring) {
  return Array.isArray(ring) && ring.length >= 6;
}

export function getCenterFromRing(ring) {
  if (!isValidRing(ring)) {
    return { ...MAP_CONFIG.defaultCenter };
  }
  let lngSum = 0;
  let latSum = 0;
  let count = 0;
  for (let i = 0; i < ring.length - 2; i += 2) {
    lngSum += ring[i];
    latSum += ring[i + 1];
    count += 1;
  }
  if (!count) return { ...MAP_CONFIG.defaultCenter };
  return { lng: lngSum / count, lat: latSum / count };
}

export function getMapCenter(area, fallbackCenter = MAP_CONFIG.defaultCenter) {
  if (area?.center?.lng != null && area?.center?.lat != null) {
    return { lng: area.center.lng, lat: area.center.lat };
  }
  if (isValidRing(area?.ring)) {
    return getCenterFromRing(area.ring);
  }
  return { ...fallbackCenter };
}

function tryParseRingList(raw) {
  let value = raw?.polygonLngLatList
    ?? raw?.polygonList
    ?? raw?.polygons
    ?? raw?.fence
    ?? raw?.geoFence
    ?? raw?.ring
    ?? raw?.jurisdictionRing
    ?? raw?.roiRing;

  if (typeof value === "string") {
    try {
      value = JSON.parse(value);
    } catch {
      return [];
    }
  }

  if (!Array.isArray(value)) return [];

  if (value.length && typeof value[0] === "number") {
    const ring = [];
    for (let i = 0; i < value.length; i += 2) {
      if (typeof value[i] === "number" && typeof value[i + 1] === "number") {
        ring.push(value[i], value[i + 1]);
      }
    }
    return isValidRing(ring) ? [ring] : [];
  }

  const rings = [];
  for (const item of value) {
    if (!item) continue;
    if (Array.isArray(item)) {
      const flat = [];
      if (typeof item[0] === "number") {
        flat.push(...item);
      } else if (typeof item[0] === "object") {
        for (const pt of item) {
          const lng = Number(pt?.lng ?? pt?.longitude);
          const lat = Number(pt?.lat ?? pt?.latitude);
          if (Number.isFinite(lng) && Number.isFinite(lat)) flat.push(lng, lat);
        }
      }
      if (isValidRing(flat)) rings.push(flat);
    }
  }
  return rings;
}

/**
 * 将接口/表单原始数据规范化为 AreaData
 * @param {Record<string, any> | AreaData | null | undefined} raw
 * @returns {AreaData | null}
 */
export function normalizeAreaData(raw) {
  if (!raw) return null;

  if (raw.type && isValidRing(raw.ring)) {
    return {
      type: raw.type,
      ring: [...raw.ring],
      points: raw.points?.map((p) => ({ lng: p.lng, lat: p.lat })),
      center: raw.center ? { lng: raw.center.lng, lat: raw.center.lat } : getCenterFromRing(raw.ring),
      radius: raw.radius,
    };
  }

  const nested = raw.jurisdictionArea ?? raw.roiArea ?? raw.areaData ?? raw.area;
  if (nested && nested !== raw) {
    return normalizeAreaData(nested);
  }

  const rings = tryParseRingList(raw);
  if (!rings.length) return null;

  return {
    type: "polygon",
    ring: rings[0],
    center: getCenterFromRing(rings[0]),
  };
}

export function serializeAreaData(area) {
  const normalized = normalizeAreaData(area);
  if (!normalized) return null;
  return {
    type: normalized.type,
    ring: normalized.ring,
    points: normalized.points,
    center: normalized.center,
    radius: normalized.radius,
  };
}
