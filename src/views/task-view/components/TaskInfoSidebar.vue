<template>
  <aside class="task-info">
    <div class="task-info__section">
      <div class="task-info__title">任务记录</div>

      <div class="task-info__field">
        <span class="task-info__label">触发方式</span>
        <div class="trigger-switch" role="group" aria-label="触发方式">
          <button
            v-for="mode in triggerModes"
            :key="mode.value"
            type="button"
            class="trigger-switch__opt"
            :class="{ 'trigger-switch__opt--active': mode.value === info.triggerMode }"
            @click="emit('change-trigger', mode.value)"
          >
            {{ mode.label }}
          </button>
        </div>
      </div>

      <div class="task-info__field">
        <span class="task-info__label">装备配置</span>
        <span class="task-info__value">{{ info.equipment || "—" }}</span>
      </div>
      <div class="task-info__field">
        <span class="task-info__label">任务ID</span>
        <span class="task-info__value">{{ info.taskId || "—" }}</span>
      </div>
      <div class="task-info__field">
        <span class="task-info__label">任务开始时间</span>
        <span class="task-info__value">{{ info.startTime || "—" }}</span>
      </div>
      <div class="task-info__field">
        <span class="task-info__label">任务状态</span>
        <span class="task-info__status">{{ info.status || "—" }}</span>
      </div>
    </div>

    <div class="task-info__section task-info__section--catalog">
      <div class="task-info__title">任务目录</div>
      <div class="catalog-scroll">
        <el-timeline class="catalog-timeline">
          <el-timeline-item
            v-for="item in catalog"
            :key="item.key"
            :hollow="item.key !== activeKey"
            :color="item.key === activeKey ? '#61bdff' : 'rgba(255,255,255,0.35)'"
          >
            <div
              class="catalog-item"
              :class="{ 'catalog-item--active': item.key === activeKey }"
              @click="emit('select-catalog', item)"
            >
              <div class="catalog-item__row">
                <span class="catalog-item__name">{{ item.title }}</span>
                <span class="catalog-item__time">{{ item.time }}</span>
              </div>
              <div class="catalog-item__desc">{{ item.desc }}</div>
            </div>
          </el-timeline-item>
        </el-timeline>
      </div>
    </div>
  </aside>
</template>

<script setup>
defineProps({
  info: { type: Object, default: () => ({}) },
  catalog: { type: Array, default: () => [] },
  triggerModes: { type: Array, default: () => [] },
  activeKey: { type: String, default: "" },
});

const emit = defineEmits(["change-trigger", "select-catalog"]);
</script>

<style scoped lang="scss">
.task-info {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  gap: 12px;
  padding: 12px;
  box-sizing: border-box;
  border: 1px solid #30363b;
  border-radius: 6px;
  background: rgba(3, 6, 10, 0.65);
  color: rgba(255, 255, 255, 0.88);

  &__section {
    display: flex;
    flex-direction: column;
    gap: 10px;

    &--catalog {
      flex: 1 1 auto;
      min-height: 0;
    }
  }

  &__title {
    font-size: 14px;
    font-weight: 600;
    color: #fff;
    padding-left: 8px;
    border-left: 3px solid #558efc;
    line-height: 1.2;
  }

  &__field {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    font-size: 13px;
  }

  &__label {
    flex-shrink: 0;
    color: rgba(255, 255, 255, 0.45);
  }

  &__value {
    color: rgba(255, 255, 255, 0.92);
    text-align: right;
    word-break: break-all;
  }

  &__status {
    color: rgba(84, 237, 206, 0.9);
    font-weight: 500;
  }
}

.trigger-switch {
  display: inline-flex;
  border: 1px solid #2f7ad8;
  border-radius: 2px;
  overflow: hidden;

  &__opt {
    padding: 3px 10px;
    border: 0;
    background: transparent;
    color: rgba(255, 255, 255, 0.6);
    font-size: 12px;
    cursor: pointer;
    transition: background 0.15s ease, color 0.15s ease;

    & + & {
      border-left: 1px solid rgba(47, 122, 216, 0.6);
    }

    &--active {
      background: rgba(85, 142, 252, 0.28);
      color: #fff;
    }
  }
}

.catalog-scroll {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  padding: 6px 2px 0 2px;

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
    background: rgba(255, 255, 255, 0.25);
  }
}

.catalog-item {
  cursor: pointer;
  padding: 2px 8px 2px 0;
  border-radius: 4px;
  transition: background 0.15s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.04);
  }

  &--active {
    background: rgba(85, 142, 252, 0.14);
  }

  &__row {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 8px;
  }

  &__name {
    flex: 1 1 auto;
    min-width: 0;
    font-size: 13px;
    color: #9fd2ff;
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__time {
    flex-shrink: 0;
    font-size: 11px;
    color: rgba(255, 255, 255, 0.4);
    font-variant-numeric: tabular-nums;
  }

  &__desc {
    margin-top: 2px;
    font-size: 12px;
    color: rgba(255, 255, 255, 0.6);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

/* Element Plus 时间线深色适配 */
.catalog-timeline {
  padding-left: 2px;

  :deep(.el-timeline-item__tail) {
    border-left-color: rgba(255, 255, 255, 0.14);
  }

  :deep(.el-timeline-item__timestamp) {
    color: rgba(255, 255, 255, 0.4);
    font-size: 11px;
    font-variant-numeric: tabular-nums;
  }

  :deep(.el-timeline-item__wrapper) {
    padding-left: 22px;
  }
}
</style>
