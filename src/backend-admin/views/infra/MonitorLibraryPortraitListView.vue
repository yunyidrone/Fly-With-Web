<template>
  <div class="infra-page">
    <div class="infra-page__section portrait-list__section--actions">
      <el-button plain class="portrait-list__accent-btn" @click="goBack">
        <el-icon><ArrowLeft /></el-icon>返回
      </el-button>
    </div>

    <div class="infra-page__section portrait-list__section--title">
      <div class="portrait-list__toolbar">
        <div class="portrait-list__meta">
          <span class="portrait-list__title">人脸管理</span>
          <span class="portrait-list__meta-item">
            人脸库名称: {{ groupName || "-" }}
          </span>
          <span class="portrait-list__meta-item">
            人脸库ID: {{ groupId || "-" }}
          </span>
        </div>
        <div class="portrait-list__actions">
          <el-button
            class="portrait-list__batch-btn"
            type="primary"
            :disabled="!portraitSelectedIds.length"
            @click="handleBatchDelete"
          >
            批量删除
          </el-button>
          <el-button class="portrait-list__accent-btn" @click="goCreate">
            新增人脸
          </el-button>
        </div>
      </div>
    </div>

    <div class="infra-page__section portrait-list__section--content">
      <div class="infra-page__filters">
        <el-input
          v-model="portraitQuery.name"
          class="infra-page__filter-item infra-page__filter-item--name"
          placeholder="人像名称"
          clearable
          @keyup.enter="searchPortrait"
          @clear="searchPortrait"
        />
        <!-- <el-select
          v-model="portraitQuery.gender"
          class="infra-page__filter-item infra-page__filter-item--gender"
          placeholder="性别"
          clearable
          @change="searchPortrait"
          @clear="searchPortrait"
        >
          <el-option
            v-for="item in genderOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select> -->
        <el-button type="primary" @click="searchPortrait">查询</el-button>
        <el-button @click="resetPortraitFilters">重置</el-button>
      </div>

      <el-table
        ref="tableRef"
        v-loading="portraitLoading"
        :data="portraitRecords"
        stripe
        class="monitor-library__table"
        @filter-change="handleTableFilterChange"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="50" />
        <el-table-column prop="name" label="人像名称" width="100" show-overflow-tooltip />
        <el-table-column label="图像" width="120">
          <template #default="{ row }">
            <el-image
              v-if="row.imageUrl"
              :src="row.imageUrl"
              :preview-src-list="[row.imageUrl]"
              :preview-z-index="3000"
              fit="contain"
              preview-teleported
              class="monitor-library__image"
            />
            <div v-else class="monitor-library__image monitor-library__image--placeholder">
              <el-icon :size="28"><Picture /></el-icon>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="id" label="人脸ID" min-width="180" show-overflow-tooltip />
        <el-table-column
          label="性别"
          min-width="120"
          show-overflow-tooltip
          column-key="gender"
          :filters="genderTableFilters"
          :filtered-value="genderFilteredValue"
          :filter-multiple="false"
          filter-class-name="portrait-list__gender-filter"
        >
          <template #filter-icon>
            <el-icon><Filter /></el-icon>
          </template>
          <template #default="{ row }">
            {{ row.genderLabel || "未知" }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="goEdit(row.id)">编辑</el-button>
            <el-button link type="danger" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
        <template #empty>
          <div class="monitor-library__empty">暂无数据</div>
        </template>
      </el-table>

      <div class="infra-page__pagination">
        <el-pagination
          :current-page="portraitQuery.current"
          :page-size="portraitQuery.pageSize"
          :total="portraitTotal"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          background
          @current-change="onPortraitPageChange"
          @size-change="onPortraitSizeChange"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { Filter, Picture } from "@element-plus/icons-vue";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  deletePortrait,
  fetchPersonGroupPage,
  fetchPortraitPage,
} from "@backend/api/monitor-library.js";
import { useTableQuery } from "@backend/composables/useTableQuery.js";
import { PORTRAIT_GENDER_OPTIONS } from "@backend/config/constants.js";
import { INFRA_BASE } from "@backend/router/routes.js";

const router = useRouter();
const route = useRoute();
const tableRef = ref();
const portraitSelectedIds = ref([]);
const genderOptions = PORTRAIT_GENDER_OPTIONS;
const genderTableFilters = genderOptions.map((item) => ({
  text: item.label,
  value: item.value,
}));

const groupId = computed(() => String(route.params.groupId ?? "").trim());
const groupName = ref(String(route.query.groupName ?? "").trim());

const {
  loading: portraitLoading,
  records: portraitRecords,
  total: portraitTotal,
  query: portraitQuery,
  load: loadPortrait,
  search: searchPortrait,
  onPageChange: onPortraitPageChange,
  onSizeChange: onPortraitSizeChange,
} = useTableQuery(fetchPortraitPage, {
  pageSize: 10,
  groupId: groupId.value,
  name: "",
  gender: "",
  dateRange: null,
});

const genderFilteredValue = computed(() => {
  if (portraitQuery.gender === "" || portraitQuery.gender == null) return [];
  return [Number(portraitQuery.gender)];
});

