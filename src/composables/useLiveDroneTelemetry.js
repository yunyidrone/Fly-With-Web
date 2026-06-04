import { computed, unref } from "vue";
import { storeToRefs } from "pinia";
import { useDeviceStore } from "@/stores/device.js";

/**
 * @param {string} droneId
 * @param {Record<string, any> | null | undefined} fallback
 * @param {Array<Record<string, any>>} [dronesList]
 */
export function findDroneInStore(droneId, fallback = null, dronesList) {
  const list = dronesList ?? useDeviceStore().drones;
  const keys = new Set(
    [droneId, fallback?.id, fallback?.sn, fallback?.mqttSn]
      .map((k) => String(k ?? "").trim())
      .filter(Boolean),
  );
  if (!keys.size) return fallback ?? null;

  return (
    list.find((d) => keys.has(String(d.id ?? ""))) ||
    list.find((d) => keys.has(String(d.sn ?? ""))) ||
    list.find((d) => keys.has(String(d.mqttSn ?? ""))) ||
    fallback
  );
}

/**
 * 合并 MQTT 实时遥测（deviceStore 内对象保持响应式，勿 spread）
 * @param {import('vue').MaybeRefOrGetter<string>} droneId
 * @param {import('vue').MaybeRefOrGetter<Record<string, any> | null>} fallbackDrone
 * @param {import('vue').MaybeRefOrGetter<string>} [mqttSn]
 */
export function useLiveDroneTelemetry(droneId, fallbackDrone = null, mqttSn) {
  const deviceStore = useDeviceStore();
  const { drones } = storeToRefs(deviceStore);

  return computed(() => {
    const list = drones.value;
    const id = String(unref(droneId) ?? "").trim();
    const sn = String(unref(mqttSn) ?? "").trim();
    const fallback = unref(fallbackDrone);

    const keys = new Set([id, sn, fallback?.id, fallback?.sn, fallback?.mqttSn]
      .map((k) => String(k ?? "").trim())
      .filter(Boolean));

    if (!keys.size) return fallback ?? null;

    const live =
      list.find((d) => keys.has(String(d.id ?? ""))) ||
      list.find((d) => keys.has(String(d.sn ?? ""))) ||
      list.find((d) => keys.has(String(d.mqttSn ?? "")));

    if (live) return live;
    return fallback ?? null;
  });
}
