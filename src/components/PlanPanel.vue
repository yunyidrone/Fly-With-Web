<template>
  <div
    class="plan-panel-wrapper"
    :class="{
      expanded: expanded || embedded,
      'plan-panel-wrapper--embedded': embedded,
    }"
  >
    <div class="plan-panel-inner">
      <div v-if="!embedded" class="plan-panel-toggle" @click="expanded = !expanded">
        <div class="toggle-left">
          <i class="ri-flight-takeoff-line toggle-icon" />
          <span class="toggle-label">飞行计划</span>
        </div>
        <div class="toggle-right">
          <i :class="expanded ? 'ri-arrow-down-s-line' : 'ri-arrow-up-s-line'" class="arrow-icon" />
          <span class="toggle-hint">{{ expanded ? "收起" : "展开" }}</span>
        </div>
      </div>

      <div class="plan-panel-content">
        <div class="plan-panel-body">
          <div class="flight-plan-board">
            <div class="scenario-tabs" role="tablist" aria-label="飞行计划场景">
              <button
                v-for="s in scenarios"
                :key="s.key"
                type="button"
                role="tab"
                class="scenario-tabs__item"
                :class="{ 'scenario-tabs__item--active': activeScenarioKey === s.key }"
                :aria-selected="activeScenarioKey === s.key"
                @click="activeScenarioKey = s.key"
              >
                <span v-if="s.key === 'mountain'" class="scenario-tabs__icon" aria-hidden="true">
                  <MountainRescueIcon :width="16" :height="16" />
                </span>
                <span v-else-if="s.key === 'water'" class="scenario-tabs__icon" aria-hidden="true">
                  <WaterObservationIcon :width="16" :height="16" />
                </span>
                <span v-else-if="s.key === 'security'" class="scenario-tabs__icon" aria-hidden="true">
                  <SecurityProtectionIcon :width="16" :height="16" />
                </span>
                <i v-else :class="s.icon" class="scenario-tabs__icon" aria-hidden="true" />
                <span class="scenario-tabs__label">{{ s.title }}</span>
              </button>
            </div>

            <!-- <div class="plan-list-toolbar">
              <input
                v-model.trim="planNameQuery"
                type="search"
                class="plan-input plan-input--single plan-name-search"
                placeholder="计划名称（回车查询）"
                enterkeyhint="search"
                @keyup.enter="loadPlansForActiveTab"
              />
            </div> -->

            <div class="plan-list-scroll">
              <template v-if="listLoading">
                <div class="plan-empty-state plan-empty-state--loading">
                  <div class="plan-empty-state__title">加载中…</div>
                </div>
              </template>
              <template v-else-if="displayRows.length">
                <div
                  v-for="row in displayRows"
                  :key="row.key"
                  class="plan-row-card"
                  :class="{
                    'plan-row-card--selected':
                      selectedRowKey === row.key ||
                      (row.planId && flightPlanStore.selectedPlanId === row.planId),
                    'plan-row-card--placeholder': row.isPlaceholder,
                  }"
                  @click="onRowClick(row)"
                >
                  <div class="plan-row-card__thumb" :class="`plan-row-card__thumb--${activeScenarioKey}`">
                    <span v-if="activeScenarioKey === 'mountain'" class="plan-row-card__thumb-icon" aria-hidden="true">
                      <MountainRescueIcon :width="24" :height="24" />
                    </span>
                    <span v-else-if="activeScenarioKey === 'water'" class="plan-row-card__thumb-icon" aria-hidden="true">
                      <WaterObservationIcon :width="24" :height="24" />
                    </span>
                    <span
                      v-else-if="activeScenarioKey === 'security'"
                      class="plan-row-card__thumb-icon"
                      aria-hidden="true"
                    >
                      <SecurityProtectionIcon :width="24" :height="24" />
                    </span>
                    <i v-else :class="scenarioThumbIcon" />
                  </div>
                  <div class="plan-row-card__text">
                    <div class="plan-row-card__title">{{ row.title }}</div>
                    <div class="plan-row-card__sub">{{ row.subtitle }}</div>
                  </div>
                  <div class="plan-row-card__actions">
                    <button
                      v-if="row.showEmergency"
                      type="button"
                      class="btn-emergency-start"
                      @click.stop="onEmergencyStart(row)"
                    >
                      紧急启动
                    </button>
                    <button
                      v-else-if="row.showStop"
                      type="button"
                      class="btn-emergency-start"
                      @click.stop="onStopTask(row)"
                    >
                      停止任务
                    </button>
                  </div>
                </div>
              </template>
              <div v-else class="plan-empty-state">
                <template v-if="flightPlanStore.plansFetchError">
                  <div class="plan-empty-state__title plan-empty-state__title--error">
                    {{ flightPlanStore.plansFetchError }}
                  </div>
                  <div class="plan-empty-state__desc">请稍后重试或检查网络</div>
                </template>
                <template v-else>
                  <div class="plan-empty-state__title">空空如也</div>
                  <div class="plan-empty-state__desc">暂无{{ activeScenarioTitle }}计划展示</div>
                </template>
              </div>
            </div>

            <div class="btn-add-plan" @click="onAddPlan">
              <i class="ri-add-circle-fill btn-add-plan__icon" aria-hidden="true" />
              添加飞行计划
            </div>
          </div>
        </div>
      </div>
    </div>

    <PlanEditorDialog
      ref="editorRef"
      v-model:visible="editorVisible"
      :list-scenario-key="activeScenarioKey"
      @changed="loadPlansForActiveTab"
      @scenario-sync="(key) => (activeScenarioKey = key)"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { FlightPlanService } from "@/api/plan";
