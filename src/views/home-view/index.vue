<!--
 * @Author: ml
 * @Date: 2026-01-12 14:47:16
 * @LastEditTime: 2026-03-14 14:27:46
 * @FilePath: /accompanying-fly-project/src/views/home-view/index.vue
 * @Description: homepage
-->
<template>
  <div class="page-wrapper">
    <HomeHeader />
    <div class="home-center-container">
      <el-splitter>
        <el-splitter-panel size="50%">
          <el-splitter class="left-splitter" :style="leftSplitterStyle" layout="vertical">
            <el-splitter-panel ref="leftTopPanelRef" v-if="isShowLeftTopView" @mouseenter="isShowSwitchViewForTop = true" @mouseleave="isShowSwitchViewForTop = false">
              <component :is="leftTopComponent" />
              <SwitchView
                v-if="isShowSwitchViewForTop"
                :isFullscreen="isShowLeftTopView && !isShowLeftBottomView"
                @update:isFullscreen="isShowLeftBottomView = !$event"
                @update:toMainView="handleLeftTopToMainView" />
            </el-splitter-panel>
            <el-splitter-panel ref="leftBottomPanelRef" v-if="isShowLeftBottomView" @mouseenter="isShowSwitchViewForBottom = true" @mouseleave="isShowSwitchViewForBottom = false">
              <!-- <component :is="leftBottomComponent" /> -->
              <SwitchView
                style="top: 10px"
                v-if="isShowSwitchViewForBottom"
                :isFullscreen="!isShowLeftTopView && isShowLeftBottomView"
                @update:isFullscreen="isShowLeftTopView = !$event"
                @update:toMainView="handleLeftBottomToMainView" />
            </el-splitter-panel>
          </el-splitter>
        </el-splitter-panel>
        <el-splitter-panel min="50%">
          <component :is="rightComponent" />
        </el-splitter-panel>
      </el-splitter>
    </div>
  </div>
</template>

<script setup>
import TiandituMap from "@/components/TiandituMap.vue";
import HomeHeader from "@/components/HomeHeader.vue";
import DroneStream from "@/components/DroneStream.vue";
import SwitchView from "@/components/SwitchView.vue";
import SubMap from "@/components/SubMap.vue";

import { ref, watch, computed, shallowRef } from "vue";

const leftTopPanelRef = ref(null);
const leftBottomPanelRef = ref(null);
const isShowSwitchViewForTop = ref(false);
const isShowSwitchViewForBottom = ref(false);
const isShowLeftTopView = ref(true);
const isShowLeftBottomView = ref(false);

// 动态组件
const leftTopComponent = shallowRef(TiandituMap);
const leftBottomComponent = shallowRef(SubMap);
const rightComponent = shallowRef(DroneStream);

const leftSplitterStyle = computed(() => ({
  backgroundColor: "#000",
  maxHeight: isShowLeftTopView.value && isShowLeftBottomView.value ? "calc(100% - 16px)" : "100%",
}));

const handleLeftTopToMainView = () => {
  const temp = leftTopComponent.value;
  const temp2 = rightComponent.value;
  leftTopComponent.value = temp2;
  rightComponent.value = temp;
};

const handleLeftBottomToMainView = () => {
  const temp = leftBottomComponent.value;
  const temp2 = rightComponent.value;
  leftBottomComponent.value = temp2;
  rightComponent.value = temp;
};
</script>

<style lang="scss" scoped>
.page-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  background-color: #000;
  .home-center-container {
    flex: auto;
    height: 0;
    :deep(.el-splitter-panel) {
      position: relative;
    }
  }
}
:deep(.el-splitter) {
  .el-splitter-bar__dragger:before {
    background-color: #000 !important;
  }
  .el-splitter-bar__dragger:hover:not(.is-disabled):before {
    background-color: rgb(33, 66, 174) !important;
  }
}
</style>
