<!--
 * @Author: ml
 * @Date: 2026-03-14 09:24:31
 * @LastEditTime: 2026-03-14 10:41:06
 * @FilePath: /accompanying-fly-project/src/components/SwitchView.vue
 * @Description: 切换视图组件
-->
<template>
  <div class="switch-view">
    <el-tooltip effect="dark" content="切到主视图" placement="bottom">
      <el-button class="icon-button" link :icon="SquareArrowForward32Regular" @click="emits('update:toMainView', true)"></el-button>
    </el-tooltip>
    <el-tooltip effect="dark" content="高度全屏" placement="bottom">
      <el-button class="icon-button" link :icon="isCurrentFullscreen ? UnfoldLessOutlined : UnfoldMoreOutlined" @click="emits('update:isFullscreen', !isCurrentFullscreen)"></el-button>
    </el-tooltip>
  </div>
</template>

<script setup>
import { ref, defineProps, watch, defineEmits } from "vue";
import { SquareArrowForward32Regular, TabDesktopCopy20Filled } from "@vicons/fluent";
import { UnfoldLessOutlined, UnfoldMoreOutlined } from "@vicons/material";

const props = defineProps({
  isFullscreen: {
    type: Boolean,
    default: true,
  },
});
const emits = defineEmits(["update:toMainView", "update:isFullscreen"]);

const isCurrentFullscreen = ref(false);

watch(
  () => props.isFullscreen,
  (newVal) => {
    isCurrentFullscreen.value = newVal;
  },
  { immediate: true },
);
</script>

<style lang="scss" scoped>
.switch-view {
  position: absolute;
  z-index: 99999;
  top: 0;
  right: 0;
  background-color: rgba(0, 0, 0, 0.4);
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
  padding: 5px;
  .icon-button {
    color: #fff;
    font-size: 16px;
    &:last-child {
      margin-left: 5px;
    }
  }
}
</style>