import { useFlightPlanStore } from "@/stores/flightPlan.js";
import MountainRescueIcon from "@/components/icons/MountainRescueIcon.vue";
import WaterObservationIcon from "@/components/icons/WaterObservationIcon.vue";
import SecurityProtectionIcon from "@/components/icons/SecurityProtectionIcon.vue";
import {
  resolveLocationLabelsFromPaths,
  normalizePlanLocationPaths,
} from "@/config/flight-plan-locations.js";
import { PLAN_SCENARIOS, TAB_TO_API_TYPE } from "@/components/plan-panel/plan-scenarios.js";
import PlanEditorDialog from "@/components/plan-panel/PlanEditorDialog.vue";

const emit = defineEmits(["start-area-draw", "view-area"]);

const props = defineProps({
  embedded: {
    type: Boolean,
    default: false,
  },
});

/** 侧栏嵌入式时：仅在用户点开「飞行计划」Tab 后再请求列表，避免首页初始化就打 /plan/pageQuery */
const planListFetchEnabled = ref(!props.embedded);

const expanded = ref(false);
const flightPlanStore = useFlightPlanStore();
const activeScenarioKey = ref("mountain");
const selectedRowKey = ref("");

const listLoading = ref(false);
const planNameQuery = ref("");
const editorRef = ref(null);
const editorVisible = ref(false);
const scenarios = PLAN_SCENARIOS;

function fetchPlaceListForActiveTab() {
  const type = TAB_TO_API_TYPE[activeScenarioKey.value];
  if (type) flightPlanStore.fetchPlaceList(type);
}

async function loadPlansForActiveTab() {
  const type = TAB_TO_API_TYPE[activeScenarioKey.value];
  if (!type) return;
  listLoading.value = true;
  try {
    const q = { type, current: 1, pageSize: 100 };
    const name = planNameQuery.value.trim();
    if (name) q.name = name;
    await flightPlanStore.fetchPlanList(q);
  } finally {
    listLoading.value = false;
  }
}

onMounted(() => {
  flightPlanStore.initCustomLocationTree();
  if (!props.embedded) loadPlansForActiveTab();
});

watch(activeScenarioKey, () => {
  if (props.embedded && !planListFetchEnabled.value) return;
  loadPlansForActiveTab();
});

/** 由父组件在左侧「飞行计划」Tab 被选中时调用 */
function notifyPlanSidebarOpened() {
  planListFetchEnabled.value = true;
  loadPlansForActiveTab();
}

const activeScenarioTitle = computed(
  () => scenarios.find((s) => s.key === activeScenarioKey.value)?.title || "飞行",
);

const scenarioThumbIcon = computed(() => {
  const m = {
    mountain: "ri-plant-line",
    water: "ri-water-flash-line",
    security: "ri-shield-line",
  };
  return m[activeScenarioKey.value] || "ri-flight-takeoff-line";
});

function infoPrefix(key) {
  if (key === "mountain") return "救援";
  if (key === "water") return "观察";
  return "安保";
}

