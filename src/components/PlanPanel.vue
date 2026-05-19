<!--
 * @Author: ml
 * @Date: 2026-05-12 15:00:00
 * @FilePath: /accompanying-fly-project/src/components/PlanPanel.vue
 * @Description: 飞行计划 — 场景 Tab、列表卡片、与地图圈选联动；新增/详情共用弹窗
-->
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

            <div class="btn-add-plan" @click="openPlanDialog('add')">
              <i class="ri-add-circle-fill btn-add-plan__icon" aria-hidden="true" />
              添加飞行计划
            </div>
          </div>
        </div>
      </div>
    </div>

    <Teleport to="body">
      <Transition name="plan-editor-fade">
        <div
          v-if="planDialogVisible"
          class="plan-editor-overlay"
          role="presentation"
        >
          <div class="plan-editor-modal" role="dialog" aria-modal="true" :aria-labelledby="planEditorTitleId">
            <header class="plan-editor-head">
              <div class="plan-editor-head__title-row">
                <img :src="arrowRightPng" class="plan-editor-head__chev" alt="" aria-hidden="true" />
                <h2 :id="planEditorTitleId" class="plan-editor-head__title">{{ planEditorTitle }}</h2>
              </div>
              <button type="button" class="plan-editor-head__close" aria-label="关闭" @click="closePlanDialog">
                <i class="ri-close-line" />
              </button>
            </header>

            <div class="plan-editor-scroll">
              <div class="plan-editor-tabs" role="tablist" aria-label="计划场景">
                <button
                  v-for="s in scenarios"
                  :key="s.key"
                  type="button"
                  role="tab"
                  class="plan-editor-tabs__item"
                  :class="{ 'plan-editor-tabs__item--active': addForm.scenarioKey === s.key }"
                  :disabled="isViewMode"
                  @click="addForm.scenarioKey = s.key"
                >
                  <span v-if="s.key === 'mountain'" class="plan-editor-tabs__icon" aria-hidden="true">
                    <MountainRescueIcon :width="16" :height="16" />
                  </span>
                  <span v-else-if="s.key === 'water'" class="plan-editor-tabs__icon" aria-hidden="true">
                    <WaterObservationIcon :width="16" :height="16" />
                  </span>
                  <span v-else-if="s.key === 'security'" class="plan-editor-tabs__icon" aria-hidden="true">
                    <SecurityProtectionIcon :width="16" :height="16" />
                  </span>
                  <i v-else :class="s.icon" class="plan-editor-tabs__icon" aria-hidden="true" />
                  <span>{{ s.title }}</span>
                </button>
              </div>

              <section class="plan-sec">
                <button
                  type="button"
                  class="plan-sec__head"
                  @click="toggleSection('theme')"
                >
                  <span class="plan-sec__head-text">{{ themeSectionTitle }}</span>
                  <i
                    class="plan-sec__head-arrow ri-arrow-down-s-fill"
                    :class="{ 'plan-sec__head-arrow--open': sectionOpen.theme }"
                  />
                </button>
                <div v-show="sectionOpen.theme" class="plan-sec__body">
                  <input
                    v-model="addForm.subject"
                    class="plan-input plan-input--single"
                    type="text"
                    placeholder="请输入"
                    :readonly="isViewMode"
                  />
                  <textarea
                    v-model="addForm.detailRemark"
                    class="plan-input plan-input--area"
                    rows="3"
                    placeholder="详情备注"
                    :readonly="isViewMode"
                  />
                </div>
              </section>

              <section class="plan-sec">
                <button type="button" class="plan-sec__head" @click="toggleSection('location')">
                  <span class="plan-sec__head-text">地点选择</span>
                  <i
                    class="plan-sec__head-arrow ri-arrow-down-s-fill"
                    :class="{ 'plan-sec__head-arrow--open': sectionOpen.location }"
                  />
                </button>
                <div v-show="sectionOpen.location" class="plan-sec__body plan-sec__body--tree">
                  <el-tree
                    v-if="isViewMode"
                    class="plan-loc-tree plan-loc-tree--readonly"
                    :data="readonlyLocationTreeData"
                    node-key="id"
                    default-expand-all
                    :props="locationTreeProps"
                    :expand-on-click-node="false"
                  />
                  <el-tree
                    v-else
                    ref="locationTreeRef"
                    class="plan-loc-tree"
                    :data="locationTreeData"
                    node-key="id"
                    show-checkbox
                    default-expand-all
                    :check-strictly="false"
                    :props="locationTreeProps"
                    @check="onLocationTreeCheck"
                  />
                </div>
              </section>

              <section class="plan-sec">
                <button type="button" class="plan-sec__head" @click="toggleSection('time')">
                  <span class="plan-sec__head-text">时间设定</span>
                  <i
                    class="plan-sec__head-arrow ri-arrow-down-s-fill"
                    :class="{ 'plan-sec__head-arrow--open': sectionOpen.time }"
                  />
                </button>
                <div v-show="sectionOpen.time" class="plan-sec__body plan-sec__body--pickers">
                  <div v-if="isViewMode" class="plan-readonly-field">
                    {{ viewTimeText }}
                  </div>
                  <template v-else>
                    <div class="plan-picker-field">
                      <el-time-picker
                        v-model="addForm.timeStart"
                        class="plan-el-picker"
                        format="HH:mm"
                        value-format="HH:mm"
                        placeholder="请选择开始时间"
                        teleported
                        :disabled="isViewMode"
                        :clearable="!isViewMode"
                        popper-class="plan-editor-picker-popper"
                        :popper-options="planPickerPopperOptions"
                      />
                    </div>
                    <div class="plan-picker-field">
                      <el-time-picker
                        v-model="addForm.timeEnd"
                        class="plan-el-picker"
                        format="HH:mm"
                        value-format="HH:mm"
                        placeholder="请选择结束时间"
                        teleported
                        :disabled="isViewMode"
                        :clearable="!isViewMode"
                        popper-class="plan-editor-picker-popper"
                        :popper-options="planPickerPopperOptions"
                      />
                    </div>
                  </template>
                </div>
              </section>

              <section class="plan-sec">
                <button type="button" class="plan-sec__head" @click="toggleSection('date')">
                  <span class="plan-sec__head-text">实行日期</span>
                  <i
                    class="plan-sec__head-arrow ri-arrow-down-s-fill"
                    :class="{ 'plan-sec__head-arrow--open': sectionOpen.date }"
                  />
                </button>
                <div v-show="sectionOpen.date" class="plan-sec__body plan-sec__body--pickers">
                  <div v-if="isViewMode" class="plan-readonly-field">
                    {{ viewDateText }}
                  </div>
                  <div v-else class="plan-picker-field">
                    <el-date-picker
                      v-model="addForm.flightDateRange"
                      class="plan-el-picker"
                      type="daterange"
                      range-separator="至"
                      start-placeholder="开始日期"
                      end-placeholder="结束日期"
                      value-format="YYYY-MM-DD"
                      format="YYYY-MM-DD"
                      teleported
                      :disabled="isViewMode"
                      :clearable="!isViewMode"
                      popper-class="plan-editor-picker-popper"
                      :popper-options="planPickerPopperOptions"
                    />
                  </div>
                </div>
              </section>

              <section class="plan-sec">
                <button type="button" class="plan-sec__head" @click="toggleSection('resources')">
                  <span class="plan-sec__head-text">所需资源</span>
                  <i
                    class="plan-sec__head-arrow ri-arrow-down-s-fill"
                    :class="{ 'plan-sec__head-arrow--open': sectionOpen.resources }"
                  />
                </button>
                <div v-show="sectionOpen.resources" class="plan-sec__body plan-sec__body--resources">
                  <div v-for="r in filteredResourceRows" :key="r.sourceId ?? r.field" class="plan-res-row">
                    <span class="plan-res-row__label">{{ r.label }}</span>
                    <div class="plan-res-counter">
                      <template v-if="isViewMode">
                        <span class="plan-res-counter__num">{{ addForm[r.field] }}</span>
                      </template>
                      <template v-else>
                        <button
                          type="button"
                          class="plan-res-counter__btn"
                          :disabled="addForm[r.field] <= 0"
                          aria-label="减少"
                          @click="bumpResource(r.field, -1)"
                        >
                          <i class="ri-subtract-line" />
                        </button>
                        <span class="plan-res-counter__num">{{ addForm[r.field] }}</span>
                        <button
                          type="button"
                          class="plan-res-counter__btn"
                          aria-label="增加"
                          @click="bumpResource(r.field, 1)"
                        >
                          <i class="ri-add-line" />
                        </button>
                      </template>
                    </div>
                  </div>
                </div>
              </section>
            </div>

            <footer class="plan-editor-foot" :class="{ 'plan-editor-foot--view': isViewMode }">
              <template v-if="isViewMode">
                <button
                  type="button"
                  class="plan-editor-btn plan-editor-btn--emergency"
                  v-if="isCurrentPlanStopped"
                  :disabled="detailActionSubmitting"
                  @click="onDetailEmergencyStart"
                >
                  紧急启动
                </button>
                <button
                  type="button"
                  v-else
                  class="plan-editor-btn plan-editor-btn--emergency"
                  :disabled="detailActionSubmitting"
                  @click="onDetailStop"
                >
                  停止任务
                </button>
                <button
                  type="button"
                  class="plan-editor-btn plan-editor-btn--danger"
                  :disabled="detailActionSubmitting"
                  @click="onDetailDelete"
                >
                  删除
                </button>
              </template>
              <template v-else>
                <button type="button" class="plan-editor-btn plan-editor-btn--primary" @click="resetPlanForm">
                  重置
                </button>
                <button
                  type="button"
                  class="plan-editor-btn plan-editor-btn--outline"
                  :disabled="planSubmitting"
                  @click="confirmAddPlan"
                >
                  {{ planSubmitting ? "提交中…" : "确认" }}
                </button>
              </template>
            </footer>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, reactive, computed, nextTick, onMounted, watch } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { AccompanyingFlyService } from "@/api";
