<template>
  <div class="infra-page">
    <div class="infra-page__section infra-page__section--org">
      <el-select
        v-model="selectedOrgId"
        class="infra-page__org-select"
        placeholder="请选择单位"
        :disabled="!authStore.isSuperAdmin && orgOptions.length <= 1"
        @change="handleOrgChange"
      >
        <el-option
          v-for="org in orgOptions"
          :key="org.id"
          :label="org.name"
          :value="org.id"
        />
      </el-select>
    </div>

    <div class="infra-page__section infra-page__section--title">
      <div class="infra-page__header">
        <div class="infra-page__title">目标设备管理</div>
        <div class="infra-page__actions">
          <el-button
            v-permission="['super_admin', 'org_admin']"
            class="infra-page__create-btn"
            @click="goCreate"
          >
            新建目标设备
          </el-button>
          <el-button class="infra-page__refresh-btn" :loading="loading" @click="load">
            <el-icon :size="16"><Refresh /></el-icon>
          </el-button>
        </div>
      </div>
    </div>

    <div class="infra-page__section infra-page__section--content">
      <div class="infra-page__filters">
        <el-select
          v-model="query.type"
          class="infra-page__filter-item infra-page__filter-item--type"
          placeholder="全部类型"
          clearable
          @change="search"
          @clear="search"
        >
          <el-option
            v-for="item in targetTypeOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
        <el-input
          v-model="query.name"
          class="infra-page__filter-item infra-page__filter-item--name"
          placeholder="目标设备名称"
          clearable
          @keyup.enter="search"
          @clear="search"
        />
        <el-input
          v-model="query.sn"
          class="infra-page__filter-item infra-page__filter-item--sn"
          placeholder="SN�?
          clearable
          @keyup.enter="search"
          @clear="search"
        />
        <el-button type="primary" @click="search">查询</el-button>
        <el-button @click="resetFilters">重置</el-button>
      </div>

      <el-table v-loading="loading" :data="records" stripe>
        <el-table-column prop="id" label="设备ID" min-width="120" show-overflow-tooltip />
        <el-table-column prop="name" label="目标设备名称" min-width="160" show-overflow-tooltip>
          <template #default="{ row }">
            <span class="text-primary">{{ row.name }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="sn" label="SN�? min-width="180" show-overflow-tooltip />
        <el-table-column label="类型" width="150">
          <template #default="{ row }">
            <el-tag size="small" effect="light">{{ row.typeLabel }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="orgName" label="关联单位" min-width="140" show-overflow-tooltip>
          <template #default="{ row }">
            {{ row.orgName || "-" }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{ row }">
            <el-button
              v-permission="['super_admin', 'org_admin']"
              link
              type="primary"
              @click="goEdit(row.id)"
            >
              编辑
            </el-button>
            <el-button
              v-permission="['super_admin', 'org_admin']"
              link
              type="danger"
              @click="handleDelete(row)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="infra-page__pagination">
        <el-pagination
          :current-page="query.current"
          :page-size="query.pageSize"
          :total="total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          background
          @current-change="onPageChange"
          @size-change="onSizeChange"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { Refresh } from "@element-plus/icons-vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { deleteTarget, fetchTargetPage } from "@backend/api/target.js";
import { fetchOrgTree } from "@backend/api/org.js";
import { useTableQuery } from "@backend/composables/useTableQuery.js";
import { TARGET_TYPE_OPTIONS } from "@backend/config/constants.js";
import { INFRA_BASE } from "@backend/router/routes.js";
import { useAuthStore } from "@/stores/auth.js";

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();
const targetTypeOptions = TARGET_TYPE_OPTIONS;

const orgOptions = ref([]);
const selectedOrgId = ref(null);

const { loading, records, total, query, load, search, reset, onPageChange, onSizeChange } =
  useTableQuery(fetchTargetPage, { pageSize: 10, orgId: "", name: "", sn: "", type: "" });

function flattenOrgTree(nodes, result = []) {
  for (const node of nodes || []) {
    if (node.id != null) result.push({ id: node.id, name: node.name });
    if (node.children?.length) flattenOrgTree(node.children, result);
  }
  return result;
}

async function loadOrgOptions() {
  try {
    const tree = (await fetchOrgTree()) || [];
    const flat = flattenOrgTree(tree);
    orgOptions.value = flat.length ? flat : [{ id: 1, name: "派出所1" }];
  } catch {
    orgOptions.value = [{ id: 1, name: "派出所1" }];
  }

  if (!authStore.isSuperAdmin && authStore.orgId != null) {
    selectedOrgId.value = authStore.orgId;
    if (!orgOptions.value.some((item) => String(item.id) === String(authStore.orgId))) {
      orgOptions.value.unshift({
        id: authStore.orgId,
        name: authStore.user?.orgName || "当前单位",
      });
    }
    return;
  }

  if (selectedOrgId.value == null) {
    selectedOrgId.value = orgOptions.value[0]?.id ?? null;
  }
}

function syncOrgQuery() {
  query.orgId = selectedOrgId.value != null ? selectedOrgId.value : "";
}

function applyRouteQuery() {
  const typeRaw = route.query.type;
  if (typeRaw != null && typeRaw !== "") {
    const typeNum = Number(typeRaw);
    query.type = Number.isFinite(typeNum) && typeNum > 0 ? typeNum : "";
  }

  const orgIdRaw = route.query.orgId;
  if (orgIdRaw != null && orgIdRaw !== "") {
    selectedOrgId.value = orgIdRaw;
    if (authStore.isSuperAdmin) {
      authStore.setCurrentOrgId(orgIdRaw);
    }
  }
}

function handleOrgChange(orgId) {
  selectedOrgId.value = orgId;
  if (authStore.isSuperAdmin) {
    authStore.setCurrentOrgId(orgId);
  }
  syncOrgQuery();
  search();
}

function resetFilters() {
  reset({
    pageSize: query.pageSize,
    orgId: query.orgId,
    name: "",
    sn: "",
    type: "",
  });
}

function goCreate() {
  router.push({
    path: `${INFRA_BASE}/targets/new`,
    query: {
      orgId: selectedOrgId.value ?? undefined,
    },
  });
}

function goEdit(id) {
  router.push(`${INFRA_BASE}/targets/${id}`);
}

async function handleDelete(row) {
  await ElMessageBox.confirm(`确定删除目标设备�?{row.name}」吗？`, "删除确认", {
    type: "warning",
    confirmButtonText: "删除",
    cancelButtonText: "取消",
  });

  await deleteTarget({ id: row.id });
  ElMessage.success("删除成功");
  await load();
}

watch(
  () => authStore.currentOrgId,
  (value) => {
    if (!authStore.isSuperAdmin || value === "all") return;
    if (String(selectedOrgId.value) !== String(value)) {
      selectedOrgId.value = value;
      syncOrgQuery();
      search();
    }
  },
);

onMounted(async () => {
  await loadOrgOptions();
  applyRouteQuery();
  syncOrgQuery();
  await load();
});
</script>

<style scoped lang="scss">
@use "./infra-page.scss";

.infra-page__section--org {
  padding: 12px 16px;
}

.infra-page__org-select {
  width: 220px;

  :deep(.el-select__wrapper) {
    min-height: 36px;
    height: 36px;
    box-sizing: border-box;
  }
}

.infra-page__filter-item--type {
  width: 180px;
}

.infra-page__filter-item--name,
.infra-page__filter-item--sn {
  width: 200px;
}

.text-primary {
  color: var(--el-color-primary);
}
</style>