const displayRows = computed(() => {
  const sk = activeScenarioKey.value;
  const plans = flightPlanStore.plansByScenario[sk] || [];
  const prefix = infoPrefix(sk);
  // 临时需求：山林救援/水上观察无真实数据时，不再展示占位卡片，直接展示空状态。
  // 原占位逻辑保留在注释中，后续如需恢复可直接取消注释。
  // const prefix = infoPrefix(sk);
  // if (plans.length === 0) {
  //   return Array.from({ length: 6 }, (_, i) => ({
  //     key: `ph-${sk}-${i}`,
  //     isPlaceholder: true,
  //     planId: null,
  //     title: `${prefix}信息${i + 1}`,
  //     subtitle: i % 2 === 0 ? "详细信息展示" : "详细信息展示详细",
  //     showEmergency: i < 4,
  //   }));
  // }
  if (plans.length === 0) return [];

  return plans.map((p, i) => ({
    key: p.id,
    isPlaceholder: false,
    planId: p.id,
    status: Number(p?.status),
    title:
      p.subject ||
      p.locationLabel ||
      resolveLocationLabelsFromPaths(normalizePlanLocationPaths(p)) ||
      `${prefix}信息${i + 1}`,
    subtitle:
      p.description ||
      `${formatPlanDateRange(p.flightDate, p.flightDateEnd)} ${p.timeStart}–${p.timeEnd} · ${p.droneLabel}`,
    showEmergency: Number(p?.status) === 0 && i < 4,
    showStop: Number(p?.status) !== 0 && i < 4,
  }));
});

function formatPlanDate(iso) {
  if (!iso) return "—";
  return iso.replace(/-/g, "/");
}

function formatPlanDateRange(start, end) {
  if (!start) return "—";
  const s = formatPlanDate(start);
  const e = end && end !== start ? formatPlanDate(end) : null;
  return e ? `${s}–${e}` : s;
}

const listActionSubmitting = ref(false);

function requestPlanStartFollow(plan) {
  if (!plan?.id) return;
  const title = plan.subject || plan.locationLabel || "飞行计划";
  if (listActionSubmitting.value) return;
  ElMessageBox.confirm(`确定紧急启动「${title}」任务？`, "紧急启动确认", {
    confirmButtonText: "紧急启动",
    cancelButtonText: "取消",
    type: "warning",
  })
    .then(async () => {
      listActionSubmitting.value = true;
      try {
        await FlightPlanService.planStartFollow({ id: plan.id });
        await loadPlansForActiveTab();
        ElMessage.success("任务已开启");
      } finally {
        listActionSubmitting.value = false;
      }
    })
    .catch(() => {});
}

function requestPlanStopFollow(plan) {
  if (!plan?.id) return;
  if (listActionSubmitting.value) return;
  const title = plan.subject || plan.locationLabel || "该飞行计划";
  ElMessageBox.confirm(`确定停止「${title}」任务？`, "停止任务确认", {
    confirmButtonText: "停止",
    cancelButtonText: "取消",
    type: "warning",
  })
    .then(async () => {
      listActionSubmitting.value = true;
      try {
        await FlightPlanService.planStopFollow({ id: plan.id });
        await loadPlansForActiveTab();
        ElMessage.success("任务已停止");
      } finally {
        listActionSubmitting.value = false;
      }
    })
    .catch(() => {});
}

function onAddPlan() {
  editorRef.value?.open("add");
}

function onRowClick(row) {
  selectedRowKey.value = row.key;
  if (!row.planId) return;
  editorRef.value?.open("view", row.planId);
}

function onEmergencyStart(row) {
  if (row.isPlaceholder) {
    const name = scenarios.find((s) => s.key === activeScenarioKey.value)?.title;
    ElMessage.info(`紧急启动（示意）：${name} · ${row.title}`);
    return;
  }
  const p = flightPlanStore.getPlanById(row.planId);
  if (!p) {
    ElMessage.warning("未找到该计划");
    return;
  }
  requestPlanStartFollow(p);
}

function onStopTask(row) {
  if (row.isPlaceholder) return;
  const p = flightPlanStore.getPlanById(row.planId);
  if (!p) {
    ElMessage.warning("未找到该计划");
    return;
  }
  requestPlanStopFollow(p);
}