import { useFlightPlanStore } from "@/stores/flightPlan.js";
import arrowRightPng from "@/assets/images/arrow_right.png";
import MountainRescueIcon from "@/components/icons/MountainRescueIcon.vue";
import WaterObservationIcon from "@/components/icons/WaterObservationIcon.vue";
import SecurityProtectionIcon from "@/components/icons/SecurityProtectionIcon.vue";
import {
  buildFlightLocationTreeData,
  pathToLocationNodeKey,
  locationNodeKeyToPath,
  resolvePolygonRingsFromPaths,
  resolveLocationLabelsFromPaths,
  normalizePlanLocationPaths,
  resolvePolygonRingByPath,
} from "@/config/flight-plan-locations.js";

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

/** 场景 Tab → 接口 type：1山林救援 2水上观察 3重点安保 */
const TAB_TO_API_TYPE = { mountain: 1, water: 2, security: 3 };
const listLoading = ref(false);
const planNameQuery = ref("");
const planSubmitting = ref(false);

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

/** 后端未就绪或解析失败时使用 */
const DEFAULT_RESOURCE_ROWS = [
  { key: "drone", label: "无人机", field: "resourceDroneCount", defaultCount: undefined },
  { key: "dog", label: "无人犬", field: "resourceDogCount", defaultCount: undefined },
  { key: "boat", label: "无人艇", field: "resourceBoatCount", defaultCount: undefined },
];

