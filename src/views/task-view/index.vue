<!--
 * @Description: 任务查看 - 全屏覆盖层组件（不占用路由；home 在底层保活，不受影响）
 * 数据当前为占位/mock，后续按接口替换 loadTaskData 内的装配逻辑即可。
-->
<template>
  <Teleport to="body">
    <Transition name="task-view-fade" @after-enter="onOverlayEntered">
      <div v-if="visible" class="task-view" role="dialog" aria-modal="true" aria-label="任务查看">
        <!-- 提升 Element Plus 弹层层级到覆盖层(3000)之上，避免下拉/提示被盖住 -->
        <el-config-provider :z-index="3100">
          <!-- 顶部覆盖层 -->
          <HomeHeader />
          <div class="task-view__body">
            <TaskInfoSidebar
              class="task-view__col task-view__col--left"
              :info="taskInfo"
              :catalog="catalog"
              :trigger-modes="triggerModes"
              :active-key="activeCatalogKey"
              @change-trigger="onChangeTrigger"
              @select-catalog="onSelectCatalog"
            />

            <div class="task-view__col task-view__col--center">
              <TaskMapPanel
                class="task-view__map"
                :active="overlayReady"
                @toggle-route="onToggleRoute"
              />
              <div class="task-view__control">
                <ManualControlPanel
                  :recording-active="recordingActive"
                  @control-event="onControlEvent"
                />
              </div>
            </div>

            <div class="task-view__col task-view__col--right">
              <TaskDevicePanel
                class="task-view__device"
                :device="device"
                :video="video"
                :ai-events="aiEvents"
                @ai-operate="noop"
                @ai-mark="noop"
                @ai-report="noop"
              />
              <TaskFooterNav
                class="task-view__nav"
                :has-prev="hasPrev"
                :has-next="hasNext"
                @prev="onPrev"
                @next="onNext"
                @exit="onExit"
              />
            </div>
          </div>
        </el-config-provider>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, watch, onUnmounted } from "vue";
import HomeHeader from "@/components/HomeHeader.vue";
import ManualControlPanel from "@/components/ManualControlPanel.vue";
import TaskInfoSidebar from "./components/TaskInfoSidebar.vue";
import TaskMapPanel from "./components/TaskMapPanel.vue";
import TaskDevicePanel from "./components/TaskDevicePanel.vue";
import TaskFooterNav from "./components/TaskFooterNav.vue";
import {
  TASK_TRIGGER_MODES,
  createMockTaskInfo,
  createMockTaskCatalog,
  createMockDevice,
  createMockVideo,
  createMockAiEvents,
} from "./task-view-mock.js";

const props = defineProps({
  visible: { type: Boolean, default: false },
  taskId: { type: String, default: "" },
});

const emit = defineEmits(["update:visible"]);

const triggerModes = TASK_TRIGGER_MODES;
const taskInfo = ref(createMockTaskInfo());
const catalog = ref(createMockTaskCatalog());
const device = ref(createMockDevice());
const video = ref(createMockVideo());
const aiEvents = ref(createMockAiEvents());

const activeCatalogKey = ref("");
const recordingActive = ref(false);
const overlayReady = ref(false);
const hasPrev = ref(true);
const hasNext = ref(true);

/** 每次打开都重新装配数据（后续替换为按 taskId 请求接口） */
function loadTaskData() {
  taskInfo.value = createMockTaskInfo();
  catalog.value = createMockTaskCatalog();
  device.value = createMockDevice();
  video.value = createMockVideo();
  aiEvents.value = createMockAiEvents();
  activeCatalogKey.value = catalog.value[0]?.key || "";
}

// 覆盖层打开时给 body 加标记类：仅用于把命令式弹层(ElMessage/Notification/MessageBox)
// 抬到覆盖层之上，关闭即还原，对 home 无任何影响。
function setBodyFlag(active) {
  if (typeof document === "undefined") return;
  document.body.classList.toggle("task-view-open", !!active);
}

watch(
  () => props.visible,
  (val) => {
    if (val) {
      loadTaskData();
    } else {
      overlayReady.value = false;
    }
    setBodyFlag(val);
  },
  { immediate: true },
);

function onOverlayEntered() {
  overlayReady.value = true;
}

onUnmounted(() => setBodyFlag(false));

function onChangeTrigger(mode) {
  taskInfo.value = { ...taskInfo.value, triggerMode: mode };
}

function onSelectCatalog(item) {
  activeCatalogKey.value = item?.key || "";
}

function onControlEvent(event) {
  // 目前无真实无人机接口，先让录像按钮有可见状态反馈
  if (event?.action === "startRecord") {
    recordingActive.value = true;
  } else if (event?.action === "stopRecord") {
    recordingActive.value = false;
  }
}
function onToggleRoute() {}
function onPrev() {
  loadTaskData();
}
function onNext() {
  loadTaskData();
}
function onExit() {
  emit("update:visible", false);
}
function noop() {}
</script>

<style scoped lang="scss">
.task-view {
  position: fixed;
  inset: 0;
  z-index: 3000;
  display: flex;
  flex-direction: column;
  background: #292e38;
  color: rgba(255, 255, 255, 0.88);

  &__body {
    flex: 1 1 auto;
    min-height: 0;
    display: flex;
    align-items: stretch;
    gap: 12px;
    /* 顶部为浮动的 HomeHeader（absolute, top:24 + 高约56）预留空间，避免与三栏重叠 */
    padding: 88px 12px 12px;
    box-sizing: border-box;
  }

  &__col {
    min-height: 0;

    &--left {
      width: 300px;
      flex-shrink: 0;
    }

    &--center {
      flex: 1 1 auto;
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    &--right {
      width: 360px;
      flex-shrink: 0;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
  }

  /* 右栏设备面板占满除按钮外的高度 */
  &__device {
    flex: 1 1 auto;
    min-height: 0;
  }

  /* 底部按钮固定在右栏底部，左/中栏因等高而与其底部对齐 */
  &__nav {
    flex-shrink: 0;
  }

  /* 地图块占据中栏剩余高度 */
  &__map {
    flex: 1 1 auto;
    min-height: 0;
  }

  /* 手动操控独立块（与地图分开）；宽度撑满中栏，与地图同宽 */
  &__control {
    flex-shrink: 0;
    display: flex;

    :deep(.manual-control-wrapper) {
      position: static;
      bottom: auto;
      display: block;
      width: 100%;
      pointer-events: auto;
    }

    :deep(.manual-control-panel) {
      margin-left: 0;
      width: 100%;
      box-sizing: border-box;
    }
  }

}

.task-view-fade-enter-active,
.task-view-fade-leave-active {
  transition: opacity 0.2s ease;
}

.task-view-fade-enter-from,
.task-view-fade-leave-to {
  opacity: 0;
}
</style>

<!-- 非 scoped：仅当覆盖层打开(body.task-view-open)时，把命令式弹层抬到覆盖层(3000)之上。
     命令式弹层挂在 body、不在 el-config-provider 组件树内，无法用 config-provider 提层，
     用 body 标记类限定作用域，关闭即失效，对 home 零影响。 -->
<style>
body.task-view-open .el-message,
body.task-view-open .el-notification,
body.task-view-open .el-message-box__wrapper,
body.task-view-open .el-loading-mask {
  z-index: 3200 !important;
}
</style>
