import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { TEST_POLICE_VEHICLES, TEST_DRONES } from "@/config/test-devices.js";

/**
 * 设备运行时状态管理
 * 左侧 ResourcePanel 和地图 TiandituMap 共用此 store
 */
export const useDeviceStore = defineStore("device", () => {
  const testActive = ref(false);

  const vehicles = ref([]);
  const drones = ref([]);

  const activeVehicles = computed(() => vehicles.value.filter((v) => v.active));
  const activeDrones = computed(() => drones.value.filter((d) => d.active));

  const escortingDrones = computed(() => drones.value.filter((d) => d.isEscorting));
  const standbyDrones = computed(() => drones.value.filter((d) => d.active && !d.isEscorting));

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
  }

  function clearTestDevices() {
    vehicles.value = [];
    drones.value = [];
    testActive.value = false;
  }

  function setDroneEscorting(droneId, vehicleId) {
    const drone = drones.value.find((d) => d.id === droneId);
    if (!drone) return;
    drone.isEscorting = true;
    drone.escortTarget = vehicleId;
    drone.status = "flying";
    drone.statusText = "伴飞中";
  }

  function setDroneStandby(droneId) {
    const drone = drones.value.find((d) => d.id === droneId);
    if (!drone) return;
    drone.isEscorting = false;
    drone.escortTarget = null;
    drone.status = "standby";
    drone.statusText = "待命";
  }

  function updateDroneBattery(droneId, battery) {
    const drone = drones.value.find((d) => d.id === droneId);
    if (drone) drone.battery = battery;
  }

  return {
    testActive,
    vehicles,
    drones,
    activeVehicles,
    activeDrones,
    escortingDrones,
    standbyDrones,
    initTestDevices,
    clearTestDevices,
    setDroneEscorting,
    setDroneStandby,
    updateDroneBattery,
  };
});