/** @type {import('vue').Ref<({ key: string, label: string, field: string, defaultCount?: number, sort?: number, sourceId?: string }) [] | null>} */
const resourceRowsFromApi = ref(null);

/** value 若为非负整数字符串，表示该项默认数量；否则视作展示文案 */
function parseApiSourceDefaultCount(rawValue) {
  if (rawValue === undefined || rawValue === null || rawValue === "") return null;
  const s = String(rawValue).trim();
  if (!/^-?\d+$/.test(s)) return null;
  return Math.max(0, Number(s));
}

/**
 * GET /config/getSource · data[] 条目（id,type,key,value,sort）。
 * label：value 为纯数字时使用 key（或 id）作展示名；否则用 value 文案。
 */
function pickLabelFromSourceItem(raw) {
  const k = String(raw?.key ?? "").trim();
  const def = parseApiSourceDefaultCount(raw?.value);
  if (def !== null)
    return k || String(raw?.id ?? "").trim() || `资源`;

  const fromValue = raw?.value != null ? String(raw.value).trim() : "";
  const s =
    fromValue ||
    (raw?.dictLabel ??
      raw?.label ??
      raw?.name ??
      raw?.title ??
      raw?.sourceName ??
      raw?.desc ??
      "");
  return String(s).trim() || k || String(raw?.id ?? "").trim();
}

function normalizeResourceRowsPayload(payload) {
  if (Array.isArray(payload)) return payload;
  if (payload && typeof payload === "object") {
    const d = payload.data;
    if (Array.isArray(d)) return d;
    if (Array.isArray(d?.list)) return d.list;
    if (Array.isArray(d?.records)) return d.records;
    if (Array.isArray(payload.list)) return payload.list;
    if (Array.isArray(payload.records)) return payload.records;
  }
  return [];
}

/**
 * type：1伴随资源 2目标资源 — 与本页「所需资源」无关的项跳过（若后端同包返回）。
 */
function isAccompanyResourceSourceRow(raw) {
  const t = raw?.type;
  if (t === undefined || t === null || t === "") return true;
  return Number(t) === 1;
}

/**
 * 将 /config/getSource 单项映射到与计划存储一致的表单字段；
 * 仅识别无人机 / 无人犬 / 无人艇三类，超出部分忽略以保持与现有计划字段兼容。
 * 匹配用 key + 文案，不把「纯数字的 value」（默认值）误当作类型编码干扰分类。
 */
function resolveLegacyPlanResourceField(raw) {
  const label = pickLabelFromSourceItem(raw);
  const codeKey = String(raw?.key ?? "").trim();

  /** 语义匹配用拼接串（默认值数字仅附在末尾供 1/2/3 编码兜底） */
  const defCnt = parseApiSourceDefaultCount(raw?.value);
  const valSemantic =
    raw?.dictValue ??
    raw?.code ??
    (defCnt !== null ? "" : raw?.value != null ? String(raw.value).trim() : "");

  const blob = `${codeKey.toLowerCase()} ${valSemantic.toLowerCase()} ${label.toLowerCase()}`;

  if (label.includes("无人艇") || /艇|boat|ship|vessel/.test(blob))
    return { field: "resourceBoatCount", key: "boat" };
  if (label.includes("无人犬") || /(^|[^无])犬|dog\b|resource.?dog/.test(blob))
    return { field: "resourceDogCount", key: "dog" };
  if (label.includes("无人机") || /uav|drone|wrj/.test(blob) || /\b(resource)?drone/i.test(blob))
    return { field: "resourceDroneCount", key: "drone" };

  /** 后端若用语义 value 编码 无人机/犬/艇 */
  const v = String(valSemantic).trim();
  if (v === "1") return { field: "resourceDroneCount", key: "drone" };
  if (v === "2") return { field: "resourceDogCount", key: "dog" };
  if (v === "3") return { field: "resourceBoatCount", key: "boat" };

  return null;
}

function buildResourceRowsFromSourceList(list) {
  const sorted = [...list].sort((a, b) => (Number(a?.sort) || 0) - (Number(b?.sort) || 0));

  /** field -> row（多条映射同一 field 时保留 sort 更小的一条） */
  /** @type {Map<string, { key: string, label: string, field: string, defaultCount?: number, sort: number, sourceId?: string }>} */
  const byField = new Map();

  for (const raw of sorted) {
    if (!isAccompanyResourceSourceRow(raw)) continue;
    const meta = resolveLegacyPlanResourceField(raw);
    if (!meta?.field) continue;
    const label = pickLabelFromSourceItem(raw) || meta.key;
    const def = parseApiSourceDefaultCount(raw?.value);
    const sortN = Number(raw?.sort) || 0;
    const sourceId = raw?.id != null && raw?.id !== "" ? String(raw.id) : "";

    const existing = byField.get(meta.field);
    if (!existing || sortN < existing.sort) {
      byField.set(meta.field, {
        key: meta.key,
        label,
        field: meta.field,
        ...(def !== null ? { defaultCount: def } : {}),
        sort: sortN,
        ...(sourceId ? { sourceId } : {}),
      });
    }
  }

  /** 列表展示顺序遵循后端 sort */
  return [...byField.values()]
    .sort((a, b) => a.sort - b.sort)
    .map(({ sort: _, ...rest }) => rest);
}

