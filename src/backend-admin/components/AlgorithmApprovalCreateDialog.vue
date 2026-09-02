<template>
  <el-dialog
    :model-value="visible"
    title="新增算法审批"
    width="560px"
    destroy-on-close
    class="algorithm-approval-create-dialog"
    @close="handleClose"
  >
    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-width="120px"
      class="algorithm-approval-create-dialog__form"
    >
      <el-form-item label="选择账户" prop="applyUserId" required>
        <el-select
          v-model="form.applyUserId"
          placeholder="请选择账户"
          filterable
          clearable
          :loading="accountLoading"
          class="algorithm-approval-create-dialog__account-select"
        >
          <el-option
            v-for="item in accountOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>

      <el-form-item label="选择算法" prop="algorithmCodes" required>
        <el-checkbox-group v-model="form.algorithmCodes">
          <el-checkbox
            v-for="item in typeOptions"
            :key="item.value"
            :label="item.value"
          >
            {{ item.label }}
          </el-checkbox>
        </el-checkbox-group>
      </el-form-item>

      <el-form-item label="审批原因" prop="approvalReason">
        <el-input
          v-model="form.approvalReason"
          type="textarea"
          :rows="4"
          resize="none"
          placeholder="请输入"
        />
      </el-form-item>

      <el-form-item label="证明材料" prop="materials">
        <div v-if="form.materials[0]" class="algorithm-approval-create-dialog__preview">
          <el-image
            :src="form.materials[0].url"
            fit="cover"
            class="algorithm-approval-create-dialog__preview-image"
            :preview-src-list="[form.materials[0].url]"
            preview-teleported
          />
          <button type="button" class="algorithm-approval-create-dialog__preview-remove" @click="removeMaterial">
            <el-icon><Close /></el-icon>
          </button>
        </div>
        <el-upload
          v-else
          class="algorithm-approval-create-dialog__upload"
          :show-file-list="false"
          accept=".jpg,.jpeg,.png,image/jpeg,image/png"
          :auto-upload="false"
          :on-change="handleMaterialChange"
        >
          <div class="algorithm-approval-create-dialog__upload-box">
            <el-icon :size="22"><Plus /></el-icon>
            <span>上传</span>
          </div>
        </el-upload>
      </el-form-item>
    </el-form>

    <template #footer>
      <div class="algorithm-approval-create-dialog__footer">
        <el-button type="primary" :loading="submitting" @click="submit">确认</el-button>
        <el-button :disabled="submitting" @click="resetForm">清空</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { reactive, ref, watch } from "vue";
import { Close, Plus } from "@element-plus/icons-vue";
import { ElMessage } from "element-plus";
import { useAuthStore } from "@/stores/auth.js";
import { fetchUserPage } from "@backend/api/user.js";
import { uploadFile, UPLOAD_PATH } from "@backend/api/common.js";
import { addAlgorithmReview } from "@backend/api/algorithm-review.js";
import { unwrapApiList } from "@backend/utils/request.js";
import {
  ALGORITHM_APPROVAL_RESULT,
  ALGORITHM_CODE_OPTIONS,
  joinAlgorithmCodes,
} from "@backend/config/algorithm-apply.js";

const ACCEPT_IMAGE_TYPES = ["image/jpeg", "image/png"];
const ACCEPT_IMAGE_EXT = [".jpg", ".jpeg", ".png"];

const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
  orgId: {
    type: [String, Number],
    default: null,
  },
});

const emit = defineEmits(["update:visible", "success"]);

const authStore = useAuthStore();
const typeOptions = ALGORITHM_CODE_OPTIONS;
const formRef = ref();
const submitting = ref(false);
const accountLoading = ref(false);
const accountOptions = ref([]);

const form = reactive({
  applyUserId: null,
  algorithmCodes: [],
  approvalReason: "",
  materials: [],
});

const rules = {
  applyUserId: [{ required: true, message: "请选择账户", trigger: "change" }],
  algorithmCodes: [
    {
      type: "array",
      required: true,
      min: 1,
      message: "请选择算法",
      trigger: "change",
    },
  ],
};

watch(
  () => props.visible,
  (value) => {
    if (!value) return;
    resetForm();
    loadAccountOptions();
  },
);

watch(
  () => props.orgId,
  () => {
    if (props.visible) {
      loadAccountOptions();
    }
  },
);

function resolveApprovalUserId() {
  return authStore.user?.id ?? authStore.user?.userId ?? null;
}

async function loadAccountOptions() {
  const orgId = props.orgId;
  if (orgId == null || orgId === "") {
    accountOptions.value = [];
    return;
  }

  accountLoading.value = true;
  try {
    const data = await fetchUserPage({
      orgId,
      current: 1,
      pageSize: 500,
    });
    const currentUserId = resolveApprovalUserId();
    accountOptions.value = unwrapApiList(data)
      .map((item) => ({
        value: item.id ?? item.userId,
        label: item.userName || item.username || String(item.id ?? item.userId ?? ""),
      }))
      .filter((item) => item.value != null && item.value !== "")
      .filter(
        (item) =>
          currentUserId == null ||
          String(item.value) !== String(currentUserId),
      );
  } catch {
    accountOptions.value = [];
  } finally {
    accountLoading.value = false;
  }
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
  form.applyUserId = null;
  form.algorithmCodes = [];
  form.approvalReason = "";
  form.materials = [];
  formRef.value?.clearValidate();
}

function handleClose() {
  emit("update:visible", false);
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
  const approvalUserId = resolveApprovalUserId();
  if (approvalUserId == null || approvalUserId === "") {
    ElMessage.warning("无法获取当前审批人信息，请重新登录后再试");
    return;
  }

  await formRef.value.validate();

  submitting.value = true;
  try {
    const certificateUrl = await resolveCertificateUrl();
    await addAlgorithmReview({
      applyUserId: form.applyUserId,
      algorithmCode: joinAlgorithmCodes(form.algorithmCodes),
      approvalUserId,
      approvalResult: ALGORITHM_APPROVAL_RESULT.APPROVED,
      approvalReason: form.approvalReason.trim(),
      certificateUrl: certificateUrl || undefined,
    });
    emit("success");
    emit("update:visible", false);
    resetForm();
  } catch (error) {
    ElMessage.warning(error?.message || "新增审批失败");
  } finally {
    submitting.value = false;
  }
}
</script>

<style scoped lang="scss">
.algorithm-approval-create-dialog__form {
  :deep(.el-form-item__label) {
    color: #606266;
  }

  :deep(.el-form-item.is-required:not(.is-no-asterisk) > .el-form-item__label::before) {
    color: #f56c6c;
  }
}

.algorithm-approval-create-dialog__account-select {
  width: 100%;
}

.algorithm-approval-create-dialog__upload {
  :deep(.el-upload) {
    display: block;
  }
}

.algorithm-approval-create-dialog__upload-box,
.algorithm-approval-create-dialog__preview {
  width: 88px;
  height: 88px;
}

.algorithm-approval-create-dialog__upload-box {
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

.algorithm-approval-create-dialog__preview {
  position: relative;
}

.algorithm-approval-create-dialog__preview-image {
  width: 88px;
  height: 88px;
  border: 1px solid #ebeef5;
  border-radius: 6px;
  overflow: hidden;

  :deep(.el-image__inner) {
    width: 100%;
    height: 100%;
  }
}

.algorithm-approval-create-dialog__preview-remove {
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
}

.algorithm-approval-create-dialog__footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>
