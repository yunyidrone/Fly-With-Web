<template>
  <span class="org-tree-node">
    <el-tag
      v-if="labelText"
      size="small"
      type="primary"
      effect="plain"
      class="org-tree-node__tag"
    >
      {{ labelText }}
    </el-tag>
    <span class="org-tree-node__name">{{ data.name }}</span>
  </span>
</template>

<script setup>
import { computed } from "vue";
import { getOrgTreeNodeLabelText } from "@backend/utils/org-set.js";

const props = defineProps({
  data: {
    type: Object,
    required: true,
  },
});

const labelText = computed(() => getOrgTreeNodeLabelText(props.data));
</script>

<style scoped lang="scss">
.org-tree-node {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}

.org-tree-node__tag {
  flex-shrink: 0;
}

.org-tree-node__name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
