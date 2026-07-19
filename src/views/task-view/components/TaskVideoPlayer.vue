<template>
  <div class="task-video">
    <div class="task-video__title">
      <i class="ri-arrow-right-s-line" />
      <span>{{ video.title || "无人机视角" }}</span>
    </div>
    <div class="task-video__stage">
      <video
        v-if="video.src"
        class="task-video__el"
        :src="video.src"
        :poster="video.poster || undefined"
        controls
        playsinline
        webkit-playsinline
      />
      <div v-else class="task-video__placeholder">
        <i class="ri-film-line" />
        <span>暂无视频源</span>
        <div class="task-video__fake-bar">
          <span class="task-video__fake-time">{{ formatTime(video.currentTime) }}</span>
          <span class="task-video__fake-track">
            <span class="task-video__fake-progress" :style="{ width: progressPercent }" />
          </span>
          <span class="task-video__fake-time">{{ formatTime(video.duration) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  video: { type: Object, default: () => ({}) },
});

const progressPercent = computed(() => {
  const cur = Number(props.video.currentTime) || 0;
  const dur = Number(props.video.duration) || 0;
  if (dur <= 0) return "0%";
  return `${Math.min(100, (cur / dur) * 100)}%`;
});

function formatTime(seconds) {
  const s = Number(seconds);
  if (!Number.isFinite(s) || s < 0) return "00:00";
  const m = Math.floor(s / 60);
  const rest = Math.floor(s % 60);
  return `${String(m).padStart(2, "0")}:${String(rest).padStart(2, "0")}`;
}
</script>

<style scoped lang="scss">
.task-video {
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

  &__stage {
    position: relative;
    width: 100%;
    aspect-ratio: 16 / 9;
    border-radius: 6px;
    overflow: hidden;
    background: #000;
  }

  &__el {
    width: 100%;
    height: 100%;
    object-fit: contain;
    display: block;
  }

  &__placeholder {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    color: rgba(255, 255, 255, 0.4);
    font-size: 13px;

    i {
      font-size: 30px;
    }
  }

  &__fake-bar {
    position: absolute;
    left: 12px;
    right: 12px;
    bottom: 12px;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  &__fake-time {
    font-size: 11px;
    color: rgba(255, 255, 255, 0.65);
    font-variant-numeric: tabular-nums;
  }

  &__fake-track {
    position: relative;
    flex: 1;
    height: 3px;
    border-radius: 2px;
    background: rgba(255, 255, 255, 0.2);
    overflow: hidden;
  }

  &__fake-progress {
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    background: #558efc;
  }
}
</style>
