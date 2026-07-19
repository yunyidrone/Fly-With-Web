<template>
  <aside class="task-device">
    <div class="task-device__head">
      <span class="task-device__name">设备名称：{{ device.name || "—" }}</span>
      <span class="task-device__battery">电量：{{ batteryText }}</span>
    </div>
    <div class="task-device__sub">
      <span>型号：{{ device.model || "—" }}</span>
      <span>信号强度：{{ signalText }}</span>
    </div>
    <div class="task-device__sub">
      <span>SN：{{ device.sn || "—" }}</span>
      <span>ID：{{ device.id || "—" }}</span>
    </div>

    <div class="telemetry">
      <div class="telemetry__cell">
        <span class="telemetry__label">经度</span>
        <span class="telemetry__value">{{ coord(device.lng) }}</span>
      </div>
      <div class="telemetry__cell">
        <span class="telemetry__label">纬度</span>
        <span class="telemetry__value">{{ coord(device.lat) }}</span>
      </div>
      <div class="telemetry__cell">
        <span class="telemetry__label">高度</span>
        <span class="telemetry__value">{{ num(device.height, "m") }}</span>
      </div>
    </div>
    <div class="telemetry">
      <div class="telemetry__cell">
        <span class="telemetry__label">HEAD</span>
        <span class="telemetry__value">{{ num(device.head, "°") }}</span>
      </div>
      <div class="telemetry__cell">
        <span class="telemetry__label">PITCH</span>
        <span class="telemetry__value">{{ num(device.pitch, "°") }}</span>
      </div>
      <div class="telemetry__cell">
        <span class="telemetry__label">ROLL</span>
        <span class="telemetry__value">{{ num(device.roll, "°") }}</span>
      </div>
    </div>

    <div class="task-device__target">
      <span>目标设备类型：{{ device.targetType || "—" }}</span>
      <span>定位编号：{{ device.locationNo || "—" }}</span>
    </div>

    <TaskVideoPlayer :video="video" />

    <TaskAiRecognition
      :events="aiEvents"
      @operate="(e) => emit('ai-operate', e)"
      @mark="(e) => emit('ai-mark', e)"
      @report="(e) => emit('ai-report', e)"
    />
  </aside>
</template>

<script setup>
import { computed } from "vue";
import TaskVideoPlayer from "./TaskVideoPlayer.vue";
import TaskAiRecognition from "./TaskAiRecognition.vue";

const props = defineProps({
  device: { type: Object, default: () => ({}) },
  video: { type: Object, default: () => ({}) },
  aiEvents: { type: Array, default: () => [] },
});

const emit = defineEmits(["ai-operate", "ai-mark", "ai-report"]);

const batteryText = computed(() => {
  const b = Number(props.device.batteryLevel);
  return Number.isFinite(b) ? `${Math.round(b)}%` : "—";
});

const signalText = computed(() => {
  const s = Number(props.device.signalQuality);
  return Number.isFinite(s) ? `${Math.round(s)}%` : "—";
});

function coord(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n.toFixed(6) : "—";
}

function num(v, unit) {
  const n = Number(v);
  return Number.isFinite(n) ? `${n.toFixed(unit === "m" ? 0 : 1)}${unit}` : "—";
}
</script>

<style scoped lang="scss">
.task-device {
  display: flex;
  flex-direction: column;
  gap: 10px;
  height: 100%;
  min-height: 0;
  overflow-y: auto;
  padding: 12px;
  box-sizing: border-box;
  border: 1px solid #30363b;
  border-radius: 6px;
  background: rgba(3, 6, 10, 0.65);
  color: rgba(255, 255, 255, 0.88);

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

  &__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 14px;
    font-weight: 600;
    color: #fff;
  }

  &__battery {
    color: rgba(255, 255, 255, 0.72);
    font-variant-numeric: tabular-nums;
  }

  &__sub {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 12px;
    color: rgba(255, 255, 255, 0.6);
  }

  &__target {
    display: flex;
    flex-direction: column;
    gap: 4px;
    font-size: 13px;
    color: rgba(255, 255, 255, 0.82);
    padding: 8px 10px;
    border-radius: 3px;
    background: #1c222a;
  }
}

.telemetry {
  display: flex;
  gap: 8px;

  &__cell {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    padding: 8px 4px;
    border-radius: 3px;
    background: #1c222a;
  }

  &__label {
    font-size: 12px;
    color: rgba(255, 255, 255, 0.45);
  }

  &__value {
    font-size: 13px;
    font-weight: 500;
    color: rgba(255, 255, 255, 0.92);
    font-variant-numeric: tabular-nums;
  }
}
</style>
