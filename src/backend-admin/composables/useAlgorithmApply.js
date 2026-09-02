import { computed, reactive } from "vue";
import {
  ALGORITHM_APPLY_RESULT,
  ALGORITHM_APPLY_TYPE,
  ALGORITHM_APPLY_TYPE_OPTIONS,
  ALGORITHM_SOURCE,
  getAlgorithmApplyTypeLabel,
} from "@backend/config/algorithm-apply.js";
import { ORG_LABEL } from "@backend/config/constants.js";

function pad(value) {
  return String(value).padStart(2, "0");
}

function formatDateTime(date = new Date()) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

function createId() {
  return `algo-apply-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function matchOrgId(recordOrgId, orgId) {
  if (orgId == null || orgId === "") return true;
  return String(recordOrgId ?? "") === String(orgId);
}

const PLACEHOLDER_IMAGE =
  "data:image/svg+xml," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48"><rect width="48" height="48" rx="4" fill="#f2f3f5"/><path d="M10 34l8-10 6 7 8-11 6 14H10z" fill="#c0c4cc"/><circle cx="18" cy="16" r="3" fill="#c0c4cc"/></svg>`,
  );

const DEMO_APPLY_TIME = "2026-08-31 18:17:21";
const DEMO_PENDING_TIME = "2026-08-31 19:50:44";
const DEMO_APPROVED_TIME = "2026-08-31 21:10:00";

/**
 * 页面联调前的本地状态。接口就绪后替换为请求结果即可。
 */
const state = reactive({
  approverOrgName: "黄岩区总管理",
  records: [
    {
      id: "demo-pending-jiangkou",
      applyTime: DEMO_PENDING_TIME,
      orgId: "org-jiangkou",
      orgName: "江口派出所",
      algorithmType: ALGORITHM_APPLY_TYPE.FACE,
      applicant: "zm",
      materials: [{ url: PLACEHOLDER_IMAGE, name: "证明材料.png" }],
      reason: "XXXXXXXXXXX",
      reviewTime: "",
      result: ALGORITHM_APPLY_RESULT.PENDING,
      reviewReason: "",
    },
    {
      id: "demo-pending-tuotuo",
      applyTime: DEMO_PENDING_TIME,
      orgId: "org-tuotuo",
      orgName: "头陀派出所",
      algorithmType: ALGORITHM_APPLY_TYPE.FACE,
      applicant: "fhfj",
      materials: [{ url: PLACEHOLDER_IMAGE, name: "证明材料.png" }],
      reason: "XXXXXXXXXXX",
      reviewTime: "",
      result: ALGORITHM_APPLY_RESULT.PENDING,
      reviewReason: "",
    },
    {
      id: "demo-approved-jiangkou",
      applyTime: DEMO_APPROVED_TIME,
      orgId: "org-jiangkou",
      orgName: "江口派出所",
      algorithmType: ALGORITHM_APPLY_TYPE.FACE,
      applicant: "zm",
      materials: [{ url: PLACEHOLDER_IMAGE, name: "证明材料.png" }],
      reason: "需要做人脸布控",
      reviewTime: DEMO_APPROVED_TIME,
      result: ALGORITHM_APPLY_RESULT.APPROVED,
      reviewReason: "同意",
      source: ALGORITHM_SOURCE.ACTIVE_ADD,
    },
    {
      id: "demo-approved-tuotuo-face",
      applyTime: DEMO_APPROVED_TIME,
      orgId: "org-tuotuo",
      orgName: "头陀派出所",
      algorithmType: ALGORITHM_APPLY_TYPE.FACE,
      applicant: "fghx",
      materials: [{ url: PLACEHOLDER_IMAGE, name: "证明材料.png" }],
      reason: "需要做人脸布控",
      reviewTime: DEMO_APPROVED_TIME,
      result: ALGORITHM_APPLY_RESULT.APPROVED,
      reviewReason: "同意",
      source: ALGORITHM_SOURCE.ACTIVE_ADD,
    },
    {
      id: "demo-approved-tuotuo-vehicle",
      applyTime: DEMO_APPROVED_TIME,
      orgId: "org-tuotuo",
      orgName: "头陀派出所",
      algorithmType: ALGORITHM_APPLY_TYPE.VEHICLE,
      applicant: "fghx",
      materials: [{ url: PLACEHOLDER_IMAGE, name: "证明材料.png" }],
      reason: "需要做人脸布控",
      reviewTime: DEMO_APPROVED_TIME,
      result: ALGORITHM_APPLY_RESULT.REJECTED,
      reviewReason: "材料不足，请重新提交！",
      source: ALGORITHM_SOURCE.ACTIVE_ADD,
    },
    {
      id: "demo-approved-face-old",
      applyTime: DEMO_APPLY_TIME,
      orgId: "org-wenxing",
      orgName: "文兴路派出所",
      algorithmType: ALGORITHM_APPLY_TYPE.FACE,
      applicant: "zm",
      materials: [{ url: PLACEHOLDER_IMAGE, name: "证明材料.png" }],
      reason: "需要做人脸布控",
      reviewTime: DEMO_APPLY_TIME,
      result: ALGORITHM_APPLY_RESULT.APPROVED,
      reviewReason: "同意",
    },
    {
      id: "demo-rejected-vehicle",
      applyTime: DEMO_APPLY_TIME,
      orgId: "org-xingfu",
      orgName: "幸福路派出所",
      algorithmType: ALGORITHM_APPLY_TYPE.VEHICLE,
      applicant: "fghx",
      materials: [{ url: PLACEHOLDER_IMAGE, name: "证明材料.png" }],
      reason: "需要做车辆布控",
      reviewTime: DEMO_APPLY_TIME,
      result: ALGORITHM_APPLY_RESULT.REJECTED,
      reviewReason: "材料不足，请重新提交！",
    },
  ],
  orgAlgorithmTree: [
    {
      id: "org-huangyan",
      name: "黄岩区管理",
      orgLabel: ORG_LABEL.PUBLIC_SECURITY_BUREAU,
      children: [
        {
          id: "org-wenxing",
          name: "文兴路派出所",
          orgLabel: ORG_LABEL.POLICE_STATION,
          algorithms: [
            { type: ALGORITHM_APPLY_TYPE.FACE, source: ALGORITHM_SOURCE.SELF_APPLY },
            { type: ALGORITHM_APPLY_TYPE.VEHICLE, source: ALGORITHM_SOURCE.SELF_APPLY },
          ],
        },
        {
          id: "org-xingfu",
          name: "幸福路派出所",
          orgLabel: ORG_LABEL.POLICE_STATION,
          algorithms: [{ type: ALGORITHM_APPLY_TYPE.FACE, source: ALGORITHM_SOURCE.ACTIVE_ADD }],
        },
      ],
    },
  ],
});

