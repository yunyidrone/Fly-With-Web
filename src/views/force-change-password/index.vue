<template>
  <div class="force-pwd">
    <div class="force-pwd__card">
      <div class="force-pwd__title">修改初始密码</div>
      <div class="force-pwd__desc">
        检测到当前为初始密码，请先设置新密码后再进入系统
      </div>

      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="100px"
        class="force-pwd__form"
        autocomplete="off"
        @keyup.enter="submit"
      >
        <!-- 干扰浏览器自动填充 -->
        <input
          class="force-pwd__autofill-trap"
          type="text"
          name="username"
          autocomplete="username"
          tabindex="-1"
          aria-hidden="true"
        />
        <input
          class="force-pwd__autofill-trap"
          type="password"
          name="password"
          autocomplete="current-password"
          tabindex="-1"
          aria-hidden="true"
        />

        <el-form-item label="新密码" prop="password">
          <el-input
            v-model="form.password"
            type="password"
            show-password
            name="new-password"
            autocomplete="new-password"
            placeholder="请输入新密码"
          />
        </el-form-item>
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input
            v-model="form.confirmPassword"
            type="password"
            show-password
            name="confirm-new-password"
            autocomplete="new-password"
            placeholder="请再次输入新密码"
          />
        </el-form-item>
        <el-form-item class="force-pwd__actions">
          <el-button type="primary" class="force-pwd__submit" :loading="submitting" @click="submit">
            确认修改
          </el-button>
          <el-button class="force-pwd__logout" @click="handleLogout">退出登录</el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from "vue";
import { useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import { changePassword } from "@/api/auth.js";
import { useAuthStore } from "@/stores/auth.js";
import { validateComplexPassword } from "@backend/utils/password.js";

const router = useRouter();
const authStore = useAuthStore();

const formRef = ref();
const submitting = ref(false);

const form = reactive({
  password: "",
  confirmPassword: "",
});

const validateConfirm = (_rule, value, callback) => {
  if (value !== form.password) {
    callback(new Error("两次输入的新密码不一致"));
    return;
  }
  callback();
};

const rules = {
  password: [
    { required: true, message: "请输入新密码", trigger: "blur" },
    { validator: validateComplexPassword, trigger: "blur" },
  ],
  confirmPassword: [
    { required: true, message: "请再次输入新密码", trigger: "blur" },
    { validator: validateConfirm, trigger: "blur" },
  ],
};

onMounted(() => {
  if (!authStore.isLoggedIn) {
    router.replace("/login");
    return;
  }
  if (!authStore.mustChangePassword) {
    router.replace("/");
    return;
  }
  if (!authStore.pendingOldPassword) {
    ElMessage.warning("请重新登录后再修改初始密码");
    authStore.logout().finally(() => {
      router.replace("/login");
    });
  }
});

async function submit() {
  await formRef.value.validate();
  if (!authStore.pendingOldPassword) {
    ElMessage.warning("登录凭证已失效，请重新登录");
    await authStore.logout();
    router.replace("/login");
    return;
  }

  submitting.value = true;
  try {
    await changePassword({
      oldPassword: authStore.pendingOldPassword,
      password: form.password,
    });
    authStore.clearPendingOldPassword();
    ElMessage.success("密码修改成功，请重新登录");
    await authStore.logout();
    router.replace("/login");
  } finally {
    submitting.value = false;
  }
}

async function handleLogout() {
  await authStore.logout();
  router.replace("/login");
}
</script>

<style scoped lang="scss">
.force-pwd {
  --el-color-primary: #29408a;
  --el-color-primary-light-3: #6779b1;
  --el-color-primary-light-5: #94a0c5;
  --el-color-primary-light-7: #bfc6da;
  --el-color-primary-light-8: #d4d9e7;
  --el-color-primary-light-9: #eaecf3;
  --el-color-primary-dark-2: #21346e;
  --el-button-bg-color: #29408a;
  --el-button-border-color: #29408a;
  --el-button-hover-bg-color: #6779b1;
  --el-button-hover-border-color: #6779b1;
  --el-button-active-bg-color: #21346e;
  --el-button-active-border-color: #21346e;

  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: linear-gradient(160deg, #eef1f8 0%, #f7f8fb 45%, #e8edf7 100%);
}

.force-pwd__card {
  width: 100%;
  max-width: 480px;
  padding: 32px 28px 28px;
  background: #fff;
  border-radius: 8px;
  border: 1px solid #ebeef5;
  box-shadow: 0 8px 24px rgba(41, 64, 138, 0.08);
}

.force-pwd__title {
  font-size: 20px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 8px;
}

.force-pwd__desc {
  font-size: 14px;
  color: #909399;
  line-height: 1.6;
  margin-bottom: 28px;
}

.force-pwd__autofill-trap {
  position: absolute;
  left: -9999px;
  width: 1px;
  height: 1px;
  opacity: 0;
  pointer-events: none;
}

.force-pwd__form {
  :deep(.el-form-item) {
    margin-bottom: 36px;
  }

  :deep(.el-input__wrapper) {
    box-shadow: 0 0 0 1px #dcdfe6 inset;
  }

  :deep(.el-input__wrapper:hover),
  :deep(.el-input__wrapper.is-focus) {
    box-shadow: 0 0 0 1px var(--el-color-primary) inset;
  }
}

.force-pwd__actions {
  margin-bottom: 0 !important;
  margin-top: 8px;
}

.force-pwd__submit {
  min-width: 120px;
}

.force-pwd__logout {
  --el-button-text-color: #29408a;
  --el-button-border-color: #29408a;
  --el-button-hover-text-color: #29408a;
  --el-button-hover-border-color: #29408a;
  --el-button-hover-bg-color: #eaecf3;
  --el-button-active-text-color: #21346e;
  --el-button-active-border-color: #21346e;
  --el-button-active-bg-color: #eaecf3;
}
</style>
