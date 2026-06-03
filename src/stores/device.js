import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { TEST_POLICE_VEHICLES, TEST_DRONES } from "@/config/test-devices.js";
import { AccompanyingFlyService } from "@/api";

/**
 * @typedef {object} ApiDroneRecord
 * @property {string} [id]
 * @property {string} [name]
 * @property {string} [sn]
 * @property {string} [waylineId]
 * @property {string} [streamUrl]
 * @property {number} [longitude]
 * @property {number} [latitude]
 * @property {number} [status]  0离线 1就绪 2伴飞中 3返航中
 * @property {string} [description]
 * @property {string} [createTime]
 */

/**
 * 将接口明细转为左侧列表 / 地图共用的运行时结构
 * @param {ApiDroneRecord} raw
 */
export function normalizeDroneRecord(raw) {
  const statusNum =
    typeof raw.status === "number"
      ? raw.status
      : raw.status === "" || raw.status == null
        ? NaN
        : Number(raw.status);
  const offline = statusNum === 0;
  const standby = statusNum === 1;
  const escort = statusNum === 2;
  const returning = statusNum === 3;

  /** 离线 / 就绪 / 伴飞中 / 返航中 */
  let statusSlug = "standby";
  let statusText = "就绪";
  if (offline) {
    statusSlug = "offline";
    statusText = "离线";
  } else if (escort) {
    statusSlug = "escorting";
    statusText = "伴飞中";
  } else if (returning) {
    statusSlug = "returning";
    statusText = "返航中";
  } else if (standby) {
    statusSlug = "standby";
    statusText = "就绪";
  } else if (Number.isFinite(statusNum)) {
    statusText = `状态${statusNum}`;
  }
  const id = raw.id ?? raw.sn;
  const name = raw.name?.trim?.() ? raw.name : raw.sn || "无人机";
  const stableFallbackId =
    raw.sn != null && raw.sn !== ""
      ? `drone-${raw.sn}`
      : raw.name?.trim?.()
        ? `drone-${raw.name.trim()}`
        : "drone-unknown";

  return {
    id: id != null && id !== "" ? String(id) : stableFallbackId,
    name,
    sn: raw.sn ?? "",
    waylineId: raw.waylineId,
    streamUrl: raw.streamUrl,
    longitude: raw.longitude,
    latitude: raw.latitude,
    lng:
      typeof raw.longitude === "number" && Number.isFinite(raw.longitude)
        ? raw.longitude : null,
        // : 121.427,
    lat:
      typeof raw.latitude === "number" && Number.isFinite(raw.latitude)
        ? raw.latitude : null,
        // : 28.653,
    description: raw.description,
    createTime: raw.createTime,
    rawStatus: Number.isFinite(statusNum) ? statusNum : undefined,
    active: !offline,
    commOk: !offline,
    status: statusSlug,
    statusText,
    isEscorting: escort,
    escortTarget: raw.targetId ?? raw.target_id ?? null,
    targetId: raw.targetId ?? raw.target_id ?? null,
    targetName: raw.targetName ?? raw.target_name ?? null,
    battery: undefined,
    endurance: undefined,
    height: undefined,
    attitudeHead: undefined,
    attitudePitch: undefined,
    attitudeRoll: undefined,
  };
}

function isGeneratedDroneId(id) {
  const text = String(id || "").trim();
  return text.startsWith("drone-");
}

/**
 * @typedef {object} ApiTargetRecord
 * @property {string} [id]
 * @property {string} [targetId]
 * @property {string} [vehicleId]
 * @property {string} [name]
 * @property {string} [plateNo]
 * @property {string} [label]
 * @property {number} [longitude]
 * @property {number} [latitude]
 * @property {number} [lng]
 * @property {number} [lat]
 * @property {number|string} [type] 1车 2人 3动物
 */

/**
 * 伴飞目标接口行 → 前端统一结构（字段按常见后端别名兼容）
 * @param {ApiTargetRecord} raw
 */
export function normalizeTargetRecord(raw) {
  const id = raw?.id ?? raw?.targetId ?? raw?.vehicleId ?? "";
  const nameSrc = raw?.name ?? raw?.plateNo ?? raw?.label ?? "";
  const snSrc =
    raw?.sn ??
    raw?.targetSn ??
    raw?.vehicleSn ??
    raw?.terminalPhone ??
    raw?.deviceSn ??
    "";
  const pickCoord = (v) => {
    if (typeof v === "number" && Number.isFinite(v)) return v;
    if (typeof v === "string" && v.trim() !== "") {
      const n = Number(v);
      if (Number.isFinite(n)) return n;
    }
    return null;
  };
  const stableFallbackId =
    snSrc !== "" && snSrc != null
      ? `target-${snSrc}`
      : typeof nameSrc === "string" && nameSrc.trim()
        ? `target-${nameSrc.trim()}`
        : "target-unknown";
  return {
    id: id !== "" && id != null ? String(id) : stableFallbackId,
    name:
      typeof nameSrc === "string" && nameSrc.trim()
        ? nameSrc.trim()
        : String(id || "目标"),
    sn: typeof snSrc === "string" ? snSrc.trim() : String(snSrc || ""),
    type: Number(raw?.type ?? raw?.targetType ?? raw?.category ?? 1) || 1,
    lng: pickCoord(raw.longitude) ?? pickCoord(raw.lng) ?? null, // 121.428
    lat: pickCoord(raw.latitude) ?? pickCoord(raw.lat) ?? null, // 28.653
    raw,
  };
}