async function loadResourceSourceDefs() {
  try {
    const res = await AccompanyingFlyService.getConfigSource({ type: 1 });
    if (res?.code !== 2000) {
      resourceRowsFromApi.value = null;
      return;
    }
    const list = normalizeResourceRowsPayload(res);
    const rows = buildResourceRowsFromSourceList(list);
    resourceRowsFromApi.value = rows.length ? rows : null;
  } catch {
    resourceRowsFromApi.value = null;
  }
}

const resourceRowsBaseline = computed(() => {
  return resourceRowsFromApi.value?.length ? resourceRowsFromApi.value : DEFAULT_RESOURCE_ROWS;
});

onMounted(() => {
  loadResourceSourceDefs();
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

defineExpose({ notifyPlanSidebarOpened });

const planDialogVisible = ref(false);
/** @type {import('vue').Ref<'add' | 'view'>} */
const planDialogMode = ref("add");
const viewingPlanId = ref(null);
const planEditorTitleId = "plan-editor-dialog-title";

/** 弹窗 z-index 为 3000，选择面板须更高 */
const PLAN_PICKER_Z_INDEX = 3600;
const planPickerPopperOptions = {
  modifiers: [
    {
      name: "computeStyles",
      options: { gpuAcceleration: false },
    },
    {
      name: "zIndex",
      enabled: true,
      phase: "write",
      fn: ({ state }) => {
        state.styles.popper.zIndex = String(PLAN_PICKER_Z_INDEX);
      },
    },
  ],
};

const scenarios = [
  { key: "mountain", title: "山林救援", icon: "ri-plant-line" },
  { key: "water", title: "水上观察", icon: "ri-water-flash-line" },
  { key: "security", title: "重点安保", icon: "ri-shield-line" },
];

const isViewMode = computed(() => planDialogMode.value === "view");
const detailActionSubmitting = ref(false);
const currentViewingPlan = computed(() =>
  flightPlanStore.getPlanById(viewingPlanId.value),
);
const isCurrentPlanStopped = computed(
  () => Number(currentViewingPlan.value?.status) === 0,
);

const themeSectionTitle = computed(() => {
  const k = addForm.scenarioKey;
  if (k === "water") return "观察主题";
  if (k === "security") return "安保主题";
  return "救援主题";
});

const planEditorTitle = computed(() =>
  planDialogMode.value === "view" ? "飞行计划详情" : "添加飞行计划",
);
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
      p.detailRemark ||
      `${formatPlanDateRange(p.flightDate, p.flightDateEnd)} ${p.timeStart}–${p.timeEnd} · ${p.droneLabel}`,
    showEmergency: Number(p?.status) === 0 && i < 4,
    showStop: Number(p?.status) !== 0 && i < 4,
  }));
});

const locationTreeRef = ref(null);
const locationTreeData = buildFlightLocationTreeData();
const locationTreeProps = { label: "label", children: "children", disabled: "disabled" };

const sectionOpen = reactive({
  theme: true,
  location: true,
  time: true,
  date: true,
  resources: true,
});

function toggleSection(key) {
  sectionOpen[key] = !sectionOpen[key];
}

const filteredResourceRows = computed(() => {
  const rows = resourceRowsBaseline.value;
  // 场景差异化资源展示：
  // 山林救援不展示无人艇；水上观察不展示无人犬。
  if (addForm.scenarioKey === "mountain") {
    return rows.filter((r) => r.key !== "boat");
  }
  if (addForm.scenarioKey === "water") {
    return rows.filter((r) => r.key !== "dog");
  }
  return rows;
});
const locationNodeLabelMap = computed(() => {
  const map = new Map();
  const queue = [...locationTreeData];
  while (queue.length) {
    const node = queue.shift();
    if (!node?.id) continue;
    map.set(node.id, node.label || String(node.id));
    if (Array.isArray(node.children) && node.children.length) {
      queue.push(...node.children);
    }
  }
  return map;
});
const readonlyLocationTreeData = computed(() => {
  const selectedPaths = (addForm.locationCheckedKeys || [])
    .map((k) => locationNodeKeyToPath(k))
    .filter((p) => p?.length);

  /** @type {{ id: string, label: string, children: any[] }[]} */
  const tree = [];
  selectedPaths.forEach((path) => {
    let cursor = tree;
    for (let i = 0; i < path.length; i += 1) {
      const pathSlice = path.slice(0, i + 1);
      const id = pathToLocationNodeKey(pathSlice);
      if (!id) break;
      const label = locationNodeLabelMap.value.get(id) || String(path[i]);
      let node = cursor.find((item) => item.id === id);
      if (!node) {
        node = { id, label, children: [] };
        cursor.push(node);
      }
      cursor = node.children;
    }
  });
  return tree;
});
const viewTimeText = computed(() => {
  const start = addForm.timeStart || "";
  const end = addForm.timeEnd || "";
  if (!start && !end) return "暂无时间设置";
  if (start && end) return `${start} 至 ${end}`;
  if (start) return `开始时间：${start}`;
  return `结束时间：${end}`;
});
const viewDateText = computed(() => {
  const range = addForm.flightDateRange || [];
  if (!Array.isArray(range) || range.length === 0) return "暂无日期设置";
  const [start, end] = range;
  if (!start) return "暂无日期设置";
  return formatPlanDateRange(start, end || start);
});

