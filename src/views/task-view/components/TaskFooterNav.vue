<template>
  <footer class="task-footer">
    <button
      type="button"
      class="task-footer__btn"
      :disabled="!hasPrev"
      @click="emit('prev')"
    >
      <i class="ri-arrow-left-s-line" />
      上个任务
    </button>
    <button
      type="button"
      class="task-footer__btn"
      :disabled="!hasNext"
      @click="emit('next')"
    >
      下一任务
      <i class="ri-arrow-right-s-line" />
    </button>
    <button
      type="button"
      class="task-footer__btn task-footer__btn--exit"
      @click="emit('exit')"
    >
      <i class="ri-logout-box-r-line" />
      退出
    </button>
  </footer>
</template>

<script setup>
defineProps({
  hasPrev: { type: Boolean, default: true },
  hasNext: { type: Boolean, default: true },
});

const emit = defineEmits(["prev", "next", "exit"]);
</script>

<style scoped lang="scss">
.task-footer {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
  /* 填满右栏宽度（右栏本身即 360px，与设备面板同宽） */
  width: 100%;

  &__btn {
    flex: 1 1 0;
    min-width: 0;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    height: 40px;
    padding: 0 8px;
    border: 1px solid #558efc;
    border-radius: 6px;
    background: rgba(255, 255, 255, 0.02);
    color: #fff;
    font-size: 14px;
    white-space: nowrap;
    cursor: pointer;
    transition: background 0.15s ease, border-color 0.15s ease;

    &:hover:not(:disabled) {
      background: rgba(85, 142, 252, 0.16);
      border-color: #6d9fff;
    }

    &:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }

    &--exit {
      border-color: #f28b9a;
      color: #ffd7dc;

      &:hover:not(:disabled) {
        background: rgba(242, 139, 154, 0.16);
        border-color: #ff9aa8;
      }
    }
  }
}
</style>
