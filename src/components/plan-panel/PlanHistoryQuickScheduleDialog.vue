<template>
  <Teleport to="body">
    <div v-if="visible" class="history-quick-overlay" role="presentation" @click.self="onCancel">
      <div class="history-quick-dialog" role="dialog" aria-modal="true" aria-labelledby="history-quick-title">
        <header class="history-quick-dialog__head">
          <h3 id="history-quick-title" class="history-quick-dialog__title">快捷创建 · 选择时间</h3>
          <button type="button" class="history-quick-dialog__close" aria-label="关闭" @click="onCancel">
            <i class="ri-close-line" />
          </button>
        </header>
        <p class="history-quick-dialog__hint">
          重点安保需重新选择实行日期与时间段，确认后将基于该记录创建新计划。
        </p>
        <p v-if="recordSubject" class="history-quick-dialog__subject">{{ recordSubject }}</p>
        <div class="history-quick-dialog__fields">
          <label class="history-quick-field">
            <span class="history-quick-field__label">实行日期</span>
            <el-date-picker
              v-model="form.executeDate"
              class="history-quick-field__picker"
              type="date"
              placeholder="请选择日期"
              value-format="YYYY-MM-DD"
              format="YYYY-MM-DD"
              :clearable="false"
              teleported
              popper-class="plan-editor-picker-popper"
            />
          </label>
          <label class="history-quick-field">
            <span class="history-quick-field__label">开始时间</span>
            <el-time-picker
              v-model="form.timeStart"
              class="history-quick-field__picker"
              format="HH:mm"
              value-format="HH:mm"
              placeholder="请选择开始时间"
              teleported
              popper-class="plan-editor-picker-popper"
            />
          </label>
          <label class="history-quick-field">
            <span class="history-quick-field__label">结束时间</span>
            <el-time-picker
              v-model="form.timeEnd"
              class="history-quick-field__picker"
              format="HH:mm"
              value-format="HH:mm"
              placeholder="请选择结束时间"
              teleported
              popper-class="plan-editor-picker-popper"
            />
          </label>
        </div>
        <footer class="history-quick-dialog__foot">
          <button type="button" class="history-quick-btn history-quick-btn--ghost" @click="onCancel">
            取消
          </button>
          <button type="button" class="history-quick-btn history-quick-btn--primary" @click="onConfirm">
            确认创建
          </button>
        </footer>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { reactive, watch } from "vue";
import { ElMessage } from "element-plus";
import { validateSecurityQuickCreateSchedule } from "@/utils/plan-history-quick-create.js";

const visible = defineModel("visible", { type: Boolean, default: false });

const props = defineProps({
  recordSubject: { type: String, default: "" },
});

const emit = defineEmits(["confirm", "cancel"]);

const form = reactive({
  executeDate: "",
  timeStart: "",
  timeEnd: "",
});

function resetForm() {
  form.executeDate = "";
  form.timeStart = "";
  form.timeEnd = "";
}

watch(visible, (v) => {
  if (v) resetForm();
});

function onCancel() {
  visible.value = false;
  emit("cancel");
}

function onConfirm() {
  const err = validateSecurityQuickCreateSchedule(form);
  if (err) {
    ElMessage.warning(err);
    return;
  }
  emit("confirm", {
    executeDate: form.executeDate,
    timeStart: form.timeStart,
    timeEnd: form.timeEnd,
  });
  visible.value = false;
}
</script>

<style lang="scss" scoped>
.history-quick-overlay {
  position: fixed;
  inset: 0;
  z-index: 3500;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px 16px;
  background: rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(4px);
}

.history-quick-dialog {
  width: min(420px, 100%);
  border-radius: 8px;
  border: 1px solid #30363b;
  background: #1c222a;
  color: #fff;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.45);
}

.history-quick-dialog__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px 10px;
  border-bottom: 1px solid #30363b;
}

.history-quick-dialog__title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.history-quick-dialog__close {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: rgba(255, 255, 255, 0.7);
  font-size: 20px;
  cursor: pointer;

  &:hover {
    background: rgba(255, 255, 255, 0.08);
    color: #fff;
  }
}

.history-quick-dialog__hint {
  margin: 0;
  padding: 12px 16px 0;
  font-size: 13px;
  line-height: 1.5;
  color: rgba(255, 255, 255, 0.65);
}

.history-quick-dialog__subject {
  margin: 8px 16px 0;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.88);
}

.history-quick-dialog__fields {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
}

.history-quick-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.history-quick-field__label {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.65);
}

.history-quick-field__picker {
  width: 100%;
}

.history-quick-dialog__foot {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 12px 16px 16px;
  border-top: 1px solid #30363b;
}

.history-quick-btn {
  min-width: 88px;
  height: 36px;
  padding: 0 16px;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;

  &--ghost {
    border: 1px solid rgba(255, 255, 255, 0.2);
    background: transparent;
    color: #fff;

    &:hover {
      border-color: rgba(255, 255, 255, 0.35);
    }
  }

  &--primary {
    border: none;
    background: #4965c9;
    color: #fff;

    &:hover {
      background: #5a74d0;
    }
  }
}

:deep(.history-quick-field__picker .el-input__wrapper) {
  height: 40px;
  background: #03060a;
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.12) inset;
}

:deep(.history-quick-field__picker .el-input__inner) {
  color: #fff;
}
</style>
