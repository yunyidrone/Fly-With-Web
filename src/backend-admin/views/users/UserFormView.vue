<template>
  <div class="user-form">
    <div class="user-form__section user-form__section--actions">
      <div class="user-form__actions">
        <el-button plain class="user-form__back-btn" @click="goBack">
          <el-icon><ArrowLeft /></el-icon>
          返回
        </el-button>
        <el-button type="primary" :loading="submitting" @click="submit">保存</el-button>
      </div>
    </div>

    <div class="user-form__section user-form__section--title">
      <div class="user-form__title-row">
        <div class="user-form__title">{{ pageTitle }}</div>
        <div v-if="contextText" class="user-form__context">{{ contextText }}</div>
      </div>
    </div>

    <div class="user-form__section user-form__section--content">
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="100px"
        class="user-form__body"
      >
        <div class="user-form__columns">
          <div class="user-form__column">
            <el-form-item label="用户账号" prop="userName" required>
              <el-input
                v-model="form.userName"
                placeholder="请输入用户账号"
                :disabled="isEdit"
                maxlength="64"
              />
            </el-form-item>
            <el-form-item label="联系电话" prop="phone">
              <el-input v-model="form.phone" placeholder="请输入手机号码" maxlength="20" />
            </el-form-item>
            <el-form-item label="邮箱" prop="email">
              <el-input v-model="form.email" placeholder="请输入用户邮箱" />
            </el-form-item>
            <el-form-item label="角色" prop="roleId" required>
              <el-select
                v-model="form.roleId"
                placeholder="请选择角色"
                style="width: 100%"
                :loading="roleLoading"
                filterable
              >
                <el-option
                  v-for="item in roleOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
          </div>

          <div class="user-form__column user-form__column--permissions">
            <div class="user-form__permissions-title">分配平台权限</div>
            <div class="user-form__permissions-divider" />
            <el-form-item label-width="0" prop="authPlatforms" class="user-form__permissions">
              <el-checkbox-group v-model="form.authPlatforms" class="user-form__checkbox-group">
                <el-checkbox
                  v-for="item in USER_PLATFORM_OPTIONS"
                  :key="item.value"
                  :value="item.value"
                >
                  {{ item.label }}
                </el-checkbox>
              </el-checkbox-group>
            </el-form-item>
            <div class="user-form__permissions-divider" />
          </div>
        </div>
      </el-form>
    </div>
  </div>
</template>

