<template>
  <el-select
    v-if="authStore.isSuperAdmin"
    :model-value="authStore.currentOrgId"
    placeholder="全部单位"
    style="width: 180px"
    @change="onChange"
  >
    <el-option label="全部单位" value="all" />
    <el-option
      v-for="org in orgOptions"
      :key="org.id"
      :label="org.name"
      :value="org.id"
    />
  </el-select>
</template>

<script setup>
import { fetchOrgTree } from "@backend/api/org.js";
import { flattenOrgTree } from "@backend/utils/org-set.js";
import { DEFAULT_REGION } from "@backend/config/constants.js";
import { useAuthStore } from "@/stores/auth.js";

const authStore = useAuthStore();
const orgOptions = ref([]);

async function loadOrgs() {
  if (!authStore.isSuperAdmin) return;
  const tree = (await fetchOrgTree(DEFAULT_REGION)) || [];
  orgOptions.value = flattenOrgTree(tree);
}

function onChange(value) {
  authStore.setCurrentOrgId(value);
}

onMounted(loadOrgs);
</script>