const addForm = reactive({
  scenarioKey: "mountain",
  subject: "",
  detailRemark: "",
  /** 地点树叶子节点 id 列表 */
  locationCheckedKeys: [],
  timeStart: "",
  timeEnd: "",
  /** @type {string[]} [开始日期, 结束日期] YYYY-MM-DD */
  flightDateRange: [],
  resourceDroneCount: 0,
  resourceDogCount: 0,
  resourceBoatCount: 0,
});

function getSelectedLocationPaths() {
  const keys = addForm.locationCheckedKeys || [];
  return keys
    .map((k) => locationNodeKeyToPath(k))
    .filter((p) => p?.length && resolvePolygonRingByPath(p));
}

function syncLocationTreeCheckedKeys(keys) {
  addForm.locationCheckedKeys = [...keys];
  nextTick(() => {
    locationTreeRef.value?.setCheckedKeys(keys, false);
  });
}

function onLocationTreeCheck() {
  if (isViewMode.value) return;
  const leafKeys = locationTreeRef.value?.getCheckedKeys(true) || [];
  addForm.locationCheckedKeys = leafKeys;
}

function bumpResource(field, delta) {
  if (isViewMode.value) return;
  const n = Number(addForm[field]) || 0;
  addForm[field] = Math.max(0, n + delta);
}

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

function timeToMinutes(t) {
  if (!t || typeof t !== "string") return NaN;
  const parts = t.split(":");
  if (parts.length < 2) return NaN;
  return Number(parts[0]) * 60 + Number(parts[1]);
}

/** 围栏环 [lng,lat,...] 的几何中心，供接口 longitude / latitude */
function ringCentroidLngLat(ringFlat) {
  if (!ringFlat?.length || ringFlat.length < 6) return null;
  let sx = 0;
  let sy = 0;
  const n = ringFlat.length / 2;
  for (let i = 0; i < ringFlat.length; i += 2) {
    sx += ringFlat[i];
    sy += ringFlat[i + 1];
  }
  return { longitude: sx / n, latitude: sy / n };
}

/** 接口实行时间，补全为 HH:mm:ss */
function formatExecuteTimeForApi(hm) {
  const s = String(hm || "").trim();
  if (!s) return "";
  const parts = s.split(":").map((p) => p.trim());
  if (parts.length === 2) {
    const h = parts[0].padStart(2, "0");
    const m = parts[1].padStart(2, "0");
    return `${h}:${m}:00`;
  }
  if (parts.length >= 3) {
    return `${parts[0].padStart(2, "0")}:${parts[1].padStart(2, "0")}:${parts[2].padStart(2, "0")}`;
  }
  return s;
}

/** @returns {{ description?: string }[]} */
function buildResourceConfigForApi() {
  const out = [];
  for (const r of filteredResourceRows.value) {
    const count = Number(addForm[r.field]) || 0;
    if (count > 0) {
      out.push({ description: `${r.label}×${count}` });
    }
  }
  const remark = addForm.detailRemark?.trim?.();
  if (remark) {
    out.push({ description: remark });
  }
  if (!out.length) {
    out.push({ description: "暂无资源分项说明" });
  }
  return out;
}

function resetResourceCountersFromBaseline() {
  addForm.resourceDroneCount = 0;
  addForm.resourceDogCount = 0;
  addForm.resourceBoatCount = 0;
  for (const r of resourceRowsBaseline.value) {
    if (
      r.field === "resourceDroneCount" ||
      r.field === "resourceDogCount" ||
      r.field === "resourceBoatCount"
    ) {
      if (r.defaultCount != null) {
        const n = Number(r.defaultCount);
        if (!Number.isNaN(n)) addForm[r.field] = Math.max(0, n);
      }
    }
  }
}

function resetPlanForm() {
  addForm.scenarioKey = activeScenarioKey.value;
  addForm.subject = "";
  addForm.detailRemark = "";
  addForm.locationCheckedKeys = [];
  addForm.timeStart = "";
  addForm.timeEnd = "";
  addForm.flightDateRange = [];
  resetResourceCountersFromBaseline();
}

function loadPlanIntoForm(p) {
  addForm.scenarioKey = p.scenarioKey;
  addForm.subject = p.subject ?? "";
  addForm.detailRemark = p.detailRemark ?? "";
  const paths = normalizePlanLocationPaths(p);
  syncLocationTreeCheckedKeys(paths.map((path) => pathToLocationNodeKey(path)).filter(Boolean));
  addForm.timeStart = p.timeStart || "";
  addForm.timeEnd = p.timeEnd || "";
  addForm.flightDateRange =
    p.flightDate ? [p.flightDate, p.flightDateEnd || p.flightDate] : [];
  addForm.resourceDroneCount = p.resourceDroneCount ?? 0;
  addForm.resourceDogCount = p.resourceDogCount ?? 0;
  addForm.resourceBoatCount = p.resourceBoatCount ?? 0;
}

function openPlanDialog(mode, planId = null) {
  planDialogMode.value = mode;
  viewingPlanId.value = null;
  if (mode === "add") {
    resetPlanForm();
    addForm.scenarioKey = activeScenarioKey.value;
    planDialogVisible.value = true;
    nextTick(() => locationTreeRef.value?.setCheckedKeys([], false));
    return;
  }
  if (planId) {
    const p = flightPlanStore.getPlanById(planId);
    if (!p) {
      ElMessage.warning("未找到该计划");
      return;
    }
    viewingPlanId.value = planId;
    planDialogVisible.value = true;
    loadPlanIntoForm(p);
    flightPlanStore.setHighlightedPlan(planId);
  }
}

