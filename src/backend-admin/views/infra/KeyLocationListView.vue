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
        <div class="infra-page__title">重点地点管理</div>

        <div class="infra-page__actions">
          <el-button class="infra-page__create-btn" @click="handleCreate">
            新建地点
          </el-button>

          <el-button
            class="infra-page__refresh-btn"
            :disabled="loading"
            @click="load"
          >
            <el-icon
              :size="16"
              :class="{ 'infra-page__refresh-icon--spinning': loading }"
            >
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
          placeholder="计划类型"
          @change="search"
        >
          <el-option
            v-for="item in planTypeOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
        <el-select
          v-model="query.placeType"
          class="infra-page__filter-item infra-page__filter-item--place-type"
          placeholder="地点类型"
          clearable
          @change="search"
          @clear="search"
        >
          <el-option
            v-for="item in placeTypeOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
        <el-input
          v-model="query.name"
          class="infra-page__filter-item infra-page__filter-item--name"
          placeholder="地点名称"
          clearable
          @keyup.enter="search"
          @clear="search"
        />
        <el-button type="primary" @click="search">查询</el-button>
        <el-button @click="resetFilters">重置</el-button>
      </div>

      <el-table v-loading="loading" :data="records" stripe>
        <el-table-column type="index" label="序号" width="70" />

        <el-table-column label="计划类型" width="110">
          <template #default="{ row }">
            <el-tag size="small" effect="light">{{ row.typeLabel }}</el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="category" label="地点类型" width="100">
          <template #default="{ row }">
            <el-tag size="small" effect="plain">{{ row.category }}</el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="name" label="地点名称" min-width="160">
          <template #default="{ row }">
            <span class="text-primary">{{ row.name }}</span>
          </template>
        </el-table-column>

        <el-table-column
          prop="orgName"
          label="所属单位"
          min-width="140"
          show-overflow-tooltip
        >
          <template #default="{ row }">
            {{ row.orgName || "-" }}
          </template>
        </el-table-column>

        <el-table-column prop="coord" label="经纬度/半径" min-width="180">
          <template #default="{ row }">
            <span class="infra-page__coord">({{ row.coord }})</span>
          </template>
        </el-table-column>

        <el-table-column
          prop="description"
          label="描述"
          min-width="160"
          show-overflow-tooltip
        >
          <template #default="{ row }">
            {{ row.description || "-" }}
          </template>
        </el-table-column>

        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{ row }">
            <el-button
              link
              type="primary"
              @click="handleEdit(row)"
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

import { useRouter } from "vue-router";

import { Refresh } from "@element-plus/icons-vue";

import { ElMessage, ElMessageBox } from "element-plus";

import { deleteKeyLocation, fetchKeyLocationPage } from "@backend/api/place.js";

import OrgCascader from "@backend/components/OrgCascader.vue";

import { useOrgCascader } from "@backend/composables/useOrgCascader.js";

import { useTableQuery } from "@backend/composables/useTableQuery.js";

import {
  PLAN_TYPE,
  PLAN_TYPE_OPTIONS,
  PLACE_TYPE_OPTIONS,
} from "@backend/config/constants.js";

import { INFRA_BASE } from "@backend/router/routes.js";

import { resolveOrgContextFromTree } from "@backend/utils/org-set.js";

import { useAuthStore } from "@/stores/auth.js";

const router = useRouter();

const authStore = useAuthStore();

const planTypeOptions = PLAN_TYPE_OPTIONS;
const placeTypeOptions = PLACE_TYPE_OPTIONS;

const {
  orgSetId,

  orgTreeOptions,

  selectedOrgId,

  loading: orgCascaderLoading,

  initOrgCascader,

  syncSelectedOrgId,
} = useOrgCascader({ autoSelectFirst: false });

const {
  loading,
  records,
  total,
  query,
  load,
  search,
  reset,
  onPageChange,
  onSizeChange,
} = useTableQuery(fetchKeyLocationPage, {
  pageSize: 10,
  orgId: null,
  type: PLAN_TYPE.MOUNTAIN,
  placeType: "",
  name: "",
});

async function loadOrgOptions() {
  await initOrgCascader(authStore);
}

function syncOrgQuery() {
  query.orgId =
    selectedOrgId.value != null && selectedOrgId.value !== ""
      ? selectedOrgId.value
      : null;
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
    type: query.type,
    placeType: "",
    name: "",
  });
}

function handleCreate() {
  const routeQuery = { type: String(query.type) };

  const orgId = selectedOrgId.value;

  if (orgId != null && orgId !== "") {
    const ctx = resolveOrgContextFromTree(
      orgTreeOptions.value,
      orgId,
      orgSetId.value,
    );

    routeQuery.orgId = orgId;

    if (ctx?.rootOrgId != null) {
      routeQuery.rootOrgId = ctx.rootOrgId;
    }
  }

  router.push({
    path: `${INFRA_BASE}/locations/new`,

    query: routeQuery,
  });
}

function handleEdit(row) {
  router.push(`${INFRA_BASE}/locations/${row.id}`);
}

async function handleDelete(row) {
  await ElMessageBox.confirm(`确定删除地点「${row.name}」吗？`, "删除确认", {
    type: "warning",

    confirmButtonText: "删除",

    cancelButtonText: "取消",
  });

  await deleteKeyLocation({ id: row.id });

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

.infra-page__filter-item--type,
.infra-page__filter-item--place-type {
  width: 180px;
}

.infra-page__filter-item--name {
  width: 200px;
}

.text-primary {
  color: var(--el-color-primary);
}
</style>
