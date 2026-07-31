<template>
  <section
    v-if="visible"
    class="history-panel"
    :class="{ 'history-panel--fullscreen': isFullscreen }"
    aria-label="历史任务记录"
  >
    <header class="history-panel__head">
      <div class="history-panel__head-bar">
        <img :src="tableJlPng" class="history-panel__title-icon" alt="" aria-hidden="true" />
        <div class="history-panel__title-group">
          <h2 class="history-panel__title">历史任务记录</h2>
          <span class="history-panel__title-divider" aria-hidden="true" />
          <p class="history-panel__subtitle">仅显示30日的数据</p>
          <button type="button" class="history-panel__expand-btn" @click="expandAll">
            一键展开
          </button>
          <button type="button" class="history-panel__expand-btn" @click="collapseAll">
            一键关闭
          </button>
        </div>
        <div class="history-panel__head-actions">
          <el-date-picker
            v-model="dateRange"
            class="history-panel__date"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            format="YYYY-MM-DD"
            :clearable="true"
            :disabled-date="disabledHistoryDate"
            teleported
            popper-class="plan-editor-picker-popper"
            @clear="onDateRangeClear"
          />
          <el-select
            v-if="activeTab === 'plan'"
            v-model="scenarioType"
            class="history-panel__scenario"
            placeholder="全部场景"
            clearable
            teleported
            popper-class="history-panel__scenario-popper"
          >
            <el-option
              v-for="opt in scenarioTypeOptions"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>
          <el-select
            v-if="activeTab === 'companion'"
            v-model="taskStatus"
            class="history-panel__scenario"
            placeholder="全部状态"
            clearable
            teleported
            popper-class="history-panel__scenario-popper"
          >
            <el-option
              v-for="opt in taskStatusOptions"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>
          <button type="button" class="history-panel__reset" @click="onResetFilters">重置</button>
          <button
            type="button"
            class="history-panel__fullscreen"
            :aria-label="isFullscreen ? '退出全屏' : '全屏查看'"
            @click="toggleFullscreen"
          >
            <i :class="isFullscreen ? 'ri-fullscreen-exit-line' : 'ri-fullscreen-line'" />
          </button>
          <button type="button" class="history-panel__close" aria-label="关闭" @click="closePanel">
            <img :src="tableClosePng" class="history-panel__close-icon" alt="" aria-hidden="true" />
          </button>
        </div>
      </div>
      <el-tabs v-model="activeTab" class="history-panel__el-tabs">
        <el-tab-pane label="飞行计划" name="plan" />
        <el-tab-pane label="伴飞任务" name="companion" />
      </el-tabs>
    </header>

    <div v-loading="loading" class="history-panel__body">
      <el-table
        ref="tableRef"
        :data="records"
        row-key="id"
        class="history-table"
        empty-text="暂无执行记录"
        :header-cell-style="tableHeaderStyle"
        :cell-style="tableCellStyle"
        @expand-change="onExpandChange"
      >
        <el-table-column type="expand" width="40">
          <template #default="{ row }">
            <div v-if="row.events?.length" class="history-events">
              <div
                v-for="ev in row.events"
                :key="ev.id"
                class="history-event-row"
                :class="
                  activeTab === 'companion'
                    ? 'history-event-row--companion'
                    : 'history-event-row--plan'
                "
              >
                <span
                  class="history-event-row__cell history-event-row__cell--type"
                  :title="formatWarnTypeLabel(ev)"
                >
                  【{{ ev.warnType }}】
                </span>
                <span
                  v-if="activeTab === 'companion'"
                  class="history-event-row__cell history-event-row__cell--ai"
                  :title="ev.aiResult || '—'"
                >
                  {{ ev.aiResult || "—" }}
                </span>
                <span class="history-event-row__cell history-event-row__cell--img">
                  <el-image
                    v-if="ev.imageUrl"
                    class="history-event-img"
                    :src="ev.imageUrl"
                    fit="cover"
                    :preview-src-list="[ev.imageUrl]"
                    preview-teleported
                    :preview-z-index="imagePreviewZIndex"
                    hide-on-click-modal
                  />
                  <span v-else class="history-event-img--empty">—</span>
                </span>
                <span class="history-event-row__cell" :title="ev.eventTime || '—'">
                  {{ ev.eventTime }}
                </span>
                <span class="history-event-row__cell" :title="formatWarnLngLat(ev)">
                  {{ formatWarnLngLat(ev) }}
                </span>
                <span
                  v-if="activeTab === 'plan'"
                  class="history-event-row__cell"
                  :title="ev.droneName || '—'"
                >
                  {{ ev.droneName || "—" }}
                </span>
              </div>
            </div>
            <div v-else class="history-events-empty">{{ expandEmptyText }}</div>
          </template>
        </el-table-column>
        <template v-if="activeTab === 'plan'">
          <el-table-column prop="scenarioTitle" label="场景类型" min-width="80" />
          <el-table-column prop="subject" label="安保主题" min-width="120" show-overflow-tooltip />
          <el-table-column prop="locationLabel" label="地点选择" min-width="120" show-overflow-tooltip />
          <el-table-column label="实施时间" width="130" show-overflow-tooltip>
            <template #default="{ row }">
              {{ formatExecuteTimeRange(row) }}
            </template>
          </el-table-column>
          <el-table-column label="所需资源" width="100" show-overflow-tooltip>
            <template #default="{ row }">
              <el-popover
                v-if="row.resourceText !== '—'"
                trigger="click"
                placement="bottom-start"
                :width="330"
                popper-class="history-resource-popover"
              >
                <template #reference>
                  <span class="history-resource-link">{{ row.resourceText }}</span>
                </template>
                <div class="history-resource-pop">
                  <template v-if="row.resourceInfo?.length">
                    <div
                      v-for="(ri, i) in row.resourceInfo"
                      :key="ri.id || i"
                      class="history-resource-pop__item"
                    >
                      <span class="history-resource-pop__name">{{ ri.name || "—" }}</span>
                      <span class="history-resource-pop__id">ID: {{ ri.id || "—" }}</span>
                      <span class="history-resource-pop__sn">SN: {{ ri.sn || "—" }}</span>
                    </div>
                  </template>
                  <div v-else class="history-resource-pop__item">
                    <span class="history-resource-pop__name">暂无设备详情</span>
                  </div>
                </div>
              </el-popover>
              <span v-else>{{ row.resourceText }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="warnCount" label="AI事件总数" width="125" align="center" />
          <el-table-column label="开始时间" width="130" show-overflow-tooltip>
            <template #default="{ row }">{{ row.startTime || "—" }}</template>
          </el-table-column>
          <el-table-column label="结束时间" width="130" show-overflow-tooltip>
            <template #default="{ row }">{{ row.endTime || "—" }}</template>
          </el-table-column>
          <el-table-column prop="startModeLabel" label="开始方式" width="105" />
          <el-table-column label="操作" fixed="right">
            <template #default="{ row }">
              <button type="button" class="history-op history-op--primary" @click="onQuickCreate(row)">
                快捷创建
              </button>
              <button type="button" class="history-op history-op--danger" @click="onDeleteRecord(row)">
                删除记录
              </button>
            </template>
          </el-table-column>
        </template>
        <template v-else>
          <el-table-column prop="name" label="任务名称" min-width="140" show-overflow-tooltip />
          <el-table-column label="任务状态" width="110" align="center">
            <template #default="{ row }">
              <span class="task-status-tag" :class="row.statusClass">{{ row.statusLabel }}</span>
            </template>
          </el-table-column>
          <el-table-column label="任务创建时间" width="160" show-overflow-tooltip>
            <template #default="{ row }">{{ row.createTime || "—" }}</template>
          </el-table-column>
          <el-table-column label="开始时间" width="160" show-overflow-tooltip>
            <template #default="{ row }">{{ row.startTime || "—" }}</template>
          </el-table-column>
          <el-table-column label="结束时间" width="160" show-overflow-tooltip>
            <template #default="{ row }">{{ row.finishTime || "—" }}</template>
          </el-table-column>
        </template>
      </el-table>

      <div class="history-pagination">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :total="total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next"
          background
          popper-class="history-pagination-popper"
          @change="loadRecords"
        />
      </div>
    </div>

    <PlanHistoryQuickScheduleDialog
      v-model:visible="quickScheduleVisible"
      :record-subject="quickCreateRow?.subject"
      @confirm="onQuickScheduleConfirm"
    />
  </section>
</template>

<script setup>
import { computed, nextTick, ref, watch } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";

import { FlightPlanService } from "@/api/plan.js";
import { TaskService } from "@/api/task.js";
import { unwrapApiList } from "@/utils/request.js";
import { normalizeWarnDataToFlatEvents } from "@/utils/plan-algorithm-data.js";
import {
  PLAN_SCENARIOS,
  SCENARIO_TITLE_BY_KEY,
  TAB_TO_API_TYPE,
} from "@/components/plan-panel/plan-scenarios.js";
import PlanHistoryQuickScheduleDialog from "@/components/plan-panel/PlanHistoryQuickScheduleDialog.vue";
import tableJlPng from "@/assets/images/table_jl.png";
import tableClosePng from "@/assets/images/table_close.png";
import {
  buildQuickCreateBody,
  historyQuickCreateNeedsSchedule,
} from "@/utils/plan-history-quick-create.js";
import { getDefaultHistoryDateRange, getHistoryFullDateRange, isDateInHistoryRange } from "@/utils/plan-history.js";
import { TASK_STATUS_OPTIONS, taskToRecord } from "@/utils/task-history.js";

const visible = defineModel("visible", { type: Boolean, default: false });
const tableRef = ref(null);
const isFullscreen = ref(false);

const emit = defineEmits(["quick-create", "deleted"]);

/** @type {import('vue').Ref<'plan' | 'companion'>} */
const activeTab = ref("plan");

const dateRange = ref(getDefaultHistoryDateRange());
/** @type {import('vue').Ref<number | null>} 1山林救援 2水上观察 3重点安保 */
const scenarioType = ref(null);
/** @type {import('vue').Ref<number | null>} 0-4 伴飞任务状态 */
const taskStatus = ref(null);
const scenarioTypeOptions = PLAN_SCENARIOS.map((s) => ({
  value: TAB_TO_API_TYPE[s.key],
  label: s.title,
}));
const taskStatusOptions = TASK_STATUS_OPTIONS;
const loading = ref(false);
const records = ref([]);
const currentPage = ref(1);
const pageSize = ref(10);
const total = ref(0);
const quickScheduleVisible = ref(false);
/** @type {import('vue').Ref<Record<string, any> | null>} */
const quickCreateRow = ref(null);

/** @type {import('vue').Ref<Record<string, Array<Record<string,any>>>>} */
const warnDataCache = ref({});
/** @type {import('vue').Ref<Record<string, Array<Record<string,any>>>>} */
const taskWarningCache = ref({});

const suppressFilterReload = ref(false);

const expandEmptyText = computed(() =>
  activeTab.value === "companion" ? "暂无任务告警" : "暂无 AI 预警事件",
);

/** 高于 HomeHeader(10001)，避免预览关闭按钮被顶部栏遮挡 */
const imagePreviewZIndex = computed(() => (isFullscreen.value ? 10200 : 10100));

const tableHeaderStyle = {
  background: "#1c222a",
  color: "rgba(255, 255, 255, 0.85)",
  fontFamily: "Roboto, sans-serif",
  fontSize: "14px",
  fontWeight: "500",
  lineHeight: "22px",
  borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
};

const tableCellStyle = {
  background: "transparent",
  color: "rgba(255, 255, 255, 0.85)",
  fontFamily: "Roboto, sans-serif",
  fontSize: "14px",
  fontWeight: "400",
  lineHeight: "22px",
  borderColor: "rgba(255, 255, 255, 0.08)",
};

function disabledHistoryDate(date) {
  return !isDateInHistoryRange(date);
}

function formatWarnLngLat(ev) {
  const lng = ev?.longitude;
  const lat = ev?.latitude;
  if (lng != null && lat != null) {
    return `${Number(lng).toFixed(6)}, ${Number(lat).toFixed(6)}`;
  }
  return "—";
}

function formatWarnTypeLabel(ev) {
  const type = ev?.warnType;
  if (type == null || type === "" || type === "—") return "—";
  return `【${type}】`;
}

function formatExecuteTimeRange(row) {
  const date = row.executeDate ? String(row.executeDate).replace(/-/g, "-") : "";
  const start = row.executeStartTime || "";
  const end = row.executeEndTime || "";
  if (!date && !start && !end) return "—";
  if (date && start && end) return `${date} ${start}-${end}`;
  if (date && start) return `${date} ${start}`;
  if (date) return date;
  return `${start}-${end}`;
}

function formatDisplayDate(ymd) {
  if (!ymd) return "—";
  return String(ymd).slice(0, 10).replace(/-/g, "/");
}

const RESOURCE_TYPE_LABEL = { drone: "无人机", hound: "无人犬", boat: "无人艇" };

function toHm(t) {
  if (t == null || t === "") return "—";
  const s = String(t);
  return s.length >= 5 ? s.slice(0, 5) : s;
}

function apiTypeToScenarioKey(typeNum) {
  if (typeNum === 2) return "water";
  if (typeNum === 3) return "security";
  return "mountain";
}

function startTypeLabel(v) {
  if (v === 1) return "紧急启动";
  if (v === 2) return "按时启动";
  return "—";
}

function formatResourceText(p) {
  const rc = p.resourceConfig;
  if (Array.isArray(rc) && rc.length) {
    return rc
      .map((r) => {
        const label = RESOURCE_TYPE_LABEL[r?.resourceType] || r?.resourceType || "资源";
        const count = Number(r?.resourceCount) || 0;
        return count > 0 ? `${label}×${count}` : "";
      })
      .filter(Boolean)
      .join("、");
  }
  return "—";
}

function planToRecord(p) {
  const scenarioKey = apiTypeToScenarioKey(p.type);
  return {
    id: p.id,
    planId: p.id,
    scenarioKey,
    scenarioTitle: SCENARIO_TITLE_BY_KEY[scenarioKey] || "—",
    subject: p.name || "—",
    locationLabel: p.placeNames || "—",
    executeDate: String(p.executeDate || "").slice(0, 10),
    resourceText: formatResourceText(p),
    resourceInfo: Array.isArray(p.resourceInfo) ? p.resourceInfo : [],
    aiEventCount: p.warnCount || 0,
    warnCount: p.warnCount || 0,
    startTime: p.startTime || "",
    endTime: p.endTime || "",
    timeStart: toHm(p.executeStartTime),
    timeEnd: toHm(p.executeEndTime),
    startModeLabel: startTypeLabel(p.startType),
    events: warnDataCache.value[p.id] || [],
    raw: p,
  };
}

function closePanel() {
  isFullscreen.value = false;
  visible.value = false;
}

function toggleFullscreen() {
  isFullscreen.value = !isFullscreen.value;
}

function expandAll() {
  records.value.forEach((row) => {
    tableRef.value?.toggleRowExpansion(row, true);
  });
}

function collapseAll() {
  records.value.forEach((row) => {
    tableRef.value?.toggleRowExpansion(row, false);
  });
}

function onResetFilters() {
  dateRange.value = getDefaultHistoryDateRange();
  scenarioType.value = null;
  taskStatus.value = null;
  currentPage.value = 1;
}

function onDateRangeClear() {
  dateRange.value = getHistoryFullDateRange();
}

async function resetPanelState() {
  suppressFilterReload.value = true;
  activeTab.value = "plan";
  dateRange.value = getDefaultHistoryDateRange();
  scenarioType.value = null;
  taskStatus.value = null;
  currentPage.value = 1;
  pageSize.value = 10;
  total.value = 0;
  records.value = [];
  isFullscreen.value = false;
  quickScheduleVisible.value = false;
  quickCreateRow.value = null;
  warnDataCache.value = {};
  taskWarningCache.value = {};
  await nextTick();
  suppressFilterReload.value = false;
}

function buildTimeRange() {
  const range = dateRange.value?.length === 2 && dateRange.value[0] && dateRange.value[1]
    ? dateRange.value
    : getHistoryFullDateRange();
  return {
    startTime: `${range[0]} 00:00:00`,
    endTime: `${range[1]} 23:59:59`,
  };
}

async function loadRecords() {
  if (!visible.value) return;
  if (loading.value) return;
  loading.value = true;
  try {
    if (activeTab.value === "companion") {
      await loadCompanionRecords();
    } else {
      await loadPlanRecords();
    }
  } catch (e) {
    console.error("[PlanHistory] loadRecords failed:", e);
    records.value = [];
    ElMessage.warning(e?.message || "加载任务记录失败");
  } finally {
    loading.value = false;
  }
}

async function loadPlanRecords() {
  const range = buildTimeRange();
  const query = {
    current: currentPage.value,
    pageSize: pageSize.value,
    ...range,
  };
  if (scenarioType.value != null && scenarioType.value !== "") {
    query.type = scenarioType.value;
  }
  const data = await FlightPlanService.recordPageQuery(query);
  const list = unwrapApiList(data);
  total.value = data?.total ?? data?.data?.total ?? list.length;
  records.value = list.map(planToRecord).filter((r) => r.id);
}

async function loadCompanionRecords() {
  const range = buildTimeRange();
  const query = {
    current: currentPage.value,
    pageSize: pageSize.value,
    ...range,
  };
  if (taskStatus.value != null && taskStatus.value !== "") {
    query.status = taskStatus.value;
  }
  const data = await TaskService.taskPageQuery(query);
  const list = unwrapApiList(data);
  total.value = data?.total ?? data?.data?.total ?? list.length;
  records.value = list
    .map((item) => {
      const record = taskToRecord(item);
      if (!record) return null;
      const uuid = record.uuid;
      return {
        ...record,
        events: taskWarningCache.value[uuid] || [],
      };
    })
    .filter(Boolean);
}

function onQuickCreate(row) {
  if (!row?.id) return;
  if (historyQuickCreateNeedsSchedule(row)) {
    quickCreateRow.value = row;
    quickScheduleVisible.value = true;
    return;
  }
  confirmAndQuickCreate(row);
}

function onQuickScheduleConfirm(schedule) {
  const row = quickCreateRow.value;
  if (!row?.id) return;
  submitQuickCreate(row, schedule);
}

async function confirmAndQuickCreate(row) {
  const label = row.scenarioTitle || "飞行计划";
  const name = row.subject || "该记录";
  try {
    await ElMessageBox.confirm(
      `确定基于「${name}」快捷创建${label}？\n\n山林救援、水上观察无需重新选择日期与时间。`,
      "快捷创建",
      {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "info",
      },
    );
  } catch {
    return;
  }
  await submitQuickCreate(row, null);
}

async function submitQuickCreate(row, schedule) {
  try {
    const body = buildQuickCreateBody(row, schedule || undefined);
    await FlightPlanService.planAdd(body);
    ElMessage.success("创建成功");
    emit("quick-create", row);
  } catch (e) {
    ElMessage.warning(e?.message || "快捷创建失败");
  }
}

function onDeleteRecord(row) {
  if (!row?.id) return;
  const planId = row.planId || row.id;
  ElMessageBox.confirm(`确定删除「${row.subject}」？删除后不可恢复。`, "删除计划", {
    confirmButtonText: "删除",
    cancelButtonText: "取消",
    type: "warning",
  })
    .then(async () => {
      try {
        await FlightPlanService.planDelete({ id: planId });
        total.value = Math.max(0, total.value - 1);
        records.value = records.value.filter((r) => r.id !== row.id);
        if (records.value.length === 0 && currentPage.value > 1) {
          currentPage.value--;
          loadRecords();
        }
        ElMessage.success("已删除计划");
        emit("deleted", row);
      } catch (e) {
        ElMessage.warning(e?.message || "删除失败");
      }
    })
    .catch(() => {});
}

async function onExpandChange(row) {
  if (activeTab.value === "companion") {
    await loadTaskWarnings(row);
    return;
  }
  await loadPlanWarnings(row);
}

async function loadPlanWarnings(row) {
  const planId = row?.planId || row?.id;
  if (!planId || warnDataCache.value[planId]) return;
  try {
    const warnData = await FlightPlanService.planWarnData({ id: planId });
    const events = normalizeWarnDataToFlatEvents(warnData);
    warnDataCache.value = { ...warnDataCache.value, [planId]: events };
    patchRowEvents(planId, events, (r) => (r.planId || r.id) === planId);
  } catch {
    warnDataCache.value = { ...warnDataCache.value, [planId]: [] };
    patchRowEvents(planId, [], (r) => (r.planId || r.id) === planId);
  }
}

async function loadTaskWarnings(row) {
  const uuid = row?.uuid || row?.id;
  if (!uuid || taskWarningCache.value[uuid]) return;
  try {
    const data = await TaskService.taskWarningPageQuery({ uuid });
    const events = normalizeWarnDataToFlatEvents(data);
    taskWarningCache.value = { ...taskWarningCache.value, [uuid]: events };
    patchRowEvents(uuid, events, (r) => (r.uuid || r.id) === uuid);
  } catch {
    taskWarningCache.value = { ...taskWarningCache.value, [uuid]: [] };
    patchRowEvents(uuid, [], (r) => (r.uuid || r.id) === uuid);
  }
}

function patchRowEvents(key, events, matchFn) {
  const idx = records.value.findIndex(matchFn);
  if (idx < 0) return;
  const next = [...records.value];
  next[idx] = {
    ...next[idx],
    events,
    aiEventCount: events.length,
    warnCount: events.length,
  };
  records.value = next;
}

watch(visible, async (v) => {
  if (v) {
    await resetPanelState();
    loadRecords();
    return;
  }
  isFullscreen.value = false;
});

watch(
  () => [dateRange.value, scenarioType.value, taskStatus.value, activeTab.value],
  () => {
    if (!visible.value || suppressFilterReload.value) return;
    currentPage.value = 1;
    collapseAll();
    loadRecords();
  },
);
</script>

<style lang="scss" scoped>
.history-panel {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  max-height: calc(100vh - 110px);
  border: 1px solid #30363b;
  border-radius: 6px;
  background: rgba(3, 6, 10, 0.65);
  padding: 10px;

  &--fullscreen {
    position: fixed;
    inset: 0;
    z-index: 10020;
    max-height: none;
    width: 100vw;
    border-radius: 0;
    background: rgba(3, 6, 10, 0.96);
  }
}

.history-panel__head {
  flex-shrink: 0;
  margin-bottom: 10px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.history-panel__head-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  border-radius: 6px;
  background: #1c222a;
}

.history-panel__title-icon {
  width: 24px;
  height: 24px;
  object-fit: contain;
  flex-shrink: 0;
}

.history-panel__title-group {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
  min-width: 0;
}

.history-panel__title {
  margin: 0;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  height: 18px;
  color: #fff;
  font-family: "HarmonyOS Sans SC", sans-serif;
  font-size: 18px;
  font-style: normal;
  font-weight: 500;
  line-height: 18px;
  white-space: nowrap;
}

.history-panel__title-divider {
  flex-shrink: 0;
  align-self: center;
  width: 1px;
  height: 18px;
  background: rgba(255, 255, 255, 0.2);
}

.history-panel__subtitle {
  margin: 0;
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  height: 18px;
  color: rgba(255, 255, 255, 0.65);
  font-family: "HarmonyOS Sans SC", sans-serif;
  font-size: 18px;
  font-style: normal;
  font-weight: 400;
  line-height: 18px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

:deep(.history-panel__el-tabs) {
  margin-top: 10px;

  .el-tabs__header {
    margin: 0;
  }

  .el-tabs__nav-wrap::after {
    height: 1px;
    background-color: rgba(255, 255, 255, 0.12);
  }

  .el-tabs__item {
    height: 40px;
    padding: 0 20px;
    color: rgba(255, 255, 255, 0.55);
    font-size: 15px;
    font-weight: 500;

    &:hover {
      color: rgba(255, 255, 255, 0.85);
    }

    &.is-active {
      color: #558efc;
    }
  }

  .el-tabs__active-bar {
    height: 2px;
    background-color: #558efc;
  }
}

.history-panel__expand-btn {
  flex-shrink: 0;
  height: 28px;
  padding: 0 10px;
  border: 1px solid #558efc;
  border-radius: 2px;
  background: #15191e;
  color: rgba(255, 255, 255, 0.85);
  font-family: Roboto, sans-serif;
  font-size: 13px;
  line-height: 26px;
  cursor: pointer;
  white-space: nowrap;

  &:hover {
    background: rgba(85, 142, 252, 0.1);
  }
}

.history-panel__head-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
  margin-left: auto;
}

.history-panel__close {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 4px;
  background: transparent;
  cursor: pointer;
  padding: 0;

  &:hover {
    background: rgba(255, 255, 255, 0.08);
  }
}

.history-panel__fullscreen {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #558efc;
  border-radius: 4px;
  background: #15191e;
  color: rgba(255, 255, 255, 0.85);
  cursor: pointer;
  padding: 0;
  font-size: 18px;
  line-height: 1;

  &:hover {
    background: rgba(85, 142, 252, 0.15);
  }
}

.history-panel__close-icon {
  width: 20px;
  height: 20px;
  object-fit: contain;
  display: block;
}

.history-panel__date {
  width: 260px;
}

.history-panel__scenario {
  width: 140px;
}

.history-panel__reset {
  height: 32px;
  padding: 0 14px;
  border: 1px solid #558EFC;
  border-radius: 2px;
  background: #15191E;
  color: rgba(255, 255, 255, 0.85);
  font-family: Roboto, sans-serif;
  font-size: 14px;
  font-weight: 400;
  line-height: 22px;
  cursor: pointer;

  &:hover {
    background: rgba(85, 142, 252, 0.1);
  }
}

.history-panel__body {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 0 0 12px;

  &::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.15);
    border-radius: 3px;

    &:hover {
      background: rgba(255, 255, 255, 0.25);
    }
  }

  :deep(.el-loading-mask) {
    background-color: rgba(3, 6, 10, 0.7);
  }

  :deep(.el-loading-spinner .circular) {
    circle {
      stroke: rgba(255, 255, 255, 0.55);
    }

    .path {
      stroke: #1890ff;
    }
  }
}

