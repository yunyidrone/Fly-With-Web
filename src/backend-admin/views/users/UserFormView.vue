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
            <el-form-item label="账户昵称" prop="displayName" required>
              <el-input v-model="form.displayName" placeholder="请输入账户昵称" />
            </el-form-item>
            <el-form-item label="联系电话" prop="phone">
              <el-input v-model="form.phone" placeholder="请输入联系电话" maxlength="20" />
            </el-form-item>
            <el-form-item label="邮箱" prop="email">
              <el-input v-model="form.email" placeholder="请输入邮箱" />
            </el-form-item>
            <el-form-item label="角色类型" prop="role">
              <el-select v-model="form.role" placeholder="" style="width: 100%">
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
            <el-form-item label-width="0" prop="platforms" class="user-form__permissions">
              <el-checkbox-group v-model="form.platforms" class="user-form__checkbox-group">
                <el-checkbox :value="USER_PLATFORM.WEB">
                  {{ USER_PLATFORM_LABELS[USER_PLATFORM.WEB] }}
                </el-checkbox>
                <el-checkbox :value="USER_PLATFORM.CLIENT">
                  {{ USER_PLATFORM_LABELS[USER_PLATFORM.CLIENT] }}
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
import { createUser, fetchUserDetail, updateUser } from "@backend/api/user.js";
import { fetchOrgDetail } from "@backend/api/org.js";
import { BACKEND_BASE } from "@backend/router/routes.js";
import {
  DEFAULT_REGION_FULL_LABEL,
  ROLES,
  USER_PLATFORM,
  USER_PLATFORM_LABELS,
} from "@backend/config/constants.js";
import { useAuthStore } from "@/stores/auth.js";

const ACCOUNT_ROLE_LABELS = {
  [ROLES.ORG_ADMIN]: "单位管理",
  [ROLES.ORG_VIEWER]: "普通用户",
};

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

const formRef = ref();
const submitting = ref(false);
const orgName = ref("");
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
  displayName: "",
  phone: "",
  email: "",
  role: ROLES.ORG_VIEWER,
  orgId: null,
  platforms: [USER_PLATFORM.CLIENT],
});

const roleOptions = [
  { value: ROLES.ORG_ADMIN, label: ACCOUNT_ROLE_LABELS[ROLES.ORG_ADMIN] },
  { value: ROLES.ORG_VIEWER, label: ACCOUNT_ROLE_LABELS[ROLES.ORG_VIEWER] },
];

const contextText = computed(() => {
  if (isEdit.value) {
    if (form.displayName) return `正在编辑{form.displayName}`;
    if (orgName.value) {
      return `正在编辑{DEFAULT_REGION_FULL_LABEL}-${orgName.value} 账户`;
    }
    return "正在编辑账户";
  }

  if (orgName.value) {
    return `正在创建{DEFAULT_REGION_FULL_LABEL}-${orgName.value} 账户`;
  }
  return "正在创建账户";
});

const rules = {
  displayName: [{ required: true, message: "请输入账户昵称", trigger: "blur" }],
  phone: [
    {
      validator: (_rule, value, callback) => {
        if (!value) {
          callback();
          return;
        }
        if (!/^1\d{10}$|^[\d-]{7,20}$/.test(value)) {
          callback(new Error("请输入有效联系电话"));
          return;
        }
        callback();
      },
      trigger: "blur",
    },
  ],
  email: [{ type: "email", message: "请输入有效邮箱", trigger: "blur" }],
  role: [{ required: true, message: "请选择角色类型", trigger: "change" }],
};

function normalizePlatforms(data) {
  if (Array.isArray(data?.platforms)) return data.platforms;
  const platforms = [];
  if (data?.platformWeb || data?.permissions?.web) platforms.push(USER_PLATFORM.WEB);
  if (data?.platformClient !== false && (data?.platformClient || data?.permissions?.client)) {
    platforms.push(USER_PLATFORM.CLIENT);
  }
  return platforms.length ? platforms : [USER_PLATFORM.CLIENT];
}

function buildPlatformPayload(platforms) {
  return {
    platforms,
    platformWeb: platforms.includes(USER_PLATFORM.WEB),
    platformClient: platforms.includes(USER_PLATFORM.CLIENT),
  };
}

async function loadOrgContext() {
  const id = orgId.value;
  if (id == null) {
    orgName.value = "";
    return;
  }
  form.orgId = id;
  try {
    const data = await fetchOrgDetail({ id });
    orgName.value = data?.name || "";
  } catch {
    orgName.value = "";
  }
}

async function loadDetail() {
  if (!isEdit.value) return;

  const data = await fetchUserDetail({ id: route.params.id });
  Object.assign(form, {
    displayName: data.displayName || "",
    phone: data.phone || "",
    email: data.email || "",
    role: data.role === ROLES.ORG_ADMIN ? ROLES.ORG_ADMIN : ROLES.ORG_VIEWER,
    orgId: data.orgId,
    platforms: normalizePlatforms(data),
  });
  if (data.orgName) {
    orgName.value = data.orgName;
  } else {
    await loadOrgContext();
  }
}

function resolveUsername() {
  if (form.email) return form.email.split("@")[0];
  if (form.phone) return String(form.phone).replace(/\D/g, "");
  return form.displayName;
}

async function submit() {
  await formRef.value.validate();
  submitting.value = true;
  try {
    const platformPayload = buildPlatformPayload(form.platforms);
    const payload = {
      displayName: form.displayName,
      phone: form.phone,
      email: form.email,
      role: form.role,
      orgId: orgId.value,
      status: 1,
      ...platformPayload,
    };
    if (isEdit.value) {
      await updateUser({ id: route.params.id, ...payload });
      ElMessage.success("保存成功");
    } else {
      await createUser({
        ...payload,
        username: resolveUsername(),
        password: form.phone ? String(form.phone).slice(-6) : "123456",
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
    await loadOrgContext();
  }
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
