<template>
  <div class="portrait-batch">
    <div class="portrait-batch__section portrait-batch__section--actions">
      <div class="portrait-batch__actions">
        <el-button plain class="portrait-batch__back-btn" @click="goBack">
          <el-icon><ArrowLeft /></el-icon>
          返回
        </el-button>
      </div>
    </div>

    <div class="portrait-batch__section portrait-batch__section--title">
      <div class="portrait-batch__title">
        新建人像
        <span class="portrait-batch__count">（{{ items.length }}/{{ maxCount }}）</span>
      </div>
    </div>

    <div class="portrait-batch__section portrait-batch__section--content">
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="140px"
        class="portrait-batch__body"
      >
        <el-form-item label="请选择人像" prop="portraits" class="portrait-batch__upload-item">
          <div class="portrait-batch__select-wrap">
            <div class="portrait-batch__select-row">
              <el-upload
                class="portrait-batch__upload"
                multiple
                :show-file-list="false"
                :auto-upload="false"
                :disabled="submitting || items.length >= maxCount"
                accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                :on-change="handleSelect"
              >
                <div class="portrait-batch__upload-box">
                  <el-icon :size="28"><Plus /></el-icon>
                </div>
              </el-upload>

              <div class="portrait-batch__example">
                <div class="portrait-batch__example-img" aria-hidden="true">
                  <svg viewBox="0 0 72 72" width="48" height="48">
                    <circle cx="36" cy="26" r="12" fill="#c0c4cc" />
                    <path d="M14 62c2-14 12-20 22-20s20 6 22 20" fill="#c0c4cc" />
                  </svg>
                </div>
                <span class="portrait-batch__example-label">示例图</span>
              </div>
            </div>

            <div class="portrait-batch__tips">
              <p>请选择清晰正面人像，图片格式为jpg、jpeg、png</p>
              <p>请将文件名改为人的姓名，上传后系统会自动使用文件名作为人像姓名</p>
              <p>单次最多上传{{ maxCount }}张，同名文件不会去重</p>
            </div>
          </div>
        </el-form-item>

        <el-form-item v-if="items.length" label="已选人像" class="portrait-batch__selected-item">
          <div class="portrait-batch__selected">
            <div class="portrait-batch__selected-head">
              <el-button
                link
                type="danger"
                :disabled="submitting"
                @click="clearAll"
              >
                一键清空
              </el-button>
            </div>
            <div class="portrait-batch__grid">
            <div v-for="(item, index) in items" :key="item.id" class="portrait-batch__card">
              <button
                type="button"
                class="portrait-batch__remove"
                :disabled="submitting"
                aria-label="删除"
                @click.stop="removeItem(item.id)"
              >
                <el-icon :size="12"><Close /></el-icon>
              </button>
              <el-image
                :src="item.previewUrl"
                :preview-src-list="previewUrls"
                :initial-index="index"
                preview-teleported
                fit="cover"
                class="portrait-batch__thumb"
              />
              <div class="portrait-batch__filename" :title="item.fileName">{{ item.fileName }}</div>
              <el-button
                link
                type="primary"
                class="portrait-batch__preview-btn"
                @click="openPreview(index)"
              >
                预览
              </el-button>
            </div>
            </div>
          </div>
        </el-form-item>

        <el-form-item label="请设置性别" prop="gender" class="portrait-batch__warning-item">
          <el-select v-model="form.gender" placeholder="请选择性别" style="width: 100%">
            <el-option
              v-for="option in genderOptions"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </el-select>
        </el-form-item>

        <div class="portrait-batch__submit">
          <el-button type="primary" :loading="submitting" @click="submit">立即上传</el-button>
        </div>
      </el-form>
    </div>

    <el-image-viewer
      v-if="previewVisible"
      teleported
      :url-list="previewUrls"
      :initial-index="previewIndex"
      @close="previewVisible = false"
    />
  </div>
</template>

<script setup>
import { computed, onUnmounted, reactive, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ArrowLeft, Close, Plus } from "@element-plus/icons-vue";
import { ElMessage } from "element-plus";
import { uploadFile, UPLOAD_PATH } from "@backend/api/common.js";
import { createPortrait } from "@backend/api/monitor-library.js";
import {
  PORTRAIT_GENDER,
  PORTRAIT_GENDER_OPTIONS,
} from "@backend/config/constants.js";
import {
  buildPortraitPayload,
  PORTRAIT_BATCH_MAX_COUNT,
  resolvePortraitNameFromFilename,
} from "@backend/utils/monitor-library.js";
import { INFRA_BASE } from "@backend/router/routes.js";

