<template>
  <template v-for="node in nodes" :key="node.id">
    <el-sub-menu v-if="hasMenuChildren(node)" :index="String(node.id)">
      <template #title>
        <el-icon v-if="resolveMenuIcon(node.icon)">
          <component :is="resolveMenuIcon(node.icon)" />
        </el-icon>
        <span>{{ node.menuName }}</span>
      </template>
      <AdminMenuTree :nodes="node.children" :title-route-path-map="titleRoutePathMap" />
    </el-sub-menu>

    <el-menu-item v-else :index="resolveMenuPath(node, titleRoutePathMap)">
      <el-icon v-if="resolveMenuIcon(node.icon)">
        <component :is="resolveMenuIcon(node.icon)" />
      </el-icon>
      <template #title>{{ node.menuName }}</template>
    </el-menu-item>
  </template>
</template>

<script setup>
import {
  hasMenuChildren,
  resolveMenuIcon,
  resolveMenuPath,
} from "@backend/utils/menu.js";

defineOptions({ name: "AdminMenuTree" });

defineProps({
  /** @type {import('vue').PropType<import('@/api/auth.js').BackendMenuNode[]>} */
  nodes: {
    type: Array,
    default: () => [],
  },
  /** @type {import('vue').PropType<Map<string, string>>} */
  titleRoutePathMap: {
    type: Object,
    default: () => new Map(),
  },
});
</script>
