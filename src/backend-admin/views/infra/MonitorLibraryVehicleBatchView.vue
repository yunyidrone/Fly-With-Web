<template>
  <div class="vehicle-batch">
    <div class="vehicle-batch__section vehicle-batch__section--actions">
      <div class="vehicle-batch__actions">
        <el-button plain class="vehicle-batch__back-btn" @click="goBack">
          <el-icon><ArrowLeft /></el-icon>
          返回
        </el-button>
      </div>
    </div>

    <div class="vehicle-batch__section vehicle-batch__section--title">
      <div class="vehicle-batch__title-row">
        <div class="vehicle-batch__title">新建车牌</div>
        <a
          class="vehicle-batch__template-btn"
          :href="templateHref"
          :download="templateDownloadName"
        >
          <el-icon><Download /></el-icon>
          下载模板
        </a>
      </div>
    </div>

    <div class="vehicle-batch__section vehicle-batch__section--content">
      <el-upload
        class="vehicle-batch__uploader"
        drag
        :auto-upload="false"
        :show-file-list="false"
        accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
        :disabled="importing"
        :on-change="handleFileChange"
      >
        <div class="vehicle-batch__drop">
          <div class="vehicle-batch__folder" aria-hidden="true">
            <svg viewBox="0 0 72 56" width="72" height="56">
              <path
                d="M8 14c0-3.3 2.7-6 6-6h16l6 6h28c3.3 0 6 2.7 6 6v26c0 3.3-2.7 6-6 6H14c-3.3 0-6-2.7-6-6V14z"
                fill="#5b8ff9"
              />
              <path d="M8 22h56v24c0 3.3-2.7 6-6 6H14c-3.3 0-6-2.7-6-6V22z" fill="#3d6fe8" />
              <path d="M20 8h14l6 6H20c-2.2 0-4-1.8-4-4s1.8-4 4-4z" fill="#8fb3ff" />
            </svg>
          </div>
          <p class="vehicle-batch__drop-text">点击或将文件拖拽到这里上传</p>
        </div>
      </el-upload>

      <div v-if="uploadFile" class="vehicle-batch__file">
        <el-icon class="vehicle-batch__file-icon"><Document /></el-icon>
        <div class="vehicle-batch__file-main">
          <div class="vehicle-batch__file-name" :title="uploadFile.name">{{ uploadFile.name }}</div>
          <el-progress
            :percentage="progress"
            :stroke-width="8"
            :show-text="false"
            color="#3d6fe8"
          />
        </div>
        <button
          type="button"
          class="vehicle-batch__file-remove"
          :disabled="importing"
          aria-label="移除文件"
          @click="clearFile"
        >
          <el-icon><Close /></el-icon>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ArrowLeft, Close, Document, Download } from "@element-plus/icons-vue";
import { ElMessage } from "element-plus";
import { createVehicle } from "@backend/api/monitor-library.js";
import { INFRA_BASE } from "@backend/router/routes.js";
import {
  parseVehicleBatchFile,
  VEHICLE_BATCH_TEMPLATE_NAME,
} from "@backend/utils/monitor-library.js";

const ACCEPT_EXT = [".xlsx", ".xls"];
const templateHref = `${String(import.meta.env.BASE_URL || "/").replace(/\/?$/, "/")}templates/vehicle-batch-template.xlsx`;
const templateDownloadName = VEHICLE_BATCH_TEMPLATE_NAME;

const route = useRoute();
const router = useRouter();
const uploadFile = ref(null);
const progress = ref(0);
const importing = ref(false);

function goBack() {
  router.push({
    path: `${INFRA_BASE}/library`,
    query: { tab: "vehicle" },
  });
}

function isExcelFile(file) {
  const name = String(file?.name ?? "").toLowerCase();
  return ACCEPT_EXT.some((ext) => name.endsWith(ext));
}

function clearFile() {
  if (importing.value) return;
  uploadFile.value = null;
  progress.value = 0;
}

async function handleFileChange(file) {
  const raw = file?.raw;
  if (!raw) return;
  if (!isExcelFile(raw)) {
    ElMessage.warning("请上传 Excel 文件（.xlsx / .xls）");
    return;
  }

  uploadFile.value = raw;
  progress.value = 20;
  importing.value = true;

  try {
    const { payloads, errors } = await parseVehicleBatchFile(raw);
    progress.value = 55;

    if (errors.length) {
      ElMessage.error(errors.slice(0, 3).join("；") + (errors.length > 3 ? "…" : ""));
      progress.value = 0;
      return;
    }

    let successCount = 0;
    for (let index = 0; index < payloads.length; index += 1) {
      await createVehicle(payloads[index]);
      successCount += 1;
      progress.value = 55 + Math.round(((index + 1) / payloads.length) * 45);
    }

    progress.value = 100;
    ElMessage.success(`成功导入 ${successCount} 条车辆`);
  } catch (error) {
    progress.value = 0;
    ElMessage.error(error?.message || "导入失败");
  } finally {
    importing.value = false;
  }
}
</script>

<style scoped lang="scss">
.vehicle-batch {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.vehicle-batch__section {
  background: #fff;
  border: 1px solid #ebeef5;
  border-radius: 4px;
}

.vehicle-batch__section--actions {
  padding: 12px 16px;
}

.vehicle-batch__section--title {
  padding: 10px 16px;
  background: #fafafa;
}

.vehicle-batch__title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.vehicle-batch__title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.vehicle-batch__section--content {
  padding: 20px 16px 24px;
}

.vehicle-batch__actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.vehicle-batch__back-btn {
  --el-button-text-color: #d87533;
  --el-button-border-color: #d87533;
  --el-button-hover-text-color: #d87533;
  --el-button-hover-border-color: #d87533;
  --el-button-hover-bg-color: #fdf6f0;
}

.vehicle-batch__template-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-width: 120px;
  height: 32px;
  padding: 0 16px;
  border-radius: 4px;
  background: var(--el-color-primary);
  color: #fff;
  font-size: 14px;
  text-decoration: none;
  box-sizing: border-box;

  &:hover {
    background: var(--el-color-primary-light-3);
    color: #fff;
  }
}

.vehicle-batch__uploader {
  width: 100%;

  :deep(.el-upload) {
    width: 100%;
  }

  :deep(.el-upload-dragger) {
    width: 100%;
    height: 280px;
    padding: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px dashed #dcdfe6;
    border-radius: 6px;
    background: #fafafa;
  }

  :deep(.el-upload-dragger:hover) {
    border-color: var(--el-color-primary);
  }
}

.vehicle-batch__drop {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
}

.vehicle-batch__drop-text {
  margin: 0;
  color: #606266;
  font-size: 14px;
}

.vehicle-batch__file {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 16px;
  padding: 10px 4px;
}

.vehicle-batch__file-icon {
  font-size: 22px;
  color: #3d6fe8;
  flex-shrink: 0;
}

.vehicle-batch__file-main {
  flex: 1;
  min-width: 0;
}

.vehicle-batch__file-name {
  margin-bottom: 8px;
  color: #303133;
  font-size: 13px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.vehicle-batch__file-remove {
  width: 24px;
  height: 24px;
  border: none;
  background: transparent;
  color: #909399;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  &:hover:not(:disabled) {
    color: #606266;
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }
}
</style>
