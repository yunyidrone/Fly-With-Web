<template>
  <el-cascader
    :model-value="modelValue"
    :options="options"
    :props="ORG_CASCADER_PROPS"
    :placeholder="placeholder"
    :disabled="disabled"
    :loading="loading"
    clearable
    filterable
    :class="['org-cascader', selectClass]"
    @update:model-value="$emit('update:modelValue', $event)"
    @change="$emit('change', $event)"
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

defineEmits(["update:modelValue", "change"]);
</script>
