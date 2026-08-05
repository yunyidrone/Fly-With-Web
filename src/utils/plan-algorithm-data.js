/**
 * 计划详情中的 planAlgorithmDataDTO 列表（兼容多种后端结构）
 * @param {Record<string, any>} detail
 */
export function unwrapPlanAlgorithmDataList(detail) {
  if (!detail || typeof detail !== "object") return [];

  const raw =
    detail.planAlgorithmDataDTO ??
    detail.planAlgorithmDataList ??
    detail.planAlgorithmData ??
    detail.algorithmDataList;

  if (Array.isArray(raw)) return raw;
  if (raw && typeof raw === "object") {
    if (Array.isArray(raw.list)) return raw.list;
    if (Array.isArray(raw.records)) return raw.records;
    return [raw];
  }
  return [];
}

function toFiniteNumber(v) {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() !== "") {
    const n = Number(v);
    if (Number.isFinite(n)) return n;
  }
  return null;
}

/** planAlgorithmDataDTO 单项上的拉流地址 */
export function resolveSlotPlayUrl(raw) {
  if (!raw || typeof raw !== "object") return "";
  return String(raw.playUrl ?? raw.play_url ?? "").trim();
}

/**
 * @param {Record<string, any>} raw
 * @param {number} index
 */
export function normalizePlanAlgorithmSlot(raw, index = 0) {
  const droneId = String(
    raw?.droneId ?? raw?.deviceId ?? raw?.uavId ?? raw?.drone_id ?? "",
  ).trim();
  const playUrl = resolveSlotPlayUrl(raw);
  const algorithmName = String(
    raw?.algorithmName ?? raw?.algorithmCode ?? raw?.name ?? "",
  ).trim();

  const eventsRaw =
    raw?.eventList ?? raw?.aiEventList ?? raw?.alarmList ?? raw?.events ?? [];

  return {
    key: droneId || `algo-slot-${index}`,
    droneId,
    playUrl,
    algorithmName,
    routeLabel: String(raw?.waylineName ?? raw?.routeName ?? raw?.routeInfo ?? "").trim(),
    events: Array.isArray(eventsRaw) ? eventsRaw : [],
    raw,
  };
}

/**
 * @param {Record<string, any>} event
 */
export function normalizePlanMonitorEvent(event) {
  if (!event || typeof event !== "object") return null;
  return {
    id: String(event.id ?? event.eventId ?? `ev-${Date.now()}`),
    warnType: event.warnType ?? event.alarmType ?? event.eventType ?? "—",
    eventTime: event.eventTime ?? event.alarmTime ?? event.createTime ?? "—",
    imageUrl: String(
      event.imageUrl ?? event.imgUrl ?? event.pictureUrl ?? event.snapshotUrl ?? "",
    ),
    label: String(event.recognizeName ?? event.recognizeType ?? "").trim(),
  };
}

/**
 * @param {Record<string, any>} detail
 */
export function buildPlanMonitorContext(detail) {
  const planEvents =
    detail?.eventList ?? detail?.aiEventList ?? detail?.alarmList ?? detail?.events ?? [];

  return {
    planName: String(detail?.name ?? detail?.planName ?? detail?.subject ?? "").trim(),
    taskStartTime: String(
      detail?.executeStartTime ?? detail?.taskStartTime ?? detail?.startTime ?? "",
    ).trim(),
    taskProgress:
      detail?.taskProgress ?? detail?.progress ?? detail?.taskProgressPercent ?? null,
    targetDevice: String(
      detail?.targetName ??
        detail?.targetDeviceName ??
        detail?.followTargetName ??
        detail?.targetId ??
        "",
    ).trim(),
    planEvents: Array.isArray(planEvents) ? planEvents : [],
  };
}

/**
 * 从 planAlgorithmDataDTO 单项 + 计划 detail 提取监控展示用无人机信息
 * @param {Record<string, any>} slotRaw planAlgorithmDataDTO[i]
 * @param {Record<string, any>} [planDetail] planDetail 根对象
 */
