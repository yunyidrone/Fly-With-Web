import { requestData, unwrapApiList } from "@backend/utils/request.js";
import {
  normalizePersonGroupRecord,
  normalizePersonGroupList,
  normalizePortraitList,
  normalizePortraitRecord,
  normalizeVehicleList,
  normalizeVehicleRecord,
  resolveQueryTimeRange,
} from "@backend/utils/monitor-library.js";

function appendTimeParams(queryParams, params) {
  const { startTime, endTime } = resolveQueryTimeRange(params);
  if (startTime) queryParams.startTime = startTime;
  if (endTime) queryParams.endTime = endTime;
}

export async function fetchPersonGroupPage(params) {
  const { keyword, id, groupName, current, pageSize } = params || {};
  const queryParams = { current, pageSize };

  const idValue = String(id ?? "").trim();
  const nameValue = String(groupName ?? "").trim();
  const keywordValue = String(keyword ?? "").trim();

  if (idValue) {
    queryParams.id = idValue;
  } else if (nameValue) {
    queryParams.groupName = nameValue;
  } else if (keywordValue) {
    if (/[\u4e00-\u9fa5]/.test(keywordValue)) {
      queryParams.groupName = keywordValue;
    } else {
      queryParams.id = keywordValue;
    }
  }

  const data = await requestData("/personGroup/pageQuery", { params: queryParams }, "GET");
  if (data && Array.isArray(data.records)) {
    return { ...data, records: normalizePersonGroupList(data.records) };
  }
  return { records: normalizePersonGroupList(unwrapApiList(data)), total: unwrapApiList(data).length };
}

export function createPersonGroup(data) {
  return requestData("/personGroup/add", data, "POST");
}

export function updatePersonGroup(data) {
  return requestData("/personGroup/update", data, "POST");
}

export function deletePersonGroup(data) {
  return requestData("/personGroup/delete", data, "POST");
}

export async function fetchPersonGroupDetail(params) {
  const data = await requestData("/personGroup/detail", { params }, "GET");
  return normalizePersonGroupRecord(data);
}

export async function fetchPortraitPage(params) {
  const { orgId, groupId, name, dateRange, startTime, endTime, ...rest } = params || {};
  const queryParams = { ...rest };
  if (orgId != null && orgId !== "") {
    queryParams.orgId = orgId;
  }
  const groupIdValue = String(groupId ?? "").trim();
  queryParams.groupId = groupIdValue;
  if (!groupIdValue) {
    return { records: [], total: 0 };
  }
  const nameTrim = String(name ?? "").trim();
  if (nameTrim) queryParams.name = nameTrim;

  appendTimeParams(queryParams, { dateRange, startTime, endTime });

  const data = await requestData("/portrait/pageQuery", { params: queryParams }, "GET");
  if (data && Array.isArray(data.records)) {
    return { ...data, records: normalizePortraitList(data.records) };
  }
  return { records: normalizePortraitList(unwrapApiList(data)), total: unwrapApiList(data).length };
}

export async function fetchPortraitDetail(params) {
  const data = await requestData("/portrait/detail", { params }, "GET");
  return normalizePortraitRecord(data);
}

export function deletePortrait(data) {
  return requestData("/portrait/delete", data, "POST");
}

export function createPortrait(data) {
  return requestData("/portrait/add", data, "POST");
}

export function updatePortrait(data) {
  return requestData("/portrait/update", data, "POST");
}

export async function fetchVehiclePage(params) {
  const { orgId, plateNo, plateNumber, powerType, dateRange, startTime, endTime, ...rest } = params || {};
  const queryParams = { ...rest };
  if (orgId != null && orgId !== "") {
    queryParams.orgId = orgId;
  }

  const plateTrim = String(plateNo ?? plateNumber ?? "")
    .trim()
    .replace(/[·.\s]/g, "");
  if (plateTrim) queryParams.plateNo = plateTrim;

  if (powerType !== "" && powerType != null) {
    queryParams.powerType = powerType;
  }

  appendTimeParams(queryParams, { dateRange, startTime, endTime });

  const data = await requestData("/vehicle/pageQuery", { params: queryParams }, "GET");
  if (data && Array.isArray(data.records)) {
    return { ...data, records: normalizeVehicleList(data.records) };
  }
  return { records: normalizeVehicleList(unwrapApiList(data)), total: unwrapApiList(data).length };
}

export async function fetchVehicleDetail(params) {
  const data = await requestData("/vehicle/detail", { params }, "GET");
  return normalizeVehicleRecord(data);
}

export function deleteVehicle(data) {
  return requestData("/vehicle/delete", data, "POST");
}

export function createVehicle(data) {
  return requestData("/vehicle/add", data, "POST");
}

export function updateVehicle(data) {
  return requestData("/vehicle/update", data, "POST");
}