function closePlanDialog() {
  planDialogVisible.value = false;
  viewingPlanId.value = null;
}

function reloadDetailFormIfViewing(planId) {
  if (!planDialogVisible.value || viewingPlanId.value !== planId) return;
  const latest = flightPlanStore.getPlanById(planId);
  if (latest) loadPlanIntoForm(latest);
}

function requestPlanStartFollow(plan) {
  if (!plan?.id) return;
  const title = plan.subject || plan.locationLabel || "飞行计划";
  if (detailActionSubmitting.value) return;
  ElMessageBox.confirm(`确定紧急启动「${title}」任务？`, "紧急启动确认", {
    confirmButtonText: "紧急启动",
    cancelButtonText: "取消",
    type: "warning",
  })
    .then(async () => {
      detailActionSubmitting.value = true;
      try {
        const res = await AccompanyingFlyService.planStartFollow({ id: plan.id });
        if (res?.code === 2000) {
          await loadPlansForActiveTab();
          reloadDetailFormIfViewing(plan.id);
          ElMessage.success("任务已开启");
        }
      } finally {
        detailActionSubmitting.value = false;
      }
    })
    .catch(() => {});
}

function requestPlanStopFollow(plan) {
  if (!plan?.id) return;
  if (detailActionSubmitting.value) return;
  const title = plan.subject || plan.locationLabel || "该飞行计划";
  ElMessageBox.confirm(`确定停止「${title}」任务？`, "停止任务确认", {
    confirmButtonText: "停止",
    cancelButtonText: "取消",
    type: "warning",
  })
    .then(async () => {
      detailActionSubmitting.value = true;
      try {
        const res = await AccompanyingFlyService.planStopFollow({ id: plan.id });
        if (res?.code === 2000) {
          await loadPlansForActiveTab();
          reloadDetailFormIfViewing(plan.id);
          ElMessage.success("任务已停止");
        }
      } finally {
        detailActionSubmitting.value = false;
      }
    })
    .catch(() => {});
}

async function onDetailEmergencyStart() {
  const p = currentViewingPlan.value;
  if (!p) {
    ElMessage.warning("未找到该计划");
    return;
  }
  requestPlanStartFollow(p);
}

async function onDetailStop() {
  const p = currentViewingPlan.value;
  if (!p) {
    ElMessage.warning("未找到该计划");
    return;
  }
  requestPlanStopFollow(p);
}

function onDetailDelete() {
  const planId = viewingPlanId.value;
  const p = currentViewingPlan.value;
  if (!p) {
    ElMessage.warning("未找到该计划");
    return;
  }
  if (detailActionSubmitting.value) return;
  const title = p.subject || p.locationLabel || "该飞行计划";
  ElMessageBox.confirm(`确定删除「${title}」？删除后不可恢复。`, "删除飞行计划", {
    confirmButtonText: "删除",
    cancelButtonText: "取消",
    type: "warning",
  })
    .then(async () => {
      detailActionSubmitting.value = true;
      try {
        const res = await AccompanyingFlyService.planDelete({ id: planId });
        if (res?.code === 2000) {
          closePlanDialog();
          await loadPlansForActiveTab();
          ElMessage.success("已删除飞行计划");
        }
      } finally {
        detailActionSubmitting.value = false;
      }
    })
    .catch(() => {});
}

async function confirmAddPlan() {
  if (planSubmitting.value) return;

  const locationPaths = getSelectedLocationPaths();
  if (!locationPaths.length) {
    ElMessage.warning("请至少选择一个地点");
    return;
  }
  const polygonLngLatList = resolvePolygonRingsFromPaths(locationPaths);
  if (polygonLngLatList.length !== locationPaths.length) {
    ElMessage.error("部分地点缺少围栏数据，无法上图");
    return;
  }

  const range = addForm.flightDateRange || [];
  const flightDate = range[0];
  const flightDateEnd = range[1];
  if (!flightDate) {
    ElMessage.warning("请选择实行日期");
    return;
  }
  if (flightDateEnd && flightDateEnd < flightDate) {
    ElMessage.warning("结束日期不能早于开始日期");
    return;
  }

  if (!addForm.timeStart || !addForm.timeEnd) {
    ElMessage.warning("请填写实行开始时间与结束时间");
    return;
  }
  const t0 = timeToMinutes(addForm.timeStart);
  const t1 = timeToMinutes(addForm.timeEnd);
  if (!Number.isFinite(t0) || !Number.isFinite(t1)) {
    ElMessage.warning("时间格式无效");
    return;
  }
  if (t1 <= t0) {
    ElMessage.warning("结束时间须晚于开始时间");
    return;
  }

  const placeLabel = resolveLocationLabelsFromPaths(locationPaths) || "—";
  const name =
    addForm.subject.trim() ||
    placeLabel ||
    (scenarios.find((s) => s.key === addForm.scenarioKey)?.title ?? "飞行计划");

  const center = ringCentroidLngLat(polygonLngLatList[0]);
  if (
    !center ||
    !Number.isFinite(center.longitude) ||
    !Number.isFinite(center.latitude)
  ) {
    ElMessage.error("无法解析地点坐标，请重新选择地点");
    return;
  }

  const type = TAB_TO_API_TYPE[addForm.scenarioKey];
  if (!type) {
    ElMessage.error("未知计划场景类型");
    return;
  }

  const body = {
    type,
    name,
    place: placeLabel,
    longitude: Number(center.longitude.toFixed(6)),
    latitude: Number(center.latitude.toFixed(6)),
    executeDate: String(flightDate).slice(0, 10),
    executeStartTime: formatExecuteTimeForApi(addForm.timeStart),
    executeEndTime: formatExecuteTimeForApi(addForm.timeEnd),
    resourceConfig: buildResourceConfigForApi(),
  };

  planSubmitting.value = true;
  try {
    const res = await AccompanyingFlyService.planAdd(body);
    if (res?.code !== 2000) {
      return;
    }
    activeScenarioKey.value = addForm.scenarioKey;
    const q = { type, current: 1, pageSize: 100 };
    const nq = planNameQuery.value.trim();
    if (nq) q.name = nq;
    await flightPlanStore.fetchPlanList(q);
    closePlanDialog();
    ElMessage.success("已提交飞行计划");
  } finally {
    planSubmitting.value = false;
  }
}

