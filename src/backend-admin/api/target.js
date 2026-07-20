import { requestData, unwrapApiList } from "@backend/utils/request.js";
import { normalizeTargetList, normalizeTargetRecord } from "@backend/utils/target.js";

export async function fetchTargetPage(params) {
  const data = await requestData("/target/pageQuery", { params }, "GET");
  if (data && Array.isArray(data.records)) {
    return { ...data, records: normalizeTargetList(data.records) };
  }
  return { records: normalizeTargetList(unwrapApiList(data)), total: unwrapApiList(data).length };
}

export async function fetchTargetDetail(params) {
  const data = await requestData("/target/detail", { params }, "GET");
  return normalizeTargetRecord(data);
}

export function createTarget(data) {
  return requestData("/target/add", data, "POST");
}

export function updateTarget(data) {
  return requestData("/target/update", data, "POST");
}

export function deleteTarget(data) {
  return requestData("/target/delete", data, "POST");
}
