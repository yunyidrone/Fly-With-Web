import { requestData, unwrapApiList } from "@backend/utils/request.js";
import {
  normalizeCheckpointList,
  normalizeCheckpointRecord,
} from "@backend/utils/checkpoint.js";

/**
 * 通用文件上传保存目录 path
 * 1. 算子仓库图片 algorithm/image
 * 2. 用户文件 user/image
 * 3. 驾驶舱 cockpit/image
 * 4. 系统 system/image
 * 5. 人像管理 portrait/image
 */
export const UPLOAD_PATH = {
  ALGORITHM_IMAGE: "algorithm/image",
  USER_IMAGE: "user/image",
  COCKPIT_IMAGE: "cockpit/image",
  SYSTEM_IMAGE: "system/image",
  PORTRAIT_IMAGE: "portrait/image",
};

function resolveUploadFileUrl(data) {
  if (typeof data === "string") return data.trim();
  if (!data || typeof data !== "object") return "";

  return String(
    data.url ??
      data.fileUrl ??
      data.imageUrl ??
      data.fullUrl ??
      data.path ??
      data.filePath ??
      "",
  ).trim();
}

/**
 * 通用文件上传
 * POST /sys/uploadFile multipart/form-data
 * @param {File|Blob} file
 * @param {string} path 保存目录，见 UPLOAD_PATH
 */
export async function uploadFile(file, path) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("path", String(path ?? "").trim());

  const data = await requestData("/sys/uploadFile", formData, "POST", "multipart/form-data");
  return resolveUploadFileUrl(data);
}

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

export async function fetchCheckpointDetail(params) {
  const data = await requestData("/control/point/detail", { params }, "GET");
  return normalizeCheckpointRecord(data);
}

export function createCheckpoint(data) {
  return requestData("/control/point/add", data, "POST");
}

export function updateCheckpoint(data) {
  return requestData("/control/point/update", data, "POST");
}

export function deleteCheckpoint(data) {
  return requestData("/control/point/delete", data, "POST");
}