function onRowClick(row) {
  selectedRowKey.value = row.key;
  if (!row.planId) return;
  openPlanDialog("view", row.planId);
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
</script>

<style lang="scss" scoped>
$fp-bg: #121212;
$fp-surface: #1e1e1e;
$fp-border: rgba(255, 255, 255, 0.12);
$fp-yellow: #e6f455;
$fp-text: #ffffff;
$fp-muted: rgba(255, 255, 255, 0.45);
$editor-bg: #0d1117;
$editor-sec-head: #161b22;
$editor-accent: #3b6fd8;

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

/* —— 弹窗 —— */
.plan-editor-overlay {
  position: fixed;
  inset: 0;
  z-index: 3000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px 16px;
  background: rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(4px);
}

.plan-editor-modal {
  width: 450px;
  max-height: min(92vh, 80vh);
  display: flex;
  flex-direction: column;
  border-radius: 6px;
border: 1px solid #30363B;
background: rgba(3, 6, 10, 0.65);
  overflow: hidden;
  padding: 10px;
}

.plan-editor-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
  padding: 8px 8px;
  border-radius: 2px;
background: #1C222A;
}

.plan-editor-head__title-row {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.plan-editor-head__chev {
  flex-shrink: 0;
  width: 18px;
  height: 18px;
  object-fit: contain;
  display: block;
  opacity: 0.75;
}

.plan-editor-head__title {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #fff;
}

.plan-editor-head__close {
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0;
  padding: 0;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: rgba(255, 255, 255, 0.65);
  font-size: 22px;
  cursor: pointer;

  &:hover {
    color: #fff;
    background: rgba(255, 255, 255, 0.06);
  }
}

.plan-editor-scroll {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 10px 0;

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

.plan-editor-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
  border-radius: 2px;
  background: #15191E;
}

.plan-editor-tabs__item {
  flex: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-height: 40px;
  padding: 8px 6px;
  margin: 0;
  border: 1px solid transparent;
  border-radius: 6px;
  background: transparent;
  color: rgba(255, 255, 255, 0.55);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition:
    background 0.15s,
    color 0.15s;

  &:disabled {
    cursor: default;
    opacity: 0.85;
  }

  // &:not(:disabled):hover {
  //   color: rgba(255, 255, 255, 0.85);
  // }
}

.plan-editor-tabs__item--active {
  background: #c8c8c8;
  border-color: #fff;
  color: #1a1a1a;

  .plan-editor-tabs__icon {
    color: #1a1a1a;
  }
}

.plan-editor-tabs__icon {
  font-size: 18px;
  color: inherit;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.plan-sec {
  margin-bottom: 8px;
  border-radius: 6px;
  overflow: hidden;
  // border: 1px solid rgba(255, 255, 255, 0.06);
}

.plan-sec__head {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  margin: 0;
  border: none;
  background: $editor-sec-head;
  color: #fff;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  text-align: left;

  &:hover {
    background: #1c232d;
  }
}

.plan-sec__head-text {
  flex: 1;
}

.plan-sec__head-arrow {
  font-size: 18px;
  color: rgba(255, 255, 255, 0.45);
  transition: transform 0.2s ease;
}

.plan-sec__head-arrow--open {
  transform: rotate(180deg);
}

.plan-sec__body {
  padding: 4px 0px;
  // background: #0a0d12;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.plan-sec__body--flush {
  padding: 0;
}

.plan-sec__body--pickers {
  gap: 10px;
}

.plan-sec__body--resources {
  gap: 12px;
  padding: 10px 12px;
  background: #03060A;
  margin-top: 5px;
}

.plan-el-picker {
  width: 100%;
  --el-fill-color-blank: #000;
  --el-bg-color: #0a0d12;
  --el-bg-color-overlay: #1e1e1e;
  --el-text-color-primary: #fff;
  --el-text-color-regular: rgba(255, 255, 255, 0.88);
  --el-text-color-placeholder: rgba(255, 255, 255, 0.35);
  --el-text-color-secondary: rgba(255, 255, 255, 0.55);
  --el-border-color: rgba(255, 255, 255, 0.12);
  --el-border-color-light: rgba(255, 255, 255, 0.08);
  --el-border-color-hover: rgba(255, 255, 255, 0.22);
  --el-disabled-bg-color: #0a0a0a;
  --el-disabled-text-color: rgba(255, 255, 255, 0.45);
  --el-disabled-border-color: rgba(255, 255, 255, 0.06);
  --el-color-primary: #3b6fd8;

  :deep(.el-input__wrapper) {
    background-color: #000 !important;
    box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.1) inset !important;
  }

  :deep(.el-input__wrapper:hover) {
    box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.18) inset !important;
  }

  :deep(.el-input.is-focus .el-input__wrapper),
  :deep(.el-input__wrapper.is-focus) {
    box-shadow:
      0 0 0 1px rgba(59, 111, 216, 0.75) inset,
      0 0 0 1px rgba(59, 111, 216, 0.35) !important;
  }

  :deep(.el-input__inner) {
    color: #fff;
  }

  :deep(.el-input__prefix),
  :deep(.el-input__suffix),
  :deep(.el-input__suffix-inner),
  :deep(.el-input__icon),
  :deep(.el-range__icon),
  :deep(.el-range__close-icon) {
    color: rgba(255, 255, 255, 0.5);
  }

  :deep(.el-range-input) {
    color: #fff;
    background: transparent !important;
  }

  :deep(.el-range-input::placeholder),
  :deep(.el-input__inner::placeholder) {
    color: rgba(255, 255, 255, 0.35);
  }

  :deep(.el-range-separator) {
    color: rgba(255, 255, 255, 0.55);
  }

  &.is-disabled :deep(.el-input__wrapper) {
    background-color: #0a0a0a !important;
    box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.06) inset !important;
  }
}