defineExpose({
  notifyPlanSidebarOpened,
  setDialogVisible: (v) => {
    editorVisible.value = !!v;
    if (v) editorRef.value?.open?.("add");
    else editorRef.value?.close?.();
  },
});

</script>

<style lang="scss" scoped>
$fp-bg: #121212;
$fp-surface: #1e1e1e;
$fp-border: rgba(255, 255, 255, 0.12);
$fp-yellow: #e6f455;
$fp-text: #ffffff;
$fp-muted: rgba(255, 255, 255, 0.45);

.plan-panel-wrapper {
  position: absolute;
  right: 16px;
  bottom: 40px;
  z-index: 100;
  width: 320px;
  transition: width 0.25s ease;

  &.expanded {
    width: min(400px, calc(100vw - 32px));
  }

  &--embedded {
    position: relative;
    right: auto;
    bottom: auto;
    z-index: auto;
    width: 100%;
    transition: none;

    &.expanded {
      width: 100%;
    }
  }
}

.plan-panel-inner {
  display: flex;
  flex-direction: column;
  border: 1px solid $fp-border;
  border-radius: 10px;
  overflow: hidden;
  background: $fp-bg;
}

.plan-panel-toggle {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 44px;
  padding: 0 16px;
  background: $fp-surface;
  cursor: pointer;
  user-select: none;
  flex-shrink: 0;

  &:hover {
    background: #2a2a2a;
  }

  .toggle-left {
    display: flex;
    align-items: center;
    gap: 8px;

    .toggle-icon {
      font-size: 18px;
      color: #5b8def;
    }

    .toggle-label {
      font-size: 15px;
      font-weight: 600;
      color: $fp-text;
    }
  }

  .toggle-right {
    display: flex;
    align-items: center;
    gap: 4px;

    .arrow-icon {
      font-size: 20px;
      color: rgba(255, 255, 255, 0.7);
    }

    .toggle-hint {
      font-size: 12px;
      color: $fp-muted;
    }
  }
}

.plan-panel-wrapper.expanded:not(.plan-panel-wrapper--embedded) .plan-panel-toggle {
  border-radius: 0;
}

.plan-panel-wrapper--embedded .plan-panel-inner {
  border-radius: 10px;
}

.plan-panel-content {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows 0.3s ease;
  background: $fp-bg;

  .plan-panel-wrapper.expanded & {
    grid-template-rows: 1fr;
  }

  > .plan-panel-body {
    overflow: hidden;
    min-height: 0;
  }
}

.flight-plan-board {
  padding: 12px 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: min(520px, 55vh);
}

.plan-panel-wrapper--embedded .flight-plan-board {
  max-height: min(560px, calc(100vh - 200px));
}

.scenario-tabs {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  flex-shrink: 0;
  border-radius: 2px;
background: #15191E;
}

.scenario-tabs__item {
  flex: 1;
  display: inline-flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-height: 40px;
  padding: 8px 10px;
  margin: 0;
  border: 1px solid transparent;
  border-radius: 6px;
  background: transparent;
  color: #fff;
  font-size: 14px;
  font-weight: 500;
  line-height: 1.2;
  cursor: pointer;
  white-space: nowrap;
  transition:
    background 0.15s,
    color 0.15s,
    border-color 0.15s;

  &:hover:not(.scenario-tabs__item--active) {
    color: rgba(255, 255, 255, 0.88);
  }
}

.scenario-tabs__item--active {
  background: #c8c8c8;
  border-color: #fff;
  color: #1a1a1a;

  .scenario-tabs__icon {
    color: #1a1a1a;
  }
}

.scenario-tabs__icon {
  flex-shrink: 0;
  font-size: 20px;
  color: #fff;
  line-height: 1;
}

.scenario-tabs__label {
  line-height: 1.2;
}

.plan-list-toolbar {
  flex-shrink: 0;
  margin-bottom: 6px;
}

.plan-name-search {
  width: 100%;
  min-height: 36px;
  font-size: 13px;
}

.plan-list-scroll {
  display: flex;
  flex-direction: column;
  gap: 10px;
  overflow-y: auto;
  flex: 1;
  min-height: 120px;
  padding-right: 2px;

  &::-webkit-scrollbar {
    width: 4px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.15);
    border-radius: 2px;

    &:hover {
      background: rgba(255, 255, 255, 0.25);
    }
  }
}

