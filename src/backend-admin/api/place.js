import { PLAN_TYPE } from "@backend/config/constants.js";
import { requestData } from "@backend/utils/request.js";
import {
  flattenPlaceListQuery,
  normalizeKeyLocationRecord,
} from "@backend/utils/key-location.js";

const PLAN_TYPES = [PLAN_TYPE.MOUNTAIN, PLAN_TYPE.WATER, PLAN_TYPE.SECURITY];

function buildListQueryParams(params = {}) {
  const { orgId, type, placeType, name, current, pageSize, ...rest } = params;
  const queryParams = { type, ...rest };
  if (orgId != null && orgId !== "") {
    queryParams.orgId = orgId;
  }
  if (placeType != null && placeType !== "") {
    queryParams.placeType = placeType;
  }
  const nameTrim = String(name ?? "").trim();
  if (nameTrim) {
    queryParams.name = nameTrim;
  }
  return queryParams;
}

function applyKeyLocationFilters(list, { placeType, name } = {}) {
  let result = list;
  if (placeType != null && placeType !== "") {
    const pt = Number(placeType);
    result = result.filter((item) => Number(item.placeType) === pt);
  }
  const nameTrim = String(name ?? "").trim();
  if (nameTrim) {
    result = result.filter((item) => String(item.name ?? "").includes(nameTrim));
  }
  return result;
}

/**
 * 重点地点列表（/place/listQuery，type 必填）
 */
export async function fetchKeyLocationPage(params = {}) {
  const { current = 1, pageSize = 10, type, orgId, placeType, name, ...rest } = params;

  if (type == null || type === "") {
    return { records: [], total: 0 };
  }

  const data = await requestData(
    "/place/listQuery",
    { params: buildListQueryParams({ type, orgId, placeType, name, ...rest }) },
    "GET",
  );
  const list = applyKeyLocationFilters(flattenPlaceListQuery(data, { planType: Number(type) }), {
    placeType,
    name,
  });
  const total = list.length;
  const start = (Number(current) - 1) * Number(pageSize);
  return {
    records: list.slice(start, start + Number(pageSize)),
    total,
  };
}

export async function fetchKeyLocationDetail(params) {
  const data = await requestData("/place/detail", { params }, "GET");
  return normalizeKeyLocationRecord(data);
}

export function createKeyLocation(data) {
  return requestData("/place/add", data, "POST");
}

export function updateKeyLocation(data) {
  return requestData("/place/update", data, "POST");
}

export function deleteKeyLocation(data) {
  return requestData("/place/delete", data, "POST");
}

/** 监控看板：拉取全部计划类型下的有效地点（扁平） */
export async function fetchKeyLocationSummary(params = {}) {
  const { orgId, ...rest } = params;
  const baseParams = { ...rest };
  if (orgId != null && orgId !== "") {
    baseParams.orgId = orgId;
  }

  const batches = await Promise.all(
    PLAN_TYPES.map(async (type) => {
      try {
        const data = await requestData(
          "/place/listQuery",
          { params: buildListQueryParams({ ...baseParams, type }) },
          "GET",
        );
        return flattenPlaceListQuery(data, { planType: type });
      } catch {
        return [];
      }
    }),
  );

  const seen = new Set();
  const merged = [];
  for (const batch of batches) {
    for (const item of batch) {
      const id = item?.id;
      if (!id || seen.has(id)) continue;
      seen.add(id);
      merged.push(item);
    }
  }
  return merged;
}
