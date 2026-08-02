import { requestData, unwrapApiList } from "@backend/utils/request.js";
import {
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

export async function fetchPortraitPage(params) {
  const { orgId, name, warningType, warnType, dateRange, startTime, endTime, ...rest } = params || {};
  const queryParams = { ...rest };
  if (orgId != null && orgId !== "") {
    queryParams.orgId = orgId;
  }
  const nameTrim = String(name ?? "").trim();
  if (nameTrim) queryParams.name = nameTrim;

  const typeValue = warningType ?? warnType;
  if (typeValue !== "" && typeValue != null) {
    queryParams.warningType = typeValue;
  }

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
