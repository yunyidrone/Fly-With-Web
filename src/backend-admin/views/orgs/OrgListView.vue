<template>
  <div class="org-list">
    <div class="org-list__section org-list__section--actions">
      <div class="org-list__actions">
        <OrgSetCascader
          v-model="region"
          :options="orgSetCascaderOptions"
          :loading="orgSetLoading"
          select-class="org-list__region"
          @change="handleRegionChange"
        />
        <div class="org-list__action-btns">
          <el-button type="primary" plain @click="goCreate">新建单位</el-button>
          <el-button @click="openTreeDrawer">单位树查看</el-button>
        </div>
      </div>
    </div>

    <div class="org-list__section org-list__section--title">
      <div class="org-list__header">
        <div class="org-list__title">单位管理</div>
        <el-button class="org-list__refresh-btn" :disabled="loading" @click="load">
          <el-icon :size="16" :class="{ 'org-list__refresh-icon--spinning': loading }">
            <Refresh />
          </el-icon>
        </el-button>
      </div>
    </div>

    <div class="org-list__section org-list__section--content">
      <el-table v-loading="loading" :data="records" stripe>
        <el-table-column prop="id" label="单位ID"/>
        <el-table-column label="所属单位集合">
          <template #default>
            {{ selectedOrgSetLabel }}
          </template>
        </el-table-column>
        <el-table-column prop="name" label="单位名称">
          <template #default="{ row }">
            <span class="text-primary">{{ row.name }}</span>
          </template>
        </el-table-column>
        <el-table-column label="单位性质" width="120">
          <template #default="{ row }">
            <el-tag type="warning" size="small">
              {{ getOrgLabelText(row.orgLabel) || "-" }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="90">
          <template #default="{ row }">
            <el-switch
              :model-value="row.status === 0"
              @change="(enabled) => handleStatusChange(row, enabled)"
            />
          </template>
        </el-table-column>
        <el-table-column label="所属账户数" min-width="110">
          <template #default="{ row }">
            <span class="text-primary">{{ row.accountCount ?? 0 }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="goEdit(row.id)">编辑</el-button>
            <!-- <el-button link type="warning" @click="toggleStatus(row)">
              {{ row.status === 0 ? "停用" : "启用" }}
            </el-button> -->
            <el-button link type="danger" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="org-list__pagination">
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

    <el-drawer v-model="treeDrawerVisible" title="单位树" direction="rtl" size="360px">
      <el-tree
        v-loading="treeLoading"
        :data="treeData"
        :props="{ label: 'name', children: 'children' }"
        default-expand-all
      >
        <template #default="{ data }">
          <OrgTreeNodeLabel :data="data" />
        </template>
      </el-tree>
    </el-drawer>
  </div>
</template>

<script setup>
import { useRouter } from "vue-router";
import { Refresh } from "@element-plus/icons-vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { deleteOrg, fetchOrgPage, fetchOrgTree, updateOrg } from "@backend/api/org.js";
import { useOrgSetOptions } from "@backend/composables/useOrgSetOptions.js";
import OrgSetCascader from "@backend/components/OrgSetCascader.vue";
import OrgTreeNodeLabel from "@backend/components/OrgTreeNodeLabel.vue";
import { useTableQuery } from "@backend/composables/useTableQuery.js";
import { findOrgInTree, getOrgLabelText } from "@backend/utils/org-set.js";
import { BACKEND_BASE } from "@backend/router/routes.js";
import { DEFAULT_REGION } from "@backend/config/constants.js";

const router = useRouter();
const { loading: orgSetLoading, orgSetCascaderOptions, loadOrgSetOptions, syncRegionValue } =
  useOrgSetOptions();
const region = ref(DEFAULT_REGION);

const selectedOrgSetLabel = computed(() => {
  const node = findOrgInTree(orgSetCascaderOptions.value, region.value);
  return node?.name || String(region.value || "-");
});

function fetchOrgList(params) {
  return fetchOrgPage({
    ...params,
    id: region.value,
  });
}

const { loading, records, total, query, load, onPageChange, onSizeChange } = useTableQuery(
  fetchOrgList,
  { pageSize: 10, isAsc: true },
);

const treeDrawerVisible = ref(false);
const treeLoading = ref(false);
const treeData = ref([]);

function goCreate() {
  router.push(`${BACKEND_BASE}/orgs/new`);
}

function goEdit(id) {
  router.push(`${BACKEND_BASE}/orgs/${id}`);
}

async function changeStatus(row, nextStatus) {
  const action = nextStatus === 0 ? "启用" : "停用";
  await ElMessageBox.confirm(`确定${action}「${row.name}」吗？`, "状态变更", { type: "warning" });
  await updateOrg({ id: row.id, status: nextStatus });
  ElMessage.success(`${action}成功`);
  await load();
}

async function handleStatusChange(row, enabled) {
  const nextStatus = enabled ? 0 : 1;
  if (nextStatus === row.status) return;
  try {
    await changeStatus(row, nextStatus);
  } catch {
    // 取消确认时保持原状态
  }
}

async function toggleStatus(row) {
  const nextStatus = row.status === 0 ? 1 : 0;
  try {
    await changeStatus(row, nextStatus);
  } catch {
    // 取消确认
  }
}

async function handleDelete(row) {
  await ElMessageBox.confirm(
    "删除此单位会删除所有它的子账户、相关配置等，此操作不可恢复，请谨慎操作!",
    `确定删除「${row.name}」吗？`,
    {
      type: "warning",
      confirmButtonText: "删除",
      cancelButtonText: "取消",
      confirmButtonType: "danger",
    },
  );
  await deleteOrg({ id: row.id });
  ElMessage.success("删除成功");
  await load();
}

function handleRegionChange() {
  query.current = 1;
  load();
}

async function openTreeDrawer() {
  treeDrawerVisible.value = true;
  treeLoading.value = true;
  try {
    treeData.value = (await fetchOrgTree(region.value)) || [];
  } finally {
    treeLoading.value = false;
  }
}

onMounted(async () => {
  await loadOrgSetOptions();
  syncRegionValue(region);
  await load();
});
</script>

<style scoped lang="scss">
.org-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.org-list__section {
  background: #fff;
  border: 1px solid #ebeef5;
  border-radius: 4px;
}

.org-list__section--actions {
  padding: 12px 16px;
}

.org-list__section--title {
  padding: 14px 16px;
}

.org-list__section--content {
  padding: 20px 16px 24px;
}

.org-list__actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.org-list__region {
  width: 280px;
}

.org-list__action-btns {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.org-list__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.org-list__title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.org-list__refresh-btn {
  width: 36px;
  height: 36px;
  padding: 0;
  color: #606266;
  border-color: #dcdfe6;

  .el-icon {
    margin: 0;
  }
}

.org-list__refresh-icon--spinning {
  animation: org-list-refresh-spin 0.8s linear infinite;
}

@keyframes org-list-refresh-spin {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}

.text-primary {
  color: var(--el-color-primary);
}

.org-list__pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
