<template>
  <div class="user-list">
    <div class="user-list__section user-list__section--title">
      <div class="user-list__title">账户管理</div>
    </div>

    <div class="user-list__section user-list__section--body">
      <aside class="user-list__aside">
        <el-input
          v-model="orgFilterText"
          placeholder="请输入单位名称进行查询"
          clearable
          class="user-list__org-search"
          @input="filterOrgTree"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>

        <el-scrollbar class="user-list__tree-scroll">
          <el-tree
            ref="orgTreeRef"
            v-loading="treeLoading"
            :data="orgTreeData"
            :props="treeProps"
            node-key="id"
            highlight-current
            default-expand-all
            :expand-on-click-node="false"
            :filter-node-method="filterOrgNode"
            @node-click="handleOrgSelect"
          >
            <template #default="{ data }">
              <span class="user-list__tree-node">
                <el-tag
                  v-if="data.nature && orgNatureLabels[data.nature]"
                  size="small"
                  type="primary"
                  effect="plain"
                  class="user-list__tree-tag"
                >
                  {{ orgNatureLabels[data.nature] }}
                </el-tag>
                <span class="user-list__tree-name">{{ data.name }}</span>
              </span>
            </template>
          </el-tree>
        </el-scrollbar>
      </aside>

      <main class="user-list__main">
        <div class="user-list__main-header">
          <el-icon class="user-list__folder-icon"><Folder /></el-icon>
          <span class="user-list__main-path">{{ selectedOrgPath }}</span>
        </div>

        <div class="user-list__toolbar">
          <el-button class="user-list__add-btn" @click="goCreate">
            <el-icon><Plus /></el-icon>
            新增账户
          </el-button>

          <div class="user-list__toolbar-right">
            <el-input
              v-model="query.keyword"
              placeholder="根据账户昵称搜索账户"
              clearable
              class="user-list__keyword"
              @keyup.enter="search"
              @clear="search"
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>

            <el-button
              type="primary"
              class="user-list__batch-delete"
              :disabled="!selectedRows.length"
              @click="handleBatchDelete"
            >
              <el-icon><Delete /></el-icon>
              删除账户
            </el-button>
          </div>
        </div>

        <el-table
          v-loading="loading"
          :data="records"
          class="user-list__table"
          @selection-change="handleSelectionChange"
        >
          <el-table-column type="selection" width="48" />
          <el-table-column prop="id" label="账户ID" width="160">
            <template #default="{ row }">
              <span class="user-list__id">{{ row.id }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="displayName" label="账户昵称" min-width="160">
            <template #default="{ row }">
              <span class="text-primary">{{ row.displayName || row.username }}</span>
            </template>
          </el-table-column>
          <el-table-column label="角色" width="140">
            <template #default="{ row }">
              {{ accountRoleLabels[row.role] || roleLabels[row.role] || row.role }}
            </template>
          </el-table-column>
          <el-table-column label="最后上线时间" min-width="170">
            <template #default="{ row }">
              {{ row.lastOnlineAt || row.lastLoginAt || row.updatedAt || "-" }}
            </template>
          </el-table-column>
          <el-table-column label="账号状态" width="110" align="center">
            <template #default="{ row }">
              <el-switch
                :model-value="row.status === 1"
                @change="(enabled) => handleStatusChange(row, enabled)"
              />
            </template>
          </el-table-column>
          <el-table-column label="操作" width="80" fixed="right" align="center">
            <template #default="{ row }">
              <el-dropdown trigger="click" @command="(cmd) => handleRowCommand(cmd, row)">
                <el-button class="user-list__ops-btn" circle>
                  <el-icon :size="16"><MoreFilled /></el-icon>
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu class="user-list__ops-menu">
                    <el-dropdown-item command="delete" class="user-list__ops-item--danger">
                      <el-icon><Delete /></el-icon>
                      删除账户
                    </el-dropdown-item>
                    <el-dropdown-item command="copyLink">
                      <el-icon><Link /></el-icon>
                      复制链接
                    </el-dropdown-item>
                    <el-dropdown-item command="resetPassword">
                      <el-icon><Key /></el-icon>
                      重置密码
                    </el-dropdown-item>
                    <el-dropdown-item command="edit">
                      <el-icon><Edit /></el-icon>
                      编辑信息
                    </el-dropdown-item>
                    <el-dropdown-item command="more">
                      <el-icon><InfoFilled /></el-icon>
                      更多信息
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </template>
          </el-table-column>
        </el-table>

        <div class="user-list__pagination">
          <el-pagination
            :current-page="query.current"
            :page-size="query.pageSize"
            :total="total"
            :page-sizes="[10, 20, 50]"
            layout="total, sizes, prev, pager, next"
            background
            @current-change="onPageChange"
            @size-change="onSizeChange"
          />
        </div>
      </main>
    </div>

    <el-dialog v-model="passwordDialogVisible" title="重置密码" width="480px" destroy-on-close>
      <el-form ref="passwordFormRef" :model="passwordForm" :rules="passwordRules" label-width="90px">
        <el-form-item label="账号">
          <el-input :model-value="passwordForm.username" disabled />
        </el-form-item>
        <el-form-item label="新密码" prop="password">
          <el-input v-model="passwordForm.password" type="password" show-password />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="passwordDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="passwordSubmitting" @click="submitResetPassword">
          确认
        </el-button>
      </template>
    </el-dialog>

    <el-drawer v-model="detailDrawerVisible" title="账户详情" direction="rtl" size="400px">
      <el-descriptions v-if="detailUser" :column="1" border>
        <el-descriptions-item label="账户ID">{{ detailUser.id }}</el-descriptions-item>
        <el-descriptions-item label="用户名">{{ detailUser.username }}</el-descriptions-item>
        <el-descriptions-item label="账户昵称">{{ detailUser.displayName }}</el-descriptions-item>
        <el-descriptions-item label="角色">
          {{ accountRoleLabels[detailUser.role] || detailUser.role }}
        </el-descriptions-item>
        <el-descriptions-item label="所属单位">{{ detailUser.orgName || "-" }}</el-descriptions-item>
        <el-descriptions-item label="账号状态">
          {{ detailUser.status === 1 ? "启用" : "停用" }}
        </el-descriptions-item>
        <el-descriptions-item label="最后上线时间">
          {{ detailUser.lastOnlineAt || detailUser.lastLoginAt || "-" }}
        </el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ detailUser.createdAt || "-" }}</el-descriptions-item>
      </el-descriptions>
    </el-drawer>
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, reactive, ref, watch } from "vue";
import { useRouter } from "vue-router";
import {
  Delete,
  Edit,
  Folder,
  InfoFilled,
  Key,
  Link,
  MoreFilled,
  Plus,
  Search,
} from "@element-plus/icons-vue";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  deleteUser,
  fetchUserDetail,
  fetchUserPage,
  resetUserPassword,
  updateUserStatus,
} from "@backend/api/user.js";
import { fetchOrgTree } from "@backend/api/org.js";
import {
  DEFAULT_REGION_LABEL,
  ORG_NATURE_LABELS,
  ROLE_LABELS,
  ROLES,
} from "@backend/config/constants.js";
import { BACKEND_BASE } from "@backend/router/routes.js";
import { useAuthStore } from "@backend/stores/auth.js";
import { useTableQuery } from "@backend/composables/useTableQuery.js";

