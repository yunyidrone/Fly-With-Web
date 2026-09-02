<template>
  <el-drawer
    :model-value="visible"
    :with-header="false"
    direction="rtl"
    size="520px"
    destroy-on-close
    class="algorithm-org-tree-drawer"
    @close="handleClose"
  >
    <div class="algorithm-org-tree-drawer__header">
      <el-button plain class="algorithm-org-tree-drawer__back-btn" @click="handleClose">
        <el-icon><ArrowLeft /></el-icon>
        返回
      </el-button>
      <div class="algorithm-org-tree-drawer__title">单位树-算法树</div>
    </div>

    <el-tree
      :data="treeData"
      :props="treeProps"
      node-key="id"
      default-expand-all
      class="algorithm-org-tree-drawer__tree"
    >
      <template #default="{ data }">
        <div class="algorithm-org-tree-drawer__node">
          <OrgTreeNodeLabel :data="data" />
          <div v-if="data.algorithms?.length" class="algorithm-org-tree-drawer__algorithms">
            <template v-for="(item, index) in data.algorithms" :key="`${data.id}-${item.type}`">
              <span v-if="index > 0" class="algorithm-org-tree-drawer__sep">、</span>
              <span class="algorithm-org-tree-drawer__algorithm">
                {{ getAlgorithmApplyTypeLabel(item.type) }}
                <span class="algorithm-org-tree-drawer__source">
                  【{{ getAlgorithmSourceLabel(item.source) }}】
                </span>
              </span>
            </template>
          </div>
        </div>
      </template>
    </el-tree>
  </el-drawer>
</template>

<script setup>
import { ArrowLeft } from "@element-plus/icons-vue";
import OrgTreeNodeLabel from "@backend/components/OrgTreeNodeLabel.vue";
import {
  getAlgorithmApplyTypeLabel,
  getAlgorithmSourceLabel,
} from "@backend/config/algorithm-apply.js";

defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
  treeData: {
    type: Array,
    default: () => [],
  },
});

const emit = defineEmits(["update:visible"]);

const treeProps = {
  label: "name",
  children: "children",
};

function handleClose() {
  emit("update:visible", false);
}
</script>

<style scoped lang="scss">
.algorithm-org-tree-drawer__header {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 16px;
}

.algorithm-org-tree-drawer__back-btn {
  align-self: flex-start;
  --el-button-text-color: #d87533;
  --el-button-border-color: #d87533;
  --el-button-hover-text-color: #d87533;
  --el-button-hover-border-color: #d87533;
  --el-button-hover-bg-color: #fdf6f0;
}

.algorithm-org-tree-drawer__title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.algorithm-org-tree-drawer__tree {
  :deep(.el-tree-node__content) {
    height: auto;
    min-height: 36px;
    align-items: flex-start;
    padding-top: 6px;
    padding-bottom: 6px;
  }
}

.algorithm-org-tree-drawer__node {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  min-width: 0;
  padding-right: 8px;
}

.algorithm-org-tree-drawer__algorithms {
  display: inline-flex;
  flex-wrap: wrap;
  align-items: center;
  min-width: 0;
  font-size: 14px;
  color: #303133;
}

.algorithm-org-tree-drawer__algorithm {
  white-space: nowrap;
}

.algorithm-org-tree-drawer__source {
  color: var(--el-color-primary);
}

.algorithm-org-tree-drawer__sep {
  color: #303133;
}
</style>
