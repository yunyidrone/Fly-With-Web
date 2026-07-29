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
              <OrgTreeNodeLabel :data="data" />
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
              v-model="query.userName"
              placeholder="根据用户账号搜索账户"
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
          <el-table-column type="selection" width="48" :selectable="canOperateUser" />
          <el-table-column prop="id" label="账户ID" min-width="160">
            <template #default="{ row }">
              <span class="user-list__id">{{ row.id }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="userName" label="用户账号" min-width="160">
            <template #default="{ row }">
              <span class="text-primary">{{ row.userName || "-" }}</span>
              <el-tag
                v-if="isSuperUser(row)"
                type="danger"
                size="small"
                class="user-list__super-tag"
              >
                超管
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="roleName" label="角色" width="140">
            <template #default="{ row }">
              {{ row.roleName || "-" }}
            </template>
          </el-table-column>
          <el-table-column label="最后上线时间" min-width="170">
            <template #default="{ row }">
              {{ row.loginTime || "-" }}
            </template>
          </el-table-column>
          <el-table-column label="账号状态" width="110" align="center">
            <template #default="{ row }">
              <el-switch
                :model-value="isUserEnabled(row)"
                :disabled="isSuperUser(row)"
                @change="(enabled) => handleStatusChange(row, enabled)"
              />
            </template>
          </el-table-column>
          <el-table-column label="操作" width="80" fixed="right" align="center">
            <template #default="{ row }">
              <el-dropdown
                v-if="canOperateUser(row)"
                trigger="click"
                popper-class="user-list__ops-popper"
                @command="(cmd) => handleRowCommand(cmd, row)"
              >
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
              <span v-else class="user-list__ops-empty">-</span>
            </template>
          </el-table-column>
        </el-table>

        <div class="user-list__pagination">
          <el-pagination
            :current-page="query.current"
            :page-size="query.pageSize"
            :total="total"
            :page-sizes="[10, 20, 50, 100]"
            layout="total, sizes, prev, pager, next"
            background
            @current-change="onPageChange"
            @size-change="onSizeChange"
          />
        </div>
      </main>
    </div>

    <el-dialog
      v-model="linkDialogVisible"
      title="复制链接"
      width="560px"
      destroy-on-close
      class="user-list__link-dialog"
    >
      <div class="user-list__link-tip">
        <p>
          您好，点击该链接
          <a
            class="user-list__link-anchor"
            :href="linkTipInfo.link"
            target="_blank"
            rel="noopener noreferrer"
          >{{ linkTipInfo.link }}</a>
          即可登录伴飞后台管理系统。
        </p>
        <p class="user-list__link-tip-row">
          <span>
            账户ID 为：{{ linkTipInfo.userId }} ，账户昵称为：{{ linkTipInfo.userName }}
            初始密码为：{{ linkTipInfo.password }}
          </span>
          <el-button
            link
            type="primary"
            class="user-list__copy-account-btn"
            :loading="accountCopying"
            @click="copyAccountAndPassword"
          >
            一键复制
          </el-button>
        </p>
        <p>为保护您的账户安全请登录后尽快修改你的账户密码.</p>
      </div>
      <template #footer>
        <el-button @click="linkDialogVisible = false">关闭</el-button>
        <el-button type="primary" :loading="linkCopying" @click="copyLinkTip">
          复制全部
        </el-button>
      </template>
    </el-dialog>

    <el-drawer v-model="detailDrawerVisible" title="更多信息" direction="rtl" size="420px">
      <div v-loading="detailLoading" class="user-list__detail">
        <el-descriptions v-if="detailUser" :column="1" border>
          <el-descriptions-item label="创建时间">
            {{ detailCreateTime }}
          </el-descriptions-item>
          <el-descriptions-item label="最后一次登录时间">
            {{ detailLoginTime }}
          </el-descriptions-item>
          <el-descriptions-item label="联系方式">
            {{ detailContact }}
          </el-descriptions-item>
          <el-descriptions-item label="所属单位名称">
            {{ detailOrgName }}
          </el-descriptions-item>
          <el-descriptions-item label="创建人">
            {{ detailCreator }}
          </el-descriptions-item>
          <el-descriptions-item label="修改密码">
            <span
              class="user-list__pwd-flag"
              :class="
                detailPasswordChanged
                  ? 'user-list__pwd-flag--yes'
                  : 'user-list__pwd-flag--no'
              "
            >
              {{ detailPasswordChanged ? "是" : "否" }}
            </span>
          </el-descriptions-item>
          <el-descriptions-item label="平台权限">
            <el-checkbox-group
              :model-value="detailAuthPlatforms"
              class="user-list__detail-platforms"
            >
              <el-checkbox
                v-for="item in USER_PLATFORM_OPTIONS"
                :key="item.value"
                :value="item.value"
                disabled
              >
                {{ item.label }}
              </el-checkbox>
            </el-checkbox-group>
          </el-descriptions-item>
        </el-descriptions>
      </div>
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
  fetchUserPassword,
  resetUserPassword,
  updateUserStatus,
} from "@backend/api/user.js";
import { fetchOrgList } from "@backend/api/org.js";
import OrgTreeNodeLabel from "@backend/components/OrgTreeNodeLabel.vue";
import {
  ORG_LABEL,
  USER_PLATFORM,
  USER_PLATFORM_OPTIONS,
} from "@backend/config/constants.js";
import { BACKEND_BASE } from "@backend/router/routes.js";
import { useAuthStore } from "@/stores/auth.js";
import { useTableQuery } from "@backend/composables/useTableQuery.js";

