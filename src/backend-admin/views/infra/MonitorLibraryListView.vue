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
          <el-tab-pane label="人像管理" name="portrait" />
          <el-tab-pane label="车辆管理" name="vehicle" />
        </el-tabs>

        <div class="monitor-library__actions">
          <el-button class="infra-page__create-btn" @click="goCreate">
            {{ createButtonLabel }}
          </el-button>
        </div>
      </div>

      <div v-if="activeTab === 'portrait'" class="infra-page__filters">
        <el-input
          v-model="portraitQuery.name"
          class="infra-page__filter-item infra-page__filter-item--name"
          placeholder="人像名称"
          clearable
          @keyup.enter="searchPortrait"
          @clear="searchPortrait"
        />
        <el-select
          v-model="portraitQuery.warningType"
          class="infra-page__filter-item infra-page__filter-item--warning-type"
          placeholder="全部预警类型"
          clearable
          @change="searchPortrait"
          @clear="searchPortrait"
        >
          <el-option
            v-for="item in warningTypeOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
        <!-- <el-date-picker
          v-model="portraitQuery.dateRange"
          class="infra-page__filter-item infra-page__filter-item--date-range"
          type="daterange"
          range-separator="-"
          start-placeholder="开始时间"
          end-placeholder="结束时间"
          value-format="YYYY-MM-DD"
          format="YYYY-MM-DD"
          clearable
          @change="handlePortraitDateChange"
        /> -->
        <el-button type="primary" @click="searchPortrait">查询</el-button>
        <el-button @click="resetPortraitFilters">重置</el-button>
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
        <!-- <el-date-picker
          v-model="vehicleQuery.dateRange"
          class="infra-page__filter-item infra-page__filter-item--date-range"
          type="daterange"
          range-separator="-"
          start-placeholder="开始时间"
          end-placeholder="结束时间"
          value-format="YYYY-MM-DD"
          format="YYYY-MM-DD""
          clearable
          @change="handleVehicleDateChange"
        /> -->
        <el-button type="primary" @click="searchVehicle">查询</el-button>
        <el-button @click="resetVehicleFilters">重置</el-button>
      </div>

      <el-table v-if="activeTab === 'portrait'" v-loading="portraitLoading" :data="portraitRecords" stripe class="monitor-library__table">
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
        <el-table-column prop="id" label="ID" min-width="180" show-overflow-tooltip />
        <el-table-column prop="name" label="姓名" min-width="120" show-overflow-tooltip />
        <el-table-column label="预警类型" min-width="120" show-overflow-tooltip>
          <template #default="{ row }">
            {{ row.warningTypeLabel || "-" }}
          </template>
        </el-table-column>
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

      <el-table v-else v-loading="vehicleLoading" :data="vehicleRecords" stripe class="monitor-library__table">
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
import { useRouter } from "vue-router";
import { Picture, Refresh } from "@element-plus/icons-vue";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  deletePortrait,
  deleteVehicle,
  fetchPortraitPage,
  fetchVehiclePage,
} from "@backend/api/monitor-library.js";
import OrgCascader from "@backend/components/OrgCascader.vue";
import { useOrgCascader } from "@backend/composables/useOrgCascader.js";
import { useTableQuery } from "@backend/composables/useTableQuery.js";
import {
  PORTRAIT_WARNING_TYPE_OPTIONS,
  VEHICLE_POWER_TYPE,
  VEHICLE_POWER_TYPE_OPTIONS,
} from "@backend/config/constants.js";
import { useAuthStore } from "@/stores/auth.js";
import { formatPlateNumberDisplay } from "@backend/utils/monitor-library.js";

const router = useRouter();
const authStore = useAuthStore();
const activeTab = ref("portrait");
const warningTypeOptions = PORTRAIT_WARNING_TYPE_OPTIONS;
const powerTypeOptions = VEHICLE_POWER_TYPE_OPTIONS;

