<template>
  <template v-for="node in nodes" :key="node.id">
    <el-sub-menu v-if="hasMenuChildren(node)" :index="String(node.id)">
      <template #title>
        <el-icon v-if="getMenuIcon(node)">
          <component :is="getMenuIcon(node)" />
        </el-icon>
        <span>{{ node.menuName }}</span>
      </template>
      <AdminMenuTree
        :nodes="node.children"
        :title-route-path-map="titleRoutePathMap"
        :top-level="false"
      />
    </el-sub-menu>

    <el-menu-item v-else :index="resolveMenuPath(node, titleRoutePathMap)">
      <el-icon v-if="getMenuIcon(node)">
        <component :is="getMenuIcon(node)" />
      </el-icon>
      <template #title>{{ node.menuName }}</template>
    </el-menu-item>
  </template>
</template>

<script setup>
import {
  hasMenuChildren,
  resolveMenuPath,
  resolveSidebarMenuIcon,
} from "@backend/utils/menu.js";

defineOptions({ name: "AdminMenuTree" });

const props = defineProps({
  /** @type {import('vue').PropType<import('@backend/api/menu.js').BackendMenuNode[]>} */
  nodes: {
    type: Array,
    default: () => [],
  },
  /** @type {import('vue').PropType<Map<string, string>>} */
  titleRoutePathMap: {
    type: Object,
    default: () => new Map(),
  },
  topLevel: {
    type: Boolean,
    default: true,
  },
});

/** @param {import('@backend/api/menu.js').BackendMenuNode} node */
function getMenuIcon(node) {
  return resolveSidebarMenuIcon(node, { topLevel: props.topLevel });
}
</script>
