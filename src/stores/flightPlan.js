import { defineStore } from "pinia";
import { reactive, ref } from "vue";
import { AccompanyingFlyService } from "@/api";
import {
  resolvePolygonRingByPath,
  resolveLocationLabelByPath,
  resolveLocationLabelsFromPaths,
  normalizePlanLocationPaths,
  migrateLegacyLocationPath,
} from "@/config/flight-plan-locations.js";

let idSeq = 200;

/**
 * API type → 前端场景 key（1山林救援 2水上观察 3重点安保）
 * @param {number} typeNum
 */
function apiTypeToScenarioKey(typeNum) {
  if (typeNum === 2) return "water";
  if (typeNum === 3) return "security";
  return "mountain";
}

/** @returns {number[][]} 每环 [lng,lat,lng,lat,...] */
function tryParsePolygonFromRaw(raw) {
  let v =
    raw?.polygonLngLatList ??
    raw?.polygonList ??
    raw?.polygons ??
    raw?.fence ??
    raw?.geoFence;
  if (typeof v === "string") {
    try {
      v = JSON.parse(v);
    } catch {
      return [];
    }
  }
  if (!Array.isArray(v)) return [];
  const rings = [];
  // 扁平单环 [lng,lat,...]
  if (v.length && typeof v[0] === "number") {
    const ring = [];
    for (let i = 0; i < v.length; i += 2) {
      if (typeof v[i] === "number" && typeof v[i + 1] === "number") {
        ring.push(v[i], v[i + 1]);
      }
    }
    if (ring.length >= 6) rings.push(ring);
    return rings;
  }
  for (const item of v) {
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
      if (flat.length >= 6) rings.push(flat);
    }
  }
  return rings;
}

function toHm(t) {
  if (t == null || t === "") return "";
  const s = String(t);
  return s.length >= 5 ? s.slice(0, 5) : s;
}

/**
 * 后端计划行 → 列表/地图用 FlightPlanItem
 * @param {Record<string, any>} raw
 */