const ACCEPT_IMAGE_TYPES = ["image/jpeg", "image/png"];
const ACCEPT_IMAGE_EXT = [".jpg", ".jpeg", ".png"];

const router = useRouter();
const route = useRoute();
const formRef = ref();
const submitting = ref(false);
const items = ref([]);
const maxCount = PORTRAIT_BATCH_MAX_COUNT;
const genderOptions = PORTRAIT_GENDER_OPTIONS;

let nextId = 1;
let exceedWarned = false;

const previewVisible = ref(false);
const previewIndex = ref(0);
const previewUrls = computed(() => items.value.map((item) => item.previewUrl));

const form = reactive({
  gender: PORTRAIT_GENDER.UNKNOWN,
  portraits: [],
});

function validatePortraits(_rule, _value, callback) {
  if (items.value.length) {
    callback();
    return;
  }
  callback(new Error("请选择人像"));
}

const rules = {
  portraits: [{ required: true, validator: validatePortraits, trigger: "change" }],
  gender: [{ required: true, message: "请选择性别", trigger: "change" }],
};

function syncPortraitsField() {
  form.portraits = items.value.map((item) => item.id);
  formRef.value?.validateField("portraits");
}

function openPreview(index) {
  if (!previewUrls.value.length) return;
  previewIndex.value = index;
  previewVisible.value = true;
}

function goBack() {
  const source = String(route.query.source ?? "").trim();
  const groupId = route.query.groupId;
  if (source === "library") {
    router.push({
      path: `${INFRA_BASE}/library`,
      query: { tab: "portrait" },
    });
    return;
  }
  if (groupId) {
    router.push({
      name: "BackendPortraitList",
      params: { groupId },
      query: route.query.groupName
        ? { groupName: route.query.groupName, source: "group" }
        : { source: "group" },
    });
    return;
  }
  router.push({
    path: `${INFRA_BASE}/library`,
    query: { tab: "portrait" },
  });
}

function isAcceptedImage(file) {
  const type = String(file?.type ?? "").toLowerCase();
  if (ACCEPT_IMAGE_TYPES.includes(type)) return true;
  const name = String(file?.name ?? "").toLowerCase();
  return ACCEPT_IMAGE_EXT.some((ext) => name.endsWith(ext));
}

function warnExceedOnce() {
  if (exceedWarned) return;
  exceedWarned = true;
  ElMessage.warning(`单次最多上传${maxCount}张人像`);
  window.setTimeout(() => {
    exceedWarned = false;
  }, 400);
}

function handleSelect(uploadFile) {
  const raw = uploadFile?.raw;
  if (!raw) return;
  if (items.value.some((item) => item.file === raw)) return;

  if (!isAcceptedImage(raw)) {
    ElMessage.warning("图片格式仅支持 jpg、jpeg、png");
    return;
  }

  if (items.value.length >= maxCount) {
    warnExceedOnce();
    return;
  }

  const name = resolvePortraitNameFromFilename(raw.name);
  if (!name) {
    ElMessage.warning("请将文件名改为人像姓名后再上传");
    return;
  }

  items.value.push({
    id: nextId,
    file: raw,
    name,
    fileName: raw.name,
    previewUrl: URL.createObjectURL(raw),
  });
  nextId += 1;
  syncPortraitsField();
}

function removeItem(id) {
  if (submitting.value) return;
  const index = items.value.findIndex((item) => item.id === id);
  if (index < 0) return;
  const [removed] = items.value.splice(index, 1);
  if (removed?.previewUrl) {
    URL.revokeObjectURL(removed.previewUrl);
  }
  previewVisible.value = false;
  syncPortraitsField();
}

function clearAll() {
  if (submitting.value || !items.value.length) return;
  items.value.forEach((item) => {
    if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
  });
  items.value = [];
  previewVisible.value = false;
  syncPortraitsField();
}

function showUploadResult(successCount, total) {
  if (successCount === total) {
    ElMessage.success(`全部上传成功！已添加 ${successCount} 条人像信息！`);
    return;
  }
  if (successCount > 0) {
    ElMessage.warning(`部分上传成功！已添加 ${successCount} 条人像信息！`);
    return;
  }
  ElMessage.error("上传失败！请检查人像格式是否正确！");
}