const router = useRouter();
const authStore = useAuthStore();

const orgTreeRef = ref();
const orgTreeData = ref([]);
const treeLoading = ref(false);
const orgFilterText = ref("");
const selectedOrg = ref(null);
const selectedRows = ref([]);

const treeProps = { label: "name", children: "children" };

const { loading, records, total, query, load, search, onPageChange, onSizeChange } =
  useTableQuery(fetchUserPage, { userName: "", orgId: "" });

function resolveUserName(row) {
  return row?.userName || row?.username || "";
}

/** superFlag：0否 1是 */
function isSuperUser(row) {
  return Number(row?.superFlag) === 1;
}

/** 非超管才可操作 */
function canOperateUser(row) {
  return !isSuperUser(row);
}

/** status：0启用 1禁用；开关打开表示启用 */
function isUserEnabled(row) {
  return Number(row?.status) === 0;
}

function normalizeDetailAuthPlatforms(data) {
  if (typeof data?.authPlatform === "string" && data.authPlatform.trim()) {
    return data.authPlatform
      .split(",")
      .map((item) => Number(item.trim()))
      .filter((item) => item === USER_PLATFORM.WEB || item === USER_PLATFORM.CLIENT);
  }
  if (Array.isArray(data?.authPlatforms)) {
    return data.authPlatforms
      .map((item) => Number(item))
      .filter((item) => item === USER_PLATFORM.WEB || item === USER_PLATFORM.CLIENT);
  }
  return [];
}

function resolvePasswordChanged(data) {
  const flag = data?.resetFlag;
  if (flag === true || flag === 1 || flag === "1" || flag === "是") return true;
  if (flag === false || flag === 0 || flag === "0" || flag === "否") return false;
  return false;
}

const orgSetName = computed(() => orgTreeData.value[0]?.name || "");

const selectedOrgPath = computed(() => {
  if (!selectedOrg.value) return orgSetName.value || "请选择单位";
  const { name, parentName } = selectedOrg.value;
  if (!parentName || parentName === name) {
    return name || orgSetName.value || "请选择单位";
  }
  return `${parentName}-${name}`;
});

const linkDialogVisible = ref(false);
const linkCopying = ref(false);
const accountCopying = ref(false);
const linkTipInfo = reactive({
  link: "",
  userId: "",
  userName: "",
  password: "",
});

const detailDrawerVisible = ref(false);
const detailLoading = ref(false);
const detailUser = ref(null);

const detailCreateTime = computed(() => {
  const data = detailUser.value;
  return data?.createTime || data?.createdAt || data?.createDate || "-";
});

const detailLoginTime = computed(() => {
  const data = detailUser.value;
  return data?.loginTime || data?.lastLoginTime || data?.lastOnlineAt || "-";
});

const detailContact = computed(() => {
  const data = detailUser.value;
  return data?.phone || data?.contact || data?.mobile || data?.tel || "-";
});

const detailOrgName = computed(() => detailUser.value?.orgName || "-");

const detailCreator = computed(() => detailUser.value?.createByName || "-");

const detailPasswordChanged = computed(() => resolvePasswordChanged(detailUser.value || {}));

const detailAuthPlatforms = computed(() => normalizeDetailAuthPlatforms(detailUser.value || {}));

function filterOrgNode(value, data) {
  if (!value) return true;
  return String(data.name || "").includes(value);
}

