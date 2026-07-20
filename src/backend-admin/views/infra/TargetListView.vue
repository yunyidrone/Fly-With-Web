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
      <el-table v-loading="loading" :data="records" stripe>
        <el-table-column prop="id" label="设备ID" min-width="120" show-overflow-tooltip />
        <el-table-column prop="name" label="目标设备名称" min-width="160" show-overflow-tooltip>
          <template #default="{ row }">
            <span class="text-primary">{{ row.name }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="sn" label="SN号" min-width="180" show-overflow-tooltip />
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
          :page-sizes="[5, 10, 20, 50]"
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
import { useRouter } from "vue-router";
import { Refresh } from "@element-plus/icons-vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { deleteTarget, fetchTargetPage } from "@backend/api/target.js";
import { fetchOrgTree } from "@backend/api/org.js";
import { useTableQuery } from "@backend/composables/useTableQuery.js";
import { INFRA_BASE } from "@backend/router/routes.js";
import { useAuthStore } from "@backend/stores/auth.js";

const router = useRouter();
const authStore = useAuthStore();

const orgOptions = ref([]);
const selectedOrgId = ref(null);

const { loading, records, total, query, load, onPageChange, onSizeChange } = useTableQuery(
  fetchTargetPage,
  { pageSize: 5, orgId: "" },
);

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

function handleOrgChange(orgId) {
  selectedOrgId.value = orgId;
  if (authStore.isSuperAdmin) {
    authStore.setCurrentOrgId(orgId);
  }
  syncOrgQuery();
  query.current = 1;
  load();
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
  await ElMessageBox.confirm(`确定删除目标设备「${row.name}」吗？`, "删除确认", {
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
      load();
    }
  },
);

onMounted(async () => {
  await loadOrgOptions();
  syncOrgQuery();
  await load();
});
</script>

<style scoped lang="scss">
@import "./infra-page.scss";

.infra-page__section--org {
  padding: 12px 16px;
}

.infra-page__org-select {
  width: 220px;
}

.text-primary {
  color: var(--el-color-primary);
}
</style>
