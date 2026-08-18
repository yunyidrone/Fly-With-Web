import { requestData, unwrapApiList } from "@backend/utils/request.js";
import { normalizeDroneList, normalizeDroneRecord } from "@backend/utils/drone.js";

export async function fetchDronePage(params) {
  const query = { ...params };
  if (query.orgId == null || query.orgId === "") {
    delete query.orgId;
  }
  const data = await requestData("/drone/pageQuery", { params: query }, "GET");
  if (data && Array.isArray(data.records)) {
    return { ...data, records: normalizeDroneList(data.records) };
  }
  return { records: normalizeDroneList(unwrapApiList(data)), total: unwrapApiList(data).length };
}

export async function fetchDroneDetail(params) {
  const data = await requestData("/drone/detail", { params }, "GET");
  return normalizeDroneRecord(data);
}

export function createDrone(data) {
  return requestData("/drone/add", data, "POST");
}

export function updateDrone(data) {
  return requestData("/drone/update", data, "POST");
}

export function deleteDrone(data) {
  return requestData("/drone/delete", data, "POST");
}

export function assignDroneOrg(data) {
  return requestData("/drone/assignOrg", data, "POST");
}

export function fetchDroneHealthSummary(params) {
  return requestData("/drone/health/summary", { params }, "GET");
}

/**
 * 无人机启停用
 * @param {{ ids: Array<string|number>, switchStatus: 0|1 }} data switchStatus 0启用 1停用
 */
export function switchDrone(data) {
  return requestData("/drone/switch", data, "POST");
}
