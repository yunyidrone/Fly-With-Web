<template>
  <div class="algorithm-approval">
    <div class="algorithm-approval__section algorithm-approval__section--org">
      <OrgCascader
        v-model="selectedOrgId"
        :options="orgTreeOptions"
        :loading="orgCascaderLoading"
        select-class="algorithm-approval__org-select"
        @change="handleOrgChange"
      />
      <!-- <el-button class="algorithm-approval__tree-btn" @click="treeDrawerVisible = true">
        单位树算法
      </el-button> -->
    </div>

    <div class="algorithm-approval__section algorithm-approval__section--content">
      <el-tabs v-model="activeTab" class="algorithm-approval__tabs">
        <el-tab-pane label="暂未审批" name="pending" />
        <el-tab-pane label="已经审批" name="approved" />
      </el-tabs>

      <div v-if="activeTab === 'pending'" class="algorithm-approval__toolbar">
        <div class="algorithm-approval__toolbar-left">
          <el-button
            class="algorithm-approval__batch-btn algorithm-approval__batch-btn--approve"
            :disabled="!selectedRows.length"
            @click="handleBatchApprove"
          >
            <el-icon><CircleCheck /></el-icon>
            批量通过
          </el-button>
          <el-button
            class="algorithm-approval__batch-btn algorithm-approval__batch-btn--reject"
            :disabled="!selectedRows.length"
            @click="openRejectDialog(selectedRows)"
          >
            <el-icon><CircleClose /></el-icon>
            批量拒绝
          </el-button>
        </div>

        <div class="algorithm-approval__toolbar-right">
          <div class="algorithm-approval__daterange-wrap">
            <span class="algorithm-approval__daterange-label">选择申请日期：</span>
            <el-date-picker
              v-model="dateRange"
              type="daterange"
              range-separator="~"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              value-format="YYYY-MM-DD"
              class="algorithm-approval__daterange"
              @change="handleDateRangeChange"
            />
          </div>
          <el-select
            v-model="query.applyUserId"
            placeholder="选择申请人"
            filterable
            clearable
            :loading="accountLoading"
            class="algorithm-approval__account-select"
            @change="handleApplicantSearch"
            @clear="handleApplicantSearch"
          >
            <el-option
              v-for="item in accountOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </div>
      </div>

      <div v-else class="algorithm-approval__toolbar algorithm-approval__toolbar--approved">
        <el-button type="primary" plain class="algorithm-approval__create-btn" @click="createDialogVisible = true">
          <el-icon><Plus /></el-icon>
          新增审批
        </el-button>

        <div class="algorithm-approval__toolbar-right">
          <div class="algorithm-approval__daterange-wrap">
            <span class="algorithm-approval__daterange-label">选择申请日期：</span>
            <el-date-picker
              v-model="dateRange"
              type="daterange"
              range-separator="~"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              value-format="YYYY-MM-DD"
              class="algorithm-approval__daterange"
              @change="handleDateRangeChange"
            />
          </div>
          <el-select
            v-model="query.applyUserId"
            placeholder="选择申请人"
            filterable
            clearable
            :loading="accountLoading"
            class="algorithm-approval__account-select"
            @change="handleApplicantSearch"
            @clear="handleApplicantSearch"
          >
            <el-option
              v-for="item in accountOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </div>
      </div>

      <el-table
        :key="activeTab"
        v-loading="loading"
        :data="displayRecords"
        class="algorithm-approval__table"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="48" align="center" />
        <el-table-column prop="applyTime" label="申请时间" min-width="180" align="center" />
        <!-- <el-table-column prop="orgName" label="申请单位" min-width="140" align="center" /> -->
        <el-table-column label="申请算法" min-width="160" align="center">
          <template #default="{ row }">
            {{ row.algorithmLabel || getAlgorithmCodeLabel(row.algorithmType) }}
          </template>
        </el-table-column>
        <el-table-column label="申请人" min-width="100" align="center">
          <template #default="{ row }">
            <span v-if="row.applicant" class="algorithm-approval__applicant">
              {{ row.applicant }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="证明材料" min-width="100" align="center">
          <template #default="{ row }">
            <button
              v-if="row.materials?.length"
              type="button"
              class="algorithm-approval__material"
              @click="previewMaterial(row.materials[0])"
            >
              <el-image
                v-if="row.materials[0].url"
                :src="row.materials[0].url"
                fit="cover"
                class="algorithm-approval__material-image"
              />
              <el-icon v-else :size="22"><Picture /></el-icon>
            </button>
          </template>
        </el-table-column>
        <el-table-column
          prop="reason"
          label="申请理由"
          min-width="160"
          align="center"
          show-overflow-tooltip
        />
        <template v-if="activeTab === 'approved'">
          <el-table-column prop="reviewTime" label="审核时间" min-width="180" align="center" />
          <el-table-column
            label="结果"
            min-width="120"
            align="center"
            :filters="resultFilters"
            :filter-method="filterResult"
          >
            <template #filter-icon>
              <el-icon><Filter /></el-icon>
            </template>
            <template #default="{ row }">
              <el-tag
                :type="getAlgorithmApprovalResultMeta(row.approvalResult).tagType"
                size="small"
                effect="light"
              >
                {{ getAlgorithmApprovalResultMeta(row.approvalResult).label }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column
            prop="reviewReason"
            label="审批原因"
            min-width="180"
            align="center"
            show-overflow-tooltip
          />
          <el-table-column label="操作" min-width="80" align="center" fixed="right">
            <template #default="{ row }">
              <el-button link type="danger" @click="handleDelete(row)">删除</el-button>
            </template>
          </el-table-column>
        </template>
        <el-table-column
          v-else
          label="操作"
          min-width="180"
          align="center"
          fixed="right"
        >
          <template #default="{ row }">
            <el-button link type="danger" @click="handleDelete(row)">删除</el-button>
            <el-button link type="primary" @click="handleApprove(row)">通过</el-button>
            <el-button link type="primary" @click="openRejectDialog([row])">拒绝</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="algorithm-approval__pagination">
        <el-pagination
          :current-page="query.current"
          :page-size="query.pageSize"
          :total="total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next"
          background
          @current-change="onPageChange"
          @size-change="onSizeChange"
        />
      </div>
    </div>

    <AlgorithmOrgTreeDrawer
      v-model:visible="treeDrawerVisible"
      :tree-data="state.orgAlgorithmTree"
    />

    <AlgorithmRejectDialog
      v-model:visible="rejectDialogVisible"
      @confirm="handleRejectConfirm"
    />

    <AlgorithmApprovalCreateDialog
      v-model:visible="createDialogVisible"
      :org-id="createDialogOrgId"
      @success="handleCreateSuccess"
    />

    <el-image-viewer
      v-if="previewVisible"
      teleported
      :url-list="previewList"
      @close="previewVisible = false"
    />
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from "vue";
import { CircleCheck, CircleClose, Filter, Picture, Plus } from "@element-plus/icons-vue";
import { ElMessage, ElMessageBox } from "element-plus";
import OrgCascader from "@backend/components/OrgCascader.vue";
import AlgorithmOrgTreeDrawer from "@backend/components/AlgorithmOrgTreeDrawer.vue";
import AlgorithmRejectDialog from "@backend/components/AlgorithmRejectDialog.vue";
import AlgorithmApprovalCreateDialog from "@backend/components/AlgorithmApprovalCreateDialog.vue";
import { useOrgCascader } from "@backend/composables/useOrgCascader.js";
import { useAlgorithmApply } from "@backend/composables/useAlgorithmApply.js";
import { useTableQuery } from "@backend/composables/useTableQuery.js";
import { fetchAlgorithmReviewApprovalPage, operateAlgorithmReviewBatch, deleteAlgorithmReviewBatch } from "@backend/api/algorithm-review.js";
import { fetchUserPage } from "@backend/api/user.js";
import { unwrapApiList } from "@backend/utils/request.js";
import {
  ALGORITHM_APPROVAL_RESULT,
  getAlgorithmApprovalResultMeta,
  getAlgorithmCodeLabel,
  parseAlgorithmCodes,
  resolveAlgorithmLabels,
} from "@backend/config/algorithm-apply.js";
import { buildDateRangeTime } from "@backend/utils/login-log.js";
import { useAuthStore } from "@/stores/auth.js";

defineOptions({ name: "BackendAlgorithmApproval" });

const authStore = useAuthStore();
const { state } = useAlgorithmApply();

const {
  orgTreeOptions,
  selectedOrgId,
  loading: orgCascaderLoading,
  initOrgCascader,
} = useOrgCascader({ autoSelectFirst: true });

const activeTab = ref("pending");
const selectedRows = ref([]);
const dateRange = ref([]);
const treeDrawerVisible = ref(false);
const rejectDialogVisible = ref(false);
const createDialogVisible = ref(false);
const rejectTargets = ref([]);
const previewVisible = ref(false);
const previewList = ref([]);
const accountLoading = ref(false);
const accountOptions = ref([]);

const resultFilters = [
  { text: "通过", value: ALGORITHM_APPROVAL_RESULT.APPROVED },
  { text: "拒绝", value: ALGORITHM_APPROVAL_RESULT.REJECTED },
];

const { loading, records, total, query, load, search, onPageChange, onSizeChange } = useTableQuery(
  (params) =>
    fetchAlgorithmReviewApprovalPage({
      ...params,
      approvalTab: activeTab.value,
    }),
  {
    pageSize: 10,
    approvalResult: "",
    applyUserId: null,
    startTime: "",
    endTime: "",
    isAsc: false,
  },
);

const createDialogOrgId = computed(() => authStore.orgId ?? authStore.effectiveOrgId);

async function loadAccountOptions() {
  const orgId = createDialogOrgId.value;
  if (orgId == null || orgId === "") {
    accountOptions.value = [];
    return;
  }

  accountLoading.value = true;
  try {
    const data = await fetchUserPage({
      orgId,
      current: 1,
      pageSize: 500,
    });
    accountOptions.value = unwrapApiList(data)
      .map((item) => ({
        value: item.id ?? item.userId,
        label: item.userName || item.username || String(item.id ?? item.userId ?? ""),
      }))
      .filter((item) => item.value != null && item.value !== "");
  } catch {
    accountOptions.value = [];
  } finally {
    accountLoading.value = false;
  }
}

function normalizeReviewRecord(row) {
  const algorithmType = row.algorithmCode || row.algorithmType;
  const algorithmCodes = parseAlgorithmCodes(algorithmType);
  return {
    id: row.id,
    applyTime: row.createTime || row.applyTime || "",
    orgName: row.orgName || row.applyOrgName || row.organizationName || "",
    orgId: row.orgId ?? row.applyOrgId,
    algorithmType,
    algorithmCodes,
    algorithmLabel: resolveAlgorithmLabels(algorithmType),
    applicant: row.applyUserName || row.applicant || row.userName || "",
    materials: row.certificateUrl ? [{ url: row.certificateUrl }] : [],
    reason: row.applyReason || row.reason || "",
    reviewTime: row.updateTime || row.reviewTime || "",
    reviewReason: row.approvalReason || row.reviewReason || "",
    approvalResult: Number(row.approvalResult),
  };
}

function buildGroupKey(record) {
  return [
    record.applyTime,
    record.orgId,
    record.orgName,
    record.applicant,
    record.reason,
  ].join("|");
}

function appendReviewReason(group, reason) {
  const text = String(reason || "").trim();
  if (!text) return;
  const parts = String(group.reviewReason || "")
    .split("；")
    .map((item) => item.trim())
    .filter(Boolean);
  if (parts.includes(text)) return;
  group.reviewReason = parts.length ? `${parts.join("；")}；${text}` : text;
}

function groupRecords(list) {
  const map = new Map();

  list.forEach((record) => {
    const groupKey = buildGroupKey(record);
    if (!map.has(groupKey)) {
      const algorithmCodes = record.algorithmCodes?.length
        ? record.algorithmCodes
        : parseAlgorithmCodes(record.algorithmType);
      map.set(groupKey, {
        groupKey,
        ids: [record.id],
        applyTime: record.applyTime,
        orgId: record.orgId,
        orgName: record.orgName,
        applicant: record.applicant,
        materials: record.materials,
        reason: record.reason,
        reviewTime: record.reviewTime,
        reviewReason: record.reviewReason || "",
        approvalResult: record.approvalResult,
        algorithmTypes: [...algorithmCodes],
      });
      return;
    }

    const group = map.get(groupKey);
    group.ids.push(record.id);
    group.algorithmTypes.push(...record.algorithmCodes);
    appendReviewReason(group, record.reviewReason);
  });

  return [...map.values()].map((group) => ({
    ...group,
    algorithmLabel: resolveAlgorithmLabels(...group.algorithmTypes),
  }));
}

const displayRecords = computed(() => {
  const source = Array.isArray(records.value) ? records.value : [];
  const list = source.map(normalizeReviewRecord);
  return activeTab.value === "approved" ? groupRecords(list) : list;
});

watch(activeTab, () => {
  selectedRows.value = [];
  query.approvalResult = "";
  query.current = 1;
  load();
});

function handleOrgChange() {
  selectedRows.value = [];
}

function handleDateRangeChange(range) {
  if (!Array.isArray(range) || range.length !== 2) {
    query.startTime = "";
    query.endTime = "";
  } else {
    const { startTime, endTime } = buildDateRangeTime(range, { endAtNow: true });
    query.startTime = startTime;
    query.endTime = endTime;
  }
  search();
}

function handleApplicantSearch() {
  selectedRows.value = [];
  search();
}

function handleSelectionChange(rows) {
  selectedRows.value = rows;
}

function filterResult(value, row) {
  return Number(row.approvalResult) === Number(value);
}

function resolveApprovalUserId() {
  return authStore.user?.id ?? authStore.user?.userId ?? null;
}

async function submitReviewOperation(ids, approvalResult, approvalReason = "") {
  const approvalUserId = resolveApprovalUserId();
  if (approvalUserId == null || approvalUserId === "") {
    throw new Error("无法获取当前审批人信息，请重新登录后再试");
  }

  await operateAlgorithmReviewBatch(ids, approvalUserId, approvalResult, approvalReason);
}

function previewMaterial(material) {
  const url = String(material?.url || "").trim();
  if (!url) return;
  previewList.value = [url];
  previewVisible.value = true;
}

async function handleApprove(row) {
  await ElMessageBox.confirm("是否要通过当前申请？", "通过确认", {
    type: "warning",
    confirmButtonText: "确认",
    cancelButtonText: "取消",
  });
  try {
    const ids = row.ids || [row.id];
    await submitReviewOperation(ids, ALGORITHM_APPROVAL_RESULT.APPROVED, "同意");
    selectedRows.value = selectedRows.value.filter((item) => item.id !== row.id);
    ElMessage.success("已通过");
    await load();
  } catch (error) {
    ElMessage.warning(error?.message || "通过失败");
  }
}

async function handleBatchApprove() {
  if (!selectedRows.value.length) return;
  await ElMessageBox.confirm("是否要通过当前申请？", "通过确认", {
    type: "warning",
    confirmButtonText: "确认",
    cancelButtonText: "取消",
  });
  try {
    const ids = selectedRows.value.flatMap((item) => item.ids || [item.id]);
    await submitReviewOperation(ids, ALGORITHM_APPROVAL_RESULT.APPROVED, "同意");
    selectedRows.value = [];
    ElMessage.success("批量通过成功");
    await load();
  } catch (error) {
    ElMessage.warning(error?.message || "批量通过失败");
  }
}

function openRejectDialog(rows) {
  if (!rows.length) return;
  rejectTargets.value = rows;
  rejectDialogVisible.value = true;
}

async function handleRejectConfirm(reason) {
  const ids = rejectTargets.value.flatMap((item) => item.ids || [item.id]);
  if (!ids.length) return;
  try {
    await submitReviewOperation(ids, ALGORITHM_APPROVAL_RESULT.REJECTED, reason);
    selectedRows.value = selectedRows.value.filter((item) => {
      const itemIds = item.ids || [item.id];
      return !itemIds.some((id) => ids.includes(id));
    });
    rejectTargets.value = [];
    ElMessage.success(ids.length > 1 ? "批量拒绝成功" : "已拒绝");
    await load();
  } catch (error) {
    ElMessage.warning(error?.message || "拒绝失败");
  }
}

async function handleDelete(row) {
  await ElMessageBox.confirm("是否删除当前申请？", "删除确认", {
    type: "warning",
    confirmButtonText: "确认",
    cancelButtonText: "取消",
  });
  const ids = row.ids || [row.id];
  try {
    await deleteAlgorithmReviewBatch(ids);
    selectedRows.value = selectedRows.value.filter((item) => {
      const itemIds = item.ids || [item.id];
      return !itemIds.some((id) => ids.includes(id));
    });
    ElMessage.success("删除成功");
    await load();
  } catch (error) {
    ElMessage.warning(error?.message || "删除失败");
  }
}

async function handleCreateSuccess() {
  ElMessage.success("新增审批成功");
  await load();
}

onMounted(async () => {
  await initOrgCascader(authStore);
  await loadAccountOptions();
  await load();
});
</script>

<style scoped lang="scss">
.algorithm-approval {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.algorithm-approval__section {
  background: #fff;
  border: 1px solid #ebeef5;
  border-radius: 4px;
}

.algorithm-approval__section--org {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 16px;
}

.algorithm-approval__section--content {
  padding: 0 16px 24px;
}

.algorithm-approval__org-select {
  width: 280px;
}

.algorithm-approval__tree-btn {
  min-width: 108px;
  height: 36px;
  color: var(--el-color-primary);
  border-color: var(--el-color-primary);
  background: #fff;

  &:hover,
  &:focus {
    color: var(--el-color-primary);
    border-color: var(--el-color-primary);
    background: var(--el-color-primary-light-9);
  }
}

.algorithm-approval__tabs {
  :deep(.el-tabs__header) {
    margin-bottom: 16px;
  }
}

.algorithm-approval__toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.algorithm-approval__toolbar--approved {
  justify-content: space-between;
}

.algorithm-approval__toolbar-left,
.algorithm-approval__toolbar-right {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.algorithm-approval__create-btn {
  height: 36px;
  padding: 0 16px;

  .el-icon {
    margin-right: 6px;
  }
}

.algorithm-approval__batch-btn {
  height: 36px;
  padding: 0 16px;

  .el-icon {
    margin-right: 6px;
  }
}

.algorithm-approval__batch-btn--approve {
  --el-button-text-color: #67c23a;
  --el-button-border-color: #67c23a;
  --el-button-hover-text-color: #67c23a;
  --el-button-hover-border-color: #67c23a;
  --el-button-hover-bg-color: #f0f9eb;
}

.algorithm-approval__batch-btn--reject {
  --el-button-text-color: #f56c6c;
  --el-button-border-color: #f56c6c;
  --el-button-hover-text-color: #f56c6c;
  --el-button-hover-border-color: #f56c6c;
  --el-button-hover-bg-color: #fef0f0;
}

.algorithm-approval__daterange-wrap {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.algorithm-approval__daterange-label {
  flex-shrink: 0;
  font-size: 14px;
  color: #606266;
  white-space: nowrap;
}

.algorithm-approval__daterange {
  width: 280px;
}

.algorithm-approval__account-select {
  width: 220px;
}

.algorithm-approval__table {
  width: 100%;
}

.algorithm-approval__pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}

.algorithm-approval__applicant {
  color: var(--el-color-primary);
}

.algorithm-approval__material {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  padding: 0;
  border: 1px solid #ebeef5;
  border-radius: 6px;
  background: #f5f7fa;
  color: #c0c4cc;
  cursor: pointer;

  &:hover {
    border-color: var(--el-color-primary-light-5);
  }
}

.algorithm-approval__material-image {
  width: 38px;
  height: 38px;
  border-radius: 5px;
  overflow: hidden;

  :deep(.el-image__inner) {
    width: 100%;
    height: 100%;
  }
}
</style>