<script setup>
import { ArrowLeft } from "@element-plus/icons-vue";
import { computed, onMounted, reactive, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import { createUser, fetchRoleList, fetchUserDetail, updateUser } from "@backend/api/user.js";
import { BACKEND_BASE } from "@backend/router/routes.js";
import { USER_PLATFORM, USER_PLATFORM_OPTIONS } from "@backend/config/constants.js";
import { useAuthStore } from "@/stores/auth.js";

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

const formRef = ref();
const submitting = ref(false);
const roleLoading = ref(false);
const roleOptions = ref([]);
const orgName = ref("");
const rootOrgName = ref("");
const rootOrgId = ref(null);

const isEdit = computed(() => route.name === "BackendUserEdit");
const pageTitle = computed(() => (isEdit.value ? "编辑账号" : "新建账号"));

const orgId = computed(() => {
  if (isEdit.value && form.orgId != null) return form.orgId;
  const queryOrgId = route.query.orgId;
  if (queryOrgId != null && queryOrgId !== "") return Number(queryOrgId) || queryOrgId;
  if (!authStore.isSuperAdmin && authStore.orgId != null) return authStore.orgId;
  return null;
});

const form = reactive({
  userName: "",
  phone: "",
  email: "",
  roleId: null,
  orgId: null,
  authPlatforms: [USER_PLATFORM.CLIENT],
});

const orgPathText = computed(() => {
  const name = orgName.value;
  const rootName = rootOrgName.value;
  if (rootName && name && rootName !== name) return `${rootName}-${name}`;
  return name || rootName || "";
});

const contextText = computed(() => {
  if (isEdit.value) {
    if (form.userName) return `正在编辑： ${form.userName} 账户`;
    if (orgPathText.value) return `正在编辑： ${orgPathText.value} 账户`;
    return "正在编辑账户";
  }

  if (orgPathText.value) return `正在创建： ${orgPathText.value} 账户`;
  return "正在创建账户";
});

const rules = {
  userName: [
    { required: true, message: "请输入用户账号", trigger: "blur" },
    { min: 2, max: 64, message: "账号长度为 2-64 个字符", trigger: "blur" },
  ],
  phone: [
    {
      validator: (_rule, value, callback) => {
        if (!value) {
          callback();
          return;
        }
        if (!/^1\d{10}$|^[\d-]{7,20}$/.test(value)) {
          callback(new Error("请输入有效手机号码"));
          return;
        }
        callback();
      },
      trigger: "blur",
    },
  ],
  email: [{ type: "email", message: "请输入有效邮箱", trigger: "blur" }],
  roleId: [{ required: true, message: "请选择角色", trigger: "change" }],
  authPlatforms: [
    {
      type: "array",
      required: true,
      min: 1,
      message: "请至少选择一个授权平台",
      trigger: "change",
    },
  ],
};

function normalizeAuthPlatforms(data) {
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
  if (Array.isArray(data?.platforms)) {
    return data.platforms
      .map((item) => {
        if (item === USER_PLATFORM.WEB || item === "web" || item === 1) return USER_PLATFORM.WEB;
        if (item === USER_PLATFORM.CLIENT || item === "client" || item === 2) {
          return USER_PLATFORM.CLIENT;
        }
        return null;
      })
      .filter(Boolean);
  }
  const platforms = [];
  if (data?.platformWeb || data?.permissions?.web) platforms.push(USER_PLATFORM.WEB);
  if (data?.platformClient !== false && (data?.platformClient || data?.permissions?.client)) {
    platforms.push(USER_PLATFORM.CLIENT);
  }
  return platforms.length ? platforms : [USER_PLATFORM.CLIENT];
}

function buildAuthPlatform(platforms) {
  return [...platforms]
    .map(Number)
    .filter((item) => item === USER_PLATFORM.WEB || item === USER_PLATFORM.CLIENT)
    .sort((a, b) => a - b)
    .join(",");
}

function normalizeRoleOptions(payload) {
  const list = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.list)
      ? payload.list
      : Array.isArray(payload?.records)
        ? payload.records
        : Array.isArray(payload?.rows)
          ? payload.rows
          : [];

  return list
    .map((item) => {
      if (item == null || typeof item !== "object") return null;
      const value = item.id ?? item.roleId ?? item.value;
      if (value == null || value === "") return null;
      const label = item.roleName ?? item.name ?? item.label ?? String(value);
      return { value, label };
    })
    .filter(Boolean);
}

function applyOrgContextFromQuery() {
  const id = orgId.value;
  form.orgId = id;
  orgName.value = String(route.query.orgName || "");
  rootOrgName.value = String(route.query.rootOrgName || route.query.orgSetName || "");

  const queryRoot = route.query.rootOrgId;
  if (queryRoot != null && queryRoot !== "") {
    rootOrgId.value = Number(queryRoot) || queryRoot;
  } else {
    rootOrgId.value = null;
  }

  return id != null && rootOrgId.value != null && rootOrgId.value !== "";
}

async function loadRoleOptions() {
  roleLoading.value = true;
  try {
    const data = await fetchRoleList({
      orgId: orgId.value,
      rootOrgId: rootOrgId.value,
    });
    roleOptions.value = normalizeRoleOptions(data);
    if (!roleOptions.value.length) {
      ElMessage.warning("暂无可用角色，请确认角色列表接口");
    }
  } catch {
    roleOptions.value = [];
    ElMessage.warning("角色列表加载失败，请确认 /auth/role/list 是否可用");
  } finally {
    roleLoading.value = false;
  }
}