function getOrgRecords(orgId) {
  return state.records.filter((item) => matchOrgId(item.orgId, orgId));
}

function getOwnedTypesForOrg(orgId) {
  return [
    ...new Set(
      getOrgRecords(orgId)
        .filter((item) => item.result === ALGORITHM_APPLY_RESULT.APPROVED)
        .map((item) => item.algorithmType),
    ),
  ];
}

function getPendingTypesForOrg(orgId) {
  return [
    ...new Set(
      getOrgRecords(orgId)
        .filter((item) => item.result === ALGORITHM_APPLY_RESULT.PENDING)
        .map((item) => item.algorithmType),
    ),
  ];
}

function hasPendingForOrg(orgId) {
  return getPendingTypesForOrg(orgId).length > 0;
}

function findRecordById(id) {
  return state.records.find((item) => item.id === id) || null;
}

export function useAlgorithmApply(orgIdRef) {
  const ownedTypes = computed(() => getOwnedTypesForOrg(orgIdRef?.value));
  const pendingTypes = computed(() => getPendingTypesForOrg(orgIdRef?.value));
  const ownedTypeSet = computed(() => new Set(ownedTypes.value));
  const pendingTypeSet = computed(() => new Set(pendingTypes.value));
  const hasPending = computed(() => pendingTypes.value.length > 0);

  const pendingRecords = computed(() =>
    state.records.filter((item) => item.result === ALGORITHM_APPLY_RESULT.PENDING),
  );

  const approvedRecords = computed(() =>
    state.records.filter((item) => item.result !== ALGORITHM_APPLY_RESULT.PENDING),
  );

  function isTypeDisabled(type, orgId = orgIdRef?.value) {
    const owned = new Set(getOwnedTypesForOrg(orgId));
    const pending = new Set(getPendingTypesForOrg(orgId));
    return owned.has(type) || pending.has(type);
  }

  function submitApplication({ types, reason, materials, applicant, orgName, orgId }) {
    const selected = [...new Set(types)].filter((type) => !isTypeDisabled(type, orgId));
    if (!selected.length) {
      throw new Error("没有可申请的算法类型");
    }
    if (hasPendingForOrg(orgId)) {
      throw new Error("算法正在审核中，请等待上级拒绝或删除后再提交");
    }

    const applyTime = formatDateTime();
    const nextRecords = selected.map((algorithmType) => ({
      id: createId(),
      applyTime,
      orgId: orgId ?? null,
      orgName: String(orgName || "").trim(),
      algorithmType,
      applicant: String(applicant || "").trim(),
      materials: (materials || []).map((item) => ({
        url: item.url,
        name: item.name || "证明材料",
      })),
      reason: String(reason || "").trim(),
      reviewTime: "",
      result: ALGORITHM_APPLY_RESULT.PENDING,
      reviewReason: "",
    }));

    state.records = [...nextRecords, ...state.records];
    return nextRecords;
  }

  function approveRecords(ids) {
    const reviewTime = formatDateTime();
    const idSet = new Set(ids);
    state.records.forEach((record) => {
      if (!idSet.has(record.id) || record.result !== ALGORITHM_APPLY_RESULT.PENDING) return;
      record.result = ALGORITHM_APPLY_RESULT.APPROVED;
      record.reviewTime = reviewTime;
      record.reviewReason = "同意";
    });
  }

  function rejectRecords(ids, reviewReason) {
    const reason = String(reviewReason || "").trim();
    if (!reason) {
      throw new Error("请输入拒绝原因");
    }

    const reviewTime = formatDateTime();
    const idSet = new Set(ids);
    state.records.forEach((record) => {
      if (!idSet.has(record.id) || record.result !== ALGORITHM_APPLY_RESULT.PENDING) return;
      record.result = ALGORITHM_APPLY_RESULT.REJECTED;
      record.reviewTime = reviewTime;
      record.reviewReason = reason;
    });
  }

  function deleteRecord(id) {
    state.records = state.records.filter((item) => item.id !== id);
  }

  function deleteRecords(ids) {
    const idSet = new Set(ids);
    state.records = state.records.filter((item) => !idSet.has(item.id));
  }

  function createActiveApproval({ orgId, orgName, types, reviewReason, materials, reviewer }) {
    const selected = [...new Set(types)];
    if (!selected.length) {
      throw new Error("请选择算法");
    }
    if (!orgId) {
      throw new Error("请选择下级单位");
    }

    const now = formatDateTime();
    const reasonText = String(reviewReason || "").trim() || "同意";
    const nextRecords = selected.map((algorithmType) => ({
      id: createId(),
      applyTime: now,
      orgId: orgId ?? null,
      orgName: String(orgName || "").trim(),
      algorithmType,
      applicant: String(reviewer || "").trim(),
      materials: (materials || []).map((item) => ({
        url: item.url,
        name: item.name || "审批证明",
      })),
      reason: reasonText,
      reviewTime: now,
      result: ALGORITHM_APPLY_RESULT.APPROVED,
      reviewReason: reasonText,
      source: ALGORITHM_SOURCE.ACTIVE_ADD,
    }));

    state.records = [...nextRecords, ...state.records];
    return nextRecords;
  }

  return {
    state,
    ownedTypes,
    pendingTypes,
    ownedTypeSet,
    pendingTypeSet,
    hasPending,
    pendingRecords,
    approvedRecords,
    typeOptions: ALGORITHM_APPLY_TYPE_OPTIONS,
    isTypeDisabled,
    submitApplication,
    approveRecords,
    rejectRecords,
    deleteRecord,
    deleteRecords,
    createActiveApproval,
    getAlgorithmApplyTypeLabel,
  };
}
