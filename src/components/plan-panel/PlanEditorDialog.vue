<template>
  <Teleport to="body">
      <Transition name="plan-editor-fade">
        <div
          v-if="visible"
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
                    v-model="addForm.description"
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
                <div v-show="sectionOpen.location">
                  <div class="plan-sec__body plan-sec__body--tree">
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

                      :check-strictly="false"
                      :props="locationTreeProps"
                      @check="onLocationTreeCheck"
                    >
                      <template #default="{ node, data }">
                        <span class="custom-tree-node">
                          <span class="custom-tree-node__label">{{ node.label }}</span>
                          <!-- <span class="custom-tree-node__actions">
                            <template v-if="data.children !== undefined">
                              <button class="tree-btn" @click.stop="handleAddRegion(data.value)">+ 地区</button>
                              <button class="tree-btn tree-btn--del" @click.stop="handleRemoveCategory(data.value)">×</button>
                            </template>
                            <template v-else>
                              <button class="tree-btn tree-btn--draw" @click.stop="emit('start-area-draw', { categoryValue: node.parent.data.value, regionValue: data.value, existingArea: data.regionData || null })">{{ data.regionData ? '编辑地区' : '选择地区' }}</button>
                              <button class="tree-btn tree-btn--del" @click.stop="handleRemoveRegion(node.parent.data.value, data.value)">×</button>
                            </template>
                          </span> -->
                        </span>
                      </template>
                    </el-tree>
                  </div>
                  <!-- <div v-if="!isViewMode" class="plan-sec__body plan-sec__body--locations">
                    <button type="button" class="loc-add-btn loc-add-btn--cat" @click="handleAddCategory">+ 添加分类</button>
                  </div> -->
                </div>
              </section>

              <section class="plan-sec">
                <button type="button" class="plan-sec__head" @click="toggleSection('algorithm')">
                  <span class="plan-sec__head-text">算法选择</span>
                  <i
                    class="plan-sec__head-arrow ri-arrow-down-s-fill"
                    :class="{ 'plan-sec__head-arrow--open': sectionOpen.algorithm }"
                  />
                </button>
                <div v-show="sectionOpen.algorithm" class="plan-sec__body plan-sec__body--algorithms">
                  <div v-if="isViewMode" class="plan-readonly-field">
                    {{ viewAlgorithmText }}
                  </div>
                  <template v-else>
                    <div v-if="algorithmListLoading" class="plan-algorithm-empty">加载中…</div>
                    <div v-else-if="!algorithmList.length" class="plan-algorithm-empty">暂无可用算法</div>
                    <el-checkbox-group
                      v-else
                      v-model="addForm.algorithmIds"
                      class="plan-algorithm-group"
                    >
                      <div
                        v-for="item in algorithmList"
                        :key="item.algorithmId"
                        class="plan-algorithm-row"
                      >
                        <el-checkbox :label="item.algorithmId" class="plan-algorithm-row__cb">
                          <span class="plan-algorithm-row__text">
                            {{ item.algorithmName || item.algorithmCode || item.algorithmId }}
                          </span>
                        </el-checkbox>
                      </div>
                    </el-checkbox-group>
                  </template>
                </div>
              </section>

              <section v-if="requiresScheduleFields" class="plan-sec">
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

              <section v-if="requiresScheduleFields" class="plan-sec">
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
                      v-model="addForm.flightDate"
                      class="plan-el-picker"
                      type="date"
                      placeholder="请选择日期"
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
                  <template v-if="isViewMode">
                    <div v-for="(count, key) in addForm.resourceCounts" :key="key" class="plan-res-row">
                      <span class="plan-res-row__label">{{ resourceLabel(key) }}</span>
                      <div class="plan-res-counter">
                        <span class="plan-res-counter__num">{{ count }}</span>
                      </div>
                    </div>
                    <div v-if="!Object.keys(addForm.resourceCounts).length" class="plan-res-row">
                      <span class="plan-res-row__label" style="color: rgba(255,255,255,0.35)">暂无资源配置</span>
                    </div>
                  </template>
                  <template v-else>
                    <div v-for="r in resourceRowsBaseline" :key="r.key" class="plan-res-row">
                      <span class="plan-res-row__label">{{ r.label }}</span>
                      <div class="plan-res-counter">
                        <button
                          type="button"
                          class="plan-res-counter__btn"
                          :disabled="(addForm.resourceCounts[r.key] || 0) <= 0"
                          aria-label="减少"
                          @click="bumpResource(r.key, -1)"
                        >
                          <i class="ri-subtract-line" />
                        </button>
                        <span class="plan-res-counter__num">{{ addForm.resourceCounts[r.key] || 0 }}</span>
                        <button
                          type="button"
                          class="plan-res-counter__btn"
                          aria-label="增加"
                          @click="bumpResource(r.key, 1)"
                        >
                          <i class="ri-add-line" />
                        </button>
                      </div>
                    </div>
                  </template>
                </div>
              </section>
            </div>

            <footer class="plan-editor-foot" :class="{ 'plan-editor-foot--view': isViewMode }">
              <template v-if="isViewMode">
                <button
                  v-if="canDetailEmergencyStart"
                  type="button"
                  class="plan-editor-btn plan-editor-btn--emergency"
                  :disabled="detailActionSubmitting"
                  @click="onDetailEmergencyStart"
                >
                  紧急启动
                </button>
                <button
                  v-else-if="canDetailStopTask"
                  type="button"
                  class="plan-editor-btn plan-editor-btn--danger"
                  :disabled="detailActionSubmitting"
                  @click="onDetailStop"
                >
                  取消任务
                </button>
                <!-- <button
                  type="button"
                  class="plan-editor-btn plan-editor-btn--ghost"
                  :disabled="detailActionSubmitting"
                  @click="switchToEditMode"
                >
                  编辑
                </button> -->
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
                <button v-if="!isEditMode" type="button" class="plan-editor-btn plan-editor-btn--primary" @click="resetPlanForm">
                  重置
                </button>
                <button
                  type="button"
                  class="plan-editor-btn plan-editor-btn--outline"
                  :disabled="planSubmitting"
                  @click="submitPlan"
                >
                  {{ planSubmitting ? "提交中…" : "确认" }}
                </button>
              </template>
            </footer>
          </div>
        </div>
      </Transition>
  </Teleport>
