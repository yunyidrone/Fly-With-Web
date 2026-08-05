import { ref } from "vue";
import { TaskService } from "@/api/task.js";
import { normalizeWarnDataToFlatEvents } from "@/utils/plan-algorithm-data.js";
import { mqttService } from "@/utils/mqtt-service.js";
import {
  buildDroneAiResultTopic,
  parseDroneAiResultMessage,
  resolveDroneThirdPartyId,
  toAiRecognitionEvent,
} from "@/utils/drone-ai-result.js";

/** TODO: 联调完成后改为 false，仅 MQTT 推送触发弹窗 */
const TEST_ALERT_WITH_FIRST_HISTORY_ITEM = false;

async function showAlertDetail(ev, alertDetail, alertDetailVisible) {
  if (!ev) return;
  alertDetail.value = ev;
  alertDetailVisible.value = true;
}

/**
 * @param {{ refreshDroneFromList?: (drone: Record<string, any> | null | undefined) => Promise<Record<string, any> | null | undefined> }} [options]
 */
export function useDroneAiRecognition(options = {}) {
  const { refreshDroneFromList } = options;
  const aiEvents = ref([]);
  const alertDetail = ref(null);
  const alertDetailVisible = ref(false);

  /** @type {string | null} */
  let activeTopic = null;
  /** @type {string} */
  let activeThirdPartyId = "";
  let waitingThirdPartyId = false;
  let sessionId = 0;
  let starting = false;

  function clearSubscription() {
    if (activeTopic) {
      mqttService.unsubscribe(activeTopic);
      activeTopic = null;
    }
    activeThirdPartyId = "";
    waitingThirdPartyId = false;
  }

  function resetEvents() {
    aiEvents.value = [];
  }

  function closeAlertDetail() {
    alertDetailVisible.value = false;
    alertDetail.value = null;
  }

  function prependEvent(ev) {
    const item = toAiRecognitionEvent(ev);
    if (!item) return;
    const exists = aiEvents.value.some((row) => row.key === item.key);
    if (exists) return;
    aiEvents.value = [item, ...aiEvents.value];
  }

  async function tryShowAlertDetail(ev) {
    const aiResult = String(ev?.aiResult ?? "").trim();
    if (!aiResult) return;

    try {
      const shouldAlert = await TaskService.alertCheck({ aiResult });
      if (shouldAlert === true) {
        await showAlertDetail(ev, alertDetail, alertDetailVisible);
      }
    } catch (error) {
      console.warn("[AI识别] alertCheck 失败", error);
    }
  }

  async function handleMqttEvent(ev) {
    prependEvent(ev);
    await tryShowAlertDetail(ev);
  }

  async function loadWarningHistory(thirdPartyId) {
    const data = await TaskService.taskWarningPageQuery({
      uuid: thirdPartyId,
      current: 1,
      pageSize: 999,
    });
    const events = normalizeWarnDataToFlatEvents(data);
    aiEvents.value = events
      .map(toAiRecognitionEvent)
      .filter(Boolean);
    return events;
  }

  function subscribeAiResult(thirdPartyId, currentSession) {
    if (!thirdPartyId || currentSession !== sessionId) return;

    const topic = buildDroneAiResultTopic(thirdPartyId);
    mqttService.subscribe(topic, (_actualTopic, data) => {
      if (currentSession !== sessionId) return;
      const ev = parseDroneAiResultMessage(data);
      if (!ev) return;
      void handleMqttEvent(ev);
    });
    activeTopic = topic;
    activeThirdPartyId = thirdPartyId;
  }

  /**
   * 有 thirdPartyId 时：先拉告警列表，再订阅 MQTT
   * @param {string} thirdPartyId
   * @param {number} currentSession
   */
  async function activateWithThirdPartyId(thirdPartyId, currentSession) {
    if (!thirdPartyId || currentSession !== sessionId) return;

    starting = true;
    try {
      clearSubscription();
      waitingThirdPartyId = false;

      let historyEvents = [];
      try {
        historyEvents = await loadWarningHistory(thirdPartyId);
      } catch (error) {
        console.warn("[AI识别] 告警历史加载失败", error);
        aiEvents.value = [];
      }

      if (currentSession !== sessionId) return;

      if (TEST_ALERT_WITH_FIRST_HISTORY_ITEM && historyEvents[0]) {
        await showAlertDetail(historyEvents[0], alertDetail, alertDetailVisible);
      }

      if (currentSession !== sessionId) return;

      await mqttService.ensureConnected();
      if (currentSession !== sessionId) return;

      subscribeAiResult(thirdPartyId, currentSession);
    } finally {
      starting = false;
    }
  }

  /**
   * @param {Record<string, any> | null | undefined} drone
   * @param {{ tryRefreshList?: boolean }} [opts]
   */
  async function resolveDroneWithThirdPartyId(drone, opts = {}) {
    let currentDrone = drone;
    let thirdPartyId = resolveDroneThirdPartyId(currentDrone);

    if (!thirdPartyId && opts.tryRefreshList && refreshDroneFromList) {
      currentDrone = (await refreshDroneFromList(currentDrone)) || currentDrone;
      thirdPartyId = resolveDroneThirdPartyId(currentDrone);
    }

    return { drone: currentDrone, thirdPartyId };
  }

  /**
   * 打开视频弹窗时绑定：无 thirdPartyId 则先尝试刷新列表；有则先拉告警再订阅
   * @param {Record<string, any> | null | undefined} drone
   */
  async function bindDroneStream(drone) {
    const currentSession = ++sessionId;
    clearSubscription();
    resetEvents();
    closeAlertDetail();

    const { thirdPartyId } = await resolveDroneWithThirdPartyId(drone, {
      tryRefreshList: true,
    });

    if (!thirdPartyId) {
      waitingThirdPartyId = true;
      return;
    }

    await activateWithThirdPartyId(thirdPartyId, currentSession);
  }

  /**
   * 无人机列表/详情刷新后同步 thirdPartyId（缺失时继续等待）
   * @param {Record<string, any> | null | undefined} drone
   */
  async function syncDroneStream(drone) {
    if (starting) return;

    const thirdPartyId = resolveDroneThirdPartyId(drone);
    if (!thirdPartyId) {
      waitingThirdPartyId = true;
      return;
    }

    if (activeTopic && activeThirdPartyId === thirdPartyId) {
      return;
    }

    if (waitingThirdPartyId || !activeTopic) {
      await activateWithThirdPartyId(thirdPartyId, sessionId);
    }
  }

  /** 关闭视频弹窗：取消 MQTT 订阅并清空列表 */
  function unbindDroneStream() {
    sessionId += 1;
    starting = false;
    clearSubscription();
    resetEvents();
    closeAlertDetail();
  }

  return {
    aiEvents,
    alertDetail,
    alertDetailVisible,
    closeAlertDetail,
    bindDroneStream,
    syncDroneStream,
    unbindDroneStream,
  };
}