const ACCOUNT_ROLE_LABELS = {
  [ROLES.SUPER_ADMIN]: "平台管理员",
  [ROLES.ORG_ADMIN]: "单位级管理员",
  [ROLES.ORG_VIEWER]: "普通用户",
};

const router = useRouter();
const authStore = useAuthStore();
const roleLabels = ROLE_LABELS;
const accountRoleLabels = ACCOUNT_ROLE_LABELS;
const orgNatureLabels = ORG_NATURE_LABELS;

const orgTreeRef = ref();
const orgTreeData = ref([]);
const treeLoading = ref(false);
const orgFilterText = ref("");
const selectedOrg = ref(null);
const selectedRows = ref([]);

const treeProps = { label: "name", children: "children" };

const { loading, records, total, query, load, search, onPageChange, onSizeChange } =
  useTableQuery(fetchUserPage, { keyword: "", orgId: "" });

const selectedOrgPath = computed(() => {
  if (!selectedOrg.value) return DEFAULT_REGION_LABEL;
  const { name, parentName } = selectedOrg.value;
  if (!parentName || parentName === name || parentName === DEFAULT_REGION_LABEL) {
    return name || DEFAULT_REGION_LABEL;
  }
  return `${parentName}-${name}`;
});

const passwordDialogVisible = ref(false);
const passwordSubmitting = ref(false);
const passwordFormRef = ref();
const passwordForm = reactive({
  id: null,
  username: "",
  password: "",
});

