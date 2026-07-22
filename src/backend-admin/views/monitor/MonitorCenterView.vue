<template>
  <div class="monitor-center">
    <div class="monitor-center__shell">
      <header class="monitor-hero">
        <h1 class="monitor-hero__title">监控中心</h1>
        <el-select
          v-model="selectedOrgId"
          class="monitor-hero__org-select"
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
      </header>

      <el-tabs v-model="activeTab" class="monitor-tabs">
        <el-tab-pane label="单位主页" name="home">
          <section class="monitor-section">
            <div class="section-head">
              <span class="section-head__accent" aria-hidden="true" />
              <div class="section-head__text">
                <h2 class="section-head__title">无人设备</h2>
                <p class="section-head__subtitle">点击卡片进入对应设备管理</p>
              </div>
            </div>

            <div class="device-grid">
              <button
                v-for="item in deviceCards"
                :key="item.key"
                type="button"
                class="asset-card device-card"
                @click="goDevicePage(item.path)"
              >
                <div class="device-card__shine" aria-hidden="true" />
                <span class="asset-card__label">{{ item.label }}</span>
                <div class="asset-card__center">
                  <img :src="item.icon" :alt="item.label" class="asset-card__icon" />
                  <div class="asset-card__count">
                    {{ item.count }}<span class="asset-card__unit">{{ item.unit }}</span>
                  </div>
                </div>
                <div v-if="item.details?.length" class="asset-card__meta">
                  <span v-for="detail in item.details" :key="detail.label" class="device-card__tag">
                    {{ detail.label }} {{ detail.value }}{{ item.unit }}
                  </span>
                </div>
              </button>
            </div>
          </section>

          <section class="monitor-section">
            <div class="section-head">
              <span class="section-head__accent" aria-hidden="true" />
              <div class="section-head__text">
                <h2 class="section-head__title">目标设备</h2>
                <p class="section-head__subtitle">点击卡片查看对应类型的目标设备列�?/p>
              </div>
            </div>

            <div class="target-grid">
              <button
                v-for="item in targetCards"
                :key="item.type"
                type="button"
                class="asset-card target-card"
                @click="goTargetList(item.type)"
              >
                <span class="asset-card__label">{{ item.label }}</span>
                <div class="asset-card__center">
                  <img :src="item.icon" :alt="item.label" class="asset-card__icon" />
                  <div class="asset-card__count">
                    {{ item.count }}<span class="asset-card__unit">�?/span>
                  </div>
                </div>
              </button>
            </div>
          </section>

          <section class="monitor-section monitor-section--panels">
            <div class="section-head section-head--compact">
              <span class="section-head__accent" aria-hidden="true" />
              <div class="section-head__text">
                <h2 class="section-head__title">辖区与配�?/h2>
                <p class="section-head__subtitle">辖区范围、重点地点与区域卡点</p>
              </div>
            </div>

            <div class="panel-grid">
              <article class="data-panel data-panel--jurisdiction">
                <div class="data-panel__head">
                  <h3 class="data-panel__title">当前单位辖区范围</h3>
                </div>
                <div class="data-panel__map">
                  <TiandituAreaMap
                    mode="view"
                    :area="jurisdictionArea"
                    empty-text="暂未设置辖区范围"
                  />
                </div>
                <button type="button" class="data-panel__link" @click="handleConfigure('jurisdiction')">
                  前往配置<i class="ri-arrow-right-s-line" />
                </button>
              </article>

              <article class="data-panel">
                <div class="data-panel__head">
                  <h3 class="data-panel__title">重点地点一�?/h3>
                  <span class="data-panel__badge">{{ keyLocations.length }} �?/span>
                </div>
                <ul class="data-panel__list">
                  <li v-for="(item, index) in keyLocations" :key="item.id" class="data-panel__row">
                    <span class="data-panel__index">{{ String(index + 1).padStart(2, "0") }}</span>
                    <span class="data-panel__chip">{{ item.category }}</span>
                    <span class="data-panel__name">{{ item.name }}</span>
                    <span class="data-panel__coord">{{ item.coord }}</span>
                  </li>
                </ul>
                <button type="button" class="data-panel__link" @click="handleConfigure('locations')">
                  前往配置<i class="ri-arrow-right-s-line" />
                </button>
              </article>

              <article class="data-panel">
                <div class="data-panel__head">
                  <h3 class="data-panel__title">区域卡点设置</h3>
                  <span class="data-panel__badge">{{ areaCheckpoints.length }} �?/span>
                </div>
                <ul class="data-panel__list data-panel__list--stack">
                  <li
                    v-for="item in areaCheckpoints"
                    :key="item.id"
                    class="data-panel__row data-panel__row--checkpoint"
                  >
                    <span class="data-panel__checkpoint-name">{{ item.name }}</span>
                    <span class="data-panel__coord">{{ item.coord }}</span>
                  </li>
                </ul>
                <button type="button" class="data-panel__link" @click="goCheckpointList">
                  前往配置<i class="ri-arrow-right-s-line" />
                </button>
              </article>
            </div>
          </section>
        </el-tab-pane>

        <el-tab-pane label="任务监控" name="task">
          <TaskMonitorTab :task-stats="taskStats" :pending-tasks="pendingTasks" />
        </el-tab-pane>
      </el-tabs>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from "vue";
import { useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import { fetchDronePage } from "@backend/api/drone.js";
import { fetchTargetPage } from "@backend/api/target.js";
import { fetchCheckpointPage } from "@backend/api/common.js";
import { fetchOrgTree, fetchOrgDetail } from "@backend/api/org.js";
import { parseJurisdictionArea } from "@backend/utils/jurisdiction.js";
import { BACKEND_BASE, MONITOR_BASE, INFRA_BASE } from "@backend/router/routes.js";
import TiandituAreaMap from "@/components/TiandituAreaMap.vue";
import { useAuthStore } from "@/stores/auth.js";
import { unwrapApiList } from "@backend/utils/request.js";
import dbWrjPng from "@/assets/images/db_wrj.png";
import dbWrgPng from "@/assets/images/db_wrg.png";
import dbWrtPng from "@/assets/images/db_wrt.png";
import dbJyPng from "@/assets/images/db_jy.png";
import dbJqrPng from "@/assets/images/db_jqr.png";
import dbJdPng from "@/assets/images/db_jd.png";
import dbJcPng from "@/assets/images/db_jc.png";
import TaskMonitorTab from "@backend/views/monitor/TaskMonitorTab.vue";
import { TARGET_TYPE, TARGET_TYPE_LABELS } from "@backend/config/constants.js";

const MAP_LEGEND_DEVICE_ICONS = {
  drone: dbWrjPng,
  dog: dbWrgPng,
  boat: dbWrtPng,
};

const TARGET_TYPE_ICONS = {
  [TARGET_TYPE.POLICE_CAR]: dbJcPng,
  [TARGET_TYPE.OFFICER]: dbJyPng,
  [TARGET_TYPE.ROBOT]: dbJqrPng,
  [TARGET_TYPE.VEHICLE]: dbJcPng,
  [TARGET_TYPE.STUDENT_CARD]: dbJyPng,
  [TARGET_TYPE.SHOULDER_LIGHT]: dbJdPng,
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
  { id: 1, category: "高校", name: "幸福街小�?", coord: "121, 53, 8" },
  { id: 2, category: "中学", name: "幸福街小�?", coord: "121, 53, 8" },
  { id: 3, category: "社区", name: "幸福街小�?", coord: "121, 53, 8" },
];

const DEMO_AREA_CHECKPOINTS = [
  { id: 1, name: "幸福街小�?", coord: "121, 53, 8" },
  { id: 2, name: "幸福街小�?", coord: "121, 53, 8" },
  { id: 3, name: "幸福街小�?", coord: "121, 53, 8" },
  { id: 4, name: "幸福街小�?", coord: "121, 53, 8" },
  { id: 5, name: "幸福街小�?", coord: "121, 53, 8" },
  { id: 6, name: "幸福街小�?", coord: "121, 53, 8" },
];

const DEMO_PENDING_TASKS = [
  { id: 1, name: "山林救援", location: "幸福街小�?" },
  { id: 2, name: "水上救援", location: "幸福街小�?" },
  { id: 3, name: "重点安保", location: "幸福街小�?" },
];

const router = useRouter();
const authStore = useAuthStore();

const activeTab = ref("home");
const orgOptions = ref([]);
const selectedOrgId = ref(null);
const keyLocations = ref([...DEMO_KEY_LOCATIONS]);
const areaCheckpoints = ref([]);
const pendingTasks = ref([...DEMO_PENDING_TASKS]);
const jurisdictionArea = ref(null);

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
  boatTotal: 0,
});

