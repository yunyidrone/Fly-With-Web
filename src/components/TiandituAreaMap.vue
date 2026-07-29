<!--
 * 天地图辖区选区/显示组件
 * mode=view 只读展示；mode=draw 矩形/圆形绘制与编辑
-->
<template>
  <div
    ref="rootRef"
    class="tianditu-area-map"
    :class="{
      'tianditu-area-map--draw': mode === 'draw',
      'tianditu-area-map--fullscreen': isFullscreen,
    }"
  >
    <div v-if="mode === 'draw' && showToolbar" class="tianditu-area-map__toolbar">
      <button
        type="button"
        class="tianditu-area-map__tool"
        :class="{ 'tianditu-area-map__tool--active': currentTool === 'rectangle' }"
        @click="setTool('rectangle')"
      >
        <i class="ri-checkbox-blank-line" />
        <span>矩形</span>
      </button>
      <button
        type="button"
        class="tianditu-area-map__tool"
        :class="{ 'tianditu-area-map__tool--active': currentTool === 'circle' }"
        @click="setTool('circle')"
      >
        <i class="ri-checkbox-blank-circle-line" />
        <span>圆形</span>
      </button>
      <button
        type="button"
        class="tianditu-area-map__tool"
        :class="{ 'tianditu-area-map__tool--active': currentTool === 'polygon' }"
        @click="setTool('polygon')"
      >
        <i class="ri-pentagon-line" />
        <span>点选</span>
      </button>
      <button
        v-if="showClearButton"
        type="button"
        class="tianditu-area-map__tool"
        @click="clearCurrentArea"
      >
        <i class="ri-delete-bin-6-line" />
        <span>清除</span>
      </button>
      <button
        v-if="showFullscreen"
        type="button"
        class="tianditu-area-map__tool tianditu-area-map__tool--ghost"
        @click="toggleFullscreen"
      >
        <i :class="isFullscreen ? 'ri-fullscreen-exit-line' : 'ri-fullscreen-line'" />
        <span>{{ isFullscreen ? "退出全屏" : "全屏" }}</span>
      </button>
      <span class="tianditu-area-map__spacer" />
      <span
        v-if="currentTool === 'polygon' && isPolygonDrawing"
        class="tianditu-area-map__hint"
      >
        点击地图添加点位，可拖拽已选点实时调整
      </span>
      <span
        v-else-if="!drawnResult"
        class="tianditu-area-map__hint"
      >
        在地图上拖拽绘制区域
      </span>
      <span v-else class="tianditu-area-map__hint tianditu-area-map__hint--ok">拖拽蓝色方块可调整形状</span>
    </div>

    <div class="tianditu-area-map__body">
      <div :id="mapContainerId" ref="mapContainerRef" class="tianditu-area-map__viewer" />
      <div v-if="loading" class="tianditu-area-map__loading">
        <span>地图加载中...</span>
      </div>
      <div v-else-if="mode === 'view' && !hasArea" class="tianditu-area-map__empty">
        <i class="ri-map-pin-line" aria-hidden="true" />
        <span>{{ emptyText }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, ref, watch } from "vue";
import { MAP_CONFIG } from "@/config/app-config.js";
import { useTiandituAreaMap } from "@/composables/useTiandituAreaMap.js";
import { getMapCenter, normalizeAreaData } from "@/utils/tianditu-area.js";

const props = defineProps({
  mode: {
    type: String,
    default: "view",
    validator: (value) => ["view", "draw"].includes(value),
  },
  area: { type: Object, default: null },
  modelValue: { type: Object, default: null },
  center: {
    type: Object,
    default: () => ({ lng: MAP_CONFIG.defaultCenter.lng, lat: MAP_CONFIG.defaultCenter.lat }),
  },
  zoom: { type: Number, default: 14 },
  showToolbar: { type: Boolean, default: true },
  emptyText: { type: String, default: "暂未设置辖区范围" },
  autoResize: { type: Boolean, default: true },
  showFullscreen: { type: Boolean, default: true },
});

const emit = defineEmits(["update:modelValue", "change"]);

const mapContainerRef = ref(null);
const rootRef = ref(null);
const mapContainerId = ref("");
const isFullscreen = ref(false);
const areaValue = computed(() => props.modelValue ?? props.area ?? null);
const hasArea = computed(() => Boolean(normalizeAreaData(areaValue.value)));
const showClearButton = computed(() =>
  props.mode === "draw" && (Boolean(drawnResult.value) || polygonPointCount.value > 0),
);

const {
  loading,
  currentTool,
  drawnResult,
  initMap,
  setupMode,
  setTool,
  cleanup,
  createContainerId,
  getArea,
  fitMapToArea,
  clearArea,
  resizeMap,
  polygonPointCount,
  isPolygonDrawing,
} = useTiandituAreaMap();

let resizeObserver = null;
let initialized = false;

