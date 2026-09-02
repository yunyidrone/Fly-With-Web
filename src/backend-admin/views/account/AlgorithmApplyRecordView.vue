<template>
  <div class="algorithm-apply-record">
    <div class="algorithm-apply-record__section algorithm-apply-record__section--actions">
      <el-button plain class="algorithm-apply-record__back-btn" @click="goBack">
        <el-icon><ArrowLeft /></el-icon>
        返回
      </el-button>
    </div>

    <div class="algorithm-apply-record__section algorithm-apply-record__section--title">
      <div class="algorithm-apply-record__title">算法申请记录</div>
    </div>

    <div class="algorithm-apply-record__section algorithm-apply-record__section--content">
      <div class="algorithm-apply-record__filters">
        <el-select
          v-model="query.approvalResults"
          multiple
          collapse-tags
          collapse-tags-tooltip
          placeholder="审批结果"
          clearable
          class="algorithm-apply-record__filter-item algorithm-apply-record__result"
          @change="search"
          @clear="search"
        >
          <el-option
            v-for="item in resultFilterOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>

        <div class="algorithm-apply-record__daterange-wrap">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="~"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            class="algorithm-apply-record__daterange"
            :style="{ '--el-date-editor-daterange-width': '300px' }"
            @change="handleDateRangeChange"
          />
        </div>

        <el-button type="primary" @click="search">查询</el-button>
        <el-button @click="resetFilters">重置</el-button>
      </div>

      <el-table
        v-loading="loading"
        :data="records"
        class="algorithm-apply-record__table"
        :default-sort="{ prop: 'createTime', order: 'descending' }"
        @sort-change="handleSortChange"
      >
        <el-table-column
          prop="createTime"
          label="申请时间"
          min-width="180"
          align="center"
          sortable="custom"
          :sort-orders="['descending', 'ascending']"
        >
          <template #default="{ row }">
            {{ row.createTime || "-" }}
          </template>
        </el-table-column>
        <el-table-column label="申请算法" min-width="120" align="center">
          <template #default="{ row }">
            {{ getAlgorithmCodeLabel(row.algorithmCode) }}
          </template>
        </el-table-column>
        <el-table-column label="申请人" min-width="120" align="center">
          <template #default="{ row }">
            <span v-if="row.applyUserName" class="algorithm-apply-record__applicant">
              {{ row.applyUserName }}
            </span>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="证明材料" min-width="100" align="center">
          <template #default="{ row }">
            <button
              v-if="row.certificateUrl"
              type="button"
              class="algorithm-apply-record__material"
              @click="previewMaterial(row.certificateUrl)"
            >
              <el-image
                :src="row.certificateUrl"
                fit="cover"
                class="algorithm-apply-record__material-image"
              />
            </button>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column
          prop="applyReason"
          label="申请理由"
          min-width="160"
          align="center"
          show-overflow-tooltip
        >
          <template #default="{ row }">
            {{ row.applyReason || "-" }}
          </template>
        </el-table-column>
        <el-table-column prop="updateTime" label="审核时间" min-width="180" align="center">
          <template #default="{ row }">
            {{ formatReviewTime(row) }}
          </template>
        </el-table-column>
        <el-table-column label="结果" min-width="90" align="center">
          <template #default="{ row }">
            <el-tag
              v-if="getAlgorithmApprovalResultMeta(row.approvalResult).label"
              :type="getAlgorithmApprovalResultMeta(row.approvalResult).tagType"
              size="small"
              effect="light"
            >
              {{ getAlgorithmApprovalResultMeta(row.approvalResult).label }}
            </el-tag>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column
          prop="approvalReason"
          label="审批原因"
          min-width="180"
          align="center"
          show-overflow-tooltip
        >
          <template #default="{ row }">
            {{ row.approvalReason || "-" }}
          </template>
        </el-table-column>
      </el-table>

      <div class="algorithm-apply-record__pagination">
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

    <el-image-viewer
      v-if="previewVisible"
      teleported
      :url-list="previewList"
      @close="previewVisible = false"
    />
  </div>
</template>