</template>

<script setup>
import { ref, reactive, computed, nextTick, onMounted, watch } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { FlightPlanService } from "@/api/plan";
import { AlgorithmService } from "@/api/algorithm";
import { unwrapApiList } from "@/utils/request.js";
import { useFlightPlanStore } from "@/stores/flightPlan.js";
import arrowRightPng from "@/assets/images/arrow_right.png";
import MountainRescueIcon from "@/components/icons/MountainRescueIcon.vue";
import WaterObservationIcon from "@/components/icons/WaterObservationIcon.vue";
import SecurityProtectionIcon from "@/components/icons/SecurityProtectionIcon.vue";
import {
  pathToLocationNodeKey,
  locationNodeKeyToPath,
} from "@/config/flight-plan-locations.js";
import {
  PLAN_SCENARIOS,
  TAB_TO_API_TYPE,
  PLAN_EDITOR_TITLE_ID,
  planPickerPopperOptions,
} from "@/components/plan-panel/plan-scenarios.js";
import { usePlanEditorResources } from "@/composables/usePlanEditorResources.js";
import { canPlanEmergencyStart, canPlanStopTask } from "@/utils/plan-task.js";

const emit = defineEmits(["closed", "changed", "scenario-sync"]);

const props = defineProps({
  /** 列表当前场景 Tab，用于「新增」默认场景 */
  listScenarioKey: {
    type: String,
    default: "mountain",
  },
});

const visible = defineModel("visible", { type: Boolean, default: false });