async function submit() {
  await formRef.value.validate();

  submitting.value = true;
  const currentItems = [...items.value];
  const failedIds = new Set();
  let successCount = 0;

  try {
    for (const item of currentItems) {
      try {
        const imageUrl = await uploadFile(item.file, UPLOAD_PATH.PORTRAIT_IMAGE);
        if (!imageUrl) {
          failedIds.add(item.id);
          continue;
        }
        await createPortrait(
          buildPortraitPayload({
            name: item.name,
            imageUrl,
            gender: form.gender,
            groupId: route.query.groupId,
          }),
        );
        successCount += 1;
      } catch {
        failedIds.add(item.id);
      }
    }

    showUploadResult(successCount, currentItems.length);

    const remain = items.value.filter((item) => failedIds.has(item.id));
    items.value.forEach((item) => {
      if (!failedIds.has(item.id) && item.previewUrl) {
        URL.revokeObjectURL(item.previewUrl);
      }
    });
    items.value = remain;
    form.portraits = remain.map((item) => item.id);
  } finally {
    submitting.value = false;
  }
}

onUnmounted(() => {
  items.value.forEach((item) => {
    if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
  });
});
</script>

<style scoped lang="scss">
.portrait-batch {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.portrait-batch__section {
  background: #fff;
  border: 1px solid #ebeef5;
  border-radius: 4px;
}

.portrait-batch__section--actions {
  padding: 12px 16px;
}

.portrait-batch__section--title {
  padding: 14px 16px;
  background: #fafafa;
}

.portrait-batch__section--content {
  padding: 20px 16px 24px;
}

.portrait-batch__actions {
  display: flex;
  align-items: center;
}

.portrait-batch__back-btn {
  --el-button-text-color: #d87533;
  --el-button-border-color: #d87533;
  --el-button-hover-text-color: #d87533;
  --el-button-hover-border-color: #d87533;
  --el-button-hover-bg-color: #fdf6f0;
}

.portrait-batch__title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.portrait-batch__count {
  font-weight: 500;
  color: #909399;
}

.portrait-batch__body {
  width: 100%;
  max-width: none;
}

.portrait-batch__upload-item,
.portrait-batch__warning-item {
  max-width: 860px;
}

.portrait-batch__selected-item {
  width: 100%;
  max-width: none;

  :deep(.el-form-item__content) {
    width: 100%;
    max-width: none;
    line-height: normal;
  }
}

.portrait-batch__selected {
  width: 100%;
}

.portrait-batch__selected-head {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 8px;
}

.portrait-batch__upload-item {
  :deep(.el-form-item__content) {
    line-height: normal;
  }

  :deep(.el-form-item__error) {
    position: static;
    margin-top: 4px;
  }
}

.portrait-batch__select-wrap {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  width: 100%;
}

.portrait-batch__select-row {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  flex-shrink: 0;
}

.portrait-batch__upload {
  :deep(.el-upload) {
    display: block;
  }
}

.portrait-batch__upload-box,
.portrait-batch__example-img,
.portrait-batch__thumb {
  width: 120px;
  height: 120px;
}

.portrait-batch__upload-box {
  display: flex;
  align-items: center;
  justify-content: center;
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

.portrait-batch__example {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.portrait-batch__example-img {
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  background: #f5f7fa;
}

.portrait-batch__example-label {
  font-size: 12px;
  color: #909399;
}

.portrait-batch__tips {
  flex: 1;
  min-width: 0;
  padding-top: 8px;
  font-size: 13px;
  line-height: 1.6;
  color: #f56c6c;

  p {
    margin: 0;
  }

  p + p {
    margin-top: 4px;
  }
}

.portrait-batch__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, 120px);
  gap: 16px;
  width: 100%;
}

.portrait-batch__card {
  position: relative;
  width: 120px;
}

.portrait-batch__thumb {
  display: block;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  background: #fafafa;
  overflow: hidden;
  cursor: pointer;

  :deep(.el-image__inner) {
    width: 100%;
    height: 100%;
  }
}

.portrait-batch__preview-btn {
  display: block;
  margin: 2px auto 0;
  padding: 0;
  height: auto;
}

.portrait-batch__remove {
  position: absolute;
  top: 4px;
  right: 4px;
  z-index: 1;
  width: 18px;
  height: 18px;
  padding: 0;
  border: none;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.55);
  color: #fff;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;

  &:hover:not(:disabled) {
    background: rgba(0, 0, 0, 0.72);
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }
}

.portrait-batch__filename {
  margin-top: 6px;
  font-size: 12px;
  line-height: 1.4;
  color: #606266;
  text-align: center;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.portrait-batch__submit {
  display: flex;
  justify-content: center;
  padding-top: 8px;
}

.portrait-batch__body :deep(.el-select__wrapper) {
  background: #fafafa;
  box-shadow: none;
  border: 1px solid #f0f2f5;
}

.portrait-batch__body :deep(.el-select__wrapper.is-focused) {
  box-shadow: 0 0 0 1px var(--el-color-primary) inset;
  background: #fff;
}

.portrait-batch__body :deep(.el-form-item__label) {
  color: #606266;
}
</style>
