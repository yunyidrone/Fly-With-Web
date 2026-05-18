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
 * @property {number} [status]  0离线 1就绪 2伴飞中
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
  const id = raw.id ?? raw.sn;
  const name = raw.name?.trim?.() ? raw.name : raw.sn || "无人机";

  return {
    id: id != null && id !== "" ? String(id) : `drone-${raw.sn ?? "unknown"}`,
    name,
    sn: raw.sn ?? "",
    waylineId: raw.waylineId,
    streamUrl: raw.streamUrl,
    longitude: raw.longitude,
    latitude: raw.latitude,
    lng:
      typeof raw.longitude === "number" && Number.isFinite(raw.longitude)
        ? raw.longitude
        : null,
    lat:
      typeof raw.latitude === "number" && Number.isFinite(raw.latitude)
        ? raw.latitude
        : null,
    description: raw.description,
    createTime: raw.createTime,
    rawStatus: Number.isFinite(statusNum) ? statusNum : undefined,
    active: !offline,
    commOk: !offline,
    status: offline ? "offline" : escort ? "flying" : standby ? "standby" : "standby",
    statusText: offline ? "离线" : escort ? "伴飞中" : "待命",
    isEscorting: escort,
    escortTarget: null,
    battery: undefined,
    endurance: undefined,
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

  const vehicles = ref([]);
  const drones = ref([]);

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
      const res = await AccompanyingFlyService.droneList(query);
      if (res?.code !== 200) {
        dronesFetchError.value = res?.message || "加载无人机列表失败";
        return drones.value;
      }
      const records = res?.data?.records;
      if (!Array.isArray(records)) {
        dronesFetchError.value = "无人机列表格式异常（缺少 data.records）";
        return drones.value;
      }
      drones.value = records.map((r) => normalizeDroneRecord(r));
      dronesLoadedFromApi.value = true;
      testActive.value = false;
      return drones.value;
    } catch (e) {
      dronesFetchError.value = e?.message || String(e);
      return drones.value;
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
    drone.status = "flying";
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
    drone.statusText = "待命";
    drone.commOk = true;
    drone.active = true;
  }

  function updateDroneBattery(droneId, battery) {
    const drone = drones.value.find((d) => d.id === droneId);
    if (drone) drone.battery = battery;
  }

  return {
    testActive,
    dronesLoadedFromApi,
    dronesFetchError,
    vehicles,
    drones,
    activeVehicles,
    activeDrones,
    escortingDrones,
    standbyDrones,
    initTestDevices,
    clearTestDevices,
    fetchDroneList,
    setDroneEscorting,
    setDroneStandby,
    updateDroneBattery,
  };
});
