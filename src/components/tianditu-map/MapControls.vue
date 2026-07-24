<template>
  <div class="custom-controls">
    <el-tooltip
      effect="dark"
      :content="isPitch2D ? '切换为3D地图' : '切换为2D地图'"
      placement="left"
    >
      <button @click="$emit('toggle-scene-mode')">
        {{ isPitch2D ? "3D" : "2D" }}
      </button>
    </el-tooltip>

    <el-tooltip
      effect="dark"
      :content="vehicleDisplayMode === 'model' ? '切换为点' : '切换为车'"
      placement="left"
    >
      <button @click="$emit('toggle-display-mode')">
        <RiBubbleChartFill
          v-if="vehicleDisplayMode === 'model'"
          size="18px"
          color="#4d4d4d"
        />
        <RiCarFill v-else size="18px" color="#4d4d4d" />
      </button>
    </el-tooltip>

    <el-tooltip
      effect="dark"
      :content="isLockMode ? '取消锁定模式' : '切换为锁定模式'"
      placement="left"
    >
      <button @click="$emit('toggle-lock-mode')">
        <ScanObject20Filled v-if="!isLockMode" size="18px" color="#4d4d4d" />
        <ScanDisabled v-else size="18px" color="#4d4d4d" />
      </button>
    </el-tooltip>

    <div class="group-controls">
      <el-tooltip effect="dark" content="放大地图" placement="left">
        <button @click="$emit('zoom-in')">
          <RiAddLine size="18px" color="#4d4d4d" />
        </button>
      </el-tooltip>
      <el-tooltip effect="dark" content="缩小地图" placement="left">
        <button @click="$emit('zoom-out')">
          <RiSubtractLine size="18px" />
        </button>
      </el-tooltip>
    </div>
  </div>
</template>

<script setup>
import {
  RiAddLine,
  RiBubbleChartFill,
  RiCarFill,
  RiSubtractLine,
} from "@remixicon/vue";
import { ScanObject20Filled } from "@vicons/fluent";
import { ScanDisabled } from "@vicons/carbon";

defineProps({
  isPitch2D: { type: Boolean, required: true },
  vehicleDisplayMode: { type: String, required: true },
  isLockMode: { type: Boolean, required: true },
});

defineEmits([
  "toggle-scene-mode",
  "toggle-display-mode",
  "toggle-lock-mode",
  "zoom-in",
  "zoom-out",
]);
</script>

<style lang="scss" scoped>
.custom-controls {
  position: absolute;
  bottom: 21px;
  right: 25px;
  z-index: 100;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 10px;

  button {
    width: 30px;
    height: 30px;
    background-color: #ffffff;
    color: #4e4e4e;
    pointer-events: auto;
    line-height: 30px;
    font-size: 14px;
    font-weight: bold;
    border-radius: 2px;
    box-shadow: 0 0 4px rgba(0, 0, 0, 0.6);
    text-align: center;
    border: none;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    box-sizing: border-box;
  }

  .group-controls {
    position: relative;
    display: flex;
    flex-direction: column;
    border-radius: 2px;
    box-shadow: 0 0 4px rgba(0, 0, 0, 0.6);
    overflow: hidden;
    box-sizing: border-box;
    width: 30px;

    button {
      border-radius: 0;
      box-shadow: unset !important;

      &:not(:last-child) {
        border-bottom: 1px solid #dcdee2;
      }
    }
  }
}

@media (max-width: 767px) {
  .custom-controls {
    z-index: 102;
    bottom: 12px;
    right: 10px;
  }
}
</style>