.history-table {
  width: 100%;
  font-family: Roboto, sans-serif;
  font-size: 14px;
  line-height: 22px;
  --el-table-bg-color: transparent;
  --el-table-tr-bg-color: transparent;
  --el-table-header-bg-color: #1c222a;
  --el-table-row-hover-bg-color: rgba(255, 255, 255, 0.04);
  --el-table-border-color: rgba(255, 255, 255, 0.08);
  --el-table-text-color: rgba(255, 255, 255, 0.85);
  --el-table-header-text-color: rgba(255, 255, 255, 0.85);
}

.history-events {
  padding: 8px 12px 8px 48px;
  background: #1c222a;
}

.history-events-empty {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 24px 0;
  font-family: Roboto, sans-serif;
  font-size: 14px;
  font-weight: 400;
  line-height: 22px;
  color: rgba(255, 255, 255, 0.45);
}

.history-event-row {
  display: grid;
  gap: 10px;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  font-family: Roboto, sans-serif;
  font-size: 14px;
  font-weight: 400;
  line-height: 22px;
  color: rgba(255, 255, 255, 0.85);

  &:last-child {
    border-bottom: none;
  }

  &--plan {
    grid-template-columns: 140px 72px 160px 1fr 1fr;
  }

  &--companion {
    grid-template-columns: 140px 120px 72px 160px 1fr;
  }
}