const flightPlanStore = useFlightPlanStore();
const scenarios = PLAN_SCENARIOS;
const planEditorTitleId = PLAN_EDITOR_TITLE_ID;
const planSubmitting = ref(false);

const { resourceRowsBaseline, loadResourceSourceDefs } = usePlanEditorResources();

function fetchPlaceListForFormScenario() {
  const type = TAB_TO_API_TYPE[addForm.scenarioKey];
  if (type) flightPlanStore.fetchPlaceList(type);
}

const algorithmList = ref([]);
const algorithmListLoading = ref(false);

function normalizeAlgorithmItem(raw) {
  const id = raw?.algorithmId ?? raw?.id;
  if (id == null || id === "") return null;
  return {
    algorithmId: String(id),
    algorithmCode: String(raw?.algorithmCode ?? "").trim(),
    algorithmName: String(raw?.algorithmName ?? raw?.name ?? "").trim(),
  };
}

async function loadAlgorithmList() {
  if (algorithmListLoading.value) return;
  algorithmListLoading.value = true;
  try {
    const data = await AlgorithmService.list();
    algorithmList.value = unwrapApiList(data)
      .map(normalizeAlgorithmItem)
      .filter(Boolean);
  } catch {
    algorithmList.value = [];
  } finally {
    algorithmListLoading.value = false;
  }
}

function parseAlgorithmIdsFromDetail(detail) {
  const raw = detail?.algorithmIds ?? detail?.algorithmIdList ?? detail?.algorithms ?? [];
  if (typeof raw === "string") {
    return raw.split(",").map((s) => s.trim()).filter(Boolean);
  }
  if (!Array.isArray(raw)) return [];
  return raw
    .map((v) => {
      if (v == null) return "";
      if (typeof v === "object") {
        const id = v?.algorithmId ?? v?.id;
        return id != null ? String(id) : "";
      }
      return String(v).trim();
    })
    .filter(Boolean);
}

onMounted(() => {
  loadResourceSourceDefs();
});

const planDialogVisible = ref(false);
/** @type {import('vue').Ref<'add' | 'view'>} */
const planDialogMode = ref("add");
const viewingPlanId = ref(null);

const isViewMode = computed(() => planDialogMode.value === "view");
const isEditMode = computed(() => planDialogMode.value === "edit");
const detailActionSubmitting = ref(false);
const currentViewingPlan = computed(() =>
  flightPlanStore.getPlanById(viewingPlanId.value),
);
const canDetailEmergencyStart = computed(() =>
  canPlanEmergencyStart(currentViewingPlan.value),
);
const canDetailStopTask = computed(() => canPlanStopTask(currentViewingPlan.value));

const themeSectionTitle = computed(() => {
  const k = addForm.scenarioKey;
  if (k === "water") return "观察主题";
  if (k === "security") return "安保主题";
  return "救援主题";
});

const planEditorTitle = computed(() =>
  planDialogMode.value === "view" ? "飞行计划详情" : planDialogMode.value === "edit" ? "编辑飞行计划" : "添加飞行计划",
);

/** 重点安保需填写实行日期与时间；山林救援、水上观察在添加/编辑/查看均不展示 */
const requiresScheduleFields = computed(() => addForm.scenarioKey === "security");

const locationTreeRef = ref(null);
const locationTreeData = computed(() => flightPlanStore.mergedLocationTreeData);
const locationTreeProps = { label: "label", children: "children", disabled: "disabled" };

const sectionOpen = reactive({
  theme: true,
  location: true,
  algorithm: true,
  time: true,
  date: true,
  resources: true,
});

function toggleSection(key) {
  sectionOpen[key] = !sectionOpen[key];
}

async function handleAddCategory() {
  try {
    const { value } = await ElMessageBox.prompt("请输入分类名称", "添加分类", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      inputPlaceholder: "例如：商业区",
    });
    const label = String(value || "").trim();
    if (label) flightPlanStore.addCustomCategory(label);
  } catch { /* cancelled */ }
}

