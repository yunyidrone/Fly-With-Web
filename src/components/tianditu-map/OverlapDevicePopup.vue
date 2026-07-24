<template>
  <div
    v-if="visible"
    class="overlap-device-popup"
    :style="popupStyle"
    @mouseenter="$emit('mouseenter')"
    @mouseleave="$emit('mouseleave')"
    @click.stop
  >
    <button
      v-for="item in items"
      :key="item.key"
      type="button"
      class="overlap-device-popup__item"
      @click="$emit('select', item)"
    >
      <span class="overlap-device-popup__icon" aria-hidden="true">
        <img :src="item.iconSrc" alt="" />
      </span>
      <span class="overlap-device-popup__name">{{ item.name }}</span>
    </button>
  </div>
</template>

<script setup>
defineProps({
  visible: { type: Boolean, required: true },
  popupStyle: { type: Object, required: true },
  items: { type: Array, default: () => [] },
});

defineEmits(["mouseenter", "mouseleave", "select"]);
</script>

<style lang="scss" scoped>
.overlap-device-popup {
  position: absolute;
  z-index: 210;
  width: 230px;
  max-height: 240px;
  overflow-y: auto;
  padding: 6px;
  border: 1px solid #37eadb;
  border-radius: 6px;
  background: rgba(3, 6, 10, 0.65);
  box-sizing: border-box;
  backdrop-filter: blur(6px);

  &__item {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 10px;
    border: none;
    border-radius: 4px;
    background: transparent;
    color: #ffffff;
    cursor: pointer;
    text-align: left;

    &:hover {
      background: rgba(55, 234, 219, 0.16);
    }
  }

  &__icon {
    width: 18px;
    height: 18px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;

    img {
      width: 16px;
      height: 16px;
      object-fit: contain;
      display: block;
    }
  }

  &__name {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 13px;
  }
}
</style>
