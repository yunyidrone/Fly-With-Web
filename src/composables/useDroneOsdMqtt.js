import { mqttService } from "@/utils/mqtt-service.js";
import { useDeviceStore } from "@/stores/device.js";
import {
  DRONE_OSD_MQTT_TOPIC,
  extractOsdSnFromTopic,
  applyDroneOsdMessage,
  parseDroneOsdPayload,
} from "@/utils/drone-osd-telemetry.js";

let osdSubscribed = false;
/** @type {Set<(sn: string, telemetry: Record<string, number | undefined>, topic: string) => void>} */
const osdListeners = new Set();

export function resetDroneOsdMqttState() {
  osdSubscribed = false;
}

/**
 * @param {(sn: string, telemetry: Record<string, number | undefined>, topic: string) => void} fn
 */
export function onDroneOsdTelemetry(fn) {
  osdListeners.add(fn);
  return () => osdListeners.delete(fn);
}

function handleDroneOsdMessage(actualTopic, msg) {
  // console.log(`[MQTT Drone OSD] topic: ${actualTopic}`, msg);
  const sn = extractOsdSnFromTopic(actualTopic);
  if (!sn) return;
  const deviceStore = useDeviceStore();
  const telemetry = parseDroneOsdPayload(msg);
  if (!telemetry) return;
  const applied = applyDroneOsdMessage(deviceStore, sn, msg);
  if (!applied) return;
  osdListeners.forEach((fn) => {
    try {
      fn(sn, telemetry, actualTopic);
    } catch (e) {
      console.warn("[MQTT OSD] listener error", e);
    }
  });
}

function subscribeDroneOsd() {
  if (osdSubscribed) return;
  osdSubscribed = true;
  mqttService.subscribe(DRONE_OSD_MQTT_TOPIC, handleDroneOsdMessage);
}

/**
 * 全局一次：连接 MQTT 并订阅无人机 OSD
 */
export async function ensureDroneOsdMqtt() {
  await mqttService.ensureConnected();
  subscribeDroneOsd();
}
