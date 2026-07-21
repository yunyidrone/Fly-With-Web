<!--
 * @FilePath: /accompanying-fly-project/src/components/AreaDrawPopup.vue
 * @Description: 独立地图框选弹窗 — 基于 TiandituAreaMap 组件
-->
<template>
  <Teleport to="body">
    <Transition name="area-draw-fade">
      <div
        v-if="visible"
        class="area-draw-overlay"
        @click.self="handleCancel"
      >
        <div class="area-draw-modal">
          <div class="area-draw-toolbar">
            <div class="area-draw-title">选择区域</div>
            <div class="area-draw-spacer" />
            <button type="button" class="area-draw-btn area-draw-btn--cancel" @click="handleCancel">
              取消
            </button>
            <button
              type="button"
              class="area-draw-btn area-draw-btn--save"
              :disabled="!drawnArea"
              @click="handleSave"
            >
              保存
            </button>
          </div>

          <TiandituAreaMap
            v-if="visible"
            ref="mapRef"
            v-model="drawnArea"
            mode="draw"
            :center="initialCenter"
            class="area-draw-map"
          />
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, watch } from "vue";
import { MAP_CONFIG } from "@/config/app-config.js";
import TiandituAreaMap from "@/components/TiandituAreaMap.vue";
import { normalizeAreaData } from "@/utils/tianditu-area.js";

const props = defineProps({
  visible: { type: Boolean, default: false },
  initialCenter: {
    type: Object,
    default: () => ({ lng: MAP_CONFIG.defaultCenter.lng, lat: MAP_CONFIG.defaultCenter.lat }),
  },
  initialArea: { type: Object, default: null },
});

const emit = defineEmits(["save", "cancel"]);

const mapRef = ref(null);
const drawnArea = ref(null);

watch(
  () => props.visible,
  (visible) => {
    if (!visible) {
      drawnArea.value = null;
      return;
    }
    drawnArea.value = normalizeAreaData(props.initialArea);
  },
  { immediate: true },
);

function handleCancel() {
  emit("cancel");
}

function handleSave() {
  const area = drawnArea.value || mapRef.value?.getArea?.();
  if (!area) return;
  emit("save", { ...area });
}
</script>

<style lang="scss" scoped>
.area-draw-overlay {
  position: fixed;
  inset: 0;
  z-index: 5000;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.65);
  backdrop-filter: blur(4px);
}

.area-draw-modal {
  width: min(1200px, calc(100vw - 48px));
  height: min(700px, calc(100vh - 80px));
  display: flex;
  flex-direction: column;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #30363b;
  background: #0d1117;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.55);
}

.area-draw-toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  background: #161b22;
  border-bottom: 1px solid #25272b;
  flex-shrink: 0;
}

.area-draw-title {
  color: rgba(255, 255, 255, 0.85);
  font-size: 14px;
  font-weight: 600;
}

.area-draw-spacer {
  flex: 1;
}

.area-draw-btn {
  padding: 6px 18px;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  border: 1px solid #30363b;
  background: transparent;
  color: rgba(255, 255, 255, 0.7);
  transition: all 0.15s ease;

  &:hover {
    color: #fff;
  }

  &--save {
    border-color: #4965c9;
    color: #4965c9;

    &:hover {
      background: rgba(73, 101, 201, 0.2);
    }

    &:disabled {
      opacity: 0.35;
      cursor: not-allowed;
    }
  }

  &--cancel:hover {
    border-color: #f56c6c;
    color: #f56c6c;
  }
}

.area-draw-map {
  flex: 1;
  min-height: 0;
  border-radius: 0;
}

.area-draw-fade-enter-active,
.area-draw-fade-leave-active {
  transition: opacity 0.2s ease;
}

.area-draw-fade-enter-from,
.area-draw-fade-leave-to {
  opacity: 0;
}
</style>
