<template>
  <div class="org-list">
    <div class="org-list__section org-list__section--actions">
      <div class="org-list__actions">
        <el-select v-model="region" class="org-list__region" placeholder="选择单位集">
          <el-option
            v-for="item in parentUnitOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
        <div class="org-list__action-btns">
          <el-button type="primary" @click="goCreate">新建单位</el-button>
          <el-button @click="openTreeDrawer">单位树查看</el-button>
        </div>
      </div>
    </div>

    <div class="org-list__section org-list__section--title">
      <div class="org-list__title">单位管理</div>
    </div>

    <div class="org-list__section org-list__section--content">
      <el-table v-loading="loading" :data="records" stripe>
        <el-table-column prop="id" label="单位ID" width="90" />
        <el-table-column prop="parentPath" label="所属单位集合" min-width="180" />
        <el-table-column prop="name" label="单位名称" min-width="160">
          <template #default="{ row }">
            <span class="text-primary">{{ row.name }}</span>
          </template>
        </el-table-column>
        <el-table-column label="单位性质" width="120">
          <template #default="{ row }">
            <el-tag type="warning" size="small">
              {{ orgNatureLabels[row.nature] || row.nature || "-" }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="90">
          <template #default="{ row }">
            <el-switch
              :model-value="row.status === 1"
              @change="(enabled) => handleStatusChange(row, enabled)"
            />
          </template>
        </el-table-column>
        <el-table-column label="所属账户数" width="110">
          <template #default="{ row }">
            <span class="text-primary">{{ row.accountCount ?? 0 }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="goEdit(row.id)">编辑</el-button>
            <el-button link type="warning" @click="toggleStatus(row)">
              {{ row.status === 1 ? "停用" : "启用" }}
            </el-button>
            <el-button link type="danger" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="org-list__pagination">
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

    <el-drawer v-model="treeDrawerVisible" title="单位树" direction="rtl" size="360px">
      <el-tree
        v-loading="treeLoading"
        :data="treeData"
        :props="{ label: 'name', children: 'children' }"
        default-expand-all
      />
    </el-drawer>
  </div>
</template>

<script setup>
import { useRouter } from "vue-router";
import { ElMessage, ElMessageBox } from "element-plus";
import { deleteOrg, fetchOrgPage, fetchOrgTree, updateOrg } from "@backend/api/org.js";
import { useTableQuery } from "@backend/composables/useTableQuery.js";
import { BACKEND_BASE } from "@backend/router/routes.js";
import {
  DEFAULT_REGION,
  DEFAULT_REGION_LABEL,
  ORG_NATURE_LABELS,
} from "@backend/config/constants.js";

const router = useRouter();
const orgNatureLabels = ORG_NATURE_LABELS;
const parentUnitOptions = [{ label: DEFAULT_REGION_LABEL, value: DEFAULT_REGION }];
const region = ref(DEFAULT_REGION);

const { loading, records, total, query, load, onPageChange, onSizeChange } = useTableQuery(
  fetchOrgPage,
  { pageSize: 5 },
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
  const action = nextStatus === 1 ? "启用" : "停用";
  await ElMessageBox.confirm(`确定${action}「${row.name}」吗？`, "状态变更", { type: "warning" });
  await updateOrg({ id: row.id, status: nextStatus });
  ElMessage.success(`${action}成功`);
  await load();
}

async function handleStatusChange(row, enabled) {
  const nextStatus = enabled ? 1 : 0;
  if (nextStatus === row.status) return;
  try {
    await changeStatus(row, nextStatus);
  } catch {
    // 取消确认时保持原状态
  }
}

async function toggleStatus(row) {
  const nextStatus = row.status === 1 ? 0 : 1;
  try {
    await changeStatus(row, nextStatus);
  } catch {
    // 取消确认
  }
}

async function handleDelete(row) {
  await ElMessageBox.confirm(`确定删除「${row.name}」吗？`, "删除确认", {
    type: "warning",
    confirmButtonText: "删除",
  });
  await deleteOrg({ id: row.id });
  ElMessage.success("删除成功");
  await load();
}

async function openTreeDrawer() {
  treeDrawerVisible.value = true;
  treeLoading.value = true;
  try {
    treeData.value = (await fetchOrgTree()) || [];
  } finally {
    treeLoading.value = false;
  }
}

// onMounted(load);
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
  width: 160px;
}

.org-list__action-btns {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.org-list__title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
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
