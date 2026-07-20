<template>
  <div class="dashboard-view">
    <el-row :gutter="16" class="dashboard-view__stats">
      <el-col v-for="item in statCards" :key="item.key" :xs="12" :sm="8" :md="4">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-card__label">{{ item.label }}</div>
          <div class="stat-card__value" :style="{ color: item.color }">
            {{ summary[item.key] ?? "-" }}
          </div>
        </el-card>
      </el-col>
    </el-row>

    <div class="page-card dashboard-view__table">
      <div class="page-toolbar">
        <div class="page-toolbar__title">设备状态明细</div>
        <div class="page-toolbar__actions">
          <el-tag type="info" effect="plain">每 {{ pollSeconds }}s 自动刷新</el-tag>
          <el-button :loading="loading" @click="refreshAll">立即刷新</el-button>
        </div>
      </div>

      <el-table v-loading="loading" :data="records" stripe border>
        <el-table-column prop="name" label="名称" min-width="120" />
        <el-table-column prop="sn" label="SN" min-width="160" />
        <el-table-column prop="orgName" label="所属单位" min-width="120" />
        <el-table-column label="运行态" width="100">
          <template #default="{ row }">
            <el-tag :type="statusMeta(row.rawStatus).type" size="small">
              {{ statusMeta(row.rawStatus).label }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="电量" width="100">
          <template #default="{ row }">
            <span :class="{ 'text-danger': row.battery <= LOW_BATTERY_THRESHOLD }">
              {{ row.battery }}%
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="lastOnlineAt" label="最近在线" min-width="160" />
      </el-table>
    </div>
  </div>
</template>

<script setup>
import { fetchDroneHealthSummary, fetchDronePage } from "@backend/api/drone.js";
import { DRONE_RAW_STATUS, DASHBOARD_POLL_INTERVAL, LOW_BATTERY_THRESHOLD } from "@backend/config/constants.js";
import { useAuthStore } from "@backend/stores/auth.js";
import { unwrapApiList } from "@backend/utils/request.js";
import { usePolling } from "@backend/composables/usePolling.js";

const authStore = useAuthStore();

const loading = ref(false);
const summary = ref({});
const records = ref([]);

const pollSeconds = DASHBOARD_POLL_INTERVAL / 1000;

const statCards = [
  { key: "total", label: "设备总数", color: "#303133" },
  { key: "online", label: "在线", color: "#67c23a" },
  { key: "offline", label: "离线", color: "#909399" },
  { key: "lowBattery", label: "低电量", color: "#f56c6c" },
  { key: "escorting", label: "伴飞中", color: "#e6a23c" },
];

function statusMeta(rawStatus) {
  return DRONE_RAW_STATUS[rawStatus] || { label: "未知", type: "info" };
}

function buildQueryParams() {
  const params = { current: 1, pageSize: 100 };
  const orgId = authStore.effectiveOrgId;
  if (orgId != null) params.orgId = orgId;
  return params;
}

async function loadSummary() {
  const params = {};
  const orgId = authStore.effectiveOrgId;
  if (orgId != null) params.orgId = orgId;
  summary.value = (await fetchDroneHealthSummary(params)) || {};
}

async function loadList() {
  const data = await fetchDronePage(buildQueryParams());
  records.value = unwrapApiList(data);
}

async function refreshAll() {
  loading.value = true;
  try {
    await Promise.all([loadSummary(), loadList()]);
  } finally {
    loading.value = false;
  }
}

const { refresh } = usePolling(refreshAll, DASHBOARD_POLL_INTERVAL);

watch(
  () => authStore.currentOrgId,
  () => refresh(),
);
</script>

<style scoped lang="scss">
.dashboard-view__stats {
  margin-bottom: 16px;
}

.stat-card {
  margin-bottom: 16px;

  :deep(.el-card__body) {
    padding: 16px 20px;
  }
}

.stat-card__label {
  color: #909399;
  font-size: 13px;
  margin-bottom: 8px;
}

.stat-card__value {
  font-size: 28px;
  font-weight: 600;
  line-height: 1;
}

.text-danger {
  color: #f56c6c;
  font-weight: 600;
}
</style>