const passwordRules = {
  password: [
    { required: true, message: "请输入新密码", trigger: "blur" },
    { min: 6, message: "密码至少 6 位", trigger: "blur" },
  ],
};

const detailDrawerVisible = ref(false);
const detailUser = ref(null);

function filterOrgNode(value, data) {
  if (!value) return true;
  return String(data.name || "").includes(value);
}

function filterOrgTree() {
  orgTreeRef.value?.filter(orgFilterText.value);
}

function normalizeTreeNodes(nodes, parentName = DEFAULT_REGION_LABEL) {
  return (nodes || []).map((node) => ({
    ...node,
    parentName,
    children: normalizeTreeNodes(node.children, node.name),
  }));
}

function findFirstSelectableOrg(nodes) {
  for (const node of nodes || []) {
    if (node.id != null && !node.children?.length) return node;
    const child = findFirstSelectableOrg(node.children);
    if (child) return child;
  }
  for (const node of nodes || []) {
    if (node.id != null) return node;
  }
  return null;
}

async function loadOrgTree() {
  treeLoading.value = true;
  try {
    const data = (await fetchOrgTree()) || [];
    orgTreeData.value = normalizeTreeNodes(data);
  } finally {
    treeLoading.value = false;
  }
}

function selectOrgNode(org) {
  selectedOrg.value = org;
  query.orgId = org?.id ?? "";
  if (org?.id != null) {
    nextTick(() => orgTreeRef.value?.setCurrentKey(org.id));
  }
}

function handleOrgSelect(data) {
  selectOrgNode(data);
  search();
}

function handleSelectionChange(rows) {
  selectedRows.value = rows;
}

function goCreate() {
  const queryParams = selectedOrg.value?.id != null ? { orgId: selectedOrg.value.id } : {};
  router.push({ path: `${BACKEND_BASE}/users/new`, query: queryParams });
}

function goEdit(row) {
  router.push(`${BACKEND_BASE}/users/${row.id}`);
}

function openResetPassword(row) {
  passwordForm.id = row.id;
  passwordForm.username = row.username;
  passwordForm.password = "";
  passwordDialogVisible.value = true;
}

async function submitResetPassword() {
  await passwordFormRef.value.validate();
  passwordSubmitting.value = true;
  try {
    await resetUserPassword({ id: passwordForm.id, password: passwordForm.password });
    ElMessage.success("密码重置成功");
    passwordDialogVisible.value = false;
  } finally {
    passwordSubmitting.value = false;
  }
}

