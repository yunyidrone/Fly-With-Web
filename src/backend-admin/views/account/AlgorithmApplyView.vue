<template>
  <div class="page-card algorithm-apply">
    <div class="page-toolbar">
      <div class="page-toolbar__title">算法申请</div>
    </div>

    <div class="algorithm-apply__body">
      <el-button class="algorithm-apply__records-btn" round @click="goRecords">
        <el-icon><Tickets /></el-icon>
        申请记录
      </el-button>

      <div class="algorithm-apply__info">
        <div class="algorithm-apply__info-row">
          <span class="algorithm-apply__info-label">审批单位：</span>
          <span class="algorithm-apply__info-org">{{ authStore.orgName || "-" }}</span>
        </div>
        <div class="algorithm-apply__info-row">
          <span class="algorithm-apply__info-label">当前已有算法权限：</span>
          <el-checkbox-group :model-value="ownedCodes" disabled>
            <el-checkbox
              v-for="item in ownedOptions"
              :key="`owned-${item.value}`"
              :label="item.value"
            >
              {{ item.label }}
            </el-checkbox>
          </el-checkbox-group>
          <span v-if="!ownedOptions.length" class="algorithm-apply__empty">-</span>
        </div>
        <div class="algorithm-apply__info-row">
          <span class="algorithm-apply__info-label">正在审核算法权限：</span>
          <el-checkbox-group :model-value="pendingCodes" disabled>
            <el-checkbox
              v-for="item in pendingOptions"
              :key="`pending-${item.value}`"
              :label="item.value"
            >
              {{ item.label }}
            </el-checkbox>
          </el-checkbox-group>
          <span v-if="!pendingOptions.length" class="algorithm-apply__empty">-</span>
        </div>
      </div>

      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="200px"
        class="algorithm-apply__form"
        :disabled="formLocked"
      >
        <el-form-item label="请选择需要申请的算法类型" prop="algorithmCodes">
          <el-checkbox-group v-model="form.algorithmCodes">
            <el-checkbox
              v-for="item in typeOptions"
              :key="item.value"
              :label="item.value"
              :disabled="formLocked || isCodeDisabled(item.value)"
            >
              {{ item.label }}
            </el-checkbox>
          </el-checkbox-group>
        </el-form-item>

        <el-form-item label="请输入申请理由" prop="applyReason">
          <el-input
            v-model="form.applyReason"
            type="textarea"
            :rows="6"
            maxlength="500"
            show-word-limit
            resize="none"
            placeholder="请输入申请理由"
          />
        </el-form-item>

        <el-form-item label="上传证明材料" prop="materials">
          <div v-if="form.materials[0]" class="algorithm-apply__preview">
            <el-image
              :src="form.materials[0].url"
              fit="cover"
              class="algorithm-apply__preview-image"
              :preview-src-list="[form.materials[0].url]"
              preview-teleported
            />
            <button
              type="button"
              class="algorithm-apply__preview-remove"
              :disabled="formLocked"
              @click="removeMaterial"
            >
              <el-icon><Close /></el-icon>
            </button>
          </div>
          <el-upload
            v-else
            class="algorithm-apply__upload"
            :show-file-list="false"
            accept=".jpg,.jpeg,.png,image/jpeg,image/png"
            :auto-upload="false"
            :disabled="formLocked"
            :on-change="handleMaterialChange"
          >
            <div class="algorithm-apply__upload-box">
              <el-icon :size="22"><Plus /></el-icon>
              <span>上传</span>
            </div>
          </el-upload>
        </el-form-item>
      </el-form>

      <p v-if="formLocked" class="algorithm-apply__hint">
        算法正在审核中，需等待上级拒绝或删除后方可再次提交
      </p>

      <div class="algorithm-apply__actions">
        <el-button type="primary" :loading="submitting" :disabled="formLocked" @click="submit">
          提交
        </el-button>
        <el-button text :disabled="formLocked" @click="resetForm">清空</el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from "vue";