/**
 * 设备运行时状态管理
 * 左侧 ResourcePanel 和地图 TiandituMap 共用此 store
 */
export const useDeviceStore = defineStore("device", () => {
  const testActive = ref(false);
  /** 无人机列表是否已从接口加载过至少一次（用于决定是否仍用占位） */
  const dronesLoadedFromApi = ref(false);
  /** 最近一次拉列表错误信息 */
  const dronesFetchError = ref(null);
  /** 伴飞目标列表是否已从接口加载过至少一次 */
  const targetsLoadedFromApi = ref(false);
  /** 最近一次拉伴飞目标列表错误 */
  const targetsFetchError = ref(null);

  const vehicles = ref([]);
  const drones = ref([]);
  /** 伴飞目标（/target/pageQuery） */
  const targets = ref([]);

  const activeVehicles = computed(() => vehicles.value.filter((v) => v.active));
  const activeDrones = computed(() => drones.value.filter((d) => d.active));

  const escortingDrones = computed(() =>
    drones.value.filter((d) => d.isEscorting),
  );
  const standbyDrones = computed(() =>
    drones.value.filter((d) => d.active && !d.isEscorting),
  );

  function initTestDevices() {
    vehicles.value = TEST_POLICE_VEHICLES.map((v) => ({
      ...v,
      active: true,
      status: "active",
      statusText: "在线",
      commStatus: "正常",
      commOk: true,
    }));

    drones.value = TEST_DRONES.map((d) => ({
      ...d,
      active: true,
      status: "standby",
      statusText: "待命",
      commStatus: "正常",
      commOk: true,
      isEscorting: false,
      escortTarget: null,
    }));

    testActive.value = true;
    dronesLoadedFromApi.value = false;
  }

  /**
   * 请求后端无人机分页列表，写入 data.records
   * @param {Record<string, any>} [query] 分页等查询参数（与后端对齐）
   */
  async function fetchDroneList(query) {
    dronesFetchError.value = null;
    try {
      const data = await AccompanyingFlyService.droneList(query);
      const records = data?.records;
      if (!Array.isArray(records)) {
        dronesFetchError.value = "无人机列表格式异常（缺少 data.records）";
        return drones.value;
      }
      if (records.length === 0 && drones.value.length > 0) {
        // 接口短暂返回空列表时，保留当前运行时无人机，避免地图实体抖动
        dronesLoadedFromApi.value = true;
        testActive.value = false;
        return drones.value;
      }
      // 合并策略：保留 MQTT 已更新的动态字段，只更新 API 静态字段
      const bySn = new Map();
      const byId = new Map();
      const byMqttSn = new Map();
      drones.value.forEach((d) => {
        const s = String(d?.sn || "").trim();
        const i = String(d?.id || "").trim();
        const ms = String(d?.mqttSn || "").trim();
        if (s) bySn.set(s, d);
        if (i) byId.set(i, d);
        if (ms) byMqttSn.set(ms, d);
      });

      const merged = records.map((raw) => {
        const n = normalizeDroneRecord(raw);
        const snKey = String(n.sn || "").trim();
        const idKey = String(n.id || "").trim();
        const existing =
          (snKey && bySn.get(snKey)) ||
          (snKey && byMqttSn.get(snKey)) ||
          (idKey && byId.get(idKey));

        if (existing) {
          // 仅更新 API 静态字段，MQTT 动态字段保留现有值
          if (!existing.id) {
            existing.id = n.id;
          } else if (
            existing.id !== n.id &&
            isGeneratedDroneId(existing.id) &&
            !isGeneratedDroneId(n.id)
          ) {
            // 若已有的是本地兜底 ID，且接口返回了更稳定的真实 ID，则升级为真实 ID
            existing.id = n.id;
          }
          existing.name = n.name;
          existing.sn = n.sn;
          existing.waylineId = n.waylineId;
          existing.streamUrl = n.streamUrl;
          existing.description = n.description;
          existing.createTime = n.createTime;
          existing.rawStatus = n.rawStatus;
          existing.active = n.active;
          existing.commOk = n.commOk;
          existing.status = n.status;
          existing.statusText = n.statusText;
          existing.isEscorting = n.isEscorting;
          existing.targetId = n.targetId;
          existing.targetName = n.targetName;
          if (!existing.escortTarget || n.escortTarget) {
            existing.escortTarget = n.escortTarget;
          }
          // 仅当 MQTT 未推送过位置时才使用 API 坐标
          if (!existing._mqttUpdated) {
            existing.lng = n.lng;
            existing.lat = n.lat;
            existing.longitude = n.longitude;
            existing.latitude = n.latitude;
          }
          return existing;
        }
        return n;
      });

      drones.value = merged;
      dronesLoadedFromApi.value = true;
      testActive.value = false;
      return drones.value;
    } catch (e) {
      dronesFetchError.value = e?.message || "加载无人机列表失败";
      return drones.value;
    }
  }

  /**
   * 伴飞目标分页列表
   * @param {Record<string, any>} [query]
   */
  async function fetchTargetList(query) {
    targetsFetchError.value = null;
    try {
      const data = await AccompanyingFlyService.targetList(query);
      const records = Array.isArray(data?.records)
        ? data.records
        : Array.isArray(data?.list)
          ? data.list
          : Array.isArray(data)
            ? data
            : null;
      if (!Array.isArray(records)) {
        targetsFetchError.value = "伴飞目标列表格式异常（缺 records/list）";
        return targets.value;
      }
      targets.value = records.map((r) => normalizeTargetRecord(r));
      targetsLoadedFromApi.value = true;
      return targets.value;
    } catch (e) {
      targetsFetchError.value = e?.message || String(e);
      return targets.value;
    }
  }

  function clearTestDevices() {
    vehicles.value = [];
    drones.value = [];
    testActive.value = false;
    dronesLoadedFromApi.value = false;
  }

  function setDroneEscorting(droneId, vehicleId) {
    const drone = drones.value.find((d) => d.id === droneId);
    if (!drone) return;
    drone.isEscorting = true;
    drone.escortTarget = vehicleId;
    drone.rawStatus = 2;
    drone.status = "escorting";
    drone.statusText = "伴飞中";
    drone.commOk = true;
    drone.active = true;
  }

  function setDroneStandby(droneId) {
    const drone = drones.value.find((d) => d.id === droneId);
    if (!drone) return;
    drone.isEscorting = false;
    drone.escortTarget = null;
    drone.rawStatus = 1;
    drone.status = "standby";
    drone.statusText = "就绪";
    drone.commOk = true;
    drone.active = true;
  }

  function updateDroneBattery(droneId, battery) {
    const drone = drones.value.find((d) => d.id === droneId);
    if (drone) drone.battery = battery;
  }

  const droneListRefreshPending = ref(false);

  /**
   * 按 SN 同步无人机遥测（电量/续航/位置）
   * 通配订阅可能收到列表外的无人机，找不到时触发列表刷新
   * @returns {boolean} true=已更新 store，false=未找到（已触发刷新）
   */
  function updateDroneTelemetryBySn(sn, payload = {}) {
    const key = String(sn || "").trim();
    if (!key) return false;
    const drone =
      drones.value.find((d) => String(d?.sn || "").trim() === key) ||
      drones.value.find((d) => String(d?.mqttSn || "").trim() === key);
    if (!drone) {
      // if (!droneListRefreshPending.value) {
      //   droneListRefreshPending.value = true;
      //   fetchDroneList().finally(() => {
      //     droneListRefreshPending.value = false;
      //   });
      // }
      return false;
    }
    drone.mqttSn = key;
    if (payload.battery != null && payload.battery !== "") {
      const b = Number(payload.battery);
      drone.battery = Number.isFinite(b) ? b : payload.battery;
    }
    if (payload.endurance != null && payload.endurance !== "") {
      drone.endurance = payload.endurance;
    }
    if (typeof payload.lng === "number" && Number.isFinite(payload.lng)) {
      drone.lng = payload.lng;
      drone.longitude = payload.lng;
      drone._mqttUpdated = true;
    }
    if (typeof payload.lat === "number" && Number.isFinite(payload.lat)) {
      drone.lat = payload.lat;
      drone.latitude = payload.lat;
      drone._mqttUpdated = true;
    }
    if (typeof payload.height === "number" && Number.isFinite(payload.height)) {
      drone.height = payload.height;
    }
    if (
      typeof payload.attitudeHead === "number" &&
      Number.isFinite(payload.attitudeHead)
    ) {
      drone.attitudeHead = payload.attitudeHead;
    }
    if (
      typeof payload.attitudePitch === "number" &&
      Number.isFinite(payload.attitudePitch)
    ) {
      drone.attitudePitch = payload.attitudePitch;
    }
    if (
      typeof payload.attitudeRoll === "number" &&
      Number.isFinite(payload.attitudeRoll)
    ) {
      drone.attitudeRoll = payload.attitudeRoll;
    }
    return true;
  }

  return {
    testActive,
    dronesLoadedFromApi,
    dronesFetchError,
    targetsLoadedFromApi,
    targetsFetchError,
    vehicles,
    drones,
    targets,
    activeVehicles,
    activeDrones,
    escortingDrones,
    standbyDrones,
    initTestDevices,
    clearTestDevices,
    fetchDroneList,
    fetchTargetList,
    setDroneEscorting,
    setDroneStandby,
    updateDroneBattery,
    updateDroneTelemetryBySn,
  };
});
