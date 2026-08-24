<!--
 * @Description: AI 识别事件详情弹窗（alertCheck 返回 2000 时展示，识别结果取自接口 data）
-->
<template>
  <Teleport to="body">
    <Transition name="ai-alert-detail-fade">
      <div
        v-if="visible"
        class="ai-alert-detail-mask"
        @click.self="emit('close')"
      >
        <div
          class="ai-alert-detail"
          role="dialog"
          aria-modal="true"
          aria-label="预警事件"
        >
          <header class="ai-alert-detail__head">
            <h3 class="ai-alert-detail__title">预警事件</h3>
            <button
              type="button"
              class="ai-alert-detail__close"
              aria-label="关闭"
              @click="emit('close')"
            >
              <i class="ri-close-line" aria-hidden="true" />
            </button>
          </header>

          <div v-if="previewImage" class="ai-alert-detail__image-wrap">
            <el-image
              :src="previewImage"
              fit="contain"
              class="ai-alert-detail__image"
              :preview-src-list="[]"
            >
              <template #placeholder>
                <div class="ai-alert-detail__image-loading">
                  <i class="ri-loader-4-line ai-alert-detail__image-loading-icon" aria-hidden="true" />
                  <span>图片加载中</span>
                </div>
              </template>
              <template #error>
                <div class="ai-alert-detail__image-error">图片加载失败</div>
              </template>
            </el-image>
          </div>

          <dl class="ai-alert-detail__meta">
            <div class="ai-alert-detail__row">
              <dt>事件名称：</dt>
              <dd>{{ eventName }}</dd>
            </div>
            <div class="ai-alert-detail__row">
              <dt>识别结果：</dt>
              <dd>{{ recognitionResult }}</dd>
            </div>
            <div class="ai-alert-detail__row">
              <dt>事件时间：</dt>
              <dd>{{ eventTime }}</dd>
            </div>
            <div class="ai-alert-detail__row">
              <dt>事件经纬度：</dt>
              <dd>{{ coordText }}</dd>
            </div>
          </dl>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { computed } from "vue";
import { formatAiAlertCoord } from "@/utils/drone-ai-result.js";

const props = defineProps({
  visible: { type: Boolean, default: false },
  /** normalizeWarnEvent 结构或兼容对象 */
  detail: { type: Object, default: null },
});

const emit = defineEmits(["close"]);

const eventName = computed(() => {
  const d = props.detail;
  return String(d?.warnType ?? d?.name ?? d?.type ?? "—").trim() || "—";
});

const recognitionResult = computed(() => {
  const d = props.detail;
  return String(d?.aiResult ?? d?.result ?? "—").trim() || "—";
});

const eventTime = computed(() => {
  const d = props.detail;
  return String(d?.eventTime ?? d?.time ?? "—").trim() || "—";
});

const coordText = computed(() => formatAiAlertCoord(props.detail));

const previewImage = computed(() => {
  const d = props.detail;
  if (!d) return "";

  const name = String(d?.warnType ?? d?.name ?? d?.type ?? "").trim();
  const isFaceEvent = name === "人脸" || name.includes("人脸");

  if (isFaceEvent) {
    return String(d?.originalImageUrl ?? d?.imageUrl ?? d?.image ?? "").trim();
  }

  return String(d?.imageUrl ?? d?.image ?? "").trim();
});
</script>

<style scoped lang="scss">
.ai-alert-detail-mask {
  position: fixed;
  inset: 0;
  z-index: 10250;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: rgba(0, 0, 0, 0.55);
  box-sizing: border-box;
}

.ai-alert-detail {
  width: min(420px, 100%);
  max-height: min(90vh, 720px);
  overflow: auto;
  padding: 16px 18px 18px;
  border-radius: 6px;
  border: 1px solid #30363b;
  background: rgba(3, 6, 10, 0.92);
  color: rgba(255, 255, 255, 0.88);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.45);
  box-sizing: border-box;

  &__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 14px;
  }

  &__title {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
    line-height: 1.3;
    color: #fff;
  }

  &__close {
    flex-shrink: 0;
    width: 28px;
    height: 28px;
    padding: 0;
    border: 0;
    border-radius: 4px;
    background: transparent;
    color: rgba(255, 255, 255, 0.72);
    font-size: 20px;
    line-height: 1;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;

    &:hover {
      color: #fff;
      background: rgba(255, 255, 255, 0.08);
    }
  }

  &__image-wrap {
    margin-bottom: 14px;
    border-radius: 4px;
    overflow: hidden;
    background: rgba(0, 0, 0, 0.45);
    min-height: 160px;
  }

  &__image {
    display: block;
    width: 100%;
    height: 220px;

    :deep(.el-image__inner) {
      width: 100%;
      height: 220px;
      object-fit: contain;
    }
  }

  &__image-loading,
  &__image-error {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    width: 100%;
    height: 220px;
    color: rgba(255, 255, 255, 0.55);
    font-size: 13px;
  }

  &__image-loading-icon {
    font-size: 22px;
    animation: ai-alert-detail-spin 0.9s linear infinite;
  }

  &__meta {
    margin: 0;
  }

  &__row {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;
    padding: 12px 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    font-size: 14px;
    line-height: 1.5;

    &:last-child {
      border-bottom: 0;
      padding-bottom: 0;
    }

    dt {
      flex-shrink: 0;
      margin: 0;
      color: rgba(255, 255, 255, 0.72);
      font-weight: 400;
    }

    dd {
      margin: 0;
      text-align: right;
      color: #fff;
      word-break: break-all;
    }
  }
}

@keyframes ai-alert-detail-spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.ai-alert-detail-fade-enter-active,
.ai-alert-detail-fade-leave-active {
  transition: opacity 0.2s ease;
}

.ai-alert-detail-fade-enter-from,
.ai-alert-detail-fade-leave-to {
  opacity: 0;
}
</style>
