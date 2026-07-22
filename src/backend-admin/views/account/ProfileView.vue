<template>
  <div class="page-card profile-view">
    <div class="page-toolbar">
      <div class="page-toolbar__title">个人中心</div>
    </div>

    <el-tabs v-model="activeTab" class="profile-view__tabs">
      <el-tab-pane label="修改密码" name="password">
        <el-form
          ref="formRef"
          :model="form"
          :rules="rules"
          label-width="150px"
          style="max-width: 480px"
        >
          <el-form-item label="请输入原本的密码" prop="oldPassword">
            <el-input v-model="form.oldPassword" type="password" show-password />
          </el-form-item>
          <el-form-item label="请输入新的密�? prop="newPassword">
            <el-input v-model="form.newPassword" type="password" show-password />
          </el-form-item>
          <el-form-item label="确认新密�? prop="confirmPassword">
            <el-input v-model="form.confirmPassword" type="password" show-password />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" :loading="submitting" @click="submit">保存</el-button>
          </el-form-item>
        </el-form>
      </el-tab-pane>

      <!-- <el-tab-pane label="信息修改" name="info">
        <el-empty description="暂无内容" />
      </el-tab-pane> -->
    </el-tabs>
  </div>
</template>

<script setup>
import { ElMessage } from "element-plus";
import { changePassword } from "@/api/auth.js";

const activeTab = ref("password");

const formRef = ref();
const submitting = ref(false);

const form = reactive({
  oldPassword: "",
  newPassword: "",
  confirmPassword: "",
});

const validateConfirm = (_rule, value, callback) => {
  if (value !== form.newPassword) {
    callback(new Error("两次输入的新密码不一�?));
    return;
  }
  callback();
};

const rules = {
  oldPassword: [{ required: true, message: "请输入原密码", trigger: "blur" }],
  newPassword: [
    { required: true, message: "请输入新密码", trigger: "blur" },
    { min: 6, message: "密码至少 6 �?, trigger: "blur" },
  ],
  confirmPassword: [
    { required: true, message: "请再次输入新密码", trigger: "blur" },
    { validator: validateConfirm, trigger: "blur" },
  ],
};

async function submit() {
  await formRef.value.validate();
  submitting.value = true;
  try {
    await changePassword({
      oldPassword: form.oldPassword,
      newPassword: form.newPassword,
    });
    ElMessage.success("密码修改成功");
    form.oldPassword = "";
    form.newPassword = "";
    form.confirmPassword = "";
  } finally {
    submitting.value = false;
  }
}
</script>
