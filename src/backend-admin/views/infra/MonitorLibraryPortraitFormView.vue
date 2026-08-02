<template>
  <div class="portrait-form">
    <div class="portrait-form__section portrait-form__section--actions">
      <div class="portrait-form__actions">
        <el-button plain class="portrait-form__back-btn" @click="goBack">
          <el-icon><ArrowLeft /></el-icon>
          返回
        </el-button>
        <el-button type="primary" :loading="submitting" @click="submit">保存</el-button>
      </div>
    </div>

    <div class="portrait-form__section portrait-form__section--title">
      <div class="portrait-form__title">{{ isEdit ? "编辑人像" : "新建人像" }}</div>
    </div>

    <div class="portrait-form__section portrait-form__section--content">
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="140px"
        class="portrait-form__body"
      >
        <el-form-item label="请上传照片" prop="imageUrl" class="portrait-form__upload-item">
          <div class="portrait-form__upload-wrap">
            <div class="portrait-form__upload-main">
              <div v-if="imagePreview" class="portrait-form__preview">
                <el-image
                  :src="imagePreview"
                  fit="contain"
                  class="portrait-form__preview-image"
                  :preview-src-list="[imagePreview]"
                  preview-teleported
                />
                <div class="portrait-form__preview-actions">
                  <el-button link type="primary" @click="openPreview">预览</el-button>
                  <el-button link type="danger" @click="removeImage">删除</el-button>
                </div>
              </div>

              <el-upload
                v-else
                class="portrait-form__upload"
                :show-file-list="false"
                accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                :auto-upload="false"
                :on-change="handleImageChange"
              >
                <div class="portrait-form__upload-box">
                  <el-icon :size="28"><UploadFilled /></el-icon>
                </div>
              </el-upload>
            </div>

            <p class="portrait-form__upload-tip">请选择清晰正面人像，图片格式为jpg、jpeg、png</p>
          </div>
        </el-form-item>

        <el-form-item label="请输入人像姓名" prop="name">
          <el-input v-model="form.name" maxlength="32" placeholder="请输入人像姓名" />
        </el-form-item>

        <el-form-item label="设置预警类型" prop="warningType">
          <el-select v-model="form.warningType" placeholder="请选择预警类型" style="width: 100%">
            <el-option
              v-for="item in warnTypeOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
      </el-form>
    </div>

    <el-image-viewer
      v-if="previewVisible"
      teleported
      :url-list="[imagePreview]"
      @close="previewVisible = false"
    />
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ArrowLeft, UploadFilled } from "@element-plus/icons-vue";
import { ElMessage } from "element-plus";
import { uploadFile, UPLOAD_PATH } from "@backend/api/common.js";
import {
  createPortrait,
  fetchPortraitDetail,
  updatePortrait,
} from "@backend/api/monitor-library.js";
import {
  PORTRAIT_WARNING_TYPE,
  PORTRAIT_WARNING_TYPE_OPTIONS,
} from "@backend/config/constants.js";
import { buildPortraitPayload } from "@backend/utils/monitor-library.js";
import { INFRA_BASE } from "@backend/router/routes.js";

const ACCEPT_IMAGE_TYPES = ["image/jpeg", "image/png"];
const ACCEPT_IMAGE_EXT = [".jpg", ".jpeg", ".png"];

const route = useRoute();
const router = useRouter();
const warnTypeOptions = PORTRAIT_WARNING_TYPE_OPTIONS;
const formRef = ref();
const submitting = ref(false);
const pendingFile = ref(null);
const imagePreview = ref("");
const previewVisible = ref(false);

const isEdit = computed(() => Boolean(route.params.id) && route.params.id !== "new");

const form = reactive({
  name: "",
  warningType: PORTRAIT_WARNING_TYPE.CONTROL,
  imageUrl: "",
});

function hasUploadedImage() {
  return Boolean(pendingFile.value || form.imageUrl || imagePreview.value);
}

function validateImage(_rule, _value, callback) {
  if (hasUploadedImage()) {
    callback();
    return;
  }
  callback(new Error("请上传照片"));
}

const rules = {
  imageUrl: [{ required: true, validator: validateImage, trigger: ["change", "blur"] }],
  name: [{ required: true, message: "请输入人像姓名", trigger: "blur" }],
  warningType: [{ required: true, message: "请选择预警类型", trigger: "change" }],
};

function isAcceptedImage(file) {
  const type = String(file?.type ?? "").toLowerCase();
  if (ACCEPT_IMAGE_TYPES.includes(type)) return true;
  const name = String(file?.name ?? "").toLowerCase();
  return ACCEPT_IMAGE_EXT.some((ext) => name.endsWith(ext));
}

function revokeBlobPreview() {
  if (imagePreview.value.startsWith("blob:")) {
    URL.revokeObjectURL(imagePreview.value);
  }
}

