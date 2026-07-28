<template>
  <div class="checkpoint-form">
    <div class="checkpoint-form__section checkpoint-form__section--actions">
      <div class="checkpoint-form__actions">
        <el-button plain class="checkpoint-form__back-btn" @click="goBack">
          <el-icon><ArrowLeft /></el-icon>
          返回
        </el-button>
        <el-button type="primary" :loading="submitting" @click="submit">保存</el-button>
      </div>
    </div>

    <div class="checkpoint-form__section checkpoint-form__section--title">
      <div class="checkpoint-form__title">{{ isEdit ? "编辑卡点" : "新建卡点" }}</div>
    </div>

    <div class="checkpoint-form__section checkpoint-form__section--content">
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="120px"
        class="checkpoint-form__body"
      >
        <el-form-item label="卡点名称" prop="name">
          <el-input v-model="form.name" maxlength="64" show-word-limit placeholder="请输入卡点名称" />
        </el-form-item>

        <el-form-item label="类型" prop="type">
          <el-select v-model="form.type" placeholder="请选择类型" style="width: 100%">
            <el-option
              v-for="item in checkpointTypeOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="目标经度" prop="longitude">
          <el-input v-model="form.longitude" placeholder="请输入目标经度" />
        </el-form-item>

        <el-form-item label="目标纬度" prop="latitude">
          <el-input v-model="form.latitude" placeholder="请输入目标纬度" />
        </el-form-item>

        <el-form-item label="描述" prop="description">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="3"
            maxlength="200"
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
  createCheckpoint,
  fetchCheckpointDetail,
  updateCheckpoint,
} from "@backend/api/common.js";
import { CHECKPOINT_TYPE, CHECKPOINT_TYPE_OPTIONS } from "@backend/config/constants.js";
import { INFRA_BASE } from "@backend/router/routes.js";
import { buildCheckpointPayload } from "@backend/utils/checkpoint.js";

const route = useRoute();
const router = useRouter();
const checkpointTypeOptions = CHECKPOINT_TYPE_OPTIONS;
const formRef = ref();
const submitting = ref(false);
const isEdit = computed(() => Boolean(route.params.id) && route.params.id !== "new");

const form = reactive({
  name: "",
  type: CHECKPOINT_TYPE.HIGHWAY_EXIT,
  longitude: "",
  latitude: "",
  description: "",
});

function validateCoordinate(_rule, value, callback) {
  const num = Number(value);
  if (!Number.isFinite(num)) {
    callback(new Error("请输入有效数字"));
    return;
  }
  callback();
}

const rules = {
  name: [{ required: true, message: "请输入卡点名称", trigger: "blur" }],
  type: [{ required: true, message: "请选择类型", trigger: "change" }],
  longitude: [
    { required: true, message: "请输入目标经度", trigger: "blur" },
    { validator: validateCoordinate, trigger: "blur" },
  ],
  latitude: [
    { required: true, message: "请输入目标纬度", trigger: "blur" },
    { validator: validateCoordinate, trigger: "blur" },
  ],
};

async function loadDetail() {
  if (!isEdit.value) return;
  const data = await fetchCheckpointDetail({ id: route.params.id });
  Object.assign(form, {
    name: data.name,
    type: data.type ?? CHECKPOINT_TYPE.HIGHWAY_EXIT,
    longitude: data.longitude != null ? String(data.longitude) : "",
    latitude: data.latitude != null ? String(data.latitude) : "",
    description: data.description ?? "",
  });
}

async function submit() {
  await formRef.value.validate();
  submitting.value = true;
  try {
    const payload = buildCheckpointPayload(
      form,
      isEdit.value ? { id: route.params.id } : {},
    );
    if (isEdit.value) {
      await updateCheckpoint(payload);
      ElMessage.success("保存成功");
    } else {
      await createCheckpoint(payload);
      ElMessage.success("创建成功");
    }
    goBack();
  } finally {
    submitting.value = false;
  }
}

function goBack() {
  router.push(`${INFRA_BASE}/checkpoints`);
}

onMounted(loadDetail);
</script>

<style scoped lang="scss">
.checkpoint-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.checkpoint-form__section {
  background: #fff;
  border: 1px solid #ebeef5;
  border-radius: 4px;
}

.checkpoint-form__section--actions {
  padding: 12px 16px;
}

.checkpoint-form__section--title {
  padding: 14px 16px;
  background: #fafafa;
}

.checkpoint-form__section--content {
  padding: 20px 16px 24px;
}

.checkpoint-form__actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.checkpoint-form__back-btn {
  --el-button-text-color: #d87533;
  --el-button-border-color: #d87533;
  --el-button-hover-text-color: #d87533;
  --el-button-hover-border-color: #d87533;
  --el-button-hover-bg-color: #fdf6f0;
}

.checkpoint-form__title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.checkpoint-form__body {
  max-width: 720px;
}

.checkpoint-form__body :deep(.el-input__wrapper),
.checkpoint-form__body :deep(.el-select__wrapper) {
  background: #fafafa;
  box-shadow: none;
  border: 1px solid #f0f2f5;
}

.checkpoint-form__body :deep(.el-input__wrapper.is-focus),
.checkpoint-form__body :deep(.el-select__wrapper.is-focused) {
  box-shadow: 0 0 0 1px var(--el-color-primary) inset;
  background: #fff;
}

.checkpoint-form__body :deep(.el-form-item__label) {
  color: #606266;
}
</style>
