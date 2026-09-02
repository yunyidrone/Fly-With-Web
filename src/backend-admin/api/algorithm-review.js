import { requestData, unwrapApiList } from "@backend/utils/request.js";
import { ALGORITHM_APPROVAL_RESULT, ALGORITHM_APPROVAL_RESULT_REVIEWED, joinApprovalResults } from "@backend/config/algorithm-apply.js";

function normalizeAlgorithmReviewPage(data) {
  const records = unwrapApiList(data);
  return {
    records,
    total: Number(data?.total ?? data?.count ?? records.length) || 0,
  };
}

/**
 * 算法申请/审批记录分页（fly：GET /fly/algorithmReview/pageQuery）
 * @param {{
 *   current?: number,
 *   pageSize?: number,
 *   applyUserId?: string|number,
 *   applyUserName?: string,
 *   approvalResults?: number|string,
 *   startTime?: string,
 *   endTime?: string,
 *   isAsc?: boolean,
 * }} params
 * @param {import('@/utils/request.js').RequestOptions} [options]
 */
function normalizeApprovalResults(value) {
  if (value == null || value === "") return "";
  if (Array.isArray(value)) {
    return value
      .map((item) => String(item).trim())
      .filter((item) => item !== "")
      .join(",");
  }
  return value;
}

export async function fetchAlgorithmReviewPage(params, options = {}) {
  const {
    current,
    pageSize,
    applyUserId,
    applyUserName,
    approvalResult,
    approvalResults,
    startTime,
    endTime,
    isAsc,
    approvalTab: _approvalTab,
    ...rest
  } = params || {};
  const query = {
    current,
    pageSize,
    ...rest,
  };

  if (applyUserId != null && applyUserId !== "") {
    query.applyUserId = applyUserId;
  }
  const applicantName = String(applyUserName ?? "").trim();
  if (applicantName) {
    query.applyUserName = applicantName;
  }
  const resolvedApprovalResults = joinApprovalResults(approvalResults ?? approvalResult);
  if (resolvedApprovalResults !== "" && resolvedApprovalResults != null) {
    query.approvalResults = resolvedApprovalResults;
  }
  if (startTime) query.startTime = startTime;
  if (endTime) query.endTime = endTime;
  if (isAsc != null) query.isAsc = isAsc;

  const data = await requestData(
    "/algorithmReview/pageQuery",
    { params: query },
    "GET",
    undefined,
    options,
  );
  return normalizeAlgorithmReviewPage(data);
}

/**
 * 算法权限列表（fly：GET /fly/algorithmReview/passList）
 * @param {{
 *   applyUserId: string|number,
 *   approvalResult: number|string,
 * }} params
 * @param {import('@/utils/request.js').RequestOptions} [options]
 */
export function fetchAlgorithmReviewPassList(params, options = {}) {
  const { applyUserId, approvalResult, ...rest } = params || {};
  return requestData(
    "/algorithmReview/passList",
    {
      params: {
        applyUserId,
        approvalResult,
        ...rest,
      },
    },
    "GET",
    undefined,
    options,
  );
}

/**
 * 提交算法申请（fly：POST /fly/algorithmReview/apply）
 * @param {{
 *   applyUserId: string|number,
 *   algorithmCode: string,
 *   applyReason?: string,
 *   certificateUrl?: string,
 * }} data
 * @param {import('@/utils/request.js').RequestOptions} [options]
 */
export function submitAlgorithmReviewApply(data, options = {}) {
  return requestData("/algorithmReview/apply", data, "POST", "application/json", options);
}

/**
 * 算法审批列表（fly：GET /fly/algorithmReview/pageQuery）
 * - 暂未审批：approvalResults = 0
 * - 已经审批：approvalResults = 1,2；筛「通过/拒绝」时传 1 或 2
 * @param {{
 *   approvalTab?: "pending" | "approved",
 *   current?: number,
 *   pageSize?: number,
 *   approvalResults?: number|string,
 *   startTime?: string,
 *   endTime?: string,
 *   isAsc?: boolean,
 * }} params
 * @param {import('@/utils/request.js').RequestOptions} [options]
 */
