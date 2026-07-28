<template>
  <div class="infra-page">
    <div class="infra-page__section infra-page__section--org">
      <OrgCascader
        v-model="selectedOrgId"
        :options="orgTreeOptions"
        :loading="orgCascaderLoading"
        select-class="infra-page__org-select"
        @change="handleOrgChange"
      />
    </div>

    <div class="infra-page__section infra-page__section--title">
      <div class="infra-page__header">
        <div class="infra-page__title">目标设备管理</div>
        <div class="infra-page__actions">
          <el-button
            class="infra-page__create-btn"
            @click="goCreate"
          >
            新建目标设备
          </el-button>
          <el-button class="infra-page__refresh-btn" :disabled="loading" @click="load">
            <el-icon :size="16" :class="{ 'infra-page__refresh-icon--spinning': loading }">
              <Refresh />
            </el-icon>
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
          placeholder="SN号"
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
        <el-table-column prop="sn" label="SN" min-width="180" show-overflow-tooltip />
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
              link
              type="primary"
              @click="goEdit(row.id)"
            >
              编辑
            </el-button>
            <el-button
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
import { onMounted, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { Refresh } from "@element-plus/icons-vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { deleteTarget, fetchTargetPage } from "@backend/api/target.js";
import OrgCascader from "@backend/components/OrgCascader.vue";
import { useOrgCascader } from "@backend/composables/useOrgCascader.js";
import { useTableQuery } from "@backend/composables/useTableQuery.js";
import { TARGET_TYPE_OPTIONS } from "@backend/config/constants.js";
import { INFRA_BASE } from "@backend/router/routes.js";
import { resolveOrgContextFromTree } from "@backend/utils/org-set.js";
import { useAuthStore } from "@/stores/auth.js";

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();
const {
  orgSetId,
  orgTreeOptions,
  selectedOrgId,
  loading: orgCascaderLoading,
  cascaderDisabled,
  initOrgCascader,
  syncSelectedOrgId,
} = useOrgCascader({ autoSelectFirst: false, autoSelectUserOrg: false });
const targetTypeOptions = TARGET_TYPE_OPTIONS;

const { loading, records, total, query, load, search, reset, onPageChange, onSizeChange } =
  useTableQuery(fetchTargetPage, { pageSize: 10, orgId: null, name: "", sn: "", type: "" });

async function loadOrgOptions() {
  await initOrgCascader(authStore);
}

function syncOrgQuery() {
  query.orgId =
    selectedOrgId.value != null && selectedOrgId.value !== "" ? selectedOrgId.value : null;
}

function applyRouteQuery() {
  const typeRaw = route.query.type;
  if (typeRaw != null && typeRaw !== "") {
    const typeNum = Number(typeRaw);
    query.type = Number.isFinite(typeNum) && typeNum > 0 ? typeNum : "";
  }

  const orgIdRaw = route.query.orgId;
  if (orgIdRaw != null && orgIdRaw !== "") {
    syncSelectedOrgId(orgIdRaw);
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
  const orgId = selectedOrgId.value;
  const query = {};
  if (route.query.type != null && route.query.type !== "") {
    query.type = route.query.type;
  }
  if (orgId != null && orgId !== "") {
    const ctx = resolveOrgContextFromTree(orgTreeOptions.value, orgId, orgSetId.value);
    query.orgId = orgId;
    if (ctx?.rootOrgId != null) {
      query.rootOrgId = ctx.rootOrgId;
    }
  }
  router.push({
    path: `${INFRA_BASE}/targets/new`,
    query,
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
      syncSelectedOrgId(value);
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
  width: 280px;

  :deep(.el-input__wrapper) {
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