.plan-empty-state {
  min-height: 156px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.04);

  &__title {
    color: rgba(255, 255, 255, 0.92);
    font-size: 16px;
    font-weight: 500;
    line-height: 1.25;

    &--error {
      color: rgba(255, 138, 128, 0.95);
      text-align: center;
      padding: 0 12px;
    }
  }

  &__desc {
    color: rgba(255, 255, 255, 0.45);
    font-size: 13px;
    line-height: 1.3;
  }
}

.plan-row-card {
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 16px;
  border-radius: 8px;
  background: $fp-surface;
  border: 1px solid transparent;
  cursor: default;
  transition:
    border-color 0.15s,
    box-shadow 0.15s;

  &:not(.plan-row-card--placeholder) {
    cursor: pointer;

    &:hover {
      border-color: rgba(255, 255, 255, 0.12);
    }
  }
}

.plan-row-card--selected {
  border-radius: 4px;
  background: linear-gradient(
    90deg,
    rgba(73, 101, 201, 0.32) 0%,
    rgba(255, 255, 255, 0.04) 100%
  );

  &::before {
    content: "";
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 4px;
    background: #4965c9;
    border-radius: 0;
  }
}

.plan-row-card__thumb {
  flex-shrink: 0;
  width: 44px;
  height: 44px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  color: #4a9eff;
  background: rgba(74, 158, 255, 0.12);
}

.plan-row-card__thumb-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.plan-row-card__text {
  flex: 1;
  min-width: 0;
}