import { useRouter } from "vue-router";
import { Close, Plus, Tickets } from "@element-plus/icons-vue";
import { ElMessage } from "element-plus";
import { useAuthStore } from "@/stores/auth.js";
import { uploadFile, UPLOAD_PATH } from "@backend/api/common.js";
import {
  fetchAlgorithmReviewPassList,
  submitAlgorithmReviewApply,
} from "@backend/api/algorithm-review.js";
import {
  ALGORITHM_APPROVAL_RESULT,
  ALGORITHM_CODE_OPTIONS,
  joinAlgorithmCodes,
  resolveAlgorithmCodesFromPassList,
} from "@backend/config/algorithm-apply.js";
import { BACKEND_BASE } from "@backend/router/routes.js";

const ACCEPT_IMAGE_TYPES = ["image/jpeg", "image/png"];
const ACCEPT_IMAGE_EXT = [".jpg", ".jpeg", ".png"];

const router = useRouter();
const authStore = useAuthStore();

const typeOptions = ALGORITHM_CODE_OPTIONS;
const ownedCodes = ref([]);
const pendingCodes = ref([]);

const formRef = ref();
const submitting = ref(false);
const form = reactive({
  algorithmCodes: [],
  applyReason: "",
  materials: [],
});

const ownedCodeSet = computed(() => new Set(ownedCodes.value));
const pendingCodeSet = computed(() => new Set(pendingCodes.value));
const hasPending = computed(() => pendingCodes.value.length > 0);
const formLocked = computed(() => hasPending.value);

const ownedOptions = computed(() =>
  typeOptions.filter((item) => ownedCodeSet.value.has(item.value)),
);
const pendingOptions = computed(() =>
  typeOptions.filter((item) => pendingCodeSet.value.has(item.value)),
);

const rules = {
  algorithmCodes: [
    {
      type: "array",
      required: true,
      min: 1,
      message: "请选择需要申请的算法类型",
      trigger: "change",
    },
  ],
  applyReason: [{ required: true, message: "请输入申请理由", trigger: "blur" }],
};

function resolveApplyUserId() {
  return authStore.user?.id ?? authStore.user?.userId ?? null;
}

async function loadApplyStatus() {
  const applyUserId = resolveApplyUserId();
  if (applyUserId == null || applyUserId === "") {
    ownedCodes.value = [];
    pendingCodes.value = [];
    return;
  }

  try {
    const [approvedData, pendingData] = await Promise.all([
      fetchAlgorithmReviewPassList({
        applyUserId,
        approvalResult: ALGORITHM_APPROVAL_RESULT.APPROVED,
      }),
      fetchAlgorithmReviewPassList({
        applyUserId,
        approvalResult: ALGORITHM_APPROVAL_RESULT.PENDING,
      }),
    ]);
    ownedCodes.value = resolveAlgorithmCodesFromPassList(approvedData);
    pendingCodes.value = resolveAlgorithmCodesFromPassList(pendingData);
  } catch {
    ownedCodes.value = [];
    pendingCodes.value = [];
  }
}

function isCodeDisabled(code) {
  return ownedCodeSet.value.has(code) || pendingCodeSet.value.has(code);
}

function isAcceptedImage(file) {
  const type = String(file?.type ?? "").toLowerCase();
  if (ACCEPT_IMAGE_TYPES.includes(type)) return true;
  const name = String(file?.name ?? "").toLowerCase();
  return ACCEPT_IMAGE_EXT.some((ext) => name.endsWith(ext));
}

function revokeMaterialPreview() {
  const url = form.materials[0]?.url;
  if (url?.startsWith("blob:")) {
    URL.revokeObjectURL(url);
  }
}

function handleMaterialChange(uploadFile) {
  const raw = uploadFile?.raw;
  if (!raw) return;
  if (!isAcceptedImage(raw)) {
    ElMessage.warning("请上传 jpg、jpeg、png 格式的图片");
    return;
  }
  revokeMaterialPreview();
  form.materials = [
    {
      url: URL.createObjectURL(raw),
      name: raw.name,
      file: raw,
    },
  ];
}

function removeMaterial() {
  revokeMaterialPreview();
  form.materials = [];
}

function resetForm() {
  revokeMaterialPreview();
  form.algorithmCodes = [];
  form.applyReason = "";
  form.materials = [];
  formRef.value?.clearValidate();
}

function goRecords() {
  router.push(`${BACKEND_BASE}/algorithm-apply/records`);
}

async function resolveCertificateUrl() {
  const material = form.materials[0];
  if (!material) return "";
  if (material.file) {
    return uploadFile(material.file, UPLOAD_PATH.ALGORITHM_IMAGE);
  }
  const url = String(material.url ?? "").trim();
  return url.startsWith("blob:") ? "" : url;
}

