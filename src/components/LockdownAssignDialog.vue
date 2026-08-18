<template>
  <Teleport to="body">
    <Transition name="lockdown-assign-fade">
      <div
        v-if="visible"
        class="lockdown-assign"
        role="dialog"
        aria-modal="true"
        aria-labelledby="lockdown-assign-title"
      >
        <div id="lockdown-assign-title" class="lockdown-assign__title">
          <i class="ri-send-plane-2-fill lockdown-assign__title-icon" aria-hidden="true" />
          <span>请确认无误后点击开始封城</span>
        </div>

        <div v-loading="loading" class="lockdown-assign__body">
          <p v-if="!loading && !rows.length" class="lockdown-assign__empty">
            暂无已关联无人机的卡点
          </p>
          <template v-else>
            <div class="lockdown-assign__toolbar">
              <button
                type="button"
                class="lockdown-assign__tool-btn"
                :disabled="submitting || !rows.length"
                @click="setAllChecked(true)"
              >
                一键全选
              </button>
              <button
                type="button"
                class="lockdown-assign__tool-btn"
                :disabled="submitting || !rows.length"
                @click="setAllChecked(false)"
              >
                一键全不选
              </button>
            </div>
            <ul class="lockdown-assign__list">
            <li
              v-for="row in rows"
              :key="row.checkpointId"
              class="lockdown-assign__row"
              :class="{
                'is-disabled': submitting || !row.selectable,
                'is-locked': !row.selectable,
              }"
              :title="row.selectable ? '' : `${row.droneName}当前${row.droneStatusLabel || '不可用'}，无法勾选`"
              @click="toggleRow(row)"
            >
              <span
                class="lockdown-assign__check"
                :class="{ 'is-checked': row.checked }"
                role="checkbox"
                :aria-checked="row.checked"
                :aria-disabled="!row.selectable"
                :aria-label="row.checkpointName"
              >
                <i
                  :class="row.checked ? 'ri-checkbox-fill' : 'ri-checkbox-blank-line'"
                  aria-hidden="true"
                />
              </span>
              <div class="lockdown-assign__point" :title="row.checkpointName">
                {{ row.checkpointName }}
              </div>
              <div class="lockdown-assign__drone" :title="row.droneName">
                <span>{{ row.droneName }}</span>
                <span v-if="row.droneStatusLabel" class="lockdown-assign__status">
                  {{ row.droneStatusLabel }}
                </span>
              </div>
            </li>
            </ul>
          </template>
        </div>

        <div class="lockdown-assign__actions">
          <button
            type="button"
            class="lockdown-assign__btn lockdown-assign__btn--cancel"
            :disabled="submitting"
            @click="onCancel"
          >
            取消
          </button>
          <button
            type="button"
            class="lockdown-assign__btn lockdown-assign__btn--confirm"
            :disabled="loading || submitting || !rows.length"
            @click="onConfirm"
          >
            开始封城
          </button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, watch } from "vue";
import { ElMessage } from "element-plus";
import { CommonService } from "@/api/common.js";
import { unwrapApiList } from "@/utils/request.js";
import {
  buildLockdownDeployPayload,
  findDuplicateLockdownDrones,
  isLockdownRowSelectable,
  LOCKDOWN_LIST_QUERY_PARAMS,
  normalizeLockdownCheckpointRows,
} from "@/utils/lockdown-assign.js";

const visible = defineModel("visible", { type: Boolean, default: false });
const emit = defineEmits(["confirm", "cancel"]);

const loading = ref(false);
const submitting = ref(false);
const rows = ref([]);
let loadSeq = 0;

function toggleRow(row) {
  if (submitting.value || !isLockdownRowSelectable(row)) return;
  row.checked = !row.checked;
}

function setAllChecked(checked) {
  if (submitting.value) return;
  rows.value.forEach((row) => {
    if (!isLockdownRowSelectable(row)) {
      row.checked = false;
      return;
    }
    row.checked = checked;
  });
}

function resetState() {
  loadSeq += 1;
  rows.value = [];
  loading.value = false;
  submitting.value = false;
}

async function loadRows() {
  const currentSeq = ++loadSeq;
  loading.value = true;
  try {
    const data = await CommonService.controlPointListQuery(LOCKDOWN_LIST_QUERY_PARAMS);
    if (currentSeq !== loadSeq) return;
    rows.value = normalizeLockdownCheckpointRows(unwrapApiList(data)).map((row) => ({
      ...row,
      checked: false,
    }));
  } catch {
    if (currentSeq !== loadSeq) return;
    rows.value = [];
  } finally {
    if (currentSeq === loadSeq) {
      loading.value = false;
    }
  }
}

function onCancel() {
  if (submitting.value) return;
  visible.value = false;
  emit("cancel");
}

function duplicateDroneTip(duplicates) {
  const names = duplicates
    .map((item) => item.droneName)
    .filter(Boolean);
  if (names.length === 1) {
    return `「${names[0]}」已勾选多个卡点，一架无人机一次只能飞往一个卡点，请重新选择`;
  }
  if (names.length) {
    return `「${names.join("、")}」已分别勾选多个卡点，一架无人机一次只能飞往一个卡点，请重新选择`;
  }
  return "一架无人机一次只能飞往一个卡点，请重新选择";
}