async function handleRemoveCategory(categoryValue) {
  try {
    await ElMessageBox.confirm("确定删除该分类及其所有地区？", "删除分类", {
      confirmButtonText: "删除",
      cancelButtonText: "取消",
      type: "warning",
    });
    flightPlanStore.removeCustomCategory(categoryValue);
  } catch { /* cancelled */ }
}

async function handleAddRegion(categoryValue) {
  try {
    const { value } = await ElMessageBox.prompt("请输入地区名称", "添加地区", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      inputPlaceholder: "例如：XX路口",
    });
    const label = String(value || "").trim();
    if (label) flightPlanStore.addCustomRegion(categoryValue, label);
  } catch { /* cancelled */ }
}

async function handleRemoveRegion(categoryValue, regionValue) {
  try {
    await ElMessageBox.confirm("确定删除该地区？", "删除地区", {
      confirmButtonText: "删除",
      cancelButtonText: "取消",
      type: "warning",
    });
    flightPlanStore.removeCustomRegion(categoryValue, regionValue);
  } catch { /* cancelled */ }
}

const locationNodeLabelMap = computed(() => {
  const map = new Map();
  const queue = [...locationTreeData.value];
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
const viewAlgorithmText = computed(() => {
  const ids = addForm.algorithmIds;
  if (!ids || !ids.length) return "暂未选择算法";
  return ids
    .map((id) => {
      const item = algorithmList.value.find((a) => a.algorithmId === id);
      return item?.algorithmName || item?.algorithmCode || id;
    })
    .join("、");
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
  const d = addForm.flightDate;
  if (!d) return "暂无日期设置";
  return formatPlanDate(d);
});

const addForm = reactive({
  scenarioKey: "mountain",
  subject: "",
  description: "",
  /** 地点树叶子节点 id 列表 */
  locationCheckedKeys: [],
  timeStart: "",
  timeEnd: "",
  /** @type {string[]} [开始日期, 结束日期] YYYY-MM-DD */
  flightDate: "",
  /** @type {string[]} 选中的 algorithmId */
  algorithmIds: [],
  resourceCounts: {},
});

watch(() => addForm.scenarioKey, (key) => {
  if (planDialogVisible.value) {
    const type = TAB_TO_API_TYPE[key];
    if (type) flightPlanStore.fetchPlaceList(type);
  }
  if (planDialogVisible.value && !isViewMode.value && key !== "security") {
    addForm.timeStart = "";
    addForm.timeEnd = "";
    addForm.flightDate = "";
  }
});

function onLocationTreeCheck() {
  if (isViewMode.value) return;
  const leafKeys = locationTreeRef.value?.getCheckedKeys(true) || [];
  addForm.locationCheckedKeys = leafKeys;
}

function resourceLabel(key) {
  const row = resourceRowsBaseline.value.find((r) => r.key === key);
  return row?.label || key;
}

function bumpResource(key, delta) {
  if (isViewMode.value) return;
  const n = Number(addForm.resourceCounts[key]) || 0;
  addForm.resourceCounts[key] = Math.max(0, n + delta);
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
/** 接口实行时间，补全为 HH:mm:ss */
function formatExecuteTimeForApi(hm) {
  const s = String(hm || "").trim();
  if (!s) return "";
  const parts = s.split(":").map((p) => p.trim());
  const h = parts[0].padStart(2, "0");
  const m = (parts[1] || "").padStart(2, "0");
  return `${h}:${m}`;
}

/** @returns {{ description?: string }[]} */
function buildResourceConfigForApi() {
  const out = [];
  for (const [key, count] of Object.entries(addForm.resourceCounts)) {
    const n = Number(count) || 0;
    if (n > 0) out.push({ resourceType: key, resourceCount: n });
  }
  return out;
}

function resetResourceCountersFromBaseline() {
  addForm.resourceCounts = {};
  for (const r of resourceRowsBaseline.value) {
    if (r.defaultCount != null) {
      const n = Number(r.defaultCount);
      if (!Number.isNaN(n)) addForm.resourceCounts[r.key] = Math.max(0, n);
    }
  }
}

function resetPlanForm() {
  addForm.scenarioKey = props.listScenarioKey;
  addForm.subject = "";
  addForm.description = "";
  addForm.locationCheckedKeys = [];
  addForm.timeStart = "";
  addForm.timeEnd = "";
  addForm.flightDate = "";
  addForm.algorithmIds = [];
  resetResourceCountersFromBaseline();
  nextTick(() => locationTreeRef.value?.setCheckedKeys([], false));
}

function typeNumToScenarioKey(typeNum) {
  if (typeNum === 2) return "water";
  if (typeNum === 3) return "security";
  return "mountain";
}

function placeIdsToTreeNodeKeys(placeIds) {
  const keys = [];
  const tree = locationTreeData.value;
  const idSet = new Set((placeIds || []).map(String));
  for (const cat of tree) {
    if (!cat.children) continue;
    for (const leaf of cat.children) {
      if (idSet.has(String(leaf.value))) {
        keys.push(leaf.id);
      }
    }
  }
  return keys;
}

function loadPlanDetailIntoForm(detail) {
  const typeNum = Number(detail?.type);
  addForm.scenarioKey = typeNumToScenarioKey(typeNum);
  addForm.subject = detail?.planName ?? detail?.name ?? "";
  addForm.description = detail?.description ?? detail?.detailRemark ?? "";
  addForm.flightDate = detail?.executeDate ?? detail?.flightDate ?? "";
  addForm.timeStart = (detail?.executeStartTime ?? detail?.timeStart ?? "").slice(0, 5);
  addForm.timeEnd = (detail?.executeEndTime ?? detail?.timeEnd ?? "").slice(0, 5);
  addForm.algorithmIds = parseAlgorithmIdsFromDetail(detail);
  addForm.resourceCounts = {};
  const rc = detail?.resourceConfig ?? detail?.resourceList;
  if (Array.isArray(rc)) {
    for (const r of rc) {
      const k = r?.resourceType ?? r?.key;
      const c = Number(r?.resourceCount ?? r?.count) || 0;
      if (k && c > 0) addForm.resourceCounts[k] = c;
    }
  }
  // placeIds 兼容：逗号分隔字符串 / 字符串数组 / 对象数组含 id
  const rawPlaceIds = detail?.placeIds ?? detail?.placeIdList ?? detail?.placeList ?? [];
  const placeIds = typeof rawPlaceIds === "string"
    ? rawPlaceIds.split(",").map((s) => s.trim()).filter(Boolean)
    : Array.isArray(rawPlaceIds)
      ? rawPlaceIds.map((v) => (typeof v === "object" ? v?.id ?? String(v) : String(v)))
      : [];
  const nodeKeys = placeIdsToTreeNodeKeys(placeIds);
  console.log("[PlanEditor] detail placeIds:", rawPlaceIds, "→ nodeKeys:", nodeKeys, "tree:", locationTreeData.value);
  addForm.locationCheckedKeys = nodeKeys;
  nextTick(() => locationTreeRef.value?.setCheckedKeys(nodeKeys, false));
}

function showEditorDialog() {
  planDialogVisible.value = true;
  visible.value = true;
  if (!algorithmList.value.length && !algorithmListLoading.value) {
    loadAlgorithmList();
  }
}

async function openPlanDialog(mode, planId = null) {
  planDialogMode.value = mode;
  viewingPlanId.value = null;
  if (mode === "add") {
    fetchPlaceListForFormScenario();
    resetPlanForm();
    addForm.scenarioKey = props.listScenarioKey;
    showEditorDialog();
    nextTick(() => locationTreeRef.value?.setCheckedKeys([], false));
    return true;
  }
  if (!planId) return false;
  let detail;
  try {
    detail = await FlightPlanService.planDetail({ id: planId });
  } catch (e) {
    ElMessage.warning(e?.message || "获取计划详情失败");
    return false;
  }
  if (!detail) {
    ElMessage.warning("未找到该计划");
    return false;
  }
  const detailType = Number(detail?.type);
  if (detailType) await flightPlanStore.fetchPlaceList(detailType);
  await nextTick();
  viewingPlanId.value = planId;
  showEditorDialog();
  loadPlanDetailIntoForm(detail);
  if (mode === "edit") {
    nextTick(() => locationTreeRef.value?.setCheckedKeys(addForm.locationCheckedKeys, false));
  }
  flightPlanStore.setHighlightedPlan(planId);
  return true;
}

function closePlanDialog() {
  planDialogVisible.value = false;
  visible.value = false;
  viewingPlanId.value = null;
  emit("closed");
}

async function open(mode, planId = null) {
  const ok = await openPlanDialog(mode, planId);
  if (!ok) closePlanDialog();
}

function close() {
  closePlanDialog();
}

watch(visible, (v) => {
  if (!v) {
    planDialogVisible.value = false;
    viewingPlanId.value = null;
  }
});

async function reloadDetailFormIfViewing(planId) {
  if (!planDialogVisible.value || viewingPlanId.value !== planId) return;
  try {
    const detail = await FlightPlanService.planDetail({ id: planId });
    if (detail) loadPlanDetailIntoForm(detail);
  } catch {
    /* 静默刷新 */
  }
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
        await FlightPlanService.planStartFollow({ id: plan.id });
        emit("changed");
        reloadDetailFormIfViewing(plan.id);
        ElMessage.success("任务已开启");
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
  ElMessageBox.confirm(`确定停止「${title}」任务？`, "取消任务确认", {
    confirmButtonText: "停止",
    cancelButtonText: "取消",
    type: "warning",
  })
    .then(async () => {
      detailActionSubmitting.value = true;
      try {
        await FlightPlanService.planStopFollow({ id: plan.id });
        emit("changed");
        reloadDetailFormIfViewing(plan.id);
        ElMessage.success("任务已停止");
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
        await FlightPlanService.planDelete({ id: planId });
        closePlanDialog();
        emit("changed");
        ElMessage.success("已删除飞行计划");
      } finally {
        detailActionSubmitting.value = false;
      }
    })
    .catch(() => {});
}

async function submitPlan() {
  if (planSubmitting.value) return;

  const checkedNodes = locationTreeRef.value?.getCheckedNodes(true) || [];
  const placeIds = checkedNodes.map((n) => n.value).filter(Boolean);
  if (!placeIds.length) {
    ElMessage.warning("请至少选择一个地点");
    return;
  }

  const type = TAB_TO_API_TYPE[addForm.scenarioKey];
  if (!type) {
    ElMessage.error("未知计划场景类型");
    return;
  }

  if (requiresScheduleFields.value) {
    const flightDate = addForm.flightDate;
    if (!flightDate) {
      ElMessage.warning("请选择实行日期");
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
  }

  const body = {
    type,
    name: addForm.subject.trim(),
    placeIds: placeIds.join(","),
    resourceConfig: buildResourceConfigForApi(),
    description: addForm.description,
  };

  if (requiresScheduleFields.value) {
    body.executeDate = String(addForm.flightDate).slice(0, 10);
    body.executeStartTime = formatExecuteTimeForApi(addForm.timeStart);
    body.executeEndTime = formatExecuteTimeForApi(addForm.timeEnd);
  }

  if (addForm.algorithmIds.length) {
    body.algorithmIds = addForm.algorithmIds.join(",");
  }

  if (isEditMode.value) {
    body.id = viewingPlanId.value;
  }

  if (addForm.scenarioKey === "rescue") {
    body.rescueType = addForm.rescueType;
  }
  console.log("submitPlan", isEditMode.value ? "edit" : "add", body);

  planSubmitting.value = true;
  try {
    if (isEditMode.value) {
      await FlightPlanService.planUpdate(body);
    } else {
      await FlightPlanService.planAdd(body);
    }
    emit("scenario-sync", addForm.scenarioKey);
    emit("changed");
    closePlanDialog();
    ElMessage.success(isEditMode.value ? "已更新飞行计划" : "已提交飞行计划");
  } finally {
    planSubmitting.value = false;
  }
}

defineExpose({ open, close });
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
  width: 500px;
  max-height: min(98vh, 95vh);
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

.plan-sec__body--algorithms {
  padding: 4px 12px 8px;
  background: #03060a;
  margin-top: 5px;
  overflow: visible;
}

.plan-algorithm-group {
  display: flex;
  flex-direction: column;
  width: 100%;
}

.plan-algorithm-row {
  width: 100%;
  min-height: 40px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);

  &:last-child {
    border-bottom: none;
  }
}

.plan-algorithm-row__cb {
  display: inline-flex !important;
  align-items: center;
  width: 100%;
  height: auto !important;
  min-height: 40px;
  margin-right: 0 !important;
  white-space: normal;
}

.plan-algorithm-row__text {
  display: block;
  color: rgba(255, 255, 255, 0.88);
  font-size: 14px;
  line-height: 1.4;
  word-break: break-word;
}

.plan-algorithm-row :deep(.el-checkbox__label) {
  display: inline-flex !important;
  align-items: center;
  flex: 1 1 auto;
  width: auto !important;
  min-width: 1px !important;
  max-width: 100%;
  height: auto !important;
  min-height: 1em;
  padding-left: 8px !important;
  overflow: visible !important;
  color: rgba(255, 255, 255, 0.88) !important;
  font-size: 14px !important;
  line-height: 1.4 !important;
  white-space: normal;
}

.plan-algorithm-empty {
  padding: 8px 0;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.35);
}

.plan-editor-modal .plan-algorithm-row__cb .el-checkbox__inner {
  background-color: transparent;
  border-color: rgba(255, 255, 255, 0.35);
}

.plan-editor-modal .plan-algorithm-row__cb .el-checkbox__input.is-checked .el-checkbox__inner {
  background-color: #3b6fd8;
  border-color: #3b6fd8;
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

/* ===== 自定义树节点内联操作按钮 ===== */
.custom-tree-node {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  gap: 6px;
  padding-right: 4px;
}

.custom-tree-node__label {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.custom-tree-node__actions {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  flex-shrink: 0;
}

.tree-btn {
  flex-shrink: 0;
  font-size: 11px;
  padding: 1px 7px;
  border-radius: 3px;
  border: 1px solid #30363b;
  background: transparent;
  color: rgba(255, 255, 255, 0.55);
  cursor: pointer;
  line-height: 1.5;
  white-space: nowrap;
  transition: all 0.15s ease;

  &:hover {
    color: #fff;
    border-color: rgba(255, 255, 255, 0.3);
  }
}

.tree-btn--draw {
  border-color: #4965c9;
  color: #4965c9;
  &:hover { background: rgba(73, 101, 201, 0.15); }
}

.tree-btn--del {
  padding: 1px 5px;
  font-size: 14px;
  line-height: 1;
  &:hover { color: #f56c6c; border-color: #f56c6c; }
}

.tree-badge {
  font-size: 10px;
  color: #67c23a;
  background: rgba(103, 194, 58, 0.12);
  border-radius: 2px;
  padding: 0 5px;
  line-height: 1.6;
  flex-shrink: 0;
}

/* ===== 地点设置 ===== */
.plan-sec__body--locations {
  padding: 10px 12px;
  background: #03060A;
  gap: 10px;
}

.loc-cat {
  border: 1px solid #25272b;
  border-radius: 6px;
  padding: 8px 10px;
  background: rgba(255, 255, 255, 0.03);
}

.loc-cat__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
}

.loc-cat__name {
  color: #fff;
  font-size: 13px;
  font-weight: 600;
}

.loc-cat__del {
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.35);
  font-size: 18px;
  cursor: pointer;
  line-height: 1;
  padding: 0 4px;
}
.loc-cat__del:hover { color: #f56c6c; }

.loc-reg {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 5px 0 5px 8px;
  border-left: 2px solid #25272b;
  margin: 4px 0 4px 4px;
}

.loc-reg__name {
  flex: 1;
  color: rgba(255, 255, 255, 0.75);
  font-size: 12px;
}

.loc-reg__badge {
  font-size: 11px;
  color: #67c23a;
  background: rgba(103, 194, 58, 0.12);
  border-radius: 3px;
  padding: 1px 6px;
  flex-shrink: 0;
}

.loc-reg__view {
  flex-shrink: 0;
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 3px;
  border: 1px solid #67c23a;
  background: transparent;
  color: #67c23a;
  cursor: pointer;
  white-space: nowrap;
}
.loc-reg__view:hover { background: rgba(103, 194, 58, 0.12); }

.loc-reg__draw {
  flex-shrink: 0;
  font-size: 11px;
  padding: 2px 10px;
  border-radius: 3px;
  border: 1px solid #4965c9;
  background: transparent;
  color: #4965c9;
  cursor: pointer;
  white-space: nowrap;
}
.loc-reg__draw:hover { background: rgba(73, 101, 201, 0.15); }

.loc-reg__del {
  flex-shrink: 0;
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.3);
  font-size: 16px;
  cursor: pointer;
  line-height: 1;
  padding: 0 2px;
}
.loc-reg__del:hover { color: #f56c6c; }

.loc-add-btn {
  display: block;
  width: 100%;
  padding: 5px 0;
  margin-top: 4px;
  background: none;
  border: 1px dashed #30363b;
  border-radius: 4px;
  color: rgba(255, 255, 255, 0.45);
  font-size: 12px;
  cursor: pointer;
  text-align: center;
}
.loc-add-btn:hover { border-color: #4965c9; color: #4965c9; }
.loc-add-btn--cat { margin-top: 4px; }

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
  border: 1px solid #FF4A4A;
  border-radius: 28px;
  background: rgba(255, 255, 255, 0.04);
  color: #FF4A4A;
  font-family: "Alibaba PuHuiTi 3.0", sans-serif;
  font-size: 12px;
  font-weight: 700;

  &:hover {
    background: rgba(255, 74, 74, 0.1);
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

/* 算法多选：避免 label 被 flex 压成 0，文案放在独立 span */
.plan-editor-modal .plan-algorithm-row__cb {
  --el-checkbox-text-color: rgba(255, 255, 255, 0.88);
  --el-checkbox-checked-text-color: rgba(255, 255, 255, 0.95);
  --el-checkbox-font-size: 14px;
  color: rgba(255, 255, 255, 0.88);
}

.plan-editor-modal .plan-algorithm-row__cb .el-checkbox__label,
.plan-editor-modal .plan-algorithm-row__text {
  color: rgba(255, 255, 255, 0.88) !important;
  font-size: 14px !important;
}

.plan-editor-modal .plan-algorithm-row__cb .el-checkbox__input.is-checked + .el-checkbox__label,
.plan-editor-modal .plan-algorithm-group.is-disabled .plan-algorithm-row__text {
  color: rgba(255, 255, 255, 0.55) !important;
}

.plan-editor-modal .plan-algorithm-row__cb .el-checkbox__input.is-checked + .el-checkbox__label .plan-algorithm-row__text {
  color: rgba(255, 255, 255, 0.95) !important;
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

	  .el-date-table td.disabled {
	    background-color: transparent !important;
	  }

	  .el-date-table td.disabled .el-date-table-cell {
	    background: transparent !important;
	  }

	  .el-date-table td.disabled .el-date-table-cell__text {
	    color: rgba(255, 255, 255, 0.35);
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