export function fetchAlgorithmReviewApprovalPage(params, options = {}) {
  const {
    approvalTab,
    approvalResult,
    current,
    pageSize,
    startTime,
    endTime,
    isAsc,
    ...rest
  } = params || {};

  const baseQuery = {
    current,
    pageSize,
    startTime,
    endTime,
    isAsc,
    ...rest,
  };

  if (approvalTab === "pending") {
    return fetchAlgorithmReviewPage(
      { ...baseQuery, approvalResult: ALGORITHM_APPROVAL_RESULT.PENDING },
      options,
    );
  }

  if (approvalResult !== "" && approvalResult != null) {
    return fetchAlgorithmReviewPage({ ...baseQuery, approvalResult }, options);
  }

  return fetchAlgorithmReviewPage(
    { ...baseQuery, approvalResult: ALGORITHM_APPROVAL_RESULT_REVIEWED },
    options,
  );
}

/**
 * 新增算法审批（fly：POST /fly/algorithmReview/add）
 * @param {{
 *   applyUserId: string|number,
 *   algorithmCode: string,
 *   approvalUserId: string|number,
 *   approvalResult: number|string,
 *   approvalReason?: string,
 *   certificateUrl?: string,
 * }} data
 * @param {import('@/utils/request.js').RequestOptions} [options]
 */
export function addAlgorithmReview(data, options = {}) {
  return requestData("/algorithmReview/add", data, "POST", "application/json", options);
}

/**
 * 删除算法审批记录（fly：POST /fly/algorithmReview/delete）
 * @param {{ id: string|number }} data
 * @param {import('@/utils/request.js').RequestOptions} [options]
 */
export function deleteAlgorithmReview(data, options = {}) {
  return requestData("/algorithmReview/delete", data, "POST", "application/json", options);
}

/**
 * @param {Array<string|number>} ids
 * @param {import('@/utils/request.js').RequestOptions} [options]
 */
export async function deleteAlgorithmReviewBatch(ids, options = {}) {
  const uniqueIds = [...new Set((ids || []).filter((id) => id != null && id !== ""))];
  if (!uniqueIds.length) return;
  await Promise.all(uniqueIds.map((id) => deleteAlgorithmReview({ id }, options)));
}

/**
 * 算法审批操作（fly：POST /fly/algorithmReview/operate）
 * @param {{
 *   ids: Array<string|number>,
 *   approvalUserId: string|number,
 *   approvalResult: number|string,
 *   approvalReason?: string,
 * }} data
 * @param {import('@/utils/request.js').RequestOptions} [options]
 */
export function operateAlgorithmReview(data, options = {}) {
  const { ids, ...rest } = data || {};
  const uniqueIds = [...new Set((ids || []).filter((id) => id != null && id !== ""))];
  return requestData(
    "/algorithmReview/operate",
    { ids: uniqueIds, ...rest },
    "POST",
    "application/json",
    options,
  );
}

/**
 * @param {Array<string|number>} ids
 * @param {string|number} approvalUserId
 * @param {number|string} approvalResult
 * @param {string} [approvalReason]
 * @param {import('@/utils/request.js').RequestOptions} [options]
 */
export async function operateAlgorithmReviewBatch(
  ids,
  approvalUserId,
  approvalResult,
  approvalReason = "",
  options = {},
) {
  const uniqueIds = [...new Set((ids || []).filter((id) => id != null && id !== ""))];
  if (!uniqueIds.length) return;

  const reason = String(approvalReason ?? "").trim();
  await operateAlgorithmReview(
    {
      ids: uniqueIds,
      approvalUserId,
      approvalResult,
      approvalReason: reason || undefined,
    },
    options,
  );
}