<script setup>
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { ArrowLeft } from "@element-plus/icons-vue";
import { ElMessage } from "element-plus";
import { useAuthStore } from "@/stores/auth.js";
import { fetchAlgorithmReviewPage } from "@backend/api/algorithm-review.js";
import { useTableQuery } from "@backend/composables/useTableQuery.js";
import {
  ALGORITHM_APPROVAL_RESULT,
  ALGORITHM_APPROVAL_RESULT_FILTER_OPTIONS,
  getAlgorithmApprovalResultMeta,
  getAlgorithmCodeLabel,
} from "@backend/config/algorithm-apply.js";
import { buildDateRangeTime } from "@backend/utils/login-log.js";
import { BACKEND_BASE } from "@backend/router/routes.js";

const router = useRouter();
const authStore = useAuthStore();
const dateRange = ref(null);
const resultFilterOptions = ALGORITHM_APPROVAL_RESULT_FILTER_OPTIONS;

function resolveApplyUserId() {
  return authStore.user?.id ?? authStore.user?.userId ?? null;
}
const { loading, records, total, query, load, search, reset, onPageChange, onSizeChange } =
  useTableQuery(fetchAlgorithmReviewPage, {
    pageSize: 10,
    applyUserId: resolveApplyUserId(),
    approvalResults: [],
    startTime: "",
    endTime: "",
    isAsc: false,
  });

const previewVisible = ref(false);
const previewList = ref([]);

function formatReviewTime(row) {
  if (Number(row.approvalResult) === ALGORITHM_APPROVAL_RESULT.PENDING) {
    return "-";
  }
  return row.updateTime || "-";
}

function previewMaterial(url) {
  const imageUrl = String(url || "").trim();
  if (!imageUrl) return;
  previewList.value = [imageUrl];
  previewVisible.value = true;
}

function handleDateRangeChange(range) {
  if (!Array.isArray(range) || range.length !== 2) {
    query.startTime = "";
    query.endTime = "";
    search();
    return;
  }
  const { startTime, endTime } = buildDateRangeTime(range, { endAtNow: true });
  query.startTime = startTime;
  query.endTime = endTime;
  search();
}

function handleSortChange({ prop, order }) {
  if (prop !== "createTime") return;
  query.isAsc = order === "ascending";
  search();
}

function resetFilters() {
  dateRange.value = null;
  reset({
    pageSize: query.pageSize,
    applyUserId: resolveApplyUserId(),
    approvalResults: [],
    startTime: "",
    endTime: "",
    isAsc: false,
  });
}

function goBack() {
  router.push(`${BACKEND_BASE}/algorithm-apply`);
}

onMounted(() => {
  const applyUserId = resolveApplyUserId();
  if (applyUserId == null || applyUserId === "") {
    ElMessage.warning("无法获取当前用户信息，请重新登录后再试");
    return;
  }
  query.applyUserId = applyUserId;
  load();
});
</script>

<style scoped lang="scss">
.algorithm-apply-record {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.algorithm-apply-record__section {
  background: #fff;
  border: 1px solid #ebeef5;
  border-radius: 4px;
}

.algorithm-apply-record__section--actions {
  padding: 12px 16px;
}

.algorithm-apply-record__section--title {
  padding: 14px 16px;
}

.algorithm-apply-record__section--content {
  padding: 20px 16px 24px;
}

.algorithm-apply-record__filters {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 16px;
}

.algorithm-apply-record__result {
  width: 220px;
}

.algorithm-apply-record__daterange-wrap {
  display: inline-flex;
  align-items: center;
}

.algorithm-apply-record__back-btn {
  --el-button-text-color: #d87533;
  --el-button-border-color: #d87533;
  --el-button-hover-text-color: #d87533;
  --el-button-hover-border-color: #d87533;
  --el-button-hover-bg-color: #fdf6f0;
}

.algorithm-apply-record__title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.algorithm-apply-record__table {
  width: 100%;
}

.algorithm-apply-record__pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}

.algorithm-apply-record__applicant {
  color: var(--el-color-primary);
}

.algorithm-apply-record__material {
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

.algorithm-apply-record__material-image {
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
