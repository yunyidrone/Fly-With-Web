<template>
  <div class="device-list">
    <div class="device-list__section device-list__section--org">
      <OrgCascader
        v-model="selectedOrgId"
        :options="orgTreeOptions"
        :loading="orgCascaderLoading"
        select-class="device-list__org-select"
        @change="handleOrgChange"
      />
    </div>

    <div class="device-list__section device-list__section--title">
      <div class="device-list__header">
        <div class="device-list__title">无人机管理</div>
        <div class="device-list__actions">
          <el-button
            class="device-list__action-btn"
            :disabled="!selectedRows.length"
            @click="handleBatchSwitch(true)"
          >
            批量启用
          </el-button>
          <el-button
            class="device-list__action-btn"
            :disabled="!selectedRows.length"
            @click="handleBatchSwitch(false)"
          >
            批量停用
          </el-button>
          <el-button
            type="primary"
            plain
            class="device-list__action-btn"
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
      <el-table
        v-loading="loading"
        :data="records"
        class="device-list__table"
        stripe
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="48" />
        <el-table-column prop="id" label="无人机ID" min-width="150" show-overflow-tooltip>
          <template #default="{ row }">
            <span class="device-list__id">{{ row.id || "-" }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="name" label="无人机名称" min-width="100" show-overflow-tooltip>
          <template #default="{ row }">
            <span class="text-primary">{{ row.name }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="orgName" label="所属单位" min-width="100" show-overflow-tooltip>
          <template #default="{ row }">
            {{ row.orgName || "-" }}
          </template>
        </el-table-column>
        <el-table-column label="目标高度" width="100" align="center">
          <template #default="{ row }">
            <span v-if="row.targetHeight != null">{{ row.targetHeight }}m</span>
            <span v-else class="device-list__placeholder">-</span>
          </template>
        </el-table-column>
        <!-- <el-table-column label="电量" width="80" align="center">
          <template #default="{ row }">
            <span
              v-if="row.battery != null"
              :class="{ 'device-list__battery--low': row.battery <= LOW_BATTERY_THRESHOLD }"
            >
              {{ row.battery }}%
            </span>
            <span v-else class="device-list__placeholder">/</span>
          </template>
        </el-table-column> -->
        <el-table-column label="在线状态" width="100">
          <template #default="{ row }">
            <span
              v-if="row.statusText"
              class="device-list__status"
              :class="getOnlineStatusClass(row.rawStatus)"
            >
              <i class="device-list__status-dot" />
              {{ row.statusText }}
            </span>
            <span v-else class="device-list__placeholder">-</span>
          </template>
        </el-table-column>
        <el-table-column label="作业状态" width="100">
          <template #default="{ row }">
            {{ row.workStatusText }}
          </template>
        </el-table-column>
        <el-table-column label="设备状态" width="100" align="center">
          <template #default="{ row }">
            <el-switch
              :model-value="isDroneEnabled(row)"
              size="small"
              @change="(enabled) => handleSwitchChange(row, enabled)"
            />
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
import { onMounted, ref, watch } from "vue";
import { useRouter } from "vue-router";
import { Refresh } from "@element-plus/icons-vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { deleteDrone, fetchDronePage, switchDrone } from "@backend/api/drone.js";
import OrgCascader from "@backend/components/OrgCascader.vue";
import { useOrgCascader } from "@backend/composables/useOrgCascader.js";
import { useTableQuery } from "@backend/composables/useTableQuery.js";
import { LOW_BATTERY_THRESHOLD } from "@backend/config/constants.js";
import { MONITOR_BASE } from "@backend/router/routes.js";
import { resolveOrgContextFromTree } from "@backend/utils/org-set.js";
import { useAuthStore } from "@/stores/auth.js";

const router = useRouter();
const authStore = useAuthStore();
const {
  orgSetId,
  orgTreeOptions,
  selectedOrgId,
  loading: orgCascaderLoading,
  initOrgCascader,
  syncSelectedOrgId,
} = useOrgCascader({ autoSelectFirst: false });

const { loading, records, total, query, load, onPageChange, onSizeChange } = useTableQuery(
  fetchDronePage,
  { pageSize: 10, orgId: null },
);

const selectedRows = ref([]);

function handleSelectionChange(rows) {
  selectedRows.value = rows;
}

function isDroneEnabled(row) {
  return row.switchStatus === 0;
}

function patchRecordsSwitchStatus(ids, enabled) {
  const switchStatus = enabled ? 0 : 1;
  const idSet = new Set(ids.map((id) => String(id || "").trim()).filter(Boolean));
  records.value.forEach((row) => {
    if (idSet.has(String(row.id))) {
      row.switchStatus = switchStatus;
      row.deviceEnabled = enabled;
    }
  });
}

async function changeDroneSwitch(ids, enabled, nameForConfirm) {
  const action = enabled ? "启用" : "停用";
  const validIds = [...new Set(ids.map((id) => String(id || "").trim()).filter(Boolean))];
  if (!validIds.length) {
    ElMessage.warning("缺少无人机 ID");
    return;
  }
  const targetLabel = nameForConfirm
    ? `无人机「${nameForConfirm}」`
    : `选中的 ${validIds.length} 架无人机`;
  await ElMessageBox.confirm(`确定${action}${targetLabel}吗？`, `${action}确认`, {
    type: "warning",
    confirmButtonText: `确认${action}`,
    cancelButtonText: "取消",
  });
  await switchDrone({
    ids: validIds,
    switchStatus: enabled ? 0 : 1,
  });
  patchRecordsSwitchStatus(validIds, enabled);
  ElMessage.success(`${action}成功`);
}

async function handleSwitchChange(row, enabled) {
  const nextStatus = enabled ? 0 : 1;
  if (nextStatus === row.switchStatus) return;
  try {
    await changeDroneSwitch([row.id], enabled, row.name || row.sn || row.id);
  } catch {
    /* 用户取消或接口失败 */
  }
}

async function handleBatchSwitch(enabled) {
  if (!selectedRows.value.length) {
    ElMessage.warning("请先选择无人机");
    return;
  }
  try {
    await changeDroneSwitch(
      selectedRows.value.map((row) => row.id),
      enabled,
    );
  } catch {
    /* 用户取消或接口失败 */
  }
}

async function loadOrgOptions() {
  await initOrgCascader(authStore);
}

function syncOrgQuery() {
  query.orgId =
    selectedOrgId.value != null && selectedOrgId.value !== "" ? selectedOrgId.value : null;
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
  const orgId = selectedOrgId.value;
  if (orgId == null || orgId === "") {
    ElMessage.warning("请先选择单位");
    return;
  }
  const ctx = resolveOrgContextFromTree(orgTreeOptions.value, orgId, orgSetId.value);
  router.push({
    path: `${MONITOR_BASE}/drones/new`,
    query: {
      orgId,
      rootOrgId: ctx?.rootOrgId,
    },
  });
}

function getOnlineStatusClass(status) {
  if (status === 0) return "device-list__status--offline";
  if (status === 1) return "device-list__status--ready";
  if (status === 2) return "device-list__status--escorting";
  return "device-list__status--unknown";
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

.device-list__action-btn {
  min-width: 120px;
  height: 36px;
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

.device-list__status--offline {
  color: #303133;

  .device-list__status-dot {
    background: #f56c6c;
  }
}

.device-list__status--ready {
  color: #303133;

  .device-list__status-dot {
    background: #67c23a;
  }
}

.device-list__status--escorting {
  color: #303133;

  .device-list__status-dot {
    background: #e6a23c;
  }
}

.device-list__status--unknown {
  color: #303133;

  .device-list__status-dot {
    background: #909399;
  }
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