const targetStats = ref({ ...DEFAULT_TARGET_STATS });

const deviceCards = computed(() => [
  {
    key: "drone",
    label: "无人�?,
    icon: MAP_LEGEND_DEVICE_ICONS.drone,
    count: deviceStats.value.droneTotal,
    unit: "�?,
    path: `${MONITOR_BASE}/drones`,
    details: [
      { label: "机场", value: deviceStats.value.droneAirport },
      { label: "单兵", value: deviceStats.value.droneSingle },
    ],
  },
  {
    key: "dog",
    label: "无人�?,
    icon: MAP_LEGEND_DEVICE_ICONS.dog,
    count: deviceStats.value.dogTotal,
    unit: "�?,
    path: `${MONITOR_BASE}/dogs`,
    details: [],
  },
  {
    key: "boat",
    label: "无人�?,
    icon: MAP_LEGEND_DEVICE_ICONS.boat,
    count: deviceStats.value.boatTotal,
    unit: "�?,
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

async function loadJurisdictionArea() {
  if (selectedOrgId.value == null) {
    jurisdictionArea.value = null;
    return;
  }
  try {
    const data = await fetchOrgDetail({ id: selectedOrgId.value });
    jurisdictionArea.value = parseJurisdictionArea(data);
  } catch {
    jurisdictionArea.value = null;
  }
}

async function loadAreaCheckpoints() {
  try {
    const data = await fetchCheckpointPage({ current: 1, pageSize: 500 });
    const records = unwrapApiList(data);
    areaCheckpoints.value = records.map((item) => ({
      id: item.id,
      name: item.name,
      coord: item.coord || "-",
    }));
  } catch {
    areaCheckpoints.value = [...DEMO_AREA_CHECKPOINTS];
  }
}

function handleOrgChange(orgId) {
  selectedOrgId.value = orgId;
  if (authStore.isSuperAdmin) {
    authStore.setCurrentOrgId(orgId);
  }
  loadDeviceStats();
  loadTargetStats();
  loadAreaCheckpoints();
  loadJurisdictionArea();
}

function goDevicePage(path) {
  router.push(path);
}

function goTargetList(type) {
  router.push({
    path: `${INFRA_BASE}/targets`,
    query: {
      type: String(type),
      orgId: selectedOrgId.value ?? undefined,
    },
  });
}

function goCheckpointList() {
  router.push(`${INFRA_BASE}/checkpoints`);
}

function handleConfigure(section) {
  if (section === "jurisdiction") {
    if (selectedOrgId.value == null) {
      ElMessage.warning("请先选择单位");
      return;
    }
    router.push(`${BACKEND_BASE}/orgs/${selectedOrgId.value}`);
    return;
  }
  if (section === "locations") {
    router.push(`${INFRA_BASE}/locations`);
    return;
  }
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
      loadAreaCheckpoints();
      loadJurisdictionArea();
    }
  },
);

onMounted(async () => {
  await loadOrgOptions();
  await Promise.all([
    loadDeviceStats(),
    loadTargetStats(),
    loadAreaCheckpoints(),
    loadJurisdictionArea(),
  ]);
});
</script>

<style scoped lang="scss">
$primary: #29408a;
$primary-light: #eaecf3;

.monitor-center {
  min-height: 100%;
}

.monitor-center__shell {
  background: #fff;
  border-radius: 12px;
  border: 1px solid rgba(41, 64, 138, 0.08);
  box-shadow:
    0 1px 2px rgba(15, 23, 42, 0.04),
    0 12px 40px rgba(41, 64, 138, 0.06);
  overflow: hidden;
}

.monitor-hero {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  padding: 20px 28px;
  background: #fff;
  border-bottom: 1px solid rgba(41, 64, 138, 0.08);
}

.monitor-hero__title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  line-height: 1.2;
  color: #1a1f36;
}