.plan-row-card__title {
  font-size: 15px;
  font-weight: 600;
  color: $fp-text;
  line-height: 1.3;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.plan-row-card__sub {
  margin-top: 4px;
  font-size: 12px;
  color: $fp-muted;
  line-height: 1.35;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.plan-row-card__actions {
  flex-shrink: 0;
  width: 76px;
  display: flex;
  justify-content: flex-end;
}

.btn-emergency-start {
  padding: 6px 10px;
  font-size: 12px;
  font-weight: 700;
  color: #1a1a1a;
  background: $fp-yellow;
  border: none;
  border-radius: 999px;
  cursor: pointer;
  white-space: nowrap;
  transition:
    filter 0.15s,
    transform 0.1s;

  &:hover {
    filter: brightness(1.05);
  }

  &:active {
    transform: scale(0.98);
  }
}

.btn-add-plan {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 12px 16px;
  margin-top: 2px;
  font-family: "Segoe UI";
  font-size: 14px;
  font-style: normal;
  font-weight: 600;
  line-height: 20px; /* 142.857% */
  color: $fp-text;
  border-radius: 32px;
  background: #25272B;
  border-radius: 32px;
  cursor: pointer;
  margin: 0px 10px;
  transition:
    border-color 0.15s,
    background 0.15s;
}

.btn-add-plan__icon {
  font-size: 18px;
  color: #fff;
}

</style>

<style lang="scss">
/* 弹窗内日期/时间 — 输入框回显（非下拉面板） */
.plan-editor-modal {
  --el-fill-color-blank: #000;
  --el-input-bg-color: #000;
  --el-input-text-color: #fff;
  --el-input-placeholder-color: rgba(255, 255, 255, 0.35);
  --el-text-color-regular: #fff;
  --el-text-color-primary: #fff;
  --el-text-color-placeholder: rgba(255, 255, 255, 0.35);
  --el-disabled-bg-color: #0a0a0a;
  --el-disabled-text-color: rgba(255, 255, 255, 0.45);
}

.plan-editor-modal .plan-loc-tree.el-tree {
  --el-color-primary: #3b6fd8;
  --el-tree-node-hover-bg-color: rgba(255, 255, 255, 0.06);
  --el-tree-text-color: rgba(255, 255, 255, 0.88);
  --el-tree-expand-icon-color: rgba(255, 255, 255, 0.45);
  background: transparent;
  color: rgba(255, 255, 255, 0.88);
}

.plan-editor-modal .plan-loc-tree .el-tree-node__content {
  height: 36px;
  border-radius: 4px;
}

.plan-editor-modal .plan-loc-tree .el-tree-node__content:hover {
  background: rgba(255, 255, 255, 0.06);
}

.plan-editor-modal .plan-loc-tree .el-tree-node__label {
  font-size: 14px;
}

.plan-editor-modal .plan-loc-tree .el-tree-node__expand-icon {
  width: 16px;
  height: 16px;
  padding: 0;
  margin-right: 4px;
  color: rgba(255, 255, 255, 0.45);
}

.plan-editor-modal .plan-loc-tree .el-tree-node__expand-icon svg {
  display: none;
}

.plan-editor-modal .plan-loc-tree .el-tree-node__expand-icon::before {
  font-family: remixicon !important;
  font-style: normal;
  font-size: 16px;
  line-height: 1;
  content: "\ea6d";
  display: inline-block;
  transition: transform 0.2s ease;
}

.plan-editor-modal .plan-loc-tree .el-tree-node__expand-icon.expanded::before {
  transform: rotate(90deg);
}

.plan-editor-modal .plan-loc-tree .el-checkbox__inner {
  background-color: transparent;
  border-color: rgba(255, 255, 255, 0.35);
}

.plan-editor-modal .plan-loc-tree .el-checkbox__input.is-checked .el-checkbox__inner,
.plan-editor-modal .plan-loc-tree .el-checkbox__input.is-indeterminate .el-checkbox__inner {
  background-color: #3b6fd8;
  border-color: #3b6fd8;
}

.plan-editor-modal .plan-loc-tree.is-disabled .el-checkbox__inner {
  background-color: rgba(255, 255, 255, 0.06);
  border-color: rgba(255, 255, 255, 0.2);
}

.plan-editor-modal .plan-picker-field {
  width: 100%;

  .plan-el-picker {
    width: 100%;
  }

  .el-date-editor {
    width: 100% !important;
    height: 40px;
    --el-input-height: 40px;
  }

  .el-date-editor.el-input__wrapper,
  .el-date-editor .el-input__wrapper,
  .el-input .el-input__wrapper {
    background-color: #000 !important;
    box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.1) inset !important;
  }

  .el-date-editor.el-input__wrapper:hover,
  .el-input .el-input__wrapper:hover {
    box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.18) inset !important;
  }

  .el-date-editor.is-active.el-input__wrapper,
  .el-input.is-focus .el-input__wrapper {
    box-shadow:
      0 0 0 1px rgba(59, 111, 216, 0.75) inset,
      0 0 0 1px rgba(59, 111, 216, 0.25) !important;
  }

  .el-input__inner,
  .el-range-input {
    color: #fff !important;
    -webkit-text-fill-color: #fff !important;
    background-color: transparent !important;
  }

  input::placeholder,
  .el-range-input::placeholder {
    color: rgba(255, 255, 255, 0.35) !important;
    -webkit-text-fill-color: rgba(255, 255, 255, 0.35) !important;
  }

  .el-range-separator {
    color: rgba(255, 255, 255, 0.55) !important;
  }

  .el-input__prefix,
  .el-input__suffix,
  .el-input__suffix-inner,
  .el-input__icon,
  .el-range__icon,
  .el-range__close-icon,
  .el-icon {
    color: rgba(255, 255, 255, 0.5) !important;
  }

  .el-date-editor.is-disabled.el-input__wrapper,
  .el-input.is-disabled .el-input__wrapper {
    background-color: #0a0a0a !important;
    box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.06) inset !important;
  }

  .el-input.is-disabled .el-input__inner,
  .el-date-editor.is-disabled .el-range-input {
    color: rgba(255, 255, 255, 0.45) !important;
    -webkit-text-fill-color: rgba(255, 255, 255, 0.45) !important;
  }
}