async function onConfirm() {
  if (loading.value || submitting.value || !rows.value.length) return;

  const payload = buildLockdownDeployPayload(rows.value);
  if (rows.value.length && !payload.droneIds.length) {
    ElMessage.warning("请先勾选要封控的卡点");
    return;
  }

  const duplicates = findDuplicateLockdownDrones(rows.value);
  if (duplicates.length) {
    ElMessage.warning(duplicateDroneTip(duplicates));
    return;
  }

  submitting.value = true;
  try {
    await CommonService.controlPointDeploy({
      droneIds: payload.droneIds,
      controlPointIds: payload.controlPointIds,
    });
    emit("confirm", payload);
    visible.value = false;
  } catch {
    // 错误提示由请求层处理，弹窗保持打开便于改选后重试
  } finally {
    submitting.value = false;
  }
}

watch(visible, (next) => {
  if (next) {
    loadRows();
    return;
  }
  resetState();
});
</script>

<style lang="scss" scoped>
.lockdown-assign {
  position: fixed;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  z-index: 3000;
  display: flex;
  width: 720px;
  max-width: calc(100vw - 32px);
  max-height: min(82vh, 780px);
  padding: 20px 24px;
  flex-direction: column;
  align-items: flex-start;
  gap: 14px;
  border-radius: 6px;
  background: rgba(3, 6, 10, 0.65);
  border: 1px solid #30363b;
  backdrop-filter: blur(0.375rem);
  box-sizing: border-box;
}

.lockdown-assign__title {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--Grey-palette-White, #4965c9);
  font-feature-settings:
    "liga" off,
    "clig" off;
  font-family: "Segoe UI";
  font-size: 20px;
  font-style: normal;
  font-weight: 600;
  line-height: 28px;
}

.lockdown-assign__title-icon {
  font-size: 22px;
  line-height: 1;
  color: #4965c9;
  flex-shrink: 0;
}

.lockdown-assign__body {
  width: 100%;
  min-height: 80px;
  max-height: 520px;
  overflow-x: hidden;
  overflow-y: auto;
  padding-right: 6px;
  margin: 20px 0;
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, 0.22) transparent;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
    margin: 4px 0;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.22);
    border-radius: 999px;
  }

  &::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.38);
  }

  :deep(.el-loading-mask) {
    background: rgba(3, 6, 10, 0.45);
  }
}

.lockdown-assign__empty {
  margin: 12px 0;
  font-family: "Segoe UI";
  font-size: 14px;
  line-height: 20px;
  color: rgba(255, 255, 255, 0.72);
}

.lockdown-assign__toolbar {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-bottom: 8px;
}

.lockdown-assign__tool-btn {
  padding: 0 4px;
  border: 0;
  background: transparent;
  color: #7f97e6;
  font-family: "Segoe UI";
  font-size: 13px;
  line-height: 20px;
  cursor: pointer;

  &:hover:not(:disabled) {
    color: #4965c9;
  }

  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }
}

.lockdown-assign__list {
  width: 100%;
  margin: 0;
  padding: 0;
  list-style: none;
}

.lockdown-assign__row {
  display: grid;
  grid-template-columns: 28px minmax(0, 1fr) minmax(0, 1fr);
  column-gap: 16px;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  cursor: pointer;

  &:last-child {
    border-bottom: none;
    padding-bottom: 0;
  }

  &:first-child {
    padding-top: 0;
  }

  &:hover:not(.is-disabled) .lockdown-assign__check {
    color: #7f97e6;
  }

  &.is-disabled {
    cursor: not-allowed;
    opacity: 0.55;
  }
}

.lockdown-assign__check {
  width: 28px;
  height: 28px;
  color: rgba(255, 255, 255, 0.45);
  font-size: 20px;
  line-height: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;

  &.is-checked {
    color: #4965c9;
  }
}

.lockdown-assign__point,
.lockdown-assign__drone {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-family: "Segoe UI";
  font-size: 14px;
  line-height: 20px;
}

.lockdown-assign__point {
  color: #fff;
  font-weight: 600;
}

.lockdown-assign__drone {
  color: rgba(255, 255, 255, 0.85);
  text-align: right;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
}

.lockdown-assign__status {
  flex-shrink: 0;
  font-size: 12px;
  font-weight: 400;
  color: rgba(255, 255, 255, 0.5);
}

.lockdown-assign__row.is-locked {
  cursor: not-allowed;
  opacity: 0.45;
}

.lockdown-assign__actions {
  width: 100%;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.lockdown-assign__btn {
  border-radius: 999px;
  color: #fff;
  font-family: "Segoe UI";
  font-size: 16px;
  font-style: normal;
  font-weight: 400;
  line-height: 1.2;
  padding: 6px 20px;
  cursor: pointer;
  border: 0;
  background: transparent;

  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }
}

.lockdown-assign__btn--cancel {
  border: 1px solid #4965c9;
  background: transparent;
}

.lockdown-assign__btn--confirm {
  background: #ff4d4f;
}

.lockdown-assign-fade-enter-active,
.lockdown-assign-fade-leave-active {
  transition: opacity 0.18s ease;
}

.lockdown-assign-fade-enter-from,
.lockdown-assign-fade-leave-to {
  opacity: 0;
}
</style>
