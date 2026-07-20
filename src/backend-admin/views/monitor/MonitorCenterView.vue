<template>
  <div class="monitor-center">
    <div class="monitor-center__section monitor-center__section--header">
      <el-select
        v-model="selectedOrgId"
        class="monitor-center__org-select"
        placeholder="请选择单位"
        :disabled="!authStore.isSuperAdmin && orgOptions.length <= 1"
        @change="handleOrgChange"
      >
        <el-option
          v-for="org in orgOptions"
          :key="org.id"
          :label="org.name"
          :value="org.id"
        />
      </el-select>

      <el-tabs v-model="activeTab" class="monitor-center__tabs">
        <el-tab-pane label="单位主页" name="home" />
        <el-tab-pane label="任务监控" name="task" />
      </el-tabs>
    </div>

    <div v-if="activeTab === 'home'" class="monitor-center__section monitor-center__section--content">
      <div class="monitor-center__devices-title">无人设备</div>

      <div class="monitor-center__device-cards">
        <button
          v-for="item in deviceCards"
          :key="item.key"
          type="button"
          class="device-card"
          :class="`device-card--${item.key}`"
          @click="goDevicePage(item.path)"
        >
          <div class="device-card__head">
            <span class="device-card__label">{{ item.label }}</span>
            <img :src="item.icon" :alt="item.label" class="device-card__icon" />
          </div>
          <div class="device-card__count">
            {{ item.count }}<span class="device-card__unit">{{ item.unit }}</span>
          </div>
          <div v-if="item.details?.length" class="device-card__details">
            <span v-for="detail in item.details" :key="detail.label">
              {{ detail.label }}：{{ detail.value }}{{ item.unit }}
            </span>
          </div>
        </button>
      </div>

      <div class="monitor-center__devices-title monitor-center__devices-title--targets">目标设备</div>

      <div class="monitor-center__target-cards">
        <button
          v-for="item in targetCards"
          :key="item.type"
          type="button"
          class="target-card"
          :class="`target-card--type-${item.type}`"
          @click="goCreateTarget(item.type)"
        >
          <div class="target-card__head">
            <span class="target-card__label">{{ item.label }}</span>
            <img :src="item.icon" :alt="item.label" class="target-card__icon" />
          </div>
          <div class="target-card__count">
            {{ item.count }}<span class="target-card__unit">个</span>
          </div>
          <div class="target-card__hint">点击新建</div>
        </button>
      </div>

      <div class="monitor-center__panels">
        <section class="info-panel">
          <div class="info-panel__title">当前单位辖区范围</div>
          <div class="info-panel__map">
            <div class="info-panel__map-placeholder">
              <span>地图选区功能开发中，后续将接入天地图</span>
            </div>
          </div>
          <button type="button" class="info-panel__link" @click="handleConfigure('jurisdiction')">
            配置&gt;&gt;
          </button>
        </section>

        <section class="info-panel">
          <div class="info-panel__title-row">
            <span class="info-panel__title">重点地点一览</span>
            <span class="info-panel__count">{{ keyLocations.length }}个</span>
          </div>
          <ul class="info-panel__list">
            <li v-for="(item, index) in keyLocations" :key="item.id" class="info-panel__list-item">
              <span class="info-panel__index">{{ index + 1 }}</span>
              <span class="info-panel__tag">{{ item.category }}</span>
              <span class="info-panel__name">{{ item.name }}</span>
              <span class="info-panel__coord">({{ item.coord }})</span>
            </li>
          </ul>
          <button type="button" class="info-panel__link" @click="handleConfigure('locations')">
            配置&gt;&gt;
          </button>
        </section>

        <section class="info-panel info-panel--checkpoints">
          <div class="info-panel__title-row">
            <span class="info-panel__title">区域卡点设置</span>
            <span class="info-panel__count">{{ areaCheckpoints.length }}个</span>
          </div>
          <ul class="info-panel__list info-panel__list--checkpoints">
            <li
              v-for="item in areaCheckpoints"
              :key="item.id"
              class="info-panel__list-item info-panel__list-item--checkpoint"
            >
              <span class="info-panel__checkpoint-name">{{ item.name }}</span>
              <span class="info-panel__coord">({{ item.coord }})</span>
            </li>
          </ul>
          <button type="button" class="info-panel__link" @click="handleConfigure('checkpoints')">
            配置&gt;&gt;
          </button>
        </section>
      </div>
    </div>

    <div v-else class="monitor-center__section monitor-center__section--content">
      <TaskMonitorTab :task-stats="taskStats" :pending-tasks="pendingTasks" />
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from "vue";
import { useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import { fetchDronePage } from "@backend/api/drone.js";
import { fetchTargetPage } from "@backend/api/target.js";
import { fetchOrgTree } from "@backend/api/org.js";
import { TARGET_TYPE, TARGET_TYPE_LABELS } from "@backend/config/constants.js";
import { MONITOR_BASE, INFRA_BASE } from "@backend/router/routes.js";
import { useAuthStore } from "@backend/stores/auth.js";
import { unwrapApiList } from "@backend/utils/request.js";
import planeIcon from "@/assets/images/plane.png";
import dogIcon from "@/assets/images/dog.png";
import boatIcon from "@/assets/images/boat.png";
import policeCarIcon from "@/assets/images/db_jc.png";
import officerIcon from "@/assets/images/dt_jy.png";
import robotIcon from "@/assets/images/dt_jqr.png";
import vehicleIcon from "@/assets/images/device.png";
import studentCardIcon from "@/assets/images/db_kd.png";
import shoulderLightIcon from "@/assets/images/db_jd.png";
import TaskMonitorTab from "@backend/views/monitor/TaskMonitorTab.vue";

const TARGET_TYPE_ICONS = {
  [TARGET_TYPE.POLICE_CAR]: policeCarIcon,
  [TARGET_TYPE.OFFICER]: officerIcon,
  [TARGET_TYPE.ROBOT]: robotIcon,
  [TARGET_TYPE.VEHICLE]: vehicleIcon,
  [TARGET_TYPE.STUDENT_CARD]: studentCardIcon,
  [TARGET_TYPE.SHOULDER_LIGHT]: shoulderLightIcon,
};

const DEFAULT_TARGET_STATS = {
  [TARGET_TYPE.POLICE_CAR]: 3,
  [TARGET_TYPE.OFFICER]: 5,
  [TARGET_TYPE.ROBOT]: 2,
  [TARGET_TYPE.VEHICLE]: 1,
  [TARGET_TYPE.STUDENT_CARD]: 0,
  [TARGET_TYPE.SHOULDER_LIGHT]: 4,
};

const DEMO_KEY_LOCATIONS = [
  { id: 1, category: "高校", name: "幸福街小站1", coord: "121, 53, 8" },
  { id: 2, category: "中学", name: "幸福街小站2", coord: "121, 53, 8" },
  { id: 3, category: "社区", name: "幸福街小站3", coord: "121, 53, 8" },
];

const DEMO_AREA_CHECKPOINTS = [
  { id: 1, name: "幸福街小站1", coord: "121, 53, 8" },
  { id: 2, name: "幸福街小站2", coord: "121, 53, 8" },
  { id: 3, name: "幸福街小站3", coord: "121, 53, 8" },
  { id: 4, name: "幸福街小站4", coord: "121, 53, 8" },
  { id: 5, name: "幸福街小站5", coord: "121, 53, 8" },
  { id: 6, name: "幸福街小站6", coord: "121, 53, 8" },
];

const DEMO_PENDING_TASKS = [
  { id: 1, name: "山林救援", location: "幸福街小站1" },
  { id: 2, name: "水上救援", location: "幸福街小站2" },
  { id: 3, name: "重点安保", location: "幸福街小站3" },
];

const router = useRouter();
const authStore = useAuthStore();

const activeTab = ref("home");
const orgOptions = ref([]);
const selectedOrgId = ref(null);
const keyLocations = ref([...DEMO_KEY_LOCATIONS]);
const areaCheckpoints = ref([...DEMO_AREA_CHECKPOINTS]);
const pendingTasks = ref([...DEMO_PENDING_TASKS]);

const taskStats = ref({
  deviceOnMissionRate: 78,
  aiEventRate: 78,
  weekCompare: 12,
  dayCompare: 11,
});

const deviceStats = ref({
  droneTotal: 7,
  droneAirport: 6,
  droneSingle: 1,
  dogTotal: 0,
  boatTotal: 1,
});

const targetStats = ref({ ...DEFAULT_TARGET_STATS });

const deviceCards = computed(() => [
  {
    key: "drone",
    label: "无人机",
    icon: planeIcon,
    count: deviceStats.value.droneTotal,
    unit: "台",
    path: `${MONITOR_BASE}/drones`,
    details: [
      { label: "机场设备", value: deviceStats.value.droneAirport },
      { label: "单兵设备", value: deviceStats.value.droneSingle },
    ],
  },
  {
    key: "dog",
    label: "无人犬",
    icon: dogIcon,
    count: deviceStats.value.dogTotal,
    unit: "台",
    path: `${MONITOR_BASE}/dogs`,
    details: [],
  },
  {
    key: "boat",
    label: "无人艇",
    icon: boatIcon,
    count: deviceStats.value.boatTotal,
    unit: "艘",
    path: `${MONITOR_BASE}/boats`,
    details: [],
  },
]);

const targetCards = computed(() =>
  Object.values(TARGET_TYPE).map((type) => ({
    type,
    label: TARGET_TYPE_LABELS[type],
    icon: TARGET_TYPE_ICONS[type],
    count: targetStats.value[type] ?? 0,
  })),
);

function flattenOrgTree(nodes, result = []) {
  for (const node of nodes || []) {
    if (node.id != null) result.push({ id: node.id, name: node.name });
    if (node.children?.length) flattenOrgTree(node.children, result);
  }
  return result;
}

async function loadOrgOptions() {
  try {
    const tree = (await fetchOrgTree()) || [];
    const flat = flattenOrgTree(tree);
    orgOptions.value = flat.length ? flat : [{ id: 1, name: "幸福路派出所" }];
  } catch {
    orgOptions.value = [{ id: 1, name: "幸福路派出所" }];
  }

  if (!authStore.isSuperAdmin && authStore.orgId != null) {
    selectedOrgId.value = authStore.orgId;
    if (!orgOptions.value.some((item) => String(item.id) === String(authStore.orgId))) {
      orgOptions.value.unshift({
        id: authStore.orgId,
        name: authStore.user?.orgName || "当前单位",
      });
    }
    return;
  }

  if (selectedOrgId.value == null) {
    selectedOrgId.value = orgOptions.value[0]?.id ?? null;
  }
}

async function loadDeviceStats() {
  try {
    const params = { current: 1, pageSize: 200 };
    if (selectedOrgId.value != null) params.orgId = selectedOrgId.value;
    const data = await fetchDronePage(params);
    const records = unwrapApiList(data);
    if (!records.length) return;

    const airportCount = records.filter((item) =>
      /机场|airport|dock/i.test(`${item.name || ""} ${item.type || ""} ${item.category || ""}`),
    ).length;
    const droneTotal = Number(data?.total ?? records.length) || records.length;

    deviceStats.value = {
      ...deviceStats.value,
      droneTotal,
      droneAirport: airportCount || Math.max(droneTotal - 1, 0),
      droneSingle: Math.max(droneTotal - airportCount, airportCount ? droneTotal - airportCount : 1),
    };
  } catch {
    // 接口不可用时保留演示数据
  }
}

async function loadTargetStats() {
  try {
    const params = { current: 1, pageSize: 500 };
    if (selectedOrgId.value != null) params.orgId = selectedOrgId.value;
    const data = await fetchTargetPage(params);
    const records = unwrapApiList(data);

    const counts = {};
    Object.values(TARGET_TYPE).forEach((type) => {
      counts[type] = 0;
    });
    records.forEach((item) => {
      const type = Number(item.type) || TARGET_TYPE.POLICE_CAR;
      if (counts[type] != null) counts[type] += 1;
    });
    targetStats.value = counts;
  } catch {
    // 接口不可用时保留演示数据
  }
}

function handleOrgChange(orgId) {
  selectedOrgId.value = orgId;
  if (authStore.isSuperAdmin) {
    authStore.setCurrentOrgId(orgId);
  }
  loadDeviceStats();
  loadTargetStats();
}

function goDevicePage(path) {
  router.push(path);
}

function goCreateTarget(type) {
  router.push({
    path: `${INFRA_BASE}/targets/new`,
    query: {
      type,
      orgId: selectedOrgId.value ?? undefined,
    },
  });
}

function handleConfigure(section) {
  ElMessage.info(`${section}配置功能开发中`);
}

watch(
  () => authStore.currentOrgId,
  (value) => {
    if (!authStore.isSuperAdmin || value === "all") return;
    if (String(selectedOrgId.value) !== String(value)) {
      selectedOrgId.value = value;
      loadDeviceStats();
      loadTargetStats();
    }
  },
);

onMounted(async () => {
  await loadOrgOptions();
  await Promise.all([loadDeviceStats(), loadTargetStats()]);
});
</script>

<style scoped lang="scss">
.monitor-center {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.monitor-center__section {
  background: #fff;
  border: 1px solid #ebeef5;
  border-radius: 4px;
}

.monitor-center__section--header {
  padding: 16px 16px 0;
}

.monitor-center__section--content {
  padding: 20px 16px 24px;
}

.monitor-center__org-select {
  width: 220px;
}

.monitor-center__tabs {
  margin-top: 8px;

  :deep(.el-tabs__header) {
    margin-bottom: 0;
  }

  :deep(.el-tabs__nav-wrap::after) {
    height: 1px;
    background: #ebeef5;
  }

  :deep(.el-tabs__item) {
    height: 44px;
    font-size: 14px;
    color: #606266;
  }

  :deep(.el-tabs__item.is-active) {
    color: var(--el-color-primary);
    font-weight: 600;
  }

  :deep(.el-tabs__active-bar) {
    background: var(--el-color-primary);
  }
}

.monitor-center__devices-title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 16px;
}

.monitor-center__devices-title--targets {
  margin-top: 8px;
}

.monitor-center__device-cards {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
  margin-bottom: 20px;
}

.monitor-center__target-cards {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 20px;
}

.target-card {
  border: 1px solid #ebeef5;
  border-radius: 8px;
  padding: 14px 16px 12px;
  min-height: 120px;
  text-align: left;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
  color: #303133;
  background: #fff;
  display: flex;
  flex-direction: column;
  gap: 8px;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.06);
    border-color: var(--el-color-primary-light-5);
  }
}