function handleFullscreenChange() {
  isFullscreen.value = document.fullscreenElement === rootRef.value;
  requestAnimationFrame(() => resizeMap());
}

async function toggleFullscreen() {
  if (!rootRef.value) return;
  try {
    if (document.fullscreenElement === rootRef.value) {
      await document.exitFullscreen();
    } else if (!document.fullscreenElement) {
      await rootRef.value.requestFullscreen();
    }
  } catch (_) {
    // ignore
  }
}

function clearCurrentArea() {
  clearArea();
}

function emitAreaChange() {
  const value = getArea();
  emit("update:modelValue", value);
  emit("change", value);
}

async function mountMap() {
  mapContainerId.value = createContainerId();
  await nextTick();

  const center = getMapCenter(areaValue.value, props.center);
  await initMap(mapContainerId.value, { center, zoom: props.zoom });
  setupMode(props.mode, areaValue.value);
  initialized = true;

  if (props.autoResize && rootRef.value && typeof ResizeObserver !== "undefined") {
    resizeObserver?.disconnect();
    resizeObserver = new ResizeObserver(() => {
      resizeMap();
    });
    resizeObserver.observe(rootRef.value);
  }

  await nextTick();
  requestAnimationFrame(() => resizeMap());
}

watch(
  () => props.mode,
  (mode) => {
    if (!initialized) return;
    setupMode(mode, areaValue.value);
  },
);

watch(
  () => normalizeAreaData(areaValue.value)?.ring?.join(","),
  async (signature) => {
    if (!initialized) return;
    if (props.mode === "draw") {
      const currentSignature = normalizeAreaData(drawnResult.value)?.ring?.join(",") ?? "";
      if (signature === currentSignature) return;
    }
    setupMode(props.mode, areaValue.value);
    await nextTick();
    requestAnimationFrame(() => resizeMap());
  },
);

watch(drawnResult, (value) => {
  if (props.mode !== "draw" || !initialized) return;
  emit("update:modelValue", value ? { ...value } : null);
  emit("change", value ? { ...value } : null);
});

watch(
  () => [props.center?.lng, props.center?.lat, props.zoom],
  () => {
    if (!initialized || hasArea.value) return;
    setupMode(props.mode, areaValue.value);
  },
);

onMounted(async () => {
  document.addEventListener("fullscreenchange", handleFullscreenChange);
  await mountMap();
});

onBeforeUnmount(() => {
  document.removeEventListener("fullscreenchange", handleFullscreenChange);
  resizeObserver?.disconnect();
  resizeObserver = null;
  cleanup();
  initialized = false;
});

defineExpose({
  getArea,
  fitArea: () => fitMapToArea(areaValue.value),
  refresh: () => setupMode(props.mode, areaValue.value),
  resizeMap,
});
</script>

<style scoped lang="scss">
.tianditu-area-map {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  min-height: 160px;
  overflow: hidden;
  border-radius: 10px;
  background: #f8f9fc;
}

.tianditu-area-map__toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
  padding: 8px 10px;
  border-bottom: 1px solid rgba(41, 64, 138, 0.08);
  background: #fff;
}

.tianditu-area-map__tool {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 12px;
  border-radius: 4px;
  border: 1px solid #dcdfe6;
  background: #fff;
  color: #606266;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.15s ease;

  i {
    font-size: 15px;
  }

  &:hover,
  &--active {
    border-color: #29408a;
    color: #29408a;
    background: rgba(41, 64, 138, 0.06);
  }
}

.tianditu-area-map__hint {
  margin-left: 4px;
  font-size: 12px;
  color: #909399;

  &--ok {
    color: #67c23a;
  }
}

.tianditu-area-map__spacer {
  flex: 1;
}

.tianditu-area-map__tool--primary {
  border-color: #29408a;
  color: #29408a;
}

.tianditu-area-map__tool--ghost {
  margin-left: auto;
}

.tianditu-area-map__tool:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.tianditu-area-map--fullscreen {
  position: fixed;
  inset: 0;
  z-index: 4000;
  border-radius: 0;
}

.tianditu-area-map__body {
  position: relative;
  flex: 1;
  min-height: 0;
}

.tianditu-area-map__viewer {
  width: 100%;
  height: 100%;

  /* 隐藏天地图默认左下角 logo/版权标识 */
  :deep(.tdt-control-copyright.tdt-control > div:not(.tdt-control-copyright)) {
    display: none !important;
  }
}

.tianditu-area-map__loading,
.tianditu-area-map__empty {
  position: absolute;
  inset: 0;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  pointer-events: none;
  color: #909399;
  font-size: 13px;
  text-align: center;
}

.tianditu-area-map__loading {
  background: rgba(248, 249, 252, 0.92);
}

.tianditu-area-map__empty {
  background: rgba(248, 249, 252, 0.72);

  i {
    font-size: 24px;
    color: rgba(41, 64, 138, 0.35);
  }
}
</style>