const {
  orgTreeOptions,
  selectedOrgId,
  loading: orgCascaderLoading,
  initOrgCascader,
  syncSelectedOrgId,
} = useOrgCascader({ autoSelectFirst: false });

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
  orgId: null,
  name: "",
  warningType: "",
  dateRange: null,
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

const createButtonLabel = computed(() =>
  activeTab.value === "portrait" ? "新建人像" : "新建车辆",
);

const currentLoading = computed(() =>
  activeTab.value === "portrait" ? portraitLoading.value : vehicleLoading.value,
);
const currentTotal = computed(() =>
  activeTab.value === "portrait" ? portraitTotal.value : vehicleTotal.value,
);
const currentQuery = computed(() =>
  activeTab.value === "portrait" ? portraitQuery : vehicleQuery,
);

function syncOrgQuery() {
  const orgId =
    selectedOrgId.value != null && selectedOrgId.value !== "" ? selectedOrgId.value : null;
  portraitQuery.orgId = orgId;
  vehicleQuery.orgId = orgId;
}

async function loadOrgOptions() {
  await initOrgCascader(authStore);
}

function reloadCurrent() {
  return activeTab.value === "portrait" ? loadPortrait() : loadVehicle();
}

function handleTabChange() {
  reloadCurrent();
}

function onPageChange(page) {
  return activeTab.value === "portrait"
    ? onPortraitPageChange(page)
    : onVehiclePageChange(page);
}

function onSizeChange(size) {
  return activeTab.value === "portrait"
    ? onPortraitSizeChange(size)
    : onVehicleSizeChange(size);
}

function handlePortraitDateChange(value) {
  portraitQuery.dateRange = value ?? null;
  searchPortrait();
}

function handleVehicleDateChange(value) {
  vehicleQuery.dateRange = value ?? null;
  searchVehicle();
}

function resetPortraitFilters() {
  portraitQuery.name = "";
  portraitQuery.warningType = "";
  portraitQuery.dateRange = null;
  searchPortrait();
}

function resetVehicleFilters() {
  vehicleQuery.plateNo = "";
  vehicleQuery.powerType = "";
  vehicleQuery.dateRange = null;
  searchVehicle();
}

function handleOrgChange(orgId) {
  selectedOrgId.value = orgId;
  if (authStore.isSuperAdmin) {
    authStore.setCurrentOrgId(orgId);
  }
  syncOrgQuery();
  searchPortrait();
  searchVehicle();
}

function goCreate() {
  if (activeTab.value === "portrait") {
    router.push({ name: "BackendPortraitCreate" });
    return;
  }
  router.push({ name: "BackendMonitorVehicleCreate" });
}

function goEdit(id) {
  if (activeTab.value === "portrait") {
    router.push({ name: "BackendPortraitEdit", params: { id } });
    return;
  }
  router.push({ name: "BackendMonitorVehicleEdit", params: { id } });
}

async function handleDelete(row) {
  const isPortrait = activeTab.value === "portrait";
  const name = isPortrait
    ? row.name
    : formatPlateNumberDisplay(row.plateNo || row.plateNumber);
  const label = isPortrait ? "人像管理" : "车辆管理";

  await ElMessageBox.confirm(`确定删除${label}「${name || row.id}」吗？`, "删除确认", {
    type: "warning",
    confirmButtonText: "删除",
    cancelButtonText: "取消",
  });

  if (isPortrait) {
    await deletePortrait({ id: row.id });
  } else {
    await deleteVehicle({ id: row.id });
  }

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
      searchPortrait();
      searchVehicle();
    }
  },
);

onMounted(async () => {
  await loadOrgOptions();
  syncOrgQuery();
  await loadPortrait();
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

.infra-page__filter-item--name {
  width: 200px;
}

.infra-page__filter-item--warning-type {
  width: 180px;
}

.infra-page__filter-item--plate {
  width: 200px;
}

.infra-page__filter-item--power-type {
  width: 180px;
}

.infra-page__filter-item--date-range {
  width: 220px;

  :deep(.el-range-input) {
    font-size: 13px;
  }

  :deep(.el-range-separator) {
    padding: 0 4px;
    flex: none;
  }
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
</style>