function portraitQueryExtra() {
  const query = { source: "group" };
  if (groupName.value) query.groupName = groupName.value;
  return query;
}

function goBack() {
  router.push({
    path: `${INFRA_BASE}/library`,
    query: { tab: "portrait" },
  });
}

function goCreate() {
  router.push({
    name: "BackendPortraitCreate",
    params: { groupId: groupId.value },
    query: portraitQueryExtra(),
  });
}

function goEdit(id) {
  router.push({
    name: "BackendPortraitEdit",
    params: { groupId: groupId.value, id },
    query: portraitQueryExtra(),
  });
}

function resetPortraitFilters() {
  portraitQuery.name = "";
  portraitQuery.gender = "";
  portraitQuery.dateRange = null;
  searchPortrait();
}

function handleTableFilterChange(filters) {
  const selected = Array.isArray(filters?.gender) ? filters.gender[0] : undefined;
  portraitQuery.gender = selected == null ? "" : Number(selected);
  searchPortrait();
}

async function handleDelete(row) {
  await ElMessageBox.confirm(`确定删除人像管理「${row.name || row.id}」吗？`, "删除确认", {
    type: "warning",
    confirmButtonText: "删除",
    cancelButtonText: "取消",
  });
  await deletePortraitByIds([row.id]);
}

function handleSelectionChange(rows) {
  portraitSelectedIds.value = (Array.isArray(rows) ? rows : []).map((row) => row.id).filter(Boolean);
}

async function handleBatchDelete() {
  if (!portraitSelectedIds.value.length) return;
  await ElMessageBox.confirm(
    `确定批量删除已选中的 ${portraitSelectedIds.value.length} 条人脸数据吗？`,
    "删除确认",
    {
      type: "warning",
      confirmButtonText: "删除",
      cancelButtonText: "取消",
    },
  );
  await deletePortraitByIds(portraitSelectedIds.value);
}

async function deletePortraitByIds(ids) {
  const normalizedIds = (Array.isArray(ids) ? ids : []).filter(Boolean);
  if (!normalizedIds.length) return;
  await deletePortrait({ ids: normalizedIds });
  ElMessage.success("删除成功");
  portraitSelectedIds.value = [];
  await loadPortrait();
  tableRef.value?.clearSelection();
}

async function loadGroupMeta() {
  if (groupName.value || !groupId.value) return;
  const data = await fetchPersonGroupPage({
    id: groupId.value,
    current: 1,
    pageSize: 1,
  });
  const row = data?.records?.[0];
  if (row?.groupName) {
    groupName.value = row.groupName;
  }
}

onMounted(async () => {
  portraitQuery.groupId = groupId.value;
  await loadGroupMeta();
  await loadPortrait();
});
</script>

<style scoped lang="scss">
@use "./infra-page.scss";

.portrait-list__toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.portrait-list__section--actions {
  padding: 12px 16px;
}

.portrait-list__section--title {
  padding: 14px 16px;
  background: #fafafa;
}

.portrait-list__section--content {
  padding: 20px 16px 24px;
}

.portrait-list__meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 24px;
  min-width: 0;
}

.portrait-list__title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.portrait-list__accent-btn {
  --el-button-text-color: #d87533;
  --el-button-border-color: #d87533;
  --el-button-hover-text-color: #d87533;
  --el-button-hover-border-color: #d87533;
  --el-button-hover-bg-color: #fdf6f0;
  min-width: 108px;
  height: 36px;
  padding: 0 16px;
}

.portrait-list__batch-btn {
  height: 36px;
  padding: 0 16px;
}

.portrait-list__meta-item {
  font-size: 14px;
  color: #303133;
}

.portrait-list__actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.infra-page__filter-item--name {
  width: 200px;
}

.infra-page__filter-item--gender {
  width: 140px;
}

.monitor-library__table {
  :deep(.el-table__empty-block) {
    min-height: 360px;
  }
}

.monitor-library__empty {
  min-height: 360px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #909399;
  font-size: 14px;
}

.monitor-library__image {
  width: 72px;
  height: 72px;
  border-radius: 4px;
  border: 1px solid #ebeef5;
  background: #f5f7fa;

  :deep(.el-image__inner) {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }
}

.monitor-library__image--placeholder {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #c0c4cc;
}

:global(.portrait-list__gender-filter .el-table-filter__list-item:not(.is-active)) {
  color: var(--el-text-color-regular) !important;
  background-color: transparent !important;
  font-weight: 400;
}

:global(.portrait-list__gender-filter .el-table-filter__list-item.is-active) {
  color: var(--el-color-primary) !important;
  background-color: var(--el-color-primary-light-9) !important;
  font-weight: 500;
}

:global(.portrait-list__gender-filter .el-table-filter__list-item:hover) {
  color: var(--el-color-primary) !important;
}

:global(.portrait-list__gender-filter .el-table-filter__bottom button:hover) {
  color: var(--el-color-primary) !important;
}

:global(.portrait-list__gender-filter .el-table-filter__bottom button.is-active) {
  color: var(--el-color-primary) !important;
}
</style>
