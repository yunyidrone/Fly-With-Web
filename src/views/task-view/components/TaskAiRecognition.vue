<template>
  <div class="task-ai">
    <div class="task-ai__title">
      <i class="ri-arrow-right-s-line" />
      <span>AI 智能识别</span>
    </div>

    <div v-if="!events.length" class="task-ai__empty">暂无识别记录</div>

    <ul v-else class="task-ai__list">
      <li v-for="event in events" :key="event.key" class="ai-item">
        <span class="ai-item__type">【{{ event.type }}】</span>
        <div class="ai-item__body">
          <div class="ai-item__thumb">
            <img v-if="event.image" :src="event.image" alt="" />
            <i v-else class="ri-image-line" />
          </div>
          <div class="ai-item__meta">
            <div class="ai-item__time">{{ event.time }}</div>
            <div class="ai-item__stat">
              识别人体：{{ event.personCount }}
              <span class="ai-item__acc">{{ event.accuracy }}</span>
            </div>
          </div>
          <div class="ai-item__ops">
            <button type="button" @click="emit('operate', event)">操作</button>
            <button type="button" @click="emit('mark', event)">地图标记</button>
            <button type="button" @click="emit('report', event)">上报</button>
          </div>
        </div>
      </li>
    </ul>
  </div>
</template>

<script setup>
defineProps({
  events: { type: Array, default: () => [] },
});

const emit = defineEmits(["operate", "mark", "report"]);
</script>

<style scoped lang="scss">
.task-ai {
  display: flex;
  flex-direction: column;
  gap: 8px;

  &__title {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 13px;
    font-weight: 500;
    color: #fff;

    i {
      color: #61bdff;
    }
  }

  &__empty {
    padding: 16px;
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
    gap: 8px;
  }
}

.ai-item {
  padding: 8px 10px;
  border-radius: 4px;
  background: #1c222a;

  &__type {
    font-size: 13px;
    font-weight: 600;
    color: #ffb454;
  }

  &__body {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-top: 6px;
  }

  &__thumb {
    flex-shrink: 0;
    width: 56px;
    height: 40px;
    border-radius: 3px;
    overflow: hidden;
    background: rgba(0, 0, 0, 0.4);
    display: flex;
    align-items: center;
    justify-content: center;
    color: rgba(255, 255, 255, 0.35);

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }

  &__meta {
    flex: 1;
    min-width: 0;
  }

  &__time {
    font-size: 12px;
    color: rgba(255, 255, 255, 0.6);
    font-variant-numeric: tabular-nums;
  }

  &__stat {
    margin-top: 3px;
    font-size: 12px;
    color: rgba(255, 255, 255, 0.88);
  }

  &__acc {
    margin-left: 6px;
    color: rgba(84, 237, 206, 0.9);
  }

  &__ops {
    display: flex;
    flex-direction: column;
    gap: 4px;
    flex-shrink: 0;

    button {
      padding: 2px 8px;
      border: 1px solid rgba(85, 142, 252, 0.6);
      border-radius: 2px;
      background: transparent;
      color: #9fd2ff;
      font-size: 11px;
      cursor: pointer;
      transition: background 0.15s ease;

      &:hover {
        background: rgba(85, 142, 252, 0.16);
      }
    }
  }
}
</style>
