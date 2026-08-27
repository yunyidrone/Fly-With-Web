<template>
  <div class="infra-page">
    <div class="infra-page__section infra-page__section--org">
      <OrgCascader
        v-model="selectedOrgId"
        :options="orgTreeOptions"
        :loading="orgCascaderLoading"
        select-class="infra-page__org-select"
        @change="handleOrgChange"
      />
    </div>

    <div class="infra-page__section infra-page__section--title">
      <div class="infra-page__header">
        <div class="infra-page__title">监控库管理</div>
        <div class="infra-page__actions">
          <el-button class="infra-page__refresh-btn" :disabled="currentLoading" @click="reloadCurrent">
            <el-icon :size="16" :class="{ 'infra-page__refresh-icon--spinning': currentLoading }">
              <Refresh />
            </el-icon>
          </el-button>
        </div>
      </div>
    </div>

    <div class="infra-page__section infra-page__section--content">
      <div class="monitor-library__toolbar">
        <el-tabs v-model="activeTab" class="monitor-library__tabs" @tab-change="handleTabChange">
          <el-tab-pane label="人脸库" name="portrait" />
          <el-tab-pane label="车辆管理" name="vehicle" />
        </el-tabs>

        <div class="monitor-library__actions">
          <template v-if="activeTab === 'portrait'">
            <el-button class="infra-page__create-btn" @click="openCreateGroup">
              新增人脸库
            </el-button>
          </template>
          <template v-else>
            <el-button class="infra-page__create-btn" @click="goCreate">
              新建车辆
            </el-button>
            <el-button class="infra-page__create-btn" @click="goBatchCreate">
              批量上传
            </el-button>
          </template>
        </div>
      </div>

      <div v-if="activeTab === 'portrait'" class="infra-page__filters">
        <el-input
          v-model="personGroupQuery.keyword"
          class="infra-page__filter-item infra-page__filter-item--group"
          placeholder="输入ID或名称进行模糊搜索"
          clearable
          @keyup.enter="searchPersonGroup"
          @clear="searchPersonGroup"
        />
        <el-button type="primary" @click="searchPersonGroup">
          <el-icon class="monitor-library__search-icon"><Search /></el-icon>
          查询
        </el-button>
        <el-button @click="resetPersonGroupFilters">重置</el-button>
      </div>

      <div v-if="activeTab === 'vehicle'" class="infra-page__filters">
        <el-input
          v-model="vehicleQuery.plateNo"
          class="infra-page__filter-item infra-page__filter-item--plate"
          placeholder="车牌号"
          clearable
          @keyup.enter="searchVehicle"
          @clear="searchVehicle"
        />
        <el-select
          v-model="vehicleQuery.powerType"
          class="infra-page__filter-item infra-page__filter-item--power-type"
          placeholder="全部动力类型"
          clearable
          @change="searchVehicle"
          @clear="searchVehicle"
        >
          <el-option
            v-for="item in powerTypeOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
        <el-button type="primary" @click="searchVehicle">查询</el-button>
        <el-button @click="resetVehicleFilters">重置</el-button>
      </div>

      <div v-if="activeTab === 'portrait'" v-loading="personGroupLoading" class="face-library">
        <div v-if="personGroupRecords.length" class="face-library__grid">
          <div v-for="row in personGroupRecords" :key="row.id" class="face-library-card">
            <div class="face-library-card__header">
              <div class="face-library-card__name">
                <el-icon class="face-library-card__icon"><FolderOpened /></el-icon>
                <span class="face-library-card__title" :title="row.groupName">{{ row.groupName }}</span>
              </div>
              <el-button class="face-library-card__add-btn" @click="goCreatePortrait(row)">
                新增人脸
              </el-button>
            </div>

            <div class="face-library-card__body">
              <div class="face-library-card__row">
                <span>ID:</span>
                <span class="face-library-card__value">{{ row.id }}</span>
              </div>
              <div class="face-library-card__row">
                <span class="face-library-card__label">人员数量:</span>
                <span class="face-library-card__value">{{ row.personCount ?? 0 }}</span>
              </div>
              <div class="face-library-card__row">
                <span class="face-library-card__label">备注:</span>
                <span class="face-library-card__value">{{ row.tag || "-" }}</span>
              </div>
              <div class="face-library-card__row">
                <span class="face-library-card__label">描述:</span>
                <span class="face-library-card__value">{{ row.description || "暂无描述" }}</span>
              </div>
              <div class="face-library-card__view-wrap">
                <el-button link type="primary" class="face-library-card__view-btn" @click="goPortraitList(row)">
                  查看
                  <el-icon><ArrowRight /></el-icon>
                </el-button>
              </div>
            </div>

            <div class="face-library-card__footer">
              <button type="button" class="face-library-card__footer-btn" @click="openEditGroup(row)">
                编辑
              </button>
              <button
                type="button"
                class="face-library-card__footer-btn face-library-card__footer-btn--danger"
                @click="handleDeleteGroup(row)"
              >
                删除
              </button>
            </div>
          </div>
        </div>
        <div v-else class="monitor-library__empty">暂无人脸库</div>
      </div>

      <el-table
        v-else
        v-loading="vehicleLoading"
        :data="vehicleRecords"
        stripe
        class="monitor-library__table"
      >
        <el-table-column label="车牌号" min-width="140" show-overflow-tooltip>
          <template #default="{ row }">
            {{ formatPlateNumberDisplay(row.plateNo || row.plateNumber) || "-" }}
          </template>
        </el-table-column>
        <el-table-column label="车辆动力类型" min-width="140">
          <template #default="{ row }">
            <el-tag
              v-if="row.powerTypeLabel"
              size="small"
              effect="light"
              :type="row.powerType === VEHICLE_POWER_TYPE.NEW_ENERGY ? 'warning' : 'info'"
            >
              {{ row.powerTypeLabel }}
            </el-tag>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="id" label="ID" min-width="160" show-overflow-tooltip />
        <el-table-column prop="createTime" label="创建时间" min-width="170" show-overflow-tooltip>
          <template #default="{ row }">
            {{ row.createTime || "-" }}
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
          :current-page="currentQuery.current"
          :page-size="currentQuery.pageSize"
          :total="currentTotal"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          background
          @current-change="onPageChange"
          @size-change="onSizeChange"
        />
      </div>
    </div>

  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ArrowRight, FolderOpened, Refresh, Search } from "@element-plus/icons-vue";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  deletePersonGroup,
  deleteVehicle,
  fetchPersonGroupPage,
  fetchVehiclePage,
} from "@backend/api/monitor-library.js";
import OrgCascader from "@backend/components/OrgCascader.vue";
import { useOrgCascader } from "@backend/composables/useOrgCascader.js";
import { useTableQuery } from "@backend/composables/useTableQuery.js";
import { VEHICLE_POWER_TYPE, VEHICLE_POWER_TYPE_OPTIONS } from "@backend/config/constants.js";
import { useAuthStore } from "@/stores/auth.js";
import { formatPlateNumberDisplay } from "@backend/utils/monitor-library.js";

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();
const powerTypeOptions = VEHICLE_POWER_TYPE_OPTIONS;

