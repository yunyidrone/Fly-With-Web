<!--
 * 左侧 Tab：无人设备 / 飞行计划，内嵌 ResourcePanel、PlanPanel
-->
<template>
  <aside class="left-sidebar-tabs" :class="{ 'left-sidebar-tabs--docked': docked }">
    <div class="left-sidebar-tabs__head" role="tablist" aria-label="侧栏模块">
      <div
        class="btn-wrap"
        :class="{ 'btn-wrap--active': activeTab === 'device' }"
        @click.stop="selectTab('device')"
      >
        <button
          type="button"
          role="tab"
          :aria-selected="activeTab === 'device'"
          class="left-sidebar-tabs__tab"
          :class="{ 'left-sidebar-tabs__tab--active': activeTab === 'device' }"
        >
          <span class="left-sidebar-tabs__icon-slot" aria-hidden="true">
            <img src="../assets/images/device.png" alt="" />
          </span>
          <span class="left-sidebar-tabs__tab-label">无人设备</span>
        </button>
      </div>
      <div
        class="btn-wrap"
        :class="{ 'btn-wrap--active': activeTab === 'plan' }"
        @click.stop="selectTab('plan')"
      >
        <button
          type="button"
          role="tab"
          :aria-selected="activeTab === 'plan'"
          class="left-sidebar-tabs__tab"
          :class="{ 'left-sidebar-tabs__tab--active': activeTab === 'plan' }"
        >
          <span class="left-sidebar-tabs__icon-slot" aria-hidden="true" >
            <img src="../assets/images/plan.png" alt="" />
          </span>
          <span class="left-sidebar-tabs__tab-label">飞行计划</span>
        </button>
      </div>
    </div>
    <div
      v-show="activeTab != null"
      class="left-sidebar-tabs__divider"
      aria-hidden="true"
    />
    <div v-show="activeTab != null" class="left-sidebar-tabs__body">
      <div
        v-show="activeTab === 'device'"
        class="left-sidebar-tabs__pane"
        role="tabpanel"
      >
        <slot name="device" />
      </div>
      <div
        v-show="activeTab === 'plan'"
        class="left-sidebar-tabs__pane"
        role="tabpanel"
      >
        <slot name="plan" />
      </div>
    </div>
  </aside>
</template>

<script setup>
import { ref } from "vue";

defineProps({
  /** 嵌入 home-left-dock 时参与 flex 布局，避免 fixed 与历史面板重叠 */
  docked: { type: Boolean, default: false },
});

const emit = defineEmits(["select-tab"]);

/** @type {import('vue').Ref<'device' | 'plan' | null>} */
const activeTab = ref(null);

function selectTab(tab) {
  activeTab.value = tab;
  emit("select-tab", tab);
}

/** 取消选中并收起下方内容（如点击地图空白区域时由父组件调用） */
function clearSelection() {
  activeTab.value = null;
}

defineExpose({ clearSelection, selectTab });
</script>

<style lang="scss" scoped>
$tab-btn-width: 184px;
$tab-head-gap: 13px;
// 与上方双 Tab 总宽一致：184 + 22 + 184
$sidebar-width: calc(#{$tab-btn-width} * 2 + #{$tab-head-gap});

.left-sidebar-tabs {
  position: fixed;
  left: 24px;
  top: 90px;
  z-index: 100;
  display: flex;
  flex-direction: column;
  width: min($sidebar-width, calc(100vw - 48px));
  max-height: calc(100vh - 110px);
  box-sizing: border-box;

  &--docked {
    position: relative;
    left: auto;
    top: auto;
    z-index: auto;
    flex-shrink: 0;
    width: $sidebar-width;
    max-width: min($sidebar-width, calc(100vw - 48px));
  }

  .btn-wrap {
    width: $tab-btn-width;
    flex: 0 0 $tab-btn-width;
    height: 64px;
    border-radius: 10px;
    padding: 5px;
    box-sizing: border-box;
    border-radius: 6px;
    border-top: 1px solid #30363b;
    border-right: 1px solid #30363b;
    border-left: 1px solid #30363b;
    background: #1c222a;
    &.btn-wrap--active {
      border: none;
      background: rgba(3, 6, 10, 0.65);
    }
  }

  &__head {
    display: flex;
    flex-direction: row;
    align-items: stretch;
    gap: $tab-head-gap;
    flex-shrink: 0;
    width: 100%;
    box-sizing: border-box;
    padding-bottom: 10px;
  }

  &__tab {
    display: inline-flex;
    width: 100%;
    height: 100%;
    flex-direction: row;
    align-items: center;
    gap: 16px;
    margin: 0;
    padding: 10px 14px;
    border: 2px solid #30363b;
    border-radius: 6px;
    background: #1c222a;
    color: rgba(255, 255, 255, 0.65);
    font-family: "HarmonyOS Sans SC";
    font-size: 18px;
    font-weight: 500;
    cursor: pointer;
    user-select: none;
    backdrop-filter: blur(10px);
    transition:
      border-color 0.2s ease,
      color 0.2s ease,
      box-shadow 0.2s ease;

    &:hover {
      border-color: rgba(64, 158, 255, 0.35);
      color: #fff;
    }

    &--active {
      border-width: 1px;
      border-color: #4965c9;
      background: rgba(255, 255, 255, 0.02);
      color: #fff;
      // box-shadow: 0 0 0 1px rgba(64, 158, 255, 0.45);
    }
  }

  &__icon-slot {
    width: 24px;
    height: 24px;
    box-sizing: border-box;
    img{
      width: 100%;
      height: 100%;
      object-fit: contain;
    }
  }

  &__tab-label {
    white-space: nowrap;
  }

  &__divider {
    flex-shrink: 0;
    width: 100%;
    height: 2px;
    margin-bottom: 10px;
    background: #4965c9;
  }

  &__body {
    flex: 1;
    min-height: 0;
    width: 100%;
    overflow-x: hidden;
    overflow-y: auto;

    &::-webkit-scrollbar {
      width: 4px;
    }
    &::-webkit-scrollbar-track {
      background: transparent;
    }
    &::-webkit-scrollbar-thumb {
      background: rgba(255, 255, 255, 0.12);
      border-radius: 2px;
    }
    &::-webkit-scrollbar-thumb:hover {
      background: rgba(255, 255, 255, 0.25);
    }
  }

  &__pane {
    min-height: 0;
    width: 100%;
    box-sizing: border-box;
  }
}
</style>