.plan-editor-picker-popper.el-popper {
  --el-bg-color-overlay: #1a1f28;
  --el-fill-color-blank: #0a0d12;
  --el-text-color-primary: #fff;
  --el-text-color-regular: rgba(255, 255, 255, 0.88);
  --el-text-color-secondary: rgba(255, 255, 255, 0.55);
  --el-text-color-placeholder: rgba(255, 255, 255, 0.35);
  --el-border-color-light: rgba(255, 255, 255, 0.1);
  --el-border-color: rgba(255, 255, 255, 0.12);
  --el-color-primary: #3b6fd8;
  --el-datepicker-off-text-color: rgba(255, 255, 255, 0.28);
  --el-datepicker-header-text-color: rgba(255, 255, 255, 0.88);
  --el-datepicker-icon-color: rgba(255, 255, 255, 0.65);
  --el-datepicker-inrange-bg-color: rgba(59, 111, 216, 0.22);
  --el-datepicker-inrange-hover-bg-color: rgba(59, 111, 216, 0.32);
  --el-datepicker-active-color: #3b6fd8;
  --el-datepicker-hover-text-color: #fff;

  z-index: 3600 !important;
  background: #1a1f28 !important;
  border: 1px solid rgba(255, 255, 255, 0.12) !important;
  color: #fff;

  .el-picker-panel,
  .el-picker-panel__body,
  .el-picker-panel__content,
  .el-date-range-picker__content,
  .el-date-range-picker__content.is-left,
  .el-date-range-picker__content.is-right {
    background: #1a1f28;
    color: #fff;
  }

  .el-picker-panel__footer {
    background: #161b22;
    border-top: 1px solid rgba(255, 255, 255, 0.08);
  }

  .el-picker-panel__footer .el-button {
    --el-button-bg-color: transparent;
    --el-button-text-color: rgba(255, 255, 255, 0.85);
    --el-button-border-color: rgba(255, 255, 255, 0.2);
    --el-button-hover-bg-color: rgba(255, 255, 255, 0.06);
    --el-button-hover-text-color: #fff;
    --el-button-hover-border-color: rgba(255, 255, 255, 0.35);
  }

  .el-picker-panel__footer .el-button--primary {
    --el-button-bg-color: #3b6fd8;
    --el-button-border-color: #3b6fd8;
    --el-button-text-color: #fff;
    --el-button-hover-bg-color: #4a7ee6;
    --el-button-hover-border-color: #4a7ee6;
  }

  .el-date-picker__header,
  .el-date-range-picker__header {
    color: rgba(255, 255, 255, 0.88);
  }

  .el-date-picker__header-label,
  .el-picker-panel__icon-btn {
    color: rgba(255, 255, 255, 0.85);

    &:hover {
      color: #fff;
    }
  }

  .el-date-table th {
    color: rgba(255, 255, 255, 0.45);
    border-bottom-color: rgba(255, 255, 255, 0.06);
  }

  .el-date-table td {
    color: rgba(255, 255, 255, 0.88);
  }

  .el-date-table td.next-month,
  .el-date-table td.prev-month {
    color: rgba(255, 255, 255, 0.28);
  }

  .el-date-table td.disabled .el-date-table-cell__text {
    color: rgba(255, 255, 255, 0.2);
    background: transparent;
  }

  .el-date-table td.available:hover .el-date-table-cell__text {
    background: rgba(255, 255, 255, 0.1);
    color: #fff;
  }

  .el-date-table td.today .el-date-table-cell__text {
    color: #6b9fff;
    font-weight: 600;
  }

  .el-date-table td.in-range .el-date-table-cell {
    background: rgba(59, 111, 216, 0.22);
  }

  .el-date-table td.start-date .el-date-table-cell__text,
  .el-date-table td.end-date .el-date-table-cell__text {
    background: #3b6fd8;
    color: #fff;
  }

  .el-date-range-picker__time-header {
    border-bottom-color: rgba(255, 255, 255, 0.08);
  }

  .el-time-panel {
    background: #1a1f28;
    border-color: rgba(255, 255, 255, 0.12);
  }

  .el-time-panel__content::before,
  .el-time-panel__content::after {
    border-color: rgba(255, 255, 255, 0.12);
  }

  .el-time-panel__footer {
    background: #161b22;
    border-top: 1px solid rgba(255, 255, 255, 0.08);
  }

  .el-time-panel__btn {
    color: rgba(255, 255, 255, 0.75);

    &.confirm {
      color: #6b9fff;
    }
  }

  .el-time-spinner__wrapper {
    background: #1a1f28;
  }

  .el-time-spinner__item {
    color: rgba(255, 255, 255, 0.65);

    &:hover:not(.is-disabled):not(.is-active) {
      background: rgba(255, 255, 255, 0.08);
      color: #fff;
    }

    &.is-active:not(.is-disabled) {
      color: #6b9fff;
      font-weight: 600;
    }

    &.is-disabled {
      color: rgba(255, 255, 255, 0.2);
    }
  }

  .el-popper__arrow::before {
    background: #1a1f28 !important;
    border-color: rgba(255, 255, 255, 0.12) !important;
  }
}
</style>