.history-event-row__cell {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  cursor: default;
}

.history-event-row__cell--ai {
  color: rgba(255, 255, 255, 0.72);
}

.history-event-row__cell--img {
  display: flex;
  align-items: center;
}

.history-event-img {
  width: 48px;
  height: 48px;
  border-radius: 4px;
  cursor: zoom-in;
  border: 1px solid rgba(255, 255, 255, 0.12);
}

.history-event-img--empty {
  color: rgba(255, 255, 255, 0.35);
}

.history-op {
  margin: 0 8px 0 0;
  padding: 0;
  border: none;
  background: none;
  font-family: Roboto, sans-serif;
  font-size: 14px;
  font-style: normal;
  font-weight: 400;
  line-height: 22px;
  color: var(--Primary-6, #1890ff);
  cursor: pointer;
  white-space: nowrap;

  &:last-child {
    margin-right: 0;
  }

  &:hover {
    opacity: 0.85;
  }

  &--primary,
  &--danger {
    color: var(--Primary-6, #1890ff);
  }
}

:deep(.history-table.el-table) {
  background: transparent;
}

:deep(.history-table .el-table__inner-wrapper::before) {
  display: none;
}

:deep(.history-table .el-table__empty-block) {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
}

:deep(.history-table .el-table__empty-text) {
  color: rgba(255, 255, 255, 0.45);
}

:deep(.history-table th.el-table__cell) {
  background: #1c222a !important;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1) !important;
  color: rgba(255, 255, 255, 0.85) !important;
  font-family: Roboto, sans-serif;
  font-size: 14px;
  font-weight: 500;
  line-height: 22px;
}

:deep(.history-table td.el-table__cell) {
  background: transparent !important;
  color: rgba(255, 255, 255, 0.85) !important;
  font-family: Roboto, sans-serif;
  font-size: 14px;
  font-weight: 400;
  line-height: 22px;
  border-bottom: none !important;
}

:deep(.history-table .el-table__body tr:hover > td.el-table__cell) {
  background: rgba(255, 255, 255, 0.04) !important;
}

:deep(.history-table .el-table__expanded-cell) {
  background: #1c222a !important;
  padding: 0 !important;
}

:deep(.history-table .el-table__expanded-cell.el-table__cell) {
  background: #1c222a !important;
}

:deep(.history-table .el-table__expand-icon) {
  color: rgba(255, 255, 255, 0.65);
  font-size: 14px;
}

:deep(.history-panel__date.el-date-editor--daterange) {
  height: 32px;
  border-radius: 2px;
  border: 1px solid #558EFC;
  background: #15191E;
  box-shadow: none;
}

:deep(.history-panel__date .el-range-input) {
  color: rgba(255, 255, 255, 0.85);
  font-family: Roboto, sans-serif;
  font-size: 14px;
  background: transparent;
}

:deep(.history-panel__date .el-range-separator) {
  color: rgba(255, 255, 255, 0.55);
}

:deep(.history-panel__scenario.el-select) {
  .el-select__wrapper {
    min-height: 32px;
    border-radius: 2px;
    border: 1px solid #558efc;
    background: #15191e;
    box-shadow: none;
  }

  .el-select__placeholder,
  .el-select__selected-item {
    color: rgba(255, 255, 255, 0.85);
    font-family: Roboto, sans-serif;
    font-size: 14px;
  }

  .el-select__caret {
    color: rgba(255, 255, 255, 0.55);
  }
}

.history-pagination {
  display: flex;
  justify-content: center;
  padding: 16px 0 4px;

  :deep(.el-pagination__total) {
    color: #fff !important;
  }

  // Page size select
  :deep(.el-pagination__sizes) {
    .el-select__wrapper {
      // min-height: 32px !important;
      // border-radius: 2px !important;
      border: 1px solid rgba(255, 255, 255, 0.15) !important;
      background: #15191e !important;
      box-shadow: none !important;
    }

    .el-select__placeholder,
    .el-select__selected-item {
      color: rgba(255, 255, 255, 0.85) !important;
    }

    .el-select__caret {
      color: rgba(255, 255, 255, 0.55) !important;
    }
  }

  // Prev / Next buttons
  :deep(.btn-prev),
  :deep(.btn-next) {
    // min-width: 32px !important;
    // height: 32px !important;
    border-radius: 2px !important;
    border: 1px solid #558efc !important;
    background: #15191e !important;
    color: rgba(255, 255, 255, 0.85) !important;
  }

  :deep(.btn-prev:hover:not(:disabled)),
  :deep(.btn-next:hover:not(:disabled)) {
    color: #fff !important;
    background: rgba(85, 142, 252, 0.15) !important;
  }

  :deep(.btn-prev:disabled),
  :deep(.btn-next:disabled) {
    color: rgba(255, 255, 255, 0.25) !important;
    border-color: rgba(255, 255, 255, 0.12) !important;
    background: #15191e !important;
  }

  // Page numbers
  :deep(.el-pager li) {
    // min-width: 32px !important;
    // height: 32px !important;
    border-radius: 2px !important;
    border: 1px solid #558efc !important;
    background: #15191e !important;
    color: rgba(255, 255, 255, 0.85) !important;
    font-weight: 400 !important;
    line-height: 30px !important;
  }

  :deep(.el-pager li:hover:not(.is-active):not(.is-disabled)) {
    color: #fff !important;
    background: rgba(85, 142, 252, 0.15) !important;
  }

  :deep(.el-pager li.is-active) {
    background: #1890ff !important;
    border-color: #1890ff !important;
    color: #fff !important;
  }
}

.history-resource-link {
  color: var(--Primary-6, #1890ff);
  cursor: pointer;

  &:hover {
    opacity: 0.85;
  }
}

.task-status-tag {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 64px;
  padding: 2px 8px;
  border-radius: 4px;
  border: 1px solid transparent;
  font-size: 12px;
  line-height: 20px;
}

.task-status--idle {
  color: rgba(255, 255, 255, 0.65);
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.15);
}

.task-status--running {
  color: #1890ff;
  background: rgba(24, 144, 255, 0.12);
  border-color: rgba(24, 144, 255, 0.35);
}

.task-status--abnormal {
  color: #e6a23c;
  background: rgba(230, 162, 60, 0.12);
  border-color: rgba(230, 162, 60, 0.35);
}

.task-status--failed {
  color: #f56c6c;
  background: rgba(245, 108, 108, 0.12);
  border-color: rgba(245, 108, 108, 0.35);
}

.task-status--completed {
  color: #67c23a;
  background: rgba(103, 194, 58, 0.12);
  border-color: rgba(103, 194, 58, 0.35);
}
</style>

<style lang="scss">
/* 历史记录图片预览需高于 HomeHeader(10001) */
.el-image-viewer__wrapper {
  z-index: 10100 !important;
}

.history-pagination-popper.el-popper {
  --el-bg-color-overlay: #1a1f28;
  --el-fill-color-blank: #15191e;
  --el-text-color-regular: rgba(255, 255, 255, 0.88);
  --el-border-color-light: rgba(255, 255, 255, 0.12);
  background: #1a1f28 !important;
  border: 1px solid rgba(255, 255, 255, 0.12) !important;

  .el-select-dropdown__item {
    color: rgba(255, 255, 255, 0.88);

    &.is-hovering,
    &:hover {
      background: rgba(255, 255, 255, 0.08);
    }

    &.is-selected {
      color: #558efc;
    }
  }

  .el-popper__arrow::before {
    background: #1a1f28 !important;
    border-color: rgba(255, 255, 255, 0.12) !important;
  }
}

.history-panel__scenario-popper.el-popper {
  --el-bg-color-overlay: #1a1f28;
  --el-fill-color-blank: #15191e;
  --el-text-color-regular: rgba(255, 255, 255, 0.88);
  --el-border-color-light: rgba(255, 255, 255, 0.12);
  background: #1a1f28 !important;
  border: 1px solid rgba(255, 255, 255, 0.12) !important;

  .el-select-dropdown__item {
    color: rgba(255, 255, 255, 0.88);

    &.is-hovering,
    &:hover {
      background: rgba(255, 255, 255, 0.08);
    }

    &.is-selected {
      color: #6b9fff;
      font-weight: 600;
    }
  }

  .el-popper__arrow::before {
    background: #1a1f28 !important;
    border-color: rgba(255, 255, 255, 0.12) !important;
  }
}

.history-resource-popover {
  background: #1c222a !important;
  border: 1px solid #30363b !important;
  padding: 8px 0 !important;

  .el-popover__title {
    color: #fff;
  }

  .el-popper__arrow::before {
    background: #1c222a !important;
    border-color: #30363b !important;
  }
}

.history-resource-pop {
  max-height: 200px;
  overflow-y: auto;
  background: #1c222a;

  &::-webkit-scrollbar {
    width: 5px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.2);
    border-radius: 3px;

    &:hover {
      background: rgba(255, 255, 255, 0.35);
    }
  }
}

.history-resource-pop__item {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 8px 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  background: #1c222a;

  &:last-child {
    border-bottom: none;
  }
}

.history-resource-pop__name {
  font-size: 13px;
  font-weight: 600;
  color: #fff;
}

.history-resource-pop__id,
.history-resource-pop__sn {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.55);
}
</style>
