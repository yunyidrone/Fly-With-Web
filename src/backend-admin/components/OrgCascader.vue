<template>
  <el-cascader
    :model-value="modelValue"
    :options="options"
    :props="ORG_CASCADER_PROPS"
    :placeholder="placeholder"
    :disabled="disabled"
    :loading="loading"
    filterable
    :class="['org-cascader', selectClass]"
    @update:model-value="onUpdate"
    @change="onChange"
  />
</template>

<script setup>
import { ORG_CASCADER_PROPS } from "@backend/utils/org-set.js";

defineProps({
  modelValue: {
    type: [String, Number],
    default: null,
  },
  options: {
    type: Array,
    default: () => [],
  },
  placeholder: {
    type: String,
    default: "请选择单位",
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  loading: {
    type: Boolean,
    default: false,
  },
  selectClass: {
    type: String,
    default: "",
  },
});

const emit = defineEmits(["update:modelValue", "change"]);

function onUpdate(value) {
  if (value == null || value === "") return;
  emit("update:modelValue", value);
}

function onChange(value) {
  if (value == null || value === "") return;
  emit("change", value);
}
</script>