async function loadDetail() {
  if (!isEdit.value) return;

  const data = await fetchUserDetail({ userId: route.params.id });
  Object.assign(form, {
    userName: data.userName || data.username || "",
    phone: data.phone || "",
    email: data.email || "",
    roleId: data.roleId ?? data.role ?? null,
    orgId: data.orgId,
    authPlatforms: normalizeAuthPlatforms(data),
  });
  rootOrgId.value = data.rootOrgId ?? data.rootId ?? null;
  orgName.value = data.orgName || "";
  rootOrgName.value = data.rootOrgName || data.rootName || "";
}

async function submit() {
  await formRef.value.validate();

  if (!isEdit.value) {
    if (orgId.value == null) {
      ElMessage.warning("请先选择所属单位");
      return;
    }
    if (rootOrgId.value == null || rootOrgId.value === "") {
      ElMessage.warning("缺少顶级单位 id，请从单位树重新进入新增");
      return;
    }
  }

  submitting.value = true;
  try {
    if (isEdit.value) {
      await updateUser({
        userId: route.params.id,
        userName: form.userName,
        phone: form.phone || undefined,
        email: form.email || undefined,
        roleId: form.roleId,
        orgId: orgId.value,
        rootOrgId: rootOrgId.value,
        authPlatform: buildAuthPlatform(form.authPlatforms),
      });
      ElMessage.success("保存成功");
    } else {
      await createUser({
        orgId: orgId.value,
        rootOrgId: rootOrgId.value,
        roleId: form.roleId,
        authPlatform: buildAuthPlatform(form.authPlatforms),
        userName: String(form.userName).trim(),
        email: form.email || undefined,
        phone: form.phone || undefined,
      });
      ElMessage.success("创建成功");
    }
    goBack();
  } finally {
    submitting.value = false;
  }
}

function goBack() {
  router.push(`${BACKEND_BASE}/users`);
}

onMounted(async () => {
  if (isEdit.value) {
    await loadDetail();
  } else {
    const ok = applyOrgContextFromQuery();
    if (!ok) {
      ElMessage.warning("请先在账户列表左侧选择单位后再新增");
    }
  }
  await loadRoleOptions();
});
</script>

<style scoped lang="scss">
.user-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.user-form__section {
  background: #fff;
  border: 1px solid #ebeef5;
  border-radius: 4px;
}

.user-form__section--actions {
  padding: 12px 16px;
}

.user-form__section--title {
  padding: 14px 16px;
}

.user-form__section--content {
  padding: 24px 16px 32px;
}

.user-form__actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.user-form__back-btn {
  --el-button-text-color: #d87533;
  --el-button-border-color: #d87533;
  --el-button-hover-text-color: #d87533;
  --el-button-hover-border-color: #d87533;
  --el-button-hover-bg-color: #fdf6f0;
}

.user-form__title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.user-form__title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.user-form__context {
  font-size: 14px;
  color: #909399;
}

.user-form__body {
  max-width: 960px;
}

.user-form__columns {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 48px;
}

.user-form__column {
  min-width: 0;
}

.user-form__column--permissions {
  padding-top: 4px;
}

.user-form__permissions-title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 12px;
}

.user-form__permissions-divider {
  height: 1px;
  background: #ebeef5;
  margin-bottom: 16px;
}

.user-form__permissions {
  margin-bottom: 16px;
}

.user-form__checkbox-group {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 16px;
}

.user-form__checkbox-group :deep(.el-checkbox) {
  height: auto;
  margin-right: 0;
}

.user-form__checkbox-group :deep(.el-checkbox__label) {
  color: #606266;
  font-size: 14px;
}

@media (max-width: 768px) {
  .user-form__columns {
    grid-template-columns: 1fr;
    gap: 24px;
  }
}
</style>