function resolveLibraryTab(value) {
  return value === "vehicle" ? "vehicle" : "portrait";
}

const activeTab = ref(resolveLibraryTab(route.query.tab));

const {
  orgTreeOptions,
  selectedOrgId,
  loading: orgCascaderLoading,
  initOrgCascader,
  syncSelectedOrgId,
} = useOrgCascader({ autoSelectFirst: false });

const {
  loading: personGroupLoading,
  records: personGroupRecords,
  total: personGroupTotal,
  query: personGroupQuery,
  load: loadPersonGroup,
  search: searchPersonGroup,
  onPageChange: onPersonGroupPageChange,
  onSizeChange: onPersonGroupSizeChange,
} = useTableQuery(fetchPersonGroupPage, {
  pageSize: 10,
  keyword: "",
});

const {
  loading: vehicleLoading,
  records: vehicleRecords,
  total: vehicleTotal,
  query: vehicleQuery,
  load: loadVehicle,
  search: searchVehicle,
  onPageChange: onVehiclePageChange,
  onSizeChange: onVehicleSizeChange,
} = useTableQuery(fetchVehiclePage, {
  pageSize: 10,
  orgId: null,
  plateNo: "",
  powerType: "",
  dateRange: null,
});

const currentLoading = computed(() =>
  activeTab.value === "portrait" ? personGroupLoading.value : vehicleLoading.value,
);
const currentTotal = computed(() =>
  activeTab.value === "portrait" ? personGroupTotal.value : vehicleTotal.value,
);
const currentQuery = computed(() =>
  activeTab.value === "portrait" ? personGroupQuery : vehicleQuery,
);

