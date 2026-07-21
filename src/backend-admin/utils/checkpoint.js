/**
 * 将后端卡点记录转为 Admin 列表使用的结构
 * @param {Record<string, any>} raw
 */
export function normalizeCheckpointRecord(raw) {
  if (!raw || typeof raw !== "object") return raw;

  const longitude = raw.longitude ?? raw.lng;
  const latitude = raw.latitude ?? raw.lat;
  const altitude = raw.altitude ?? raw.alt;
  const coordParts = [longitude, latitude].filter((value) => value != null && value !== "");
  if (altitude != null && altitude !== "") {
    coordParts.push(altitude);
  }

  return {
    ...raw,
    id: raw.id != null ? raw.id : "",
    name: String(raw.name ?? "").trim() || "未命名卡点",
    coord: coordParts.join(", "),
    longitude,
    latitude,
    description: raw.description ?? "",
  };
}

export function normalizeCheckpointList(payload) {
  if (!Array.isArray(payload)) return [];
  return payload.map(normalizeCheckpointRecord);
}
