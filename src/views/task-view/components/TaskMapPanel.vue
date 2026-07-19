<template>
  <section ref="rootRef" class="task-map">
    <!-- 等容器有有效尺寸再挂载 Cesium，避免覆盖层首帧 0×0 初始化 -->
    <TiandituMap
      v-if="mapReady && active"
      ref="mapRef"
      class="task-map__view"
      companion
      :active-escort-drone-id="resolvedFocusId"
    />

    <button
      type="button"
      class="task-map__route-toggle"
      :class="{ 'task-map__route-toggle--active': routeVisible }"
      @click="toggleRoute"
    >
      伴飞路线{{ routeVisible ? "关闭" : "打开" }}
    </button>
  </section>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from "vue";
import TiandituMap from "@/components/TiandituMap.vue";
import { useDeviceStore } from "@/stores/device.js";

const props = defineProps({
  /** 需要聚焦的无人机 id；为空时回退到第一架有坐标的无人机（便于当前联调预览） */
  focusDroneId: { type: String, default: "" },
  /** 覆盖层过渡结束后再挂载地图，避免首帧与主地图 WebGL 冲突 */
  active: { type: Boolean, default: true },
});

const emit = defineEmits(["toggle-route"]);

const deviceStore = useDeviceStore();
const rootRef = ref(null);
const mapRef = ref(null);
const mapReady = ref(false);
const routeVisible = ref(true);
let sizeObserver = null;

function hasContainerSize(el) {
  return Boolean(el && el.clientWidth > 0 && el.clientHeight > 0);
}

function tryEnableMap() {
  if (!props.active || mapReady.value || !hasContainerSize(rootRef.value)) return;
  mapReady.value = true;
  nextTick(() => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        mapRef.value?.resizeMapView?.();
        applyFocus();
      });
    });
  });
}

function setupSizeObserver() {
  const el = rootRef.value;
  if (!el || typeof ResizeObserver === "undefined") {
    tryEnableMap();
    return;
  }
  sizeObserver?.disconnect();
  sizeObserver = new ResizeObserver(() => tryEnableMap());
  sizeObserver.observe(el);
  tryEnableMap();
}

const resolvedFocusId = computed(() => {
  if (props.focusDroneId) return String(props.focusDroneId);
  const drone = deviceStore.drones.find((d) => {
    const lng = Number(d?.longitude ?? d?.lng);
    const lat = Number(d?.latitude ?? d?.lat);
    return Number.isFinite(lng) && Number.isFinite(lat) && !(lng === 0 && lat === 0);
  });
  return drone ? String(drone.id || drone.sn || "") : "";
});

function applyFocus() {
  const id = resolvedFocusId.value;
  if (!id) return;
  // 高亮由 active-escort-drone-id 完成；此处让相机飞到该无人机
  nextTick(() => {
    requestAnimationFrame(() => {
      mapRef.value?.focusDrone?.(id);
    });
  });
}

function toggleRoute() {
  routeVisible.value = !routeVisible.value;
  emit("toggle-route", routeVisible.value);
}

watch(
  () => props.active,
  (val) => {
    if (val) {
      nextTick(setupSizeObserver);
    } else {
      sizeObserver?.disconnect();
      sizeObserver = null;
      mapReady.value = false;
    }
  },
  { immediate: true },
);

watch(resolvedFocusId, () => {
  if (mapReady.value) applyFocus();
});

onMounted(() => {
  if (props.active) setupSizeObserver();
});
onUnmounted(() => {
  sizeObserver?.disconnect();
  sizeObserver = null;
  mapReady.value = false;
});

defineExpose({ mapRef, applyFocus, resizeMapView: () => mapRef.value?.resizeMapView?.() });
</script>

<style scoped lang="scss">
.task-map {
  position: relative;
  width: 100%;
  height: 100%;
  border: 1px solid #30363b;
  border-radius: 6px;
  overflow: hidden;
  background: #0b0f16;

  &__view {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
  }

  &__route-toggle {
    position: absolute;
    right: 80px;
    bottom: 16px;
    z-index: 20;
    padding: 8px 16px;
    border: 1px solid #558efc;
    border-radius: 4px;
    background: rgba(3, 6, 10, 0.72);
    color: #fff;
    font-size: 13px;
    cursor: pointer;
    transition: background 0.15s ease, border-color 0.15s ease;

    &:hover {
      background: rgba(85, 142, 252, 0.18);
    }

    &--active {
      background: rgba(85, 142, 252, 0.24);
      border-color: #80aaff;
    }
  }
}
</style>