function filterOrgTree() {
  orgTreeRef.value?.filter(orgFilterText.value);
}

function normalizeTreeNodes(nodes, parentName = "", rootId = null) {
  const defaultRootId = rootId ?? nodes?.[0]?.id ?? null;
  return (Array.isArray(nodes) ? nodes : []).map((node) => ({
    ...node,
    parentName,
    rootOrgId: node.rootOrgId ?? node.rootId ?? defaultRootId,
    children: normalizeTreeNodes(node.children, node.name, defaultRootId),
  }));
}

function findFirstSelectableOrg(nodes) {
  for (const node of nodes || []) {
    if (node.id != null && Number(node.orgLabel) !== ORG_LABEL.SET && !node.children?.length) {
      return node;
    }
    const child = findFirstSelectableOrg(node.children);
    if (child) return child;
  }
  for (const node of nodes || []) {
    if (node.id != null && Number(node.orgLabel) !== ORG_LABEL.SET) return node;
  }
  return null;
}

async function loadOrgTree() {
  treeLoading.value = true;
  try {
    const data = (await fetchOrgList()) || [];
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
  const org = selectedOrg.value;
  if (org?.id == null) {
    ElMessage.warning("请先选择所属单位");
    return;
  }
  const rootId = org.rootOrgId ?? org.rootId ?? orgTreeData.value[0]?.id;
  const queryParams = {
    orgId: org.id,
    orgName: org.name || "",
  };
  if (rootId != null && rootId !== "") {
    queryParams.rootOrgId = rootId;
  }
  if (orgSetName.value) {
    queryParams.rootOrgName = orgSetName.value;
  } else if (org.parentName) {
    queryParams.rootOrgName = org.parentName;
  }
  router.push({ path: `${BACKEND_BASE}/users/new`, query: queryParams });
}

function goEdit(row) {
  router.push(`${BACKEND_BASE}/users/${row.id}`);
}

async function openResetPassword(row) {
  const name = resolveUserName(row) || row.id;
  try {
    await ElMessageBox.confirm(`确定重置账户「${name}」的密码吗？`, "重置密码", {
      type: "warning",
      confirmButtonText: "确认重置",
    });
  } catch {
    return;
  }

  const data = await resetUserPassword({ userId: row.id });
  const userName = data?.userName || data?.username || name;
  const password = data?.password || "";
  ElMessage.success(`${userName}账号密码已重置为${password}`);
}

async function changeStatus(row, nextStatus) {
  if (isSuperUser(row)) {
    ElMessage.warning("不可对超管进行操作");
    return;
  }
  const action = nextStatus === 0 ? "启用" : "停用";
  const name = resolveUserName(row) || row.id;
  await ElMessageBox.confirm(`确定${action}账户「${name}」吗？`, `${action}确认`, {
    type: "warning",
    confirmButtonText: `确认${action}`,
    cancelButtonText: "取消",
  });
  await updateUserStatus({ userId: row.id, status: nextStatus });
  ElMessage.success(`${action}成功`);
  await load();
}

async function handleStatusChange(row, enabled) {
  // enabled=true 对应 status=0（启用），enabled=false 对应 status=1（禁用）
  const nextStatus = enabled ? 0 : 1;
  if (nextStatus === Number(row.status)) return;
  try {
    await changeStatus(row, nextStatus);
  } catch {
    // 取消确认或接口失败时，开关仍绑定原 status，无需回写
  }
}

async function handleDelete(row) {
  const name = resolveUserName(row) || row.id;
  await ElMessageBox.confirm(`确定删除账户「${name}」吗？`, "删除确认", {
    type: "warning",
    confirmButtonText: "删除",
  });
  await deleteUser({ userId: row.id });
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
  await Promise.all(selectedRows.value.map((row) => deleteUser({ userId: row.id })));
  ElMessage.success("删除成功");
  selectedRows.value = [];
  await load();
}

function buildAccountLink() {
  return `${window.location.origin}/#/login`;
}

function buildAccountLinkTipText({ link, userId, userName, password }) {
  return [
    `您好，点击该链接${link}即可登录伴飞后台管理系统。`,
    `账户ID 为：${userId} ，账户昵称为：${userName}  初始密码为：${password}`,
    "为保护您的账户安全请登录后尽快修改你的账户密码.",
  ].join("\n");
}

async function copyAccountLink(row) {
  const data = await fetchUserPassword({ userId: row.id });
  const userName = data?.userName || data?.username || resolveUserName(row) || "-";
  const password = data?.password || "";
  const userId = data?.userId ?? data?.id ?? row.id;
  const link = buildAccountLink();

  Object.assign(linkTipInfo, {
    link,
    userId,
    userName,
    password,
  });
  linkDialogVisible.value = true;
}

async function copyLinkTip() {
  const text = buildAccountLinkTipText(linkTipInfo);
  if (!text) return;
  linkCopying.value = true;
  try {
    await navigator.clipboard.writeText(text);
    ElMessage.success("已复制到剪贴板");
  } catch {
    ElMessage.warning("复制失败，请手动复制");
  } finally {
    linkCopying.value = false;
  }
}

async function copyAccountAndPassword() {
  const userName = linkTipInfo.userName || "";
  const password = linkTipInfo.password || "";
  if (!userName && !password) {
    ElMessage.warning("暂无账号或密码可复制");
    return;
  }
  accountCopying.value = true;
  try {
    await navigator.clipboard.writeText(`账号：${userName}\n密码：${password}`);
    ElMessage.success("账号和密码已复制");
  } catch {
    ElMessage.warning("复制失败，请手动复制");
  } finally {
    accountCopying.value = false;
  }
}

async function openDetail(row) {
  detailDrawerVisible.value = true;
  detailUser.value = { ...row };
  detailLoading.value = true;
  try {
    const data = await fetchUserDetail({ userId: row.id });
    if (data) detailUser.value = { ...detailUser.value, ...data };
  } catch {
    // 详情接口不可用时展示列表数据
  } finally {
    detailLoading.value = false;
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
  () => query.userName,
  (value, oldValue) => {
    if (value === "" && oldValue !== "") search();
  },
);

onMounted(async () => {
  await loadOrgTree();

  let initialOrg = null;
  if (!authStore.isSuperAdmin && authStore.orgId != null) {
    initialOrg = findOrgById(orgTreeData.value, authStore.orgId);
  }
  if (!initialOrg) {
    initialOrg = findFirstSelectableOrg(orgTreeData.value);
  }
  if (initialOrg) {
    selectOrgNode(initialOrg);
  }
  await load();
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

  :deep(.el-input__wrapper) {
    min-height: 36px;
    height: 36px;
    box-sizing: border-box;
  }
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

  :deep(.el-input__wrapper) {
    min-height: 36px;
    height: 36px;
    box-sizing: border-box;
  }
}

.user-list__batch-delete {
  min-width: 108px;
  height: 36px;
}

.user-list__table {
  flex: 1;
}

.user-list__id {
  color: #303133;
  font-variant-numeric: tabular-nums;
}

.user-list__super-tag {
  margin-left: 8px;
  vertical-align: middle;
}

.user-list__detail {
  min-height: 200px;
}

.user-list__pwd-flag {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 40px;
  padding: 2px 10px;
  border-radius: 4px;
  border: 1px solid transparent;
  font-size: 13px;
  line-height: 20px;
}

.user-list__pwd-flag--yes {
  color: #67c23a;
  background: #f0f9eb;
  border-color: #c2e7b0;
}

.user-list__pwd-flag--no {
  color: #f56c6c;
  background: #fef0f0;
  border-color: #fbc4c4;
}

.user-list__detail-platforms {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
}

.user-list__detail-platforms :deep(.el-checkbox) {
  height: auto;
  margin-right: 0;
}

.user-list__ops-btn {
  width: 32px;
  height: 32px;
  padding: 0;
  color: var(--el-color-primary);
  border-color: var(--el-color-primary);
  background: #fff;

  &:hover,
  &:focus {
    color: var(--el-color-primary);
    border-color: var(--el-color-primary);
    background: var(--el-color-primary-light-9);
  }
}

.user-list__ops-empty {
  color: #c0c4cc;
}

.user-list__link-tip {
  line-height: 1.8;
  color: #303133;
  font-size: 14px;
  word-break: break-all;

  p {
    margin: 0 0 12px;

    &:last-child {
      margin-bottom: 0;
    }
  }
}

.user-list__link-tip-row {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.user-list__copy-account-btn {
  flex-shrink: 0;
  height: auto;
  padding: 0;
  margin-top: 2px;
}

.user-list__link-anchor {
  color: var(--el-color-primary);
  text-decoration: underline;
  cursor: pointer;

  &:hover {
    color: var(--el-color-primary-light-3);
  }
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

:deep(.el-tree--highlight-current .el-tree-node.is-current > .el-tree-node__content .org-tree-node__name) {
  color: var(--el-color-primary);
}
</style>