function handleImageChange(uploadFile) {
  const rawFile = uploadFile?.raw;
  if (!rawFile) return;

  if (!isAcceptedImage(rawFile)) {
    ElMessage.warning("图片格式仅支持 jpg、jpeg、png");
    return;
  }

  pendingFile.value = rawFile;
  revokeBlobPreview();
  imagePreview.value = URL.createObjectURL(rawFile);
  form.imageUrl = "";
  formRef.value?.validateField("imageUrl");
}

function openPreview() {
  if (!imagePreview.value) return;
  previewVisible.value = true;
}

function removeImage() {
  revokeBlobPreview();
  imagePreview.value = "";
  pendingFile.value = null;
  form.imageUrl = "";
  previewVisible.value = false;
  formRef.value?.validateField("imageUrl");
}

async function loadDetail() {
  if (!isEdit.value) return;
  const data = await fetchPortraitDetail({ id: route.params.id });
  Object.assign(form, {
    name: data.name,
    warningType: data.warningType || data.warnType || PORTRAIT_WARNING_TYPE.CONTROL,
    imageUrl: data.imageUrl,
  });
  imagePreview.value = data.imageUrl || "";
}

async function resolveImageUrl() {
  if (pendingFile.value) {
    return uploadFile(pendingFile.value, UPLOAD_PATH.PORTRAIT_IMAGE);
  }
  return form.imageUrl;
}

async function submit() {
  await formRef.value.validate();
  submitting.value = true;
  try {
    const imageUrl = await resolveImageUrl();
    if (!imageUrl) {
      ElMessage.warning("请上传照片");
      return;
    }

    const payload = buildPortraitPayload(
      { ...form, imageUrl },
      isEdit.value ? { id: route.params.id } : {},
    );

    if (isEdit.value) {
      await updatePortrait(payload);
      ElMessage.success("保存成功");
    } else {
      await createPortrait(payload);
      ElMessage.success("创建成功");
    }
    goBack();
  } finally {
    submitting.value = false;
  }
}

function goBack() {
  router.push(`${INFRA_BASE}/library`);
}

onMounted(loadDetail);
</script>

<style scoped lang="scss">
.portrait-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.portrait-form__section {
  background: #fff;
  border: 1px solid #ebeef5;
  border-radius: 4px;
}

.portrait-form__section--actions {
  padding: 12px 16px;
}

.portrait-form__section--title {
  padding: 14px 16px;
  background: #fafafa;
}

.portrait-form__section--content {
  padding: 20px 16px 24px;
}

.portrait-form__actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.portrait-form__back-btn {
  --el-button-text-color: #d87533;
  --el-button-border-color: #d87533;
  --el-button-hover-text-color: #d87533;
  --el-button-hover-border-color: #d87533;
  --el-button-hover-bg-color: #fdf6f0;
}

.portrait-form__title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.portrait-form__body {
  max-width: 720px;
}

.portrait-form__upload-item {
  :deep(.el-form-item__content) {
    line-height: normal;
  }

  :deep(.el-form-item__error) {
    position: static;
    margin-top: 4px;
  }
}

.portrait-form__upload-wrap {
  display: flex;
  align-items: center;
  gap: 16px;
  width: 100%;
}

.portrait-form__upload-main {
  flex-shrink: 0;
}

.portrait-form__upload {
  :deep(.el-upload) {
    display: block;
  }
}

.portrait-form__upload-box,
.portrait-form__preview {
  width: 120px;
}

.portrait-form__upload-box {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 120px;
  border: 1px dashed #dcdfe6;
  border-radius: 4px;
  background: #fafafa;
  color: #c0c4cc;
  cursor: pointer;

  &:hover {
    border-color: var(--el-color-primary);
    color: var(--el-color-primary);
  }
}

.portrait-form__preview {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.portrait-form__preview-image {
  width: 120px;
  height: 120px;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  background: #fafafa;
  overflow: hidden;

  :deep(.el-image__inner) {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }
}

.portrait-form__preview-actions {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.portrait-form__upload-tip {
  margin: 0;
  flex: 1;
  min-width: 0;
  font-size: 13px;
  line-height: 1.6;
  color: #f56c6c;
}

.portrait-form__body :deep(.el-input__wrapper),
.portrait-form__body :deep(.el-select__wrapper) {
  background: #fafafa;
  box-shadow: none;
  border: 1px solid #f0f2f5;
}

.portrait-form__body :deep(.el-input__wrapper.is-focus),
.portrait-form__body :deep(.el-select__wrapper.is-focused) {
  box-shadow: 0 0 0 1px var(--el-color-primary) inset;
  background: #fff;
}

.portrait-form__body :deep(.el-form-item__label) {
  color: #606266;
}
</style>