function syncOrgQuery() {
  const orgId =
    selectedOrgId.value != null && selectedOrgId.value !== "" ? selectedOrgId.value : null;
  vehicleQuery.orgId = orgId;
}

async function loadOrgOptions() {
  await initOrgCascader(authStore);
}

function reloadCurrent() {
  return activeTab.value === "portrait" ? loadPersonGroup() : loadVehicle();
}

function handleTabChange(name) {
  const tab = resolveLibraryTab(name);
  activeTab.value = tab;
  if (String(route.query.tab || "") !== tab) {
    router.replace({ query: { ...route.query, tab } });
  }
  reloadCurrent();
}

function onPageChange(page) {
  return activeTab.value === "portrait"
    ? onPersonGroupPageChange(page)
    : onVehiclePageChange(page);
}

function onSizeChange(size) {
  return activeTab.value === "portrait"
    ? onPersonGroupSizeChange(size)
    : onVehicleSizeChange(size);
}

function resetVehicleFilters() {
  vehicleQuery.plateNo = "";
  vehicleQuery.powerType = "";
  vehicleQuery.dateRange = null;
  searchVehicle();
}

function resetPersonGroupFilters() {
  personGroupQuery.keyword = "";
  searchPersonGroup();
}

function handleOrgChange(orgId) {
  selectedOrgId.value = orgId;
  if (authStore.isSuperAdmin) {
    authStore.setCurrentOrgId(orgId);
  }
  syncOrgQuery();
  searchPersonGroup();
  searchVehicle();
}

function portraitListQuery(row, source = "") {
  const query = {};
  if (row.groupName) query.groupName = row.groupName;
  if (source) query.source = source;
  return query;
}

function goPortraitList(row) {
  router.push({
    name: "BackendPortraitList",
    params: { groupId: row.id },
    query: portraitListQuery(row, "group"),
  });
}

function goCreatePortrait(row) {
  router.push({
    name: "BackendPortraitCreate",
    params: { groupId: row.id },
    query: portraitListQuery(row, "library"),
  });
}

function goCreate() {
  router.push({ name: "BackendMonitorVehicleCreate", query: { tab: "vehicle" } });
}

function goBatchCreate() {
  router.push({ name: "BackendMonitorVehicleBatchCreate", query: { tab: "vehicle" } });
}

function goEdit(id) {
  router.push({ name: "BackendMonitorVehicleEdit", params: { id }, query: { tab: "vehicle" } });
}

function openCreateGroup() {
  router.push({ name: "BackendPersonGroupCreate" });
}

function openEditGroup(row) {
  router.push({ name: "BackendPersonGroupEdit", params: { id: row.id } });
}

async function handleDeleteGroup(row) {
  await ElMessageBox.confirm(
    `确定删除人脸库「${row.groupName || row.id}」吗？删除后将同时删除库内所有人员数据，且不可恢复。`,
    "删除确认",
    {
      type: "warning",
      confirmButtonText: "删除",
      cancelButtonText: "取消",
    },
  );

  await deletePersonGroup({ id: row.id });
  ElMessage.success("删除成功");
  await loadPersonGroup();
}

