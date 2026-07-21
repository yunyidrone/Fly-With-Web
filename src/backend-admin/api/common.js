import { requestData, unwrapApiList } from "@backend/utils/request.js";
import { normalizeCheckpointList } from "@backend/utils/checkpoint.js";

/**
 * 封控点 / 卡点列表
 */
export async function controlPointListQuery(params = {}) {
  return requestData("/control/point/listQuery", { params }, "GET");
}

/**
 * 卡点设置分页列表（兼容全量返回与分页返回）
 */
export async function fetchCheckpointPage(params = {}) {
  const { current = 1, pageSize = 10, ...rest } = params;
  const data = await controlPointListQuery(rest);

  if (data && Array.isArray(data.records)) {
    const records = normalizeCheckpointList(data.records);
    return {
      ...data,
      records,
      total: Number(data.total ?? records.length) || 0,
    };
  }

  const list = normalizeCheckpointList(unwrapApiList(data));
  const total = list.length;
  const start = (Number(current) - 1) * Number(pageSize);
  return {
    records: list.slice(start, start + Number(pageSize)),
    total,
  };
}