async function submit() {
  if (formLocked.value) {
    ElMessage.warning("算法正在审核中，请等待上级拒绝或删除后再提交");
    return;
  }

  const applyUserId = resolveApplyUserId();
  if (applyUserId == null || applyUserId === "") {
    ElMessage.warning("无法获取当前用户信息，请重新登录后再试");
    return;
  }

  await formRef.value.validate();

  const selected = form.algorithmCodes.filter((code) => !isCodeDisabled(code));
  if (!selected.length) {
    ElMessage.warning("已通过审批或审核中的算法不可再次申请");
    return;
  }

  submitting.value = true;
  try {
    const certificateUrl = await resolveCertificateUrl();
    await submitAlgorithmReviewApply({
      applyUserId,
      algorithmCode: joinAlgorithmCodes(selected),
      applyReason: form.applyReason.trim(),
      certificateUrl: certificateUrl || undefined,
    });
    ElMessage.success("提交成功");
    resetForm();
    await loadApplyStatus();
  } catch (error) {
    ElMessage.warning(error?.message || "提交失败");
  } finally {
    submitting.value = false;
  }
}

onMounted(() => {
  loadApplyStatus();
});
</script>

<style scoped lang="scss">
.algorithm-apply__body {
  position: relative;
  padding-top: 8px;
}

.algorithm-apply__records-btn {
  position: absolute;
  top: 0;
  right: 0;
  height: 36px;
  padding: 0 16px;
  color: var(--el-color-primary);
  border-color: var(--el-color-primary);
  background: #fff;

  .el-icon {
    margin-right: 6px;
  }

  &:hover,
  &:focus {
    color: var(--el-color-primary);
    border-color: var(--el-color-primary);
    background: var(--el-color-primary-light-9);
  }
}

.algorithm-apply__info {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 28px;
  padding-right: 140px;
}

.algorithm-apply__info-row {
  display: flex;
  align-items: center;
  min-height: 22px;
  font-size: 14px;
  line-height: 22px;
  color: #606266;
}

.algorithm-apply__info-label {
  flex-shrink: 0;
}

.algorithm-apply__info-org {
  color: var(--el-color-primary);
  font-weight: 600;
}

.algorithm-apply__empty {
  color: #909399;
}

.algorithm-apply__info-row :deep(.el-checkbox-group) {
  display: inline-flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px 16px;
}

.algorithm-apply__form {
  max-width: 760px;
}

.algorithm-apply__form :deep(.el-textarea__inner) {
  background: #f7f8fa;
  box-shadow: none;
  border: 1px solid #f0f2f5;
}

.algorithm-apply__form :deep(.el-textarea__inner:focus) {
  background: #fff;
  box-shadow: 0 0 0 1px var(--el-color-primary) inset;
}

.algorithm-apply__upload {
  :deep(.el-upload) {
    display: block;
  }
}

.algorithm-apply__upload-box,
.algorithm-apply__preview {
  width: 88px;
  height: 88px;
}

.algorithm-apply__upload-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  border: 1px dashed #dcdfe6;
  border-radius: 6px;
  background: #fafafa;
  color: #c0c4cc;
  font-size: 12px;
  cursor: pointer;

  &:hover {
    border-color: var(--el-color-primary);
    color: var(--el-color-primary);
  }
}

.algorithm-apply__preview {
  position: relative;
}

.algorithm-apply__preview-image {
  width: 88px;
  height: 88px;
  border: 1px solid #ebeef5;
  border-radius: 6px;
  overflow: hidden;
  background: #fafafa;

  :deep(.el-image__inner) {
    width: 100%;
    height: 100%;
  }
}

.algorithm-apply__preview-remove {
  position: absolute;
  top: -8px;
  right: -8px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  padding: 0;
  border: none;
  border-radius: 50%;
  background: #909399;
  color: #fff;
  cursor: pointer;

  &:hover {
    background: #f56c6c;
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }
}

.algorithm-apply__hint {
  margin: 0 0 12px;
  padding-left: 200px;
  font-size: 13px;
  color: #e6a23c;
}

.algorithm-apply__actions {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-top: 8px;
  padding-left: 200px;

  .el-button {
    min-width: 72px;
  }
}
</style>