async function handleDelete(row) {
  const name = formatPlateNumberDisplay(row.plateNo || row.plateNumber);
  await ElMessageBox.confirm(`确定删除车辆管理「${name || row.id}」吗？`, "删除确认", {
    type: "warning",
    confirmButtonText: "删除",
    cancelButtonText: "取消",
  });

  await deleteVehicle({ id: row.id });
  ElMessage.success("删除成功");
  await reloadCurrent();
}

watch(
  () => authStore.currentOrgId,
  (value) => {
    if (!authStore.isSuperAdmin || value === "all") return;
    if (String(selectedOrgId.value) !== String(value)) {
      syncSelectedOrgId(value);
      syncOrgQuery();
      searchPersonGroup();
      searchVehicle();
    }
  },
);

onMounted(async () => {
  await loadOrgOptions();
  syncOrgQuery();
  await reloadCurrent();
});
</script>

<style scoped lang="scss">
@use "./infra-page.scss";

.infra-page__section--org {
  padding: 12px 16px;
}

.infra-page__org-select {
  width: 280px;

  :deep(.el-input__wrapper) {
    min-height: 36px;
    height: 36px;
    box-sizing: border-box;
  }
}

.infra-page__filter-item--plate {
  width: 200px;
}

.infra-page__filter-item--group {
  width: 240px;
}

.infra-page__filter-item--power-type {
  width: 180px;
}

.monitor-library__toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
}

.monitor-library__tabs {
  flex: 1;
  min-width: 320px;

  :deep(.el-tabs__header) {
    margin: 0;
  }

  :deep(.el-tabs__nav-wrap::after) {
    height: 1px;
    background-color: #ebeef5;
  }

  :deep(.el-tabs__item) {
    height: 36px;
    min-width: 120px;
    padding: 0 16px;
    margin-right: 8px;
    font-size: 14px;
    color: #606266;
    justify-content: center;
  }

  :deep(.el-tabs__item:last-child) {
    margin-right: 0;
  }

  :deep(.el-tabs__item.is-active) {
    color: var(--el-color-primary);
    font-weight: 500;
  }

  :deep(.el-tabs__active-bar) {
    height: 2px;
  }
}

.monitor-library__actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.monitor-library__search-icon {
  margin-right: 4px;
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

.face-library {
  min-height: 360px;
}

.face-library__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 16px;
}

.face-library-card {
  display: flex;
  flex-direction: column;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  background: #fff;
  overflow: hidden;
}

.face-library-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 14px 16px 8px;
}

.face-library-card__name {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.face-library-card__icon {
  flex-shrink: 0;
  color: var(--el-color-primary);
}

.face-library-card__title {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.face-library-card__add-btn {
  --el-button-text-color: #d87533;
  --el-button-border-color: #d87533;
  --el-button-hover-text-color: #d87533;
  --el-button-hover-border-color: #d87533;
  --el-button-hover-bg-color: #fdf6f0;
  flex-shrink: 0;
  height: 28px;
  padding: 0 10px;
  font-size: 13px;
}

.face-library-card__body {
  flex: 1;
  padding: 4px 16px 12px;
}

.face-library-card__row {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
  font-size: 13px;
  line-height: 1.5;
}

.face-library-card__label {
  width: 64px;
  flex-shrink: 0;
  text-align: right;
  color: #909399;
}

.face-library-card__value {
  min-width: 0;
  color: #606266;
  word-break: break-all;
}

.face-library-card__view-wrap {
  display: flex;
  justify-content: flex-end;
}

.face-library-card__view-btn {
  :deep(.el-icon) {
    margin-left: 2px;
  }
}

.face-library-card__footer {
  display: flex;
  border-top: 1px solid #ebeef5;
}

.face-library-card__footer-btn {
  flex: 1;
  height: 40px;
  border: none;
  background: transparent;
  color: #606266;
  font-size: 14px;
  cursor: pointer;

  & + & {
    border-left: 1px solid #ebeef5;
  }

  &:hover {
    color: var(--el-color-primary);
    background: #f5f7fa;
  }
}

.face-library-card__footer-btn--danger:hover {
  color: var(--el-color-danger);
}
</style>
