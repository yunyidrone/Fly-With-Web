import { defineStore } from "pinia";
import { reactive, ref, computed } from "vue";
import { FlightPlanService } from "@/api/plan";
import { unwrapApiList } from "@/utils/request.js";
import {
  isPlanExecuting,
  isPlanUpcoming,
  getPlanExecuteStartMs,
  parsePlanStatusNum,
  PLAN_STATUS_LABELS,
} from "@/utils/plan-task.js";
import {
  resolvePolygonRingByPath,
  resolveLocationLabelByPath,
  resolveLocationLabelsFromPaths,
  normalizePlanLocationPaths,
  migrateLegacyLocationPath,
  createCustomLocationTree,
  createCategoryNode,
  createRegionNode,
  buildFlightLocationTreeData,
  buildCustomLocationTreeData,
  findCustomLocationNode,
  FLIGHT_LOCATION_CASCADER_OPTIONS,
} from "@/config/flight-plan-locations.js";

let idSeq = 200;

/** 中心 + 半径 → 圆形围栏环 [lng,lat,lng,lat,...] */
function generateCircleRing(lng, lat, radiusM, numPoints = 36) {
  const ring = [];
  const cosLat = Math.cos((lat * Math.PI) / 180);
  for (let i = 0; i < numPoints; i++) {
    const angle = (i / numPoints) * 2 * Math.PI;
    const dLat = (radiusM * Math.cos(angle)) / 111320;
    const dLng = (radiusM * Math.sin(angle)) / (111320 * cosLat);
    ring.push(lng + dLng, lat + dLat);
  }
  return ring;
}

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

  const flightDate =
    raw?.executeDate ?? raw?.flightDate ?? raw?.startDate ?? raw?.beginDate ?? "";
  const flightDateEnd =
    raw?.flightDateEnd ??
    raw?.endDate ??
    raw?.finishDate ??
    flightDate ??
    "";

  const timeStart = toHm(
    raw?.executeStartTime ?? raw?.timeStart ?? raw?.startTime ?? raw?.beginTime ?? "",
  );
  const timeEnd = toHm(
    raw?.executeEndTime ?? raw?.timeEnd ?? raw?.endTime ?? raw?.finishTime ?? "",
  );

  const resourceDroneCount =
    Number(raw?.resourceDroneCount ?? raw?.droneCount ?? 0) || 0;
  const resourceDogCount =
    Number(raw?.resourceDogCount ?? raw?.dogCount ?? 0) || 0;
  const resourceBoatCount =
    Number(raw?.resourceBoatCount ?? raw?.boatCount ?? 0) || 0;

  const statusNum = parsePlanStatusNum(raw);
  const statusText = String(
    raw?.statusText ??
      (statusNum != null ? PLAN_STATUS_LABELS[statusNum] : "") ??
      "预备执行",
  );

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
    status: statusNum,
    statusText,
    locationPaths: locationPaths.length ? locationPaths : [],
    locationPath: [...primaryPath],
    locationLabel,
    polygonLngLat: [...polygonLngLat],
    polygonLngLatList: polygonLngLatList.length
      ? polygonLngLatList.map((r) => [...r])
      : [],
    subject,
    description: raw?.description ?? raw?.remark ?? "",
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
 * @property {string} [description] 详情备注
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

  /** 驱动「即将执行」时间窗重算 */
  const planTaskTick = ref(Date.now());
  /** 本轮刷新后由「执行中」变为「已完成」的计划 ID 列表 */
  const justCompletedPlanIds = ref([]);
  /** 用户关闭的全局即将执行提示 planId */
  const dismissedUpcomingAlertIds = ref(/** @type {string[]} */ ([]));

  let planTaskIntervalId = null;
  let planListRefreshIntervalId = null;

  const allPlansFlat = computed(() => [
    ...plansByScenario.mountain,
    ...plansByScenario.water,
    ...plansByScenario.security,
  ]);

  const executingPlans = computed(() => {
    void planTaskTick.value;
    return allPlansFlat.value.filter(isPlanExecuting);
  });

  const upcomingPlans = computed(() => {
    const now = planTaskTick.value;
    return allPlansFlat.value
      .filter((p) => isPlanUpcoming(p, now))
      .sort(
        (a, b) =>
          (getPlanExecuteStartMs(a) ?? Number.MAX_SAFE_INTEGER) -
          (getPlanExecuteStartMs(b) ?? Number.MAX_SAFE_INTEGER),
      );
  });

  const upcomingAlertPlans = computed(() => {
    const dismissed = new Set(dismissedUpcomingAlertIds.value);
    return upcomingPlans.value.filter((p) => !dismissed.has(p.id));
  });

  /** 接口地点数据版本号，用于触发 mergedLocationTreeData 重算 */
  const planLocationsVersion = ref(0);

  // ===== 自定义地点树（地点设置） =====
  /** @type {import('vue').Ref<Array<{value:string,label:string,children?:Array,ring?:number[]|null}>>} */
  const customLocationTree = ref([]);

  /** 是否已初始化自定义地点树 */
  const customTreeInitialized = ref(false);

  function initCustomLocationTree() {
    if (customTreeInitialized.value) return;
    customLocationTree.value = createCustomLocationTree();
    customTreeInitialized.value = true;
  }

  function addCustomCategory(label) {
    if (!customTreeInitialized.value) initCustomLocationTree();
    const node = createCategoryNode(label);
    customLocationTree.value.push(node);
    return node.value;
  }

  function removeCustomCategory(categoryValue) {
    const idx = customLocationTree.value.findIndex((n) => n.value === categoryValue);
    if (idx >= 0) customLocationTree.value.splice(idx, 1);
  }

  function addCustomRegion(categoryValue, label) {
    if (!customTreeInitialized.value) initCustomLocationTree();
    const found = findCustomLocationNode(customLocationTree.value, categoryValue);
    if (!found) return null;
    const node = createRegionNode(label);
    if (!found.category.children) found.category.children = [];
    found.category.children.push(node);
    return node.value;
  }

  function removeCustomRegion(categoryValue, regionValue) {
    const found = findCustomLocationNode(customLocationTree.value, categoryValue, regionValue);
    if (found && found.regionIndex >= 0) {
      found.category.children.splice(found.regionIndex, 1);
    }
  }

  /**
   * @param {string} categoryValue
   * @param {string} regionValue
   * @param {object} data — { type, ring, points?, center?, radius? }
   */
  function setCustomRegionData(categoryValue, regionValue, data) {
    // 先在自定义树中查找
    const found = findCustomLocationNode(customLocationTree.value, categoryValue, regionValue);
    if (found && found.region) {
      found.region.regionData = data || null;
      found.region.ring = data?.ring && data.ring.length >= 6 ? [...data.ring] : null;
      return;
    }

    // 回退到预设树查找并克隆到自定义树
    const presetCategory = FLIGHT_LOCATION_CASCADER_OPTIONS.find((n) => n.value === categoryValue);
    if (!presetCategory) return;
    const presetChildren = presetCategory.children || [];
    const presetRegion = presetChildren.find((n) => n.value === regionValue);
    if (!presetRegion) return;

    // 确保自定义树中有该分类（不存在则克隆整个分类及其全部子地区）
    let customCat = customLocationTree.value.find((n) => n.value === categoryValue);
    if (!customCat) {
      customCat = {
        value: presetCategory.value,
        label: presetCategory.label,
        children: presetChildren.map((r) => ({
          value: r.value,
          label: r.label,
          ring: r.ring ? [...r.ring] : null,
          regionData: r.regionData ? { ...r.regionData } : null,
        })),
      };
      customLocationTree.value.push(customCat);
    }

    // 在克隆的分类中找到对应地区并更新数据
    const customRegion = (customCat.children || []).find((n) => n.value === regionValue);
    if (customRegion) {
      customRegion.regionData = data || null;
      customRegion.ring = data?.ring && data.ring.length >= 6 ? [...data.ring] : null;
    }
  }

  /** 自定义地点树 → el-tree data 格式 */
  const customLocationTreeData = computed(() =>
    customTreeInitialized.value ? buildCustomLocationTreeData(customLocationTree.value) : [],
  );

  /**
   * 合并后的完整地点树（预设 + 自定义，用于飞行计划地点选择）
   * 自定义分类覆盖同 value 的预设分类（编辑预设地区后会克隆到自定义树）
   */
  const mergedLocationTreeData = computed(() => {
    void planLocationsVersion.value;
    const preset = buildFlightLocationTreeData();
    if (!customTreeInitialized.value) return preset;
    const custom = buildCustomLocationTreeData(customLocationTree.value);
    // 递归标记所有自定义节点（含子级地区），方便 PlanPanel 做视觉区分
    function markCustom(nodes) {
      for (const node of nodes) {
        node._custom = true;
        if (node.children && node.children.length) markCustom(node.children);
      }
    }
    markCustom(custom);
    // 自定义分类覆盖同 value 的预设分类，保持预设原始顺序
    const customByValue = new Map(custom.map((n) => [n.value, n]));
    const result = [];
    for (const node of preset) {
      result.push(customByValue.get(node.value) || node);
    }
    // 追加纯新增的自定义分类（不在预设中的）
    for (const node of custom) {
      if (!preset.some((n) => n.value === node.value)) {
        result.push(node);
      }
    }
    return result;
  });

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
      description: payload.description ?? "",
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
  /** 拉取全部场景计划（不传 type） */
  async function fetchAllPlanList(query = {}) {
    return fetchPlanList({
      current: 1,
      pageSize: 9999,
      ...query,
    });
  }

  function dismissUpcomingAlert(planId) {
    const id = String(planId);
    if (!dismissedUpcomingAlertIds.value.includes(id)) {
      dismissedUpcomingAlertIds.value = [...dismissedUpcomingAlertIds.value, id];
    }
  }

  /** 计划列表轮询间隔（毫秒），用于刷新执行中/即将执行状态 */
  const PLAN_LIST_REFRESH_INTERVAL = 10000;

  function startPlanTaskWatcher() {
    if (planTaskIntervalId != null) return;
    planTaskTick.value = Date.now();
    // 仅本地重算「即将执行」30 分钟窗口，不调接口
    planTaskIntervalId = setInterval(() => {
      planTaskTick.value = Date.now();
    }, 30000);
    planListRefreshIntervalId = setInterval(() => {
      fetchAllPlanList();
    }, PLAN_LIST_REFRESH_INTERVAL);
  }

  function stopPlanTaskWatcher() {
    if (planTaskIntervalId != null) {
      clearInterval(planTaskIntervalId);
      planTaskIntervalId = null;
    }
    if (planListRefreshIntervalId != null) {
      clearInterval(planListRefreshIntervalId);
      planListRefreshIntervalId = null;
    }
  }

  /** 兼容列表项包一层 plan / planInfo */
  function unwrapPlanListRow(row) {
    if (!row || typeof row !== "object") return row;
    const nested = row.plan ?? row.planInfo ?? row.planDetail;
    if (nested && typeof nested === "object") {
      return { ...nested, ...row };
    }
    return row;
  }

  async function fetchPlanList(query = {}) {
    plansFetchError.value = null;
    // 刷新前记录当前正在执行的任务 ID，用于对比是否已完成
    const prevExecutingIds = new Set(executingPlans.value.map((p) => p.id));
    try {
      const data = await FlightPlanService.planPageQuery(query);
      const records = unwrapApiList(data);
      const total = data?.total ?? records.length;
      planListTotal.value = total;

      const typeFilter =
        query.type != null && query.type !== ""
          ? Number(query.type)
          : null;

      const items = records
        .map((r) => normalizeFlightPlanRecord(unwrapPlanListRow(r)))
        .filter((p) => p?.id);

      if (typeFilter >= 1 && typeFilter <= 3) {
        const sk = apiTypeToScenarioKey(typeFilter);
        plansByScenario[sk].splice(0, plansByScenario[sk].length, ...items);
      } else {
        for (const key of Object.keys(plansByScenario)) {
          plansByScenario[key].splice(0, plansByScenario[key].length);
        }
        items.forEach((item) => {
          const list = plansByScenario[item.scenarioKey];
          if (list) list.push(item);
        });
      }

      plansLoadedFromApi.value = true;
      planTaskTick.value = Date.now();

      // 检测由「执行中」变为「已完成」的任务
      const nowExecutingIds = new Set(executingPlans.value.map((p) => p.id));
      justCompletedPlanIds.value = [...prevExecutingIds].filter((id) => !nowExecutingIds.has(id));

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

  /**
   * 从接口拉取地点数据，填充 FLIGHT_LOCATION_CASCADER_OPTIONS
   * @param {number} type 1山林救援 2水上观察 3重点安保
   */
  const PLACE_TYPE_LABEL = {
    1: "小学",
    2: "中学",
    3: "高校",
    4: "加油站",
    5: "动车站",
    6: "医院",
    7: "公园",
    8: "政府单位",
  };

  async function fetchPlaceList(type) {
    try {
      const data = await FlightPlanService.placeListQuery({ type });
      const list = unwrapApiList(data);
      const tree = list.map((group) => {
        const pt = group?.placeType;
        const places = Array.isArray(group?.followPlaceList) ? group.followPlaceList : [];
        const children = places
          .filter((p) => p?.delFlag !== 1 && p?.delFlag !== "1")
          .map((p) => {
            const lng = Number(p?.longitude);
            const lat = Number(p?.latitude);
            const radius = Number(p?.radius) || 500;
            return {
              value: String(p?.id ?? ""),
              label: String(p?.name ?? ""),
              ring: generateCircleRing(lng, lat, radius),
              regionData: { longitude: lng, latitude: lat, radius },
            };
          });
        return {
          value: `place_${pt}`,
          label: PLACE_TYPE_LABEL[pt] || `类型${pt}`,
          children,
        };
      });
      FLIGHT_LOCATION_CASCADER_OPTIONS.splice(0, FLIGHT_LOCATION_CASCADER_OPTIONS.length, ...tree);
      planLocationsVersion.value++;
    } catch {
      // silent
    }
  }

  return {
    plansByScenario,
    plansLoadedFromApi,
    plansFetchError,
    planListTotal,
    selectedPlanId,
    getPlanById,
    addPlan,
    allPlansFlat,
    executingPlans,
    upcomingPlans,
    upcomingAlertPlans,
    planTaskTick,
    justCompletedPlanIds,
    fetchPlanList,
    fetchAllPlanList,
    dismissUpcomingAlert,
    startPlanTaskWatcher,
    stopPlanTaskWatcher,
    fetchPlaceList,
    selectPlan,
    clearPlanHighlight,
    setHighlightedPlan,
    deletePlan,
    // 自定义地点树
    customLocationTree,
    customTreeInitialized,
    initCustomLocationTree,
    addCustomCategory,
    removeCustomCategory,
    addCustomRegion,
    removeCustomRegion,
    setCustomRegionData,
    customLocationTreeData,
    mergedLocationTreeData,
  };
});