export function normalizeFlightPlanRecord(raw) {
  const id =
    raw?.id != null && raw.id !== ""
      ? String(raw.id)
      : raw?.planId != null && raw.planId !== ""
        ? String(raw.planId)
        : `plan-api-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

  const typeNum = Number(raw?.type ?? raw?.planType ?? raw?.sceneType ?? 1);
  const scenarioKey = apiTypeToScenarioKey(typeNum);

  const name = String(raw?.name ?? raw?.planName ?? raw?.title ?? "").trim();
  const subject =
    String(raw?.subject ?? raw?.theme ?? name).trim() || name || "飞行计划";
  const detailRemark = String(
    raw?.detailRemark ?? raw?.remark ?? raw?.description ?? "",
  ).trim();

  const flightDate = raw?.flightDate ?? raw?.startDate ?? raw?.beginDate ?? "";
  const flightDateEnd =
    raw?.flightDateEnd ??
    raw?.endDate ??
    raw?.finishDate ??
    flightDate ??
    "";

  const timeStart = toHm(raw?.timeStart ?? raw?.startTime ?? raw?.beginTime ?? "");
  const timeEnd = toHm(raw?.timeEnd ?? raw?.endTime ?? raw?.finishTime ?? "");

  const resourceDroneCount =
    Number(raw?.resourceDroneCount ?? raw?.droneCount ?? 0) || 0;
  const resourceDogCount =
    Number(raw?.resourceDogCount ?? raw?.dogCount ?? 0) || 0;
  const resourceBoatCount =
    Number(raw?.resourceBoatCount ?? raw?.boatCount ?? 0) || 0;

  const statusText = String(raw?.statusText ?? raw?.status ?? "预备执行");
  const status = Number(raw?.status);

  const locationLabelRaw = String(
    raw?.locationLabel ?? raw?.location ?? raw?.areaName ?? "",
  ).trim();

  let locationPaths =
    Array.isArray(raw?.locationPaths) &&
    raw.locationPaths.length &&
    typeof raw.locationPaths[0]?.[0] === "string"
      ? raw.locationPaths.map((p) => [...p])
      : [];

  if (!locationPaths.length) {
    const single =
      Array.isArray(raw?.locationPath) &&
      raw.locationPath.length &&
      raw.locationPath.every((x) => typeof x === "string")
        ? [...raw.locationPath]
        : Array.isArray(raw?.areaPath) &&
            raw.areaPath.length &&
            raw.areaPath.every((x) => typeof x === "string")
          ? [...raw.areaPath]
          : null;
    if (single?.length) locationPaths = [single];
  }

  let polygonLngLatList = tryParsePolygonFromRaw(raw);
  let polygonLngLat = [...(polygonLngLatList[0] || [])];

  const primaryPath = locationPaths[0] || [];

  if (!polygonLngLat.length && primaryPath.length) {
    const ring = resolvePolygonRingByPath(primaryPath);
    if (ring?.length) {
      polygonLngLat = [...ring];
      polygonLngLatList = [[...ring]];
    }
  }

  let locationLabel = locationLabelRaw || "—";
  if (locationPaths.length) {
    locationLabel =
      resolveLocationLabelsFromPaths(locationPaths) || locationLabel;
  }

  const droneLabel =
    raw?.droneLabel != null && raw.droneLabel !== ""
      ? String(raw.droneLabel)
      : resourceDroneCount > 0
        ? `无人机 ×${resourceDroneCount}`
        : "无人机";

  return {
    id,
    scenarioKey,
    flightDate: flightDate ? String(flightDate).slice(0, 10) : "",
    flightDateEnd: flightDateEnd ? String(flightDateEnd).slice(0, 10) : "",
    timeStart,
    timeEnd,
    droneLabel,
    status: Number.isFinite(status) ? status : undefined,
    statusText,
    locationPaths: locationPaths.length ? locationPaths : [],
    locationPath: [...primaryPath],
    locationLabel,
    polygonLngLat: [...polygonLngLat],
    polygonLngLatList: polygonLngLatList.length
      ? polygonLngLatList.map((r) => [...r])
      : [],
    subject,
    detailRemark,
    resourceDroneCount,
    resourceDogCount,
    resourceBoatCount,
    raw,
  };
}

/**
 * @typedef {Object} FlightPlanItem
 * @property {string} id
 * @property {string} scenarioKey
 * @property {string} flightDate YYYY-MM-DD 实行开始日期
 * @property {string} [flightDateEnd] YYYY-MM-DD 实行结束日期
 * @property {string} timeStart HH:mm
 * @property {string} timeEnd HH:mm
 * @property {string} droneLabel
 * @property {string} statusText
 * @property {string[]} locationPath 首个地点（兼容）
 * @property {string[][]} [locationPaths] 多选地点路径
 * @property {string} locationLabel
 * @property {number[]} polygonLngLat 首个围栏（兼容）
 * @property {number[][]} [polygonLngLatList] 多区域围栏
 * @property {string} [subject] 主题 / 救援主题
 * @property {string} [detailRemark] 详情备注
 * @property {number} [resourceDroneCount]
 * @property {number} [resourceDogCount]
 * @property {number} [resourceBoatCount]
 */

export const useFlightPlanStore = defineStore("flightPlan", () => {
  /** @type {Record<string, FlightPlanItem[]>} */
  const plansByScenario = reactive({
    mountain: [],
    water: [],
    security: [],
  });

  const plansLoadedFromApi = ref(false);
  const plansFetchError = ref(null);
  const planListTotal = ref(0);

  const selectedPlanId = ref(null);

  function getPlanById(id) {
    if (!id) return null;
    for (const key of Object.keys(plansByScenario)) {
      const found = plansByScenario[key].find((p) => p.id === id);
      if (found) return found;
    }
    return null;
  }

  /**
   * @param {Omit<FlightPlanItem, 'id'|'statusText'|'locationLabel'> & { locationLabel?: string }} payload
   */
  function addPlan(payload) {
    const id = `plan-${++idSeq}`;
    const locationPaths =
      payload.locationPaths?.length > 0
        ? payload.locationPaths.map((p) => migrateLegacyLocationPath([...p]))
        : payload.locationPath?.length
          ? [migrateLegacyLocationPath([...payload.locationPath])]
          : [];
    const primaryPath = locationPaths[0] || [];
    const polygonLngLatList =
      payload.polygonLngLatList?.length > 0
        ? payload.polygonLngLatList.map((r) => [...r])
        : payload.polygonLngLat?.length
          ? [[...payload.polygonLngLat]]
          : [];
    const locationLabel =
      payload.locationLabel ||
      resolveLocationLabelsFromPaths(locationPaths) ||
      resolveLocationLabelByPath(primaryPath) ||
      "—";
    const item = {
      id,
      scenarioKey: payload.scenarioKey,
      flightDate: payload.flightDate,
      flightDateEnd: payload.flightDateEnd || payload.flightDate,
      timeStart: payload.timeStart,
      timeEnd: payload.timeEnd,
      droneLabel: payload.droneLabel,
      statusText: payload.statusText || "预备执行",
      locationPaths,
      locationPath: [...primaryPath],
      locationLabel,
      polygonLngLat: [...(polygonLngLatList[0] || payload.polygonLngLat || [])],
      polygonLngLatList,
      subject: payload.subject ?? "",
      detailRemark: payload.detailRemark ?? "",
      resourceDroneCount: Number(payload.resourceDroneCount) || 0,
      resourceDogCount: Number(payload.resourceDogCount) || 0,
      resourceBoatCount: Number(payload.resourceBoatCount) || 0,
    };
    const list = plansByScenario[payload.scenarioKey];
    if (list) list.push(item);
    return id;
  }

  function selectPlan(id) {
    if (selectedPlanId.value === id) {
      selectedPlanId.value = null;
      return;
    }
    selectedPlanId.value = id;
  }

  function clearPlanHighlight() {
    selectedPlanId.value = null;
  }

  /** 仅设置地图高亮，不切换关闭（用于打开详情弹窗） */
  function setHighlightedPlan(id) {
    selectedPlanId.value = id || null;
  }

  /**
   * 分页查询飞行计划；带 type 时只刷新对应场景 Tab 的列表
   * @param {Record<string, any>} [query] type name current pageSize
   */
  async function fetchPlanList(query = {}) {
    plansFetchError.value = null;
    try {
      const res = await AccompanyingFlyService.planPageQuery(query);
      if (res?.code !== 2000) {
        plansFetchError.value = res?.message || "加载飞行计划失败";
        return [];
      }
      const data = res?.data;
      const records = Array.isArray(data?.records)
        ? data.records
        : Array.isArray(data?.list)
          ? data.list
          : Array.isArray(data)
            ? data
            : [];
      const total = data?.total ?? records.length;
      planListTotal.value = total;

      const typeFilter =
        query.type != null && query.type !== ""
          ? Number(query.type)
          : null;

      const items = records.map((r) => normalizeFlightPlanRecord(r));

      if (typeFilter >= 1 && typeFilter <= 3) {
        const sk = apiTypeToScenarioKey(typeFilter);
        plansByScenario[sk].splice(0, plansByScenario[sk].length, ...items);
      } else {
        plansByScenario.mountain = [];
        plansByScenario.water = [];
        plansByScenario.security = [];
        items.forEach((item) => {
          const list = plansByScenario[item.scenarioKey];
          if (list) list.push(item);
        });
      }

      plansLoadedFromApi.value = true;
      return items;
    } catch (e) {
      plansFetchError.value = e?.message || String(e);
      return [];
    }
  }

  function deletePlan(id) {
    if (!id) return false;
    for (const key of Object.keys(plansByScenario)) {
      const list = plansByScenario[key];
      const idx = list.findIndex((p) => p.id === id);
      if (idx >= 0) {
        list.splice(idx, 1);
        if (selectedPlanId.value === id) {
          selectedPlanId.value = null;
        }
        return true;
      }
    }
    return false;
  }

  return {
    plansByScenario,
    plansLoadedFromApi,
    plansFetchError,
    planListTotal,
    selectedPlanId,
    getPlanById,
    addPlan,
    fetchPlanList,
    selectPlan,
    clearPlanHighlight,
    setHighlightedPlan,
    deletePlan,
  };
});
