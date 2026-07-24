<template>
  <div
    v-if="visible"
    class="police-vehicle-popup"
    :style="popupStyle"
    @click.stop
  >
    <div class="police-vehicle-popup__header">
      <div class="police-vehicle-popup__urgent">
        <img class="police-vehicle-popup__urgent-icon" :src="sosSrc" alt="" />
        <span>紧急伴飞</span>
      </div>
    </div>

    <div class="police-vehicle-popup__row">
      <span class="police-vehicle-popup__label">目标设备：</span>
      <span class="police-vehicle-popup__value">
        {{ popup.vehicleName }}（{{ popup.targetTypeLabel }}）
      </span>
    </div>

    <div class="police-vehicle-popup__row">
      <span class="police-vehicle-popup__label">坐标信息：</span>
      <span class="police-vehicle-popup__value">{{ popup.coordText }}</span>
    </div>

    <div
      v-if="popup.loadingDrones"
      class="police-vehicle-popup__field"
    >
      <span class="police-vehicle-popup__label">推荐无人机：</span>
      <span class="police-vehicle-popup__value">加载中...</span>
    </div>

    <div
      v-else-if="popup.drones.length"
      class="police-vehicle-popup__field"
    >
      <span class="police-vehicle-popup__label">推荐无人机：</span>
      <select
        :value="popup.selectedDroneId"
        class="police-vehicle-popup__select"
        @change="$emit('update:selected-drone-id', $event.target.value)"
      >
        <option
          v-for="d in popup.drones"
          :key="d.id"
          :value="d.id"
        >
          {{ d.label }}
        </option>
      </select>
    </div>

    <p v-else class="police-vehicle-popup__empty">暂无可用无人机</p>

    <div
      v-if="immersiveFlight"
      class="police-vehicle-popup__actions"
    >
      <button
        type="button"
        class="police-vehicle-popup__escort police-vehicle-popup__escort--primary"
        :disabled="popup.loadingDrones || !popup.drones.length"
        @click="$emit('escort', 'follow-only')"
      >
        开始伴飞
      </button>
      <button
        type="button"
        class="police-vehicle-popup__escort police-vehicle-popup__escort--jump"
        title="将退出当前沉浸并切换到新伴飞目标"
        :disabled="popup.loadingDrones || !popup.drones.length"
        @click="$emit('escort', 'follow-and-switch')"
      >
        开始伴飞并跳转
      </button>
    </div>

    <button
      v-else
      type="button"
      class="police-vehicle-popup__escort"
      :disabled="popup.loadingDrones || !popup.drones.length"
      @click="$emit('escort', 'follow-full')"
    >
      开始伴飞
    </button>
  </div>
</template>

<script setup>
defineProps({
  visible: { type: Boolean, required: true },
  popupStyle: { type: Object, required: true },
  popup: { type: Object, required: true },
  immersiveFlight: { type: Boolean, required: true },
  sosSrc: { type: String, required: true },
});

defineEmits(["escort", "update:selected-drone-id"]);
</script>

<style lang="scss" scoped>
.police-vehicle-popup {
  position: absolute;
  z-index: 200;
  width: 350px;
  padding: 12px 14px;
  border-radius: 6px;
  border: 1px solid #30363b;
  background: rgba(3, 6, 10, 0.65);
  color: #ffffff;
  font-size: 13px;
  line-height: 1.5;
  pointer-events: auto;
  box-sizing: border-box;
  backdrop-filter: blur(6px);

  &__header {
    margin-bottom: 10px;
    padding-bottom: 8px;
  }

  &__urgent {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 15px;
    font-weight: 600;
    color: #ff4d4f;
    margin-bottom: 8px;

    &-icon {
      width: 18px;
      height: 18px;
      flex-shrink: 0;
    }
  }

  &__row {
    display: flex;
    flex-direction: row;
    align-items: flex-start;
    gap: 6px;
    margin-bottom: 8px;
  }

  &__field {
    display: flex;
    gap: 6px;
    margin-bottom: 12px;
  }

  &__label {
    width: 80px;
    color: #fff;
    font-family: "HarmonyOS Sans SC";
    font-size: 14px;
    font-style: normal;
    font-weight: 400;
    line-height: normal;
    flex-shrink: 0;
    white-space: nowrap;
  }

  &__value {
    color: #ffffff;
    flex: 1;
    min-width: 0;
    word-break: break-all;
    overflow-wrap: anywhere;
  }

  &__select {
    width: 100%;
    padding: 6px 8px;
    border-radius: 2px;
    border: 1px solid #30363b;
    background: rgba(255, 255, 255, 0.08);
    color: #ffffff;
    font-size: 12px;
    outline: none;
    cursor: pointer;

    option {
      background: #1a1f24;
      color: #ffffff;
    }
  }

  &__empty {
    margin: 0 0 12px;
    font-size: 12px;
    color: rgba(255, 255, 255, 0.45);
  }

  &__escort {
    display: block;
    width: 100%;
    padding: 8px 0;
    border: none;
    border-radius: 2px;
    background: #ff4d4f;
    color: #ffffff;
    font-size: 14px;
    cursor: pointer;
    transition: opacity 0.2s;

    &:hover:not(:disabled) {
      opacity: 0.9;
    }

    &:disabled {
      opacity: 0.45;
      cursor: not-allowed;
    }

    &--primary {
      background: #409eff;
    }

    &--jump {
      background: #e6a23c;
    }
  }

  &__actions {
    display: flex;
    gap: 8px;

    .police-vehicle-popup__escort {
      flex: 1;
      width: auto;
      padding: 8px 6px;
      font-size: 13px;
    }
  }
}
</style>