async function changeStatus(row, nextStatus) {
  const action = nextStatus === 1 ? "启用" : "停用";
  await ElMessageBox.confirm(
    `确定${action}账户「${row.displayName || row.username}」吗？`,
    "状态变更",
    { type: "warning" },
  );
  await updateUserStatus({ id: row.id, status: nextStatus });
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

async function handleDelete(row) {
  await ElMessageBox.confirm(
    `确定删除账户「${row.displayName || row.username}」吗？`,
    "删除确认",
    { type: "warning", confirmButtonText: "删除" },
  );
  await deleteUser({ id: row.id });
  ElMessage.success("删除成功");
  await load();
}

async function handleBatchDelete() {
  if (!selectedRows.value.length) {
    ElMessage.warning("请先选择要删除的账户");
    return;
  }
  await ElMessageBox.confirm(
    `确定删除选中的 ${selectedRows.value.length} 个账户吗？`,
    "批量删除",
    { type: "warning", confirmButtonText: "删除" },
  );
  await Promise.all(selectedRows.value.map((row) => deleteUser({ id: row.id })));
  ElMessage.success("删除成功");
  selectedRows.value = [];
  await load();
}

async function copyAccountLink(row) {
  const link = `${window.location.origin}/login?account=${encodeURIComponent(row.username || row.id)}`;
  try {
    await navigator.clipboard.writeText(link);
    ElMessage.success("链接已复制");
  } catch {
    ElMessage.warning("复制失败，请手动复制");
  }
}

async function openDetail(row) {
  detailDrawerVisible.value = true;
  detailUser.value = { ...row };
  try {
    const data = await fetchUserDetail({ id: row.id });
    if (data) detailUser.value = { ...detailUser.value, ...data };
  } catch {
    // 详情接口不可用时展示列表数据
  }
}

function handleRowCommand(command, row) {
  if (command === "delete") return handleDelete(row);
  if (command === "copyLink") return copyAccountLink(row);
  if (command === "resetPassword") return openResetPassword(row);
  if (command === "edit") return goEdit(row);
  if (command === "more") return openDetail(row);
}

watch(
  () => query.keyword,
  (value, oldValue) => {
    if (value === "" && oldValue !== "") search();
  },
);

onMounted(async () => {
  // await loadOrgTree();

  // let initialOrg = null;
  // if (!authStore.isSuperAdmin && authStore.orgId != null) {
  //   initialOrg = findOrgById(orgTreeData.value, authStore.orgId);
  // }
  // if (!initialOrg) {
  //   initialOrg = findFirstSelectableOrg(orgTreeData.value);
  // }
  // if (initialOrg) {
  //   selectOrgNode(initialOrg);
  // }
  // await load();
});

function findOrgById(nodes, id) {
  for (const node of nodes || []) {
    if (String(node.id) === String(id)) return node;
    const found = findOrgById(node.children, id);
    if (found) return found;
  }
  return null;
}
</script>

<style scoped lang="scss">
.user-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.user-list__section {
  background: #fff;
  border: 1px solid #ebeef5;
  border-radius: 4px;
}

.user-list__section--title {
  padding: 14px 16px;
}

.user-list__section--body {
  display: flex;
  min-height: 560px;
  padding: 0;
  overflow: hidden;
}

.user-list__title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.user-list__aside {
  width: 240px;
  flex-shrink: 0;
  border-right: 1px solid #ebeef5;
  padding: 16px 12px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.user-list__org-search {
  width: 100%;
}

.user-list__tree-scroll {
  flex: 1;
  min-height: 0;
}

.user-list__tree-node {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  padding-right: 8px;
}

.user-list__tree-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.user-list__tree-tag {
  flex-shrink: 0;
  height: 20px;
  padding: 0 6px;
  font-size: 12px;
}

.user-list__main {
  flex: 1;
  min-width: 0;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.user-list__main-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

.user-list__folder-icon {
  color: var(--el-color-primary);
  font-size: 18px;
}

.user-list__toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.user-list__add-btn {
  min-width: 132px;
  height: 36px;
  border-style: dashed;
  color: var(--el-color-primary);
  border-color: var(--el-color-primary);
  background: #fff;
}

.user-list__toolbar-right {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-left: auto;
}

.user-list__keyword {
  width: 240px;
}

.user-list__batch-delete {
  min-width: 108px;
}

.user-list__table {
  flex: 1;
}

.user-list__id {
  color: #303133;
  font-variant-numeric: tabular-nums;
}

.user-list__ops-btn {
  width: 32px;
  height: 32px;
  padding: 0;
  color: #606266;
  border-color: #dcdfe6;
}

.text-primary {
  color: var(--el-color-primary);
}

.user-list__pagination {
  display: flex;
  justify-content: flex-end;
}

:deep(.el-tree-node__content) {
  height: 36px;
}

:deep(.el-tree--highlight-current .el-tree-node.is-current > .el-tree-node__content) {
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
}

:deep(.el-tree--highlight-current .el-tree-node.is-current > .el-tree-node__content .user-list__tree-name) {
  color: var(--el-color-primary);
}

:deep(.user-list__ops-menu .el-dropdown-menu__item) {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 140px;
}

:deep(.user-list__ops-item--danger) {
  color: #f56c6c;
}

:deep(.user-list__ops-item--danger .el-icon) {
  color: #f56c6c;
}
</style>
