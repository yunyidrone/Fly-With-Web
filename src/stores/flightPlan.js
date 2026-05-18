import { defineStore } from "pinia";
import { reactive, ref } from "vue";
import {
  resolvePolygonRingByPath,
  resolveLocationLabelByPath,
  resolveLocationLabelsFromPaths,
  normalizePlanLocationPaths,
  migrateLegacyLocationPath,
} from "@/config/flight-plan-locations.js";

let idSeq = 200;

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
    security: [
      {
        id: "plan-seed-security-1",
        scenarioKey: "security",
        flightDate: "2026-11-07",
        flightDateEnd: "2026-11-09",
        timeStart: "19:05",
        timeEnd: "21:25",
        droneLabel: "无人机xxx1",
        statusText: "预备执行",
        locationPaths: [["gov", "huangyan", "gov_huangyan"]],
        locationPath: ["gov", "huangyan", "gov_huangyan"],
        locationLabel: "政府区域 / 黄岩区 / 黄岩区政府",
        polygonLngLat: resolvePolygonRingByPath(["gov", "huangyan", "gov_huangyan"]) || [],
        polygonLngLatList: [
          resolvePolygonRingByPath(["gov", "huangyan", "gov_huangyan"]) || [],
        ],
        subject: "重点路段夜间巡逻",
        detailRemark: "与辖区派出所协同，覆盖区政府周边主干道。",
        resourceDroneCount: 1,
        resourceDogCount: 0,
        resourceBoatCount: 0,
      },
    ],
  });

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
    selectedPlanId,
    getPlanById,
    addPlan,
    selectPlan,
    clearPlanHighlight,
    setHighlightedPlan,
    deletePlan,
  };
});