.target-card__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
}

.target-card__label {
  font-size: 13px;
  font-weight: 600;
  color: #303133;
  line-height: 1.4;
}

.target-card__icon {
  width: 36px;
  height: 36px;
  object-fit: contain;
  flex-shrink: 0;
}

.target-card__count {
  font-size: 32px;
  font-weight: 700;
  line-height: 1;
  color: var(--el-color-primary);
}

.target-card__unit {
  font-size: 14px;
  font-weight: 600;
  margin-left: 2px;
}

.target-card__hint {
  font-size: 12px;
  color: #909399;
}

.device-card {
  border: none;
  border-radius: 8px;
  padding: 18px 20px 16px;
  min-height: 148px;
  text-align: left;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  color: #fff;
  display: flex;
  flex-direction: column;
  gap: 12px;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.08);
  }
}

.device-card--drone {
  background: linear-gradient(135deg, #9f9fe8 0%, #b6b6ef 100%);
}

.device-card--dog {
  background: linear-gradient(135deg, #ffb45a 0%, #ffc57d 100%);
}

.device-card--boat {
  background: linear-gradient(135deg, #9fd067 0%, #b7e08d 100%);
}

.device-card__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.device-card__label {
  font-size: 16px;
  font-weight: 600;
}

.device-card__icon {
  width: 56px;
  height: 56px;
  object-fit: contain;
  flex-shrink: 0;
  opacity: 0.95;
}

.device-card__count {
  font-size: 40px;
  font-weight: 700;
  line-height: 1;
}

.device-card__unit {
  font-size: 18px;
  font-weight: 600;
  margin-left: 4px;
}

.device-card__details {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 16px;
  font-size: 13px;
  opacity: 0.95;
}

.monitor-center__panels {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
}

.info-panel {
  border: 1px solid #ebeef5;
  border-radius: 4px;
  padding: 16px;
  min-height: 280px;
  display: flex;
  flex-direction: column;
  position: relative;
}

.info-panel__title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.info-panel__title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

.info-panel__count {
  font-size: 14px;
  font-weight: 600;
  color: var(--el-color-primary);
}

.info-panel__list--checkpoints {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.info-panel__list-item--checkpoint {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: auto;
  padding: 0;
  border-bottom: none;
}

.info-panel__checkpoint-name {
  display: inline-flex;
  align-items: center;
  padding: 4px 12px;
  border-radius: 999px;
  background: #eaecf3;
  color: #909399;
  font-size: 13px;
  white-space: nowrap;
}

.info-panel--checkpoints .info-panel__coord {
  color: #909399;
  font-size: 13px;
}

.info-panel__map {
  flex: 1;
  min-height: 180px;
}

.info-panel__map-placeholder {
  height: 100%;
  min-height: 180px;
  border: 1px dashed #dcdfe6;
  border-radius: 4px;
  background: #fafafa;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  color: #909399;
  font-size: 13px;
  text-align: center;
}

.info-panel__list {
  list-style: none;
  margin: 0;
  padding: 0;
  flex: 1;
}

.info-panel__list-item {
  display: grid;
  grid-template-columns: 28px 56px 1fr auto;
  align-items: center;
  gap: 8px;
  min-height: 40px;
  padding: 8px 0;
  border-bottom: 1px solid #f2f3f5;
  font-size: 13px;
  color: #606266;
}

.info-panel__list--tasks .info-panel__list-item {
  grid-template-columns: 28px 72px 1fr auto;
}

.info-panel__index {
  color: #909399;
}

.info-panel__tag {
  color: #303133;
}

.info-panel__name {
  color: #303133;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.info-panel__coord {
  color: #909399;
  white-space: nowrap;
}

.info-panel__location {
  color: #909399;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.info-panel__action {
  border: none;
  background: none;
  padding: 0;
  color: var(--el-color-primary);
  cursor: pointer;
  font-size: 13px;
  white-space: nowrap;
}

.info-panel__link {
  align-self: flex-end;
  margin-top: 12px;
  border: none;
  background: none;
  padding: 0;
  color: var(--el-color-primary);
  cursor: pointer;
  font-size: 13px;
}

@media (max-width: 1200px) {
  .monitor-center__device-cards,
  .monitor-center__panels {
    grid-template-columns: 1fr;
  }

  .monitor-center__target-cards {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 768px) {
  .monitor-center__target-cards {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