.monitor-hero__org-select {
  width: 260px;

  :deep(.el-select__wrapper) {
    min-height: 36px;
    border-radius: 6px;
  }
}

.monitor-tabs {
  padding: 0 28px 28px;

  :deep(.el-tabs__header) {
    margin: 0 0 8px;
  }

  :deep(.el-tabs__nav-wrap::after) {
    height: 1px;
    background: rgba(41, 64, 138, 0.08);
  }

  :deep(.el-tabs__item) {
    height: 52px;
    padding: 0 4px;
    margin-right: 28px;
    font-size: 15px;
    color: #8b93a7;
    transition: color 0.2s ease;
  }

  :deep(.el-tabs__item.is-active) {
    color: $primary;
    font-weight: 600;
  }

  :deep(.el-tabs__active-bar) {
    height: 3px;
    border-radius: 3px 3px 0 0;
    background: linear-gradient(90deg, $primary 0%, #5266a6 100%);
  }

  :deep(.el-tab-pane) {
    padding-top: 24px;
  }
}

.monitor-section {
  & + & {
    margin-top: 32px;
  }

  &--panels {
    margin-top: 36px;
    padding-top: 28px;
    border-top: 1px solid rgba(41, 64, 138, 0.08);
  }
}

.section-head {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 18px;

  &--compact {
    margin-bottom: 16px;
  }
}

.section-head__accent {
  width: 4px;
  height: 36px;
  margin-top: 2px;
  border-radius: 4px;
  background: linear-gradient(180deg, $primary 0%, #5266a6 100%);
  flex-shrink: 0;
}

.section-head__title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #1a1f36;
  line-height: 1.3;
}

.section-head__subtitle {
  margin: 4px 0 0;
  font-size: 12px;
  color: #8b93a7;
  line-height: 1.5;
}

.device-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
}

.asset-card {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  min-height: 148px;
  padding: 16px 18px 14px;
  border: none;
  border-radius: 14px;
  overflow: hidden;
  cursor: pointer;
  transition:
    transform 0.25s ease,
    box-shadow 0.25s ease;

  &:hover {
    transform: translateY(-2px);
  }
}

.asset-card__label {
  align-self: flex-start;
  font-size: 15px;
  font-weight: 600;
  line-height: 1.3;
  text-align: left;
}

.asset-card__center {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  flex: 1;
  margin-top: 14px;
  min-height: 56px;
}

.asset-card__icon {
  display: block;
  width: 30px;
  height: 30px;
  object-fit: contain;
  object-position: center;
  flex-shrink: 0;
  pointer-events: none;
  user-select: none;
}

.asset-card__count {
  font-size: 36px;
  font-weight: 700;
  line-height: 1;
  letter-spacing: -0.02em;
}

.asset-card__unit {
  margin-left: 4px;
  font-size: 15px;
  font-weight: 500;
}

.asset-card__meta {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px;
  margin-top: 10px;
}

.device-card {
  color: #fff;
  text-align: left;
  background: linear-gradient(135deg, #29408a 0%, #3d5499 52%, #5266a6 100%);
  box-shadow: 0 8px 24px rgba(41, 64, 138, 0.28);

  &:hover {
    box-shadow: 0 16px 36px rgba(41, 64, 138, 0.32);
  }

  .asset-card__unit {
    opacity: 0.88;
  }

  .asset-card__icon {
    filter: brightness(0) invert(1);
  }
}

.device-card__shine {
  position: absolute;
  top: -40%;
  right: -10%;
  width: 220px;
  height: 220px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.22) 0%, transparent 68%);
  pointer-events: none;
}

.device-card__tag {
  padding: 4px 10px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.18);
  backdrop-filter: blur(4px);
  font-size: 12px;
  line-height: 1.4;
}

.target-grid {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 14px;
}

