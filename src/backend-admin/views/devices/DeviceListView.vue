<template>
  <div class="device-list">
    <div class="device-list__section device-list__section--org">
      <OrgCascader
        v-model="selectedOrgId"
        :options="orgTreeOptions"
        :loading="orgCascaderLoading"
        :disabled="!authStore.isSuperAdmin && cascaderDisabled"
        select-class="device-list__org-select"
        @change="handleOrgChange"
      />
    </div>

    <div class="device-list__section device-list__section--title">
      <div class="device-list__header">
        <div class="device-list__title">无人机管理</div>
        <div class="device-list__actions">
          <el-button
            type="primary"
            plain
            class="device-list__create-btn"
            @click="goCreate"
          >
            创建无人机
          </el-button>
          <el-button class="device-list__refresh-btn" :disabled="loading" @click="load">
            <el-icon :size="16" :class="{ 'device-list__refresh-icon--spinning': loading }">
              <Refresh />
            </el-icon>
          </el-button>
        </div>
      </div>
    </div>

    <div class="device-list__section device-list__section--content">
      <el-table v-loading="loading" :data="records" class="device-list__table" stripe>
        <el-table-column prop="id" label="无人机ID" min-width="140" show-overflow-tooltip>
          <template #default="{ row }">
            <span class="device-list__id">{{ row.id || "-" }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="name" label="无人机名称" min-width="120" show-overflow-tooltip>
          <template #default="{ row }">
            <span class="text-primary">{{ row.name }}</span>
          </template>
        </el-table-column>
        <el-table-column label="类型" width="130">
          <template #default="{ row }">
            <el-tag :type="row.droneTypeTagType" size="small" effect="light" round>
              {{ row.droneTypeLabel }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="电量" width="80" align="center">
          <template #default="{ row }">
            <span
              v-if="row.battery != null"
              :class="{ 'device-list__battery--low': row.battery <= LOW_BATTERY_THRESHOLD }"
            >
              {{ row.battery }}%
            </span>
            <span v-else class="device-list__placeholder">/</span>
          </template>
        </el-table-column>
        <el-table-column label="在线状态" width="100">
          <template #default="{ row }">
            <span
              v-if="row.isOnline != null"
              class="device-list__status"
              :class="row.isOnline ? 'device-list__status--online' : 'device-list__status--offline'"
            >
              <i class="device-list__status-dot" />
              {{ row.isOnline ? "在线" : "离线" }}
            </span>
            <span v-else class="device-list__placeholder">-</span>
          </template>
        </el-table-column>
        <el-table-column label="作业状态" width="100">
          <template #default="{ row }">
            {{ row.workStatusText }}
          </template>
        </el-table-column>
        <el-table-column label="设备状态" width="90">
          <template #default="{ row }">
            <span
              class="device-list__device-status"
              :class="{ 'device-list__device-status--disabled': !row.deviceEnabled }"
            >
              {{ row.deviceEnabled ? "启用" : "停用" }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="机场经纬度" min-width="140">
          <template #default="{ row }">
            <span class="device-list__coord">{{ row.coordText }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{ row }">
            <el-button
              link
              type="primary"
              @click="goEdit(row.id)"
            >
              编辑
            </el-button>
            <el-button
              link
              type="danger"
              @click="handleDelete(row)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="device-list__pagination">
        <el-pagination
          :current-page="query.current"
          :page-size="query.pageSize"
          :total="total"
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
import { onMounted, watch } from "vue";
import { useRouter } from "vue-router";
import { Refresh } from "@element-plus/icons-vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { deleteDrone, fetchDronePage } from "@backend/api/drone.js";
import OrgCascader from "@backend/components/OrgCascader.vue";
import { useOrgCascader } from "@backend/composables/useOrgCascader.js";
import { useTableQuery } from "@backend/composables/useTableQuery.js";
import { LOW_BATTERY_THRESHOLD } from "@backend/config/constants.js";
import { MONITOR_BASE } from "@backend/router/routes.js";
import { useAuthStore } from "@/stores/auth.js";

const router = useRouter();
const authStore = useAuthStore();
const {
  orgTreeOptions,
  selectedOrgId,
  loading: orgCascaderLoading,
  cascaderDisabled,
  initOrgCascader,
  syncSelectedOrgId,
} = useOrgCascader();

const { loading, records, total, query, load, onPageChange, onSizeChange } = useTableQuery(
  fetchDronePage,
  { pageSize: 10, orgId: "" },
);

async function loadOrgOptions() {
  await initOrgCascader(authStore);
}

function syncOrgQuery() {
  query.orgId = selectedOrgId.value != null ? selectedOrgId.value : "";
}

function handleOrgChange(orgId) {
  selectedOrgId.value = orgId;
  if (authStore.isSuperAdmin) {
    authStore.setCurrentOrgId(orgId);
  }
  syncOrgQuery();
  query.current = 1;
  load();
}

function goCreate() {
  router.push(`${MONITOR_BASE}/drones/new`);
}

function goEdit(id) {
  router.push(`${MONITOR_BASE}/drones/${id}`);
}

async function handleDelete(row) {
  await ElMessageBox.confirm(`确定删除无人机「{row.name}」吗？`, "删除确认", {
    type: "warning",
    confirmButtonText: "删除",
    cancelButtonText: "取消",
  });

  await deleteDrone({ id: row.id });
  ElMessage.success("删除成功");
  await load();
}

watch(
  () => authStore.currentOrgId,
  (value) => {
    if (!authStore.isSuperAdmin || value === "all") return;
    if (String(selectedOrgId.value) !== String(value)) {
      syncSelectedOrgId(value);
      syncOrgQuery();
      load();
    }
  },
);

onMounted(async () => {
  await loadOrgOptions();
  syncOrgQuery();
  await load();
});
</script>

<style scoped lang="scss">
.device-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.device-list__section {
  background: #fff;
  border: 1px solid #ebeef5;
  border-radius: 4px;
}

.device-list__section--org {
  padding: 12px 16px;
}

.device-list__section--title {
  padding: 14px 16px;
}

.device-list__section--content {
  padding: 20px 16px 24px;
}

.device-list__org-select {
  width: 280px;
}

.device-list__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.device-list__title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.device-list__actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.device-list__create-btn {
  min-width: 120px;
  height: 36px;
  // border-style: solid;
  // color: var(--el-color-primary);
  // border-color: var(--el-color-primary);
  // background: #fff;

  // &:hover,
  // &:focus {
  //   color: var(--el-color-primary);
  //   border-color: var(--el-color-primary);
  //   background: var(--el-color-primary-light-9);
  // }
}

.device-list__refresh-btn {
  width: 36px;
  height: 36px;
  padding: 0;
  color: #606266;
  border-color: #dcdfe6;

  .el-icon {
    margin: 0;
  }
}

.device-list__refresh-icon--spinning {
  animation: device-list-refresh-spin 0.8s linear infinite;
}

@keyframes device-list-refresh-spin {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}

.device-list__table {
  width: 100%;
}

.device-list__id {
  color: #303133;
  font-variant-numeric: tabular-nums;
}

.text-primary {
  color: var(--el-color-primary);
}

.device-list__placeholder {
  color: #909399;
}

.device-list__battery--low {
  color: #f56c6c;
  font-weight: 600;
}

.device-list__status {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
}

.device-list__status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.device-list__status--online {
  color: #303133;

  .device-list__status-dot {
    background: #67c23a;
  }
}

.device-list__status--offline {
  color: #303133;

  .device-list__status-dot {
    background: #f56c6c;
  }
}

.device-list__device-status {
  color: var(--el-color-primary);
  cursor: default;
}

.device-list__device-status--disabled {
  color: #909399;
}

.device-list__coord {
  color: #606266;
  font-variant-numeric: tabular-nums;
}

.device-list__pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