.plan-input {
  width: 100%;
  box-sizing: border-box;
  margin: 0;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 4px;
  background: #000;
  color: #fff;
  font-size: 14px;
  outline: none;

  &::placeholder {
    color: rgba(255, 255, 255, 0.35);
  }

  &:focus:not(:read-only) {
    border-color: rgba($editor-accent, 0.65);
  }
}

.plan-input--single {
  height: 40px;
  padding: 0 12px;
}

.plan-input--area {
  padding: 10px 12px;
  resize: vertical;
  min-height: 72px;
  font-family: inherit;
}

.plan-readonly-field {
  width: 100%;
  box-sizing: border-box;
  min-height: 40px;
  padding: 10px 12px;
  border-radius: 4px;
  background: #000;
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.9);
  font-size: 14px;
  line-height: 1.4;
}

.plan-sec__body--tree {
  padding: 8px 10px 10px;
  overflow: visible;
  background: #03060A;
}

.plan-loc-tree {
  background: transparent;
  --el-tree-node-hover-bg-color: rgba(255, 255, 255, 0.06);
  --el-tree-text-color: rgba(255, 255, 255, 0.88);
  --el-tree-expand-icon-color: rgba(255, 255, 255, 0.45);
}

.plan-loc-tree--readonly {
  padding: 4px 0;
}

.plan-res-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.plan-res-row__label {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.88);
}

.plan-res-counter {
  display: flex;
  align-items: center;
  gap: 12px;
}

.plan-res-counter__btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: 1px solid rgba(255, 255, 255, 0.35);
  border-radius: 50%;
  background: transparent;
  color: #fff;
  font-size: 16px;
  cursor: pointer;
  transition:
    border-color 0.15s,
    background 0.15s;

  &:hover:not(:disabled) {
    border-color: rgba(255, 255, 255, 0.55);
    background: rgba(255, 255, 255, 0.06);
  }

  &:disabled {
    opacity: 0.35;
    cursor: default;
  }
}

.plan-res-counter__num {
  min-width: 24px;
  text-align: center;
  font-size: 15px;
  font-weight: 600;
  color: #fff;
  font-variant-numeric: tabular-nums;
}

.plan-editor-foot {
  flex-shrink: 0;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 12px;
  padding: 14px 16px 16px;
  // background: #0a0d12;
  // border-top: 1px solid rgba(255, 255, 255, 0.06);

  &--view {
    justify-content: space-between;
  }
}

.plan-editor-btn {
  min-width: 88px;
  height: 40px;
  padding: 0 20px;
  margin: 0;
  border-radius: 999px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition:
    opacity 0.15s,
    border-color 0.15s,
    background 0.15s;
}

.plan-editor-btn--primary {
  border: none;
  background: $editor-accent;
  color: #fff;

  &:hover {
    filter: brightness(1.08);
  }
}

.plan-editor-btn--outline {
  border: 1px solid $editor-accent;
  background: transparent;
  color: #fff;

  &:hover {
    background: rgba($editor-accent, 0.15);
  }
}

.plan-editor-btn--ghost {
  border: 1px solid rgba(255, 255, 255, 0.25);
  background: transparent;
  color: rgba(255, 255, 255, 0.9);

  &:hover {
    border-color: rgba(255, 255, 255, 0.45);
  }
}

.plan-editor-btn--emergency {
  border: none;
  background: #e6f455;
  color: #1a1a1a;

  &:hover {
    filter: brightness(1.05);
  }
}

.plan-editor-btn--danger {
  border: 1px solid #ea375f;
  background: transparent;
  color: #ff6b8a;

  &:hover {
    background: rgba(234, 55, 95, 0.15);
    border-color: #ff4d6d;
    color: #ff8fa8;
  }
}

.plan-editor-fade-enter-active,
.plan-editor-fade-leave-active {
  transition: opacity 0.2s ease;
}

.plan-editor-fade-enter-active .plan-editor-modal,
.plan-editor-fade-leave-active .plan-editor-modal {
  transition: transform 0.2s ease;
}

.plan-editor-fade-enter-from,
.plan-editor-fade-leave-to {
  opacity: 0;

  .plan-editor-modal {
    transform: translateY(8px) scale(0.98);
  }
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
