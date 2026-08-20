<!--

 * @Description: AI 智能识别列表面板（可接接口替换 events）

-->

<template>
  <section class="ai-recognition">
    <div class="ai-recognition__title">
      <img
        :src="arrowRightPng"
        alt=""
        class="ai-recognition__arrow"
        width="16"
        height="16"
        aria-hidden="true"
      />

      <span>AI智能识别</span>
    </div>

    <div v-if="!displayEvents.length" class="ai-recognition__empty">
      暂无识别记录
    </div>

    <ul v-else class="ai-recognition__list">
      <li v-for="event in displayEvents" :key="event.key" class="ai-row">
        <span class="ai-row__type">【{{ event.type }}】</span>

        <div
          class="ai-row__thumb"
          :class="{
            'ai-row__thumb--clickable': !!event.image,
          }"
        >
          <el-image
            v-if="event.image"
            class="ai-row__thumb-image"
            :src="event.image"
            fit="cover"
            lazy
            :preview-src-list="[event.image]"
            preview-teleported
            :preview-z-index="10200"
            hide-on-click-modal
          >
            <template #placeholder>
              <div class="ai-row__thumb-loading">
                <i class="ri-loader-4-line ai-row__thumb-loading-icon" aria-hidden="true" />
              </div>
            </template>
            <template #error>
              <div class="ai-row__thumb-error">
                <i class="ri-image-line" aria-hidden="true" />
              </div>
            </template>
          </el-image>

          <i v-else class="ri-image-line" aria-hidden="true" />
        </div>

        <span class="ai-row__time">{{ event.time }}</span>

        <span class="ai-row__result">{{ event.result }}</span>

        <span class="ai-row__coord">{{ event.coord }}</span>

        <!-- <div class="ai-row__ops">

          <span class="ai-row__ops-label">操作</span>

          <button type="button" class="ai-row__ops-btn" @click="emit('mark', event)">

            地图标记

          </button>

          <button

            type="button"

            class="ai-row__ops-btn ai-row__ops-btn--report"

            @click="emit('report', event)"

          >

            <i class="ri-pushpin-2-fill" aria-hidden="true" />

            上报

          </button>

        </div> -->
      </li>
    </ul>
  </section>
</template>

<script setup>
import { computed } from "vue";

import arrowRightPng from "@/assets/images/arrow_right.png";

const props = defineProps({
  /** 识别事件列表 */

  events: { type: Array, default: () => [] },
});

const emit = defineEmits(["mark", "report"]);

const displayEvents = computed(() => props.events);
</script>

<style scoped lang="scss">
.ai-recognition {
  flex: 1 1 auto;

  min-height: 0;

  display: flex;

  flex-direction: column;

  margin: 0 12px 12px;

  padding: 8px 10px;

  border-radius: 2px;

  background: #1c222a;

  &__arrow {
    width: 16px;

    height: 16px;

    object-fit: contain;

    flex-shrink: 0;

    display: block;
  }

  &__title {
    display: inline-flex;

    align-items: center;

    gap: 6px;

    margin-bottom: 8px;

    font-size: 14px;

    font-weight: 500;

    color: #fff;

    flex-shrink: 0;
  }

  &__empty {
    padding: 12px 0;

    text-align: center;

    font-size: 13px;

    color: rgba(255, 255, 255, 0.4);
  }

  &__list {
    list-style: none;

    margin: 0;

    padding: 0;

    display: flex;

    flex-direction: column;

    gap: 10px;

    flex: 1 1 auto;

    min-height: 0;

    overflow-x: hidden;

    overflow-y: auto;

    scrollbar-width: thin;

    scrollbar-color: rgba(255, 255, 255, 0.18) transparent;

    &::-webkit-scrollbar {
      width: 4px;
    }

    &::-webkit-scrollbar-track {
      background: transparent;
    }

    &::-webkit-scrollbar-thumb {
      background: rgba(255, 255, 255, 0.15);

      border-radius: 2px;
    }

    &::-webkit-scrollbar-thumb:hover {
      background: rgba(255, 255, 255, 0.28);
    }
  }
}

.ai-row {
  display: flex;

  flex-direction: row;

  align-items: center;

  gap: 10px;

  min-width: 0;

  font-size: 13px;

  color: rgba(255, 255, 255, 0.88);

  &__type {
    flex-shrink: 0;

    font-weight: 500;

    color: #fff;

    white-space: nowrap;
  }

  &__thumb {
    flex-shrink: 0;

    width: 40px;

    height: 40px;

    border-radius: 2px;

    overflow: hidden;

    background: rgba(0, 0, 0, 0.45);

    display: flex;

    align-items: center;

    justify-content: center;

    color: rgba(255, 255, 255, 0.35);

    font-size: 18px;

    &--clickable {
      cursor: zoom-in;
    }

    &:hover .ai-row__thumb-image {
      opacity: 0.88;
    }
  }

  &__thumb-image {
    width: 100%;

    height: 100%;

    display: block;

    :deep(.el-image__inner) {
      width: 100%;

      height: 100%;

      object-fit: cover;

      transition: opacity 0.15s ease;
    }
  }

  &__thumb-loading,
  &__thumb-error {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.45);
    color: rgba(255, 255, 255, 0.45);
  }

  &__thumb-loading-icon {
    font-size: 16px;
    animation: ai-row-thumb-spin 0.9s linear infinite;
  }

  &__thumb-error {
    font-size: 18px;
  }

  &__time {
    flex-shrink: 0;

    font-variant-numeric: tabular-nums;

    color: rgba(255, 255, 255, 0.78);

    white-space: nowrap;
  }

  &__result {
    flex: 1 1 auto;

    min-width: 0;

    color: rgba(255, 255, 255, 0.88);

    white-space: nowrap;

    overflow: hidden;

    text-overflow: ellipsis;
  }

  &__coord {
    flex-shrink: 0;

    color: rgba(255, 255, 255, 0.55);

    white-space: nowrap;
  }

  &__ops {
    flex-shrink: 0;

    display: flex;

    flex-direction: column;

    align-items: flex-end;

    gap: 2px;

    min-width: 56px;
  }

  &__ops-label {
    font-size: 12px;

    color: rgba(255, 255, 255, 0.55);

    line-height: 1.2;
  }

  &__ops-btn {
    padding: 0;

    border: 0;

    background: transparent;

    color: #9fd2ff;

    font-size: 12px;

    line-height: 1.4;

    cursor: pointer;

    white-space: nowrap;

    &:hover {
      color: #c5e2ff;
    }

    &--report {
      display: inline-flex;

      align-items: center;

      gap: 2px;

      color: #f28b9a;

      i {
        font-size: 12px;
      }

      &:hover {
        color: #ffb0bb;
      }
    }
  }
}

@keyframes ai-row-thumb-spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