.target-card {
  border: 1px solid rgba(41, 64, 138, 0.1);
  background: linear-gradient(180deg, #fafbfe 0%, #fff 100%);
  text-align: left;

  &:hover {
    border-color: rgba(41, 64, 138, 0.22);
    box-shadow: 0 10px 28px rgba(41, 64, 138, 0.1);
  }

  .asset-card__label {
    color: #303133;
  }

  .asset-card__count {
    color: $primary;
  }

  .asset-card__unit {
    color: $primary;
  }
}

.panel-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
}

.data-panel {
  display: flex;
  flex-direction: column;
  min-height: 300px;
  padding: 18px 18px 16px;
  border: 1px solid rgba(41, 64, 138, 0.08);
  border-radius: 12px;
  background: #fff;
  box-shadow: 0 4px 16px rgba(41, 64, 138, 0.04);
}

.data-panel__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}

.data-panel__title {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #1a1f36;
}

.data-panel__badge {
  padding: 2px 10px;
  border-radius: 999px;
  background: $primary-light;
  color: $primary;
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
}

.data-panel__map {
  flex: 1;
  min-height: 180px;
  overflow: hidden;
  border-radius: 10px;

  :deep(.tianditu-area-map) {
    height: 100%;
    min-height: 0;
    border-radius: 10px;
  }
}

.data-panel--jurisdiction {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr) auto;

  .data-panel__map {
    flex: unset;
    min-height: 0;
    display: flex;
    flex-direction: column;
  }

  .data-panel__map-placeholder {
    flex: 1;
    min-height: 0;
    height: auto;
  }

  .data-panel__link {
    flex-shrink: 0;
    margin-top: 14px;
    justify-self: end;
  }
}

.data-panel__map-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  height: 100%;
  min-height: 180px;
  padding: 20px;
  border-radius: 10px;
  background:
    linear-gradient(135deg, rgba(41, 64, 138, 0.04) 0%, rgba(41, 64, 138, 0.01) 100%),
    #f8f9fc;
  border: 1px dashed rgba(41, 64, 138, 0.14);
  color: #8b93a7;
  font-size: 13px;
  text-align: center;
  line-height: 1.6;

  i {
    font-size: 28px;
    color: rgba(41, 64, 138, 0.35);
  }
}

.data-panel__list {
  list-style: none;
  margin: 0;
  padding: 0;
  flex: 1;
}

.data-panel__list--stack {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.data-panel__row {
  display: grid;
  grid-template-columns: 32px 52px 1fr auto;
  align-items: center;
  gap: 8px;
  min-height: 38px;
  padding: 8px 0;
  border-bottom: 1px solid #f0f2f7;
  font-size: 13px;
  color: #606266;

  &:last-child {
    border-bottom: none;
  }
}

.data-panel__row--checkpoint {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  min-height: auto;
  padding: 0;
  border-bottom: none;
}

.data-panel__index {
  font-size: 12px;
  font-weight: 600;
  color: #a0a7b8;
  font-variant-numeric: tabular-nums;
}

.data-panel__chip {
  font-size: 12px;
  color: #303133;
}

.data-panel__name {
  color: #303133;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.data-panel__coord {
  color: #a0a7b8;
  font-size: 12px;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.data-panel__checkpoint-name {
  padding: 5px 12px;
  border-radius: 999px;
  background: $primary-light;
  color: #606266;
  font-size: 13px;
}

.data-panel__link {
  align-self: flex-end;
  justify-self: end;
  margin-left: auto;
  display: inline-flex;
  align-items: center;
  gap: 2px;
  margin-top: 14px;
  padding: 0;
  border: none;
  background: none;
  color: $primary;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: gap 0.2s ease;

  &:hover {
    gap: 6px;
  }

  i {
    font-size: 16px;
  }
}

@media (max-width: 1400px) {
  .target-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 1200px) {
  .device-grid,
  .panel-grid {
    grid-template-columns: 1fr;
  }

  .target-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .monitor-hero {
    padding: 16px;
  }

  .monitor-hero__org-select {
    width: 100%;
  }
}

@media (max-width: 768px) {
  .monitor-tabs {
    padding: 0 16px 20px;
  }

  .target-grid {
    grid-template-columns: 1fr;
  }

  .asset-card__count {
    font-size: 32px;
  }

  .asset-card__icon {
    width: 30px;
    height: 30px;
  }
}
</style>
