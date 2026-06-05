<template>
  <section v-if="visible" class="history-panel" aria-label="历史任务记录">
    <header class="history-panel__head">
      <div class="history-panel__head-bar">
        <img :src="tableJlPng" class="history-panel__title-icon" alt="" aria-hidden="true" />
        <div class="history-panel__title-group">
          <h2 class="history-panel__title">历史任务记录</h2>
          <span class="history-panel__title-divider" aria-hidden="true" />
          <p class="history-panel__subtitle">仅显示30日的数据，数据范围之外需要去平台端查看</p>
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
          />
          <button type="button" class="history-panel__reset" @click="onResetDate">重置</button>
          <button type="button" class="history-panel__close" aria-label="关闭" @click="closePanel">
            <img :src="tableClosePng" class="history-panel__close-icon" alt="" aria-hidden="true" />
          </button>
        </div>
      </div>
    </header>

    <div v-loading="loading" class="history-panel__body">
      <el-table
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
              <div v-for="ev in row.events" :key="ev.id" class="history-event-row">
                <span class="history-event-row__cell history-event-row__cell--type">
                  【{{ ev.warnType }}】
                </span>
                <span class="history-event-row__cell history-event-row__cell--img">
                  <el-image
                    v-if="ev.imageUrl"
                    class="history-event-img"
                    :src="ev.imageUrl"
                    fit="cover"
                    :preview-src-list="[ev.imageUrl]"
                    preview-teleported
                  />
                  <span v-else class="history-event-img--empty">—</span>
                </span>
                <span class="history-event-row__cell">{{ ev.eventTime }}</span>
                <span class="history-event-row__cell">
                  {{ formatWarnLngLat(ev) }}
                </span>
                <span class="history-event-row__cell">{{ ev.droneName || "—" }}</span>
              </div>
            </div>
            <div v-else class="history-events-empty">暂无 AI 预警事件</div>
          </template>
        </el-table-column>
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
      </el-table>
    </div>

    <PlanHistoryQuickScheduleDialog
      v-model:visible="quickScheduleVisible"
      :record-subject="quickCreateRow?.subject"
      @confirm="onQuickScheduleConfirm"
    />
  </section>
</template>

<script setup>
import { ref, watch } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";

import { FlightPlanService } from "@/api/plan.js";
import { unwrapApiList } from "@/utils/request.js";
import { normalizeWarnDataToFlatEvents } from "@/utils/plan-algorithm-data.js";
import { SCENARIO_TITLE_BY_KEY } from "@/components/plan-panel/plan-scenarios.js";
import PlanHistoryQuickScheduleDialog from "@/components/plan-panel/PlanHistoryQuickScheduleDialog.vue";
import tableJlPng from "@/assets/images/table_jl.png";
import tableClosePng from "@/assets/images/table_close.png";
import {
  buildQuickCreateBody,
  historyQuickCreateNeedsSchedule,
} from "@/utils/plan-history-quick-create.js";
import { getTodayYmd, isDateInHistoryRange } from "@/utils/plan-history.js";

const visible = defineModel("visible", { type: Boolean, default: false });

const emit = defineEmits(["quick-create", "deleted"]);

const dateRange = ref([getTodayYmd(), getTodayYmd()]);
const loading = ref(false);
const records = ref([]);
const quickScheduleVisible = ref(false);
/** @type {import('vue').Ref<Record<string, any> | null>} */
const quickCreateRow = ref(null);

/** @type {import('vue').Ref<Record<string, Array<Record<string,any>>>>} */
const warnDataCache = ref({});

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
  visible.value = false;
}

function onResetDate() {
  dateRange.value = [getTodayYmd(), getTodayYmd()];
}

function buildTimeRange() {
  const range = dateRange.value;
  if (range && Array.isArray(range) && range.length === 2 && range[0] && range[1]) {
    return {
      startTime: `${range[0]} 00:00:00`,
      endTime: `${range[1]} 23:59:59`,
    };
  }
  // 未选择日期时，查询近 30 天
  const today = getTodayYmd();
  const d = new Date();
  d.setDate(d.getDate() - 29);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const minDate = `${y}-${m}-${day}`;
  return {
    startTime: `${minDate} 00:00:00`,
    endTime: `${today} 23:59:59`,
  };
}

async function loadRecords() {
  if (!visible.value) return;
  if (loading.value) return;
  loading.value = true;
  try {
    const range = buildTimeRange();
    const data = await FlightPlanService.recordPageQuery({
      current: 1,
      pageSize: 200,
      ...range,
    });
    const list = unwrapApiList(data);
    records.value = list.map(planToRecord).filter((r) => r.id);
  } catch (e) {
    console.error("[PlanHistory] loadRecords failed:", e);
    records.value = [];
    ElMessage.warning(e?.message || "加载任务记录失败");
  } finally {
    loading.value = false;
  }
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
        records.value = records.value.filter((r) => r.id !== row.id);
        ElMessage.success("已删除计划");
        emit("deleted", row);
      } catch (e) {
        ElMessage.warning(e?.message || "删除失败");
      }
    })
    .catch(() => {});
}

async function onExpandChange(row) {
  const planId = row?.planId || row?.id;
  if (!planId || warnDataCache.value[planId]) return;
  try {
    const warnData = await FlightPlanService.planWarnData({ id: planId });
    const events = normalizeWarnDataToFlatEvents(warnData);
    warnDataCache.value = { ...warnDataCache.value, [planId]: events };
    const idx = records.value.findIndex((r) => (r.planId || r.id) === planId);
    if (idx >= 0) {
      const next = [...records.value];
      next[idx] = { ...next[idx], events, aiEventCount: events.length };
      records.value = next;
    }
  } catch {
    warnDataCache.value = { ...warnDataCache.value, [planId]: [] };
  }
}

watch(
  () => [visible.value, dateRange.value],
  ([v]) => {
    if (v) loadRecords();
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

.history-panel__close-icon {
  width: 20px;
  height: 20px;
  object-fit: contain;
  display: block;
}

.history-panel__date {
  width: 260px;
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
  grid-template-columns: 100px 72px 160px 1fr 1fr;
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

.history-resource-link {
  color: var(--Primary-6, #1890ff);
  cursor: pointer;

  &:hover {
    opacity: 0.85;
  }
}
</style>

<style lang="scss">
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
