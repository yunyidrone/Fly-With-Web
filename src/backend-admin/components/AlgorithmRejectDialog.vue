<template>
  <el-dialog
    :model-value="visible"
    title="拒绝原因"
    width="520px"
    destroy-on-close
    class="algorithm-reject-dialog"
    @close="handleClose"
  >
    <div class="algorithm-reject-dialog__body">
      <div class="algorithm-reject-dialog__section">
        <div class="algorithm-reject-dialog__label">请选择原因：</div>
        <el-checkbox-group v-model="selectedPresets" class="algorithm-reject-dialog__presets">
          <el-checkbox
            v-for="item in presetOptions"
            :key="item"
            :label="item"
          >
            {{ item }}
          </el-checkbox>
        </el-checkbox-group>
      </div>

      <div class="algorithm-reject-dialog__section">
        <div class="algorithm-reject-dialog__label">或输入原因：</div>
        <el-input
          v-model="customReason"
          type="textarea"
          :rows="4"
          resize="none"
          placeholder="请输入拒绝原因"
        />
      </div>
    </div>

    <template #footer>
      <div class="algorithm-reject-dialog__footer">
        <el-button type="primary" @click="handleConfirm">确认</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, watch } from "vue";
import { ElMessage } from "element-plus";
import { ALGORITHM_REJECT_REASON_PRESETS } from "@backend/config/algorithm-apply.js";

const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["update:visible", "confirm"]);

const presetOptions = ALGORITHM_REJECT_REASON_PRESETS;
const selectedPresets = ref([]);
const customReason = ref("");

watch(
  () => props.visible,
  (value) => {
    if (!value) return;
    selectedPresets.value = [];
    customReason.value = "";
  },
);

function handleClose() {
  emit("update:visible", false);
}

function resolveReason() {
  const presetText = selectedPresets.value.join("；");
  const customText = String(customReason.value || "").trim();
  if (presetText && customText) return `${presetText}；${customText}`;
  return presetText || customText;
}

function handleConfirm() {
  const reason = resolveReason();
  if (!reason) {
    ElMessage.warning("请选择或输入拒绝原因");
    return;
  }
  emit("confirm", reason);
  emit("update:visible", false);
}
</script>

<style scoped lang="scss">
.algorithm-reject-dialog__body {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.algorithm-reject-dialog__section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.algorithm-reject-dialog__label {
  font-size: 14px;
  color: #606266;
}

.algorithm-reject-dialog__presets {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 12px;
}

.algorithm-reject-dialog__footer {
  display: flex;
  justify-content: center;
}
</style>