export function buildSlotDroneInfoFromDetail(slotRaw, planDetail = {}) {
  const raw = slotRaw && typeof slotRaw === "object" ? slotRaw : {};
  const plan = planDetail && typeof planDetail === "object" ? planDetail : {};
  const nested = raw.drone ?? raw.droneInfo ?? raw.device ?? raw.uav ?? {};
  const nest = nested && typeof nested === "object" ? nested : {};

  const pick = (...keys) => {
    for (const key of keys) {
      const v = raw[key] ?? nest[key];
      if (v != null && v !== "") return v;
    }
    return undefined;
  };

  const id = String(
    pick("droneId", "deviceId", "uavId", "drone_id") ?? "",
  ).trim();
  const sn = String(
    pick("sn", "droneSn", "deviceSn", "mqttSn") ?? "",
  ).trim();
  const name = String(
    pick("droneName", "name", "deviceName") ?? "",
  ).trim();

  const lng = toFiniteNumber(
    pick("longitude", "lng", "lon"),
  );
  const lat = toFiniteNumber(
    pick("latitude", "lat"),
  );
  const attitudeHead = toFiniteNumber(
    pick("attitudeHead", "head", "yaw", "heading"),
  );
  const attitudePitch = toFiniteNumber(
    pick("attitudePitch", "pitch"),
  );

  const targetId = String(
    pick("targetId", "target_id", "followTargetId") ??
      plan.targetId ??
      plan.target_id ??
      plan.followTargetId ??
      "",
  ).trim();

  const targetName = String(
    pick("targetName", "target_name", "followTargetName", "targetDeviceName") ??
      plan.targetName ??
      plan.targetDeviceName ??
      plan.followTargetName ??
      "",
  ).trim();

  const taskStartTime = String(
    pick("executeStartTime", "taskStartTime", "startTime") ??
      plan.executeStartTime ??
      plan.taskStartTime ??
      plan.startTime ??
      "",
  ).trim();

  const taskProgress =
    pick("taskProgress", "progress", "taskProgressPercent") ??
    plan.taskProgress ??
    plan.progress ??
    plan.taskProgressPercent ??
    null;

  const routeLabel = String(
    pick("waylineName", "routeName", "routeInfo", "waylineInfo") ?? "",
  ).trim();

  return {
    id,
    sn,
    mqttSn: sn,
    /** 计划 DTO 中的名称，最终以 droneDetail 为准 */
    name: name || sn || id || "",
    lng,
    lat,
    longitude: lng,
    latitude: lat,
    attitudeHead,
    attitudePitch,
    head: attitudeHead,
    pitch: attitudePitch,
    targetId,
    targetName,
    routeLabel,
    taskStartTime,
    taskProgress,
  };
}

/**
 * 合并 planAlgorithmDataDTO + droneDetail 接口数据（名称、SN 等以接口为准）
 * @param {ReturnType<typeof buildSlotDroneInfoFromDetail>} slotInfo
 * @param {Record<string, any> | null} [droneDetail] AccompanyingFlyService.droneDetail
 */
export function mergeMonitorDroneInfo(slotInfo, droneDetail) {
  const base = slotInfo && typeof slotInfo === "object" ? slotInfo : {};
  const api = droneDetail && typeof droneDetail === "object" ? droneDetail : {};

  const id = String(api.id ?? base.id ?? "").trim();
  const sn = String(api.sn ?? api.deviceSn ?? base.sn ?? "").trim();
  const name = String(api.name ?? api.droneName ?? "").trim();

  const lng =
    toFiniteNumber(api.longitude ?? api.lng) ?? base.lng;
  const lat =
    toFiniteNumber(api.latitude ?? api.lat) ?? base.lat;
  const attitudeHead =
    toFiniteNumber(api.attitudeHead ?? api.head ?? api.yaw) ?? base.attitudeHead;
  const attitudePitch =
    toFiniteNumber(api.attitudePitch ?? api.pitch) ?? base.attitudePitch;

  const targetId = String(
    api.targetId ?? api.target_id ?? base.targetId ?? "",
  ).trim();
  const targetName = String(
    api.targetName ?? api.target_name ?? base.targetName ?? "",
  ).trim();
  const routeLabel = String(
    api.waylineName ?? api.routeName ?? base.routeLabel ?? "",
  ).trim();

  return {
    ...base,
    id: id || base.id,
    sn: sn || base.sn,
    mqttSn: sn || base.mqttSn,
    name: name || base.name || sn || id || "无人机",
    lng,
    lat,
    longitude: lng,
    latitude: lat,
    attitudeHead,
    attitudePitch,
    head: attitudeHead,
    pitch: attitudePitch,
    targetId,
    targetName,
    routeLabel: routeLabel || base.routeLabel,
  };
}

/**
 * @param {{ taskStartTime?: string, taskProgress?: unknown }} input
 */
export function formatPlanTaskProgressText(input = {}) {
  const t = String(input.taskStartTime ?? "").trim();
  const p = input.taskProgress;
  if (p != null && p !== "") {
    const num = Number(p);
    if (Number.isFinite(num)) {
      const pct = num <= 1 ? Math.round(num * 100) : Math.round(num);
      return t ? `${t}（${pct}%）` : `${pct}%`;
    }
  }
  return t || "";
}

