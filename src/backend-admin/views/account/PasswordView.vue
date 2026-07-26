<template>
  <div class="page-card password-view">
    <div class="page-toolbar">
      <div class="page-toolbar__title">修改密码</div>
      <el-button @click="goBack">返回</el-button>
    </div>

    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-width="100px"
      class="password-view__form"
    >
      <el-form-item label="原密码" prop="oldPassword">
        <el-input v-model="form.oldPassword" type="password" show-password />
      </el-form-item>
      <el-form-item label="新密码" prop="newPassword">
        <el-input v-model="form.newPassword" type="password" show-password />
      </el-form-item>
      <el-form-item label="确认密码" prop="confirmPassword">
        <el-input v-model="form.confirmPassword" type="password" show-password />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" :loading="submitting" @click="submit">保存</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup>
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
  oldPassword: "",
  newPassword: "",
  confirmPassword: "",
});

const validateConfirm = (_rule, value, callback) => {
  if (value !== form.newPassword) {
    callback(new Error("两次输入的新密码不一致"));
    return;
  }
  callback();
};

const rules = {
  oldPassword: [{ required: true, message: "请输入原密码", trigger: "blur" }],
  newPassword: [
    { required: true, message: "请输入新密码", trigger: "blur" },
    { validator: validateComplexPassword, trigger: "blur" },
  ],
  confirmPassword: [
    { required: true, message: "请确认新密码", trigger: "blur" },
    { validator: validateConfirm, trigger: "blur" },
  ],
};

async function submit() {
  await formRef.value.validate();
  submitting.value = true;
  try {
    await changePassword({
      oldPassword: form.oldPassword,
      password: form.newPassword,
    });
    ElMessage.success("密码修改成功，请重新登录");
    form.oldPassword = "";
    form.newPassword = "";
    form.confirmPassword = "";
    await authStore.logout();
    router.replace("/login");
  } finally {
    submitting.value = false;
  }
}

function goBack() {
  if (window.history.length > 1) {
    router.back();
    return;
  }
  router.push("/backend/monitor");
}
</script>

<style scoped lang="scss">
.password-view__form {
  max-width: 480px;

  :deep(.el-form-item) {
    margin-bottom: 28px;
  }

  :deep(.el-form-item:last-child) {
    margin-bottom: 0;
    margin-top: 8px;
  }
}
</style>
