<template>
  <div class="group-form">
    <div class="group-form__section group-form__section--actions">
      <div class="group-form__actions">
        <el-button plain class="group-form__back-btn" @click="goBack">
          <el-icon><ArrowLeft /></el-icon>
          返回
        </el-button>
        <el-button type="primary" :loading="submitting" @click="submit">保存</el-button>
      </div>
    </div>

    <div class="group-form__section group-form__section--title">
      <div class="group-form__title">{{ isEdit ? "编辑人脸库" : "新增人脸库" }}</div>
    </div>

    <div class="group-form__section group-form__section--content">
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="130px"
        class="group-form__body"
      >
        <el-form-item label="人脸库名称" prop="groupName">
          <el-input v-model="form.groupName" maxlength="60" placeholder="请输入人脸库名称" />
        </el-form-item>
        <el-form-item label="备注" prop="tag">
          <el-input v-model="form.tag" maxlength="64" placeholder="请输入人脸库信息备注" />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="4"
            maxlength="256"
            show-word-limit
            placeholder="请输入描述"
          />
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ArrowLeft } from "@element-plus/icons-vue";
import { ElMessage } from "element-plus";
import {
  createPersonGroup,
  fetchPersonGroupDetail,
  updatePersonGroup,
} from "@backend/api/monitor-library.js";
import { buildPersonGroupPayload } from "@backend/utils/monitor-library.js";
import { INFRA_BASE } from "@backend/router/routes.js";

const route = useRoute();
const router = useRouter();
const formRef = ref();
const submitting = ref(false);
const isEdit = computed(() => Boolean(route.params.id));

const form = reactive({
  groupName: "",
  tag: "",
  description: "",
});

const rules = {
  groupName: [
    { required: true, message: "请输入人脸库名称", trigger: "blur" },
    { max: 60, message: "人脸库名称最多60个字符", trigger: "blur" },
  ],
  description: [{ max: 256, message: "描述最多256个字符", trigger: "blur" }],
};

async function loadDetail() {
  if (!isEdit.value) return;
  const data = await fetchPersonGroupDetail({ id: route.params.id });
  form.groupName = String(data.groupName ?? "");
  form.tag = String(data.tag ?? "");
  form.description = String(data.description ?? "");
}

async function submit() {
  await formRef.value.validate();
  submitting.value = true;
  try {
    const payload = buildPersonGroupPayload(
      form,
      isEdit.value ? { id: route.params.id } : {},
    );
    if (isEdit.value) {
      await updatePersonGroup(payload);
      ElMessage.success("保存成功");
    } else {
      await createPersonGroup(payload);
      ElMessage.success("创建成功");
    }
    goBack();
  } finally {
    submitting.value = false;
  }
}

function goBack() {
  router.push({
    path: `${INFRA_BASE}/library`,
    query: { tab: "portrait" },
  });
}

onMounted(loadDetail);
</script>

<style scoped lang="scss">
.group-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.group-form__section {
  background: #fff;
  border: 1px solid #ebeef5;
  border-radius: 4px;
}

.group-form__section--actions {
  padding: 12px 16px;
}

.group-form__section--title {
  padding: 14px 16px;
  background: #fafafa;
}

.group-form__section--content {
  padding: 20px 16px 24px;
}

.group-form__actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.group-form__back-btn {
  --el-button-text-color: #d87533;
  --el-button-border-color: #d87533;
  --el-button-hover-text-color: #d87533;
  --el-button-hover-border-color: #d87533;
  --el-button-hover-bg-color: #fdf6f0;
}

.group-form__title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.group-form__body {
  max-width: 720px;
}

.group-form__body :deep(.el-input__wrapper),
.group-form__body :deep(.el-textarea__inner) {
  background: #fafafa;
  box-shadow: none;
  border: 1px solid #f0f2f5;
}

.group-form__body :deep(.el-input__wrapper.is-focus),
.group-form__body :deep(.el-textarea__inner:focus) {
  box-shadow: 0 0 0 1px var(--el-color-primary) inset;
  background: #fff;
}

.group-form__body :deep(.el-form-item__label) {
  color: #606266;
}
</style>