/**
 * @param {Record<string, any>} slotRaw
 * @param {Record<string, any>} planDetail
 * @param {ReturnType<typeof buildPlanMonitorContext>} [ctx]
 */
export function buildSlotTaskMeta(slotRaw, planDetail, ctx = {}) {
  const info = buildSlotDroneInfoFromDetail(slotRaw, planDetail);
  return {
    taskProgressText: formatPlanTaskProgressText({
      taskStartTime: info.taskStartTime || ctx.taskStartTime,
      taskProgress: info.taskProgress ?? ctx.taskProgress,
    }),
    targetDeviceLabel: info.targetName || ctx.targetDevice || "",
  };
}

/**
 * MQTT topic SN 与业务 id 对齐
 * @param {Record<string, any> | null} droneDetail
 * @param {string} droneId
 */
export function resolveDroneMqttSn(droneDetail, droneId = "") {
  return String(
    droneDetail?.sn ??
      droneDetail?.mqttSn ??
      droneDetail?.deviceSn ??
      droneId ??
      "",
  ).trim();
}

function normalizeAiResultText(value) {
  const text = String(value ?? "").trim();
  if (!text || text === "—") return "";
  return text;
}

/**
 * 将 /plan/warnData 单条告警转为 PlanTaskMonitorDroneCell events 格式
 * @param {Record<string, any>} item
 */
export function normalizeWarnEvent(item) {
  if (!item || typeof item !== "object") return null;
  return {
    id: String(item.warningId ?? item.id ?? `warn-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`),
    warnType: String(item.name ?? item.warnType ?? item.alarmType ?? "—"),
    aiResult: normalizeAiResultText(
      item.aiResult ?? item.recognizeResult ?? item.recognitionResult ?? item.recognizeName,
    ),
    eventTime: String(item.alarmTime ?? item.eventTime ?? item.createTime ?? "—"),
    imageUrl: String(item.imageUrl ?? item.imgUrl ?? item.pictureUrl ?? ""),
    originalImageUrl: String(
      item.originalImageUrl ?? item.original_image_url ?? item.imageUrl ?? "",
    ),
    label: "",
    longitude: item.longitude ?? null,
    latitude: item.latitude ?? null,
    droneName: String(item.droneName ?? item.deviceName ?? item.reportDeviceName ?? ""),
    uuid: String(item.uuid ?? ""),
    thirdPartyId: String(item.thirdPartyId ?? ""),
  };
}

/**
 * 将 /plan/warnData 响应按无人机分组，每台取最新 10 条
 * @param {any} warnData API 原始返回
 * @returns {Record<string, Array>} droneId → events[]
 */
export function normalizeWarnDataToDroneEvents(warnData) {
  let entries = [];

  if (Array.isArray(warnData)) {
    entries = warnData;
  } else if (warnData && typeof warnData === "object") {
    // 可能已是 { droneId: [...] } 结构
    const vals = Object.values(warnData);
    if (vals.length && vals.every((v) => Array.isArray(v))) {
      const map = {};
      for (const [key, list] of Object.entries(warnData)) {
        if (Array.isArray(list)) {
          const evs = list.map(normalizeWarnEvent).filter(Boolean).slice(0, 10);
          if (evs.length) map[key] = evs;
        }
      }
      return map;
    }
    entries = warnData.records ?? warnData.list ?? warnData.data ?? [];
  }

  if (!Array.isArray(entries) || !entries.length) return {};

  const grouped = {};
  for (const item of entries) {
    // uuid 为平台数据 id，用作无人机标识
    const droneId = String(
      item?.droneId ?? item?.uuid ?? item?.deviceId ?? "_unknown",
    ).trim();
    if (!grouped[droneId]) grouped[droneId] = [];
    const ev = normalizeWarnEvent(item);
    if (ev) grouped[droneId].push(ev);
  }

  for (const key of Object.keys(grouped)) {
    grouped[key] = grouped[key].slice(0, 10);
  }

  return grouped;
}

/**
 * 将 /plan/warnData 响应展平为事件列表（不分组），用于总览展示
 * @param {any} warnData
 * @returns {Array<Record<string, any>>}
 */
export function normalizeWarnDataToFlatEvents(warnData) {
  let entries = [];

  if (Array.isArray(warnData)) {
    entries = warnData;
  } else if (warnData && typeof warnData === "object") {
    const vals = Object.values(warnData);
    if (vals.length && vals.every((v) => Array.isArray(v))) {
      return vals.flat().map(normalizeWarnEvent).filter(Boolean);
    }
    entries = warnData.records ?? warnData.list ?? warnData.data ?? [];
  }

  if (!Array.isArray(entries)) return [];
  return entries.map(normalizeWarnEvent).filter(Boolean);
}
