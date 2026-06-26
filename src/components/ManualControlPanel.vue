<template>
  <div class="manual-control-wrapper" @click.stop>
    <div class="manual-control-panel">
      <div class="control-column control-column--left">
        <div class="control-title">前进</div>
        <div class="cross-pad">
          <button type="button" class="ctrl-btn" @click="onMoveControl('forward')"><el-icon><CaretTop /></el-icon></button>
          <button type="button" class="ctrl-btn" @click="onMoveControl('left')"><el-icon><CaretLeft /></el-icon></button>
          <button type="button" class="ctrl-btn" @click="onMoveControl('backward')"><el-icon><CaretBottom /></el-icon></button>
          <button type="button" class="ctrl-btn" @click="onMoveControl('right')"><el-icon><CaretRight /></el-icon></button>
        </div>
        <div class="direction-row">
          <span>向左</span>
          <span>后退</span>
          <span>向右</span>
        </div>
        <div class="step-row">
          <span>步幅:</span>
          <el-input-number
            v-model="moveStep"
            class="step-input-number"
            :min="1"
            :max="20"
            controls-position="right"
            @change="onStepChange('moveStep', $event)"
          />
        </div>
      </div>

      <div class="control-column control-column--left">
        <div class="control-title">上升</div>
        <div class="cross-pad">
          <button type="button" class="ctrl-btn" @click="onAttitudeControl('up')">↑</button>
          <button type="button" class="ctrl-btn" @click="onAttitudeControl('yawLeft')">↶</button>
          <button type="button" class="ctrl-btn" @click="onAttitudeControl('pitchDown')">↓</button>
          <button type="button" class="ctrl-btn" @click="onAttitudeControl('yawRight')">↷</button>
        </div>
        <div class="direction-row">
          <span>左旋</span>
          <span>下俯</span>
          <span>右旋</span>
        </div>
        <div class="step-row">
          <span>步幅:</span>
          <el-input-number
            v-model="rotateStep"
            class="step-input-number"
            :min="1"
            :max="20"
            size="small"
            controls-position="right"
            @change="onStepChange('rotateStep', $event)"
          />
        </div>
      </div>

      <div class="control-column control-column--center">
        <label class="form-row">
          <span>镜头选择</span>
          <el-select
            v-model="cameraLens"
            class="manual-select"
            placeholder="请选择镜头"
            size="small"
            popper-class="manual-select-popper"
            @change="onSelectChange('cameraLens', $event)"
          >
            <el-option label="广角镜头" value="wide" />
            <el-option label="变焦镜头" value="zoom" />
            <el-option label="热成像镜头" value="thermal" />
          </el-select>
        </label>
        <label class="form-row">
          <span>挂载镜头</span>
          <el-select
            v-model="payloadLens"
            class="manual-select"
            placeholder="请选择挂载"
            size="small"
            popper-class="manual-select-popper"
            @change="onSelectChange('payloadLens', $event)"
          >
            <el-option label="云台 A" value="gimbal-a" />
            <el-option label="云台 B" value="gimbal-b" />
          </el-select>
        </label>
        <label class="form-row">
          <span>相机模式</span>
          <el-select
            v-model="cameraMode"
            class="manual-select"
            placeholder="请选择相机模式"
            size="small"
            popper-class="manual-select-popper"
            @change="onSelectChange('cameraMode', $event)"
          >
            <el-option label="拍照" value="photo" />
            <el-option label="录像" value="video" />
          </el-select>
        </label>
        <div class="focus-row">
          <span>焦距</span>
          <input v-model.number="focusValue" type="range" min="1" max="10" @change="onFocusSliderChange" />
          <el-input-number
            v-model="focusValue"
            class="step-input-number step-input-number--small"
            :min="1"
            :max="10"
            controls-position="right"
            @change="onFocusNumberChange"
          />
        </div>
      </div>

      <div class="control-column control-column--left">
        <div class="control-title">向上</div>
        <div class="cross-pad">
          <button type="button" class="ctrl-btn ctrl-btn--camera ctrl-btn--camera-side" @click="onCameraControl('up')">
            <el-icon class="camera-main-icon"><CameraFilled /></el-icon>
            <el-icon class="camera-dir-icon"><Top /></el-icon>
          </button>
          <button type="button" class="ctrl-btn ctrl-btn--camera ctrl-btn--camera-bottom" @click="onCameraControl('left')">
            <el-icon class="camera-main-icon"><CameraFilled /></el-icon>
            <el-icon class="camera-dir-icon"><Back /></el-icon>
          </button>
          <button type="button" class="ctrl-btn ctrl-btn--camera ctrl-btn--camera-side" @click="onCameraControl('down')">
            <el-icon class="camera-main-icon"><CameraFilled /></el-icon>
            <el-icon class="camera-dir-icon"><Bottom /></el-icon>
          </button>
          <button type="button" class="ctrl-btn ctrl-btn--camera ctrl-btn--camera-bottom" @click="onCameraControl('right')">
            <el-icon class="camera-main-icon"><CameraFilled /></el-icon>
            <el-icon class="camera-dir-icon"><Right /></el-icon>
          </button>
        </div>
        <div class="direction-row">
          <span>向左</span>
          <span>后下</span>
          <span>向右</span>
        </div>
        <div class="step-row">
          <span>角度:</span>
          <el-input-number
            v-model="angleStep"
            class="step-input-number"
            :min="1"
            :max="20"
            controls-position="right"
            @change="onStepChange('angleStep', $event)"
          />
        </div>
      </div>

      <div class="control-column control-column--right">
        <div class="record-status" :class="{ 'record-status--active': props.recordingActive }">
          <span class="record-status__dot" />
          <span>{{ props.recordingActive ? "REC 录像中" : "REC 未开始" }}</span>
        </div>
        <button type="button" class="action-btn" @click="onAction('takePhoto')">拍照</button>
        <button type="button" class="action-btn" @click="onAction('gimbalReset')">云台复位</button>
        <button
          type="button"
          class="action-btn"
          :class="{ 'action-btn--recording': props.recordingActive }"
          :disabled="props.recordingActive"
          @click="onAction('startRecord')"
        >
          {{ props.recordingActive ? "录像中..." : "开始录像" }}
        </button>
        <button
          type="button"
          class="action-btn"
          :disabled="!props.recordingActive"
          @click="onAction('stopRecord')"
        >
          结束录像
        </button>
        <!-- <button type="button" class="action-btn action-btn--danger" @click="$emit('close')">
          退出操控
        </button> -->
      </div>

      <!-- <button type="button" class="close-btn" aria-label="关闭" @click="$emit('close')">×</button> -->
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import {
  CameraFilled,
  CaretBottom,
  CaretLeft,
  CaretRight,
  CaretTop,
} from "@element-plus/icons-vue";

const emit = defineEmits(["close", "control-event"]);
const props = defineProps({
  recordingActive: { type: Boolean, default: false },
});

const moveStep = ref(6);
const rotateStep = ref(6);
const angleStep = ref(6);
const focusValue = ref(2);
const cameraLens = ref("");
const payloadLens = ref("");
const cameraMode = ref("");

function dispatchControlEvent(type, action, extra = {}) {
  const payload = {
    type,
    action,
    moveStep: moveStep.value,
    rotateStep: rotateStep.value,
    angleStep: angleStep.value,
    focusValue: focusValue.value,
    cameraLens: cameraLens.value,
    payloadLens: payloadLens.value,
    cameraMode: cameraMode.value,
    timestamp: Date.now(),
    ...extra,
  };
  emit("control-event", payload);

  // TODO: 后续在这里接入真实无人机操控接口（如云台/飞行控制 API）
  // 示例：await DroneControlService.sendCommand(payload)
  console.debug("[ManualControlPanel] 控制事件已触发（未调接口）", payload);
}

function onMoveControl(action) {
  dispatchControlEvent("move", action);
}

function onAttitudeControl(action) {
  dispatchControlEvent("attitude", action);
}

function onCameraControl(action) {
  dispatchControlEvent("camera", action);
}

function onAction(action) {
  dispatchControlEvent("action", action);
}

function onStepChange(field, value) {
  dispatchControlEvent("setting", "stepChange", { field, value });
}

function onSelectChange(field, value) {
  dispatchControlEvent("setting", "selectChange", { field, value });
}

function onFocusSliderChange() {
  dispatchControlEvent("setting", "focusSliderChange", { value: focusValue.value });
}

function onFocusNumberChange(value) {
  dispatchControlEvent("setting", "focusNumberChange", { value });
}
</script>

<style scoped lang="scss">
.manual-control-wrapper {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 20px;
  z-index: 100;
  display: flex;
  justify-content: center;
  pointer-events: none;
}

.manual-control-panel {
  position: relative;
  // width: min(1180px, calc(100vw - 48px));
  // min-height: 100px;
  padding: 18px 18px 14px;
  border: 1px solid #30363b;
  border-radius: 6px;
  background: rgba(3, 6, 10, 0.8);
  display: flex;
  align-items: stretch;
  gap: 16px;
  box-sizing: border-box;
  pointer-events: auto;
  margin-left: -25rem;
}

.control-column {
  display: flex;
  flex-direction: column;
  color: #9fd2ff;
  font-size: 14px;
}

.control-column--left {
  width: 150px;
  flex-shrink: 0;
}

.control-column--center {
  width: 280px;
  gap: 10px;
}

.control-column--right {
  margin-left: auto;
  width: 120px;
  gap: 8px;
}

.record-status {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 2px;
}

.record-status__dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.4);
}

.record-status--active {
  color: #ff696b;
}

.record-status--active .record-status__dot {
  background: #ff4d4f;
  box-shadow: 0 0 8px rgba(255, 77, 79, 0.6);
}

.control-title {
  text-align: center;
  margin-bottom: 8px;
  color: #61bdff;
}

.direction-row {
  display: grid;
  grid-template-columns: repeat(3, 32px);
  column-gap: 4px;
  width: max-content;
  justify-items: center;
  align-items: center;
  margin: 6px auto 4px;
  color: #61bdff;
  font-size: 13px;
  line-height: 1.1;
}

.cross-pad {
  display: grid;
  grid-template-columns: repeat(3, 32px);
  grid-template-rows: repeat(2, 32px);
  gap: 4px;
  width: max-content;
  justify-content: center;
  margin: 0 auto 2px;
}

.cross-pad .ctrl-btn:nth-child(1) {
  grid-column: 2;
  grid-row: 1;
}
.cross-pad .ctrl-btn:nth-child(2) {
  grid-column: 1;
  grid-row: 2;
}
.cross-pad .ctrl-btn:nth-child(3) {
  grid-column: 2;
  grid-row: 2;
}
.cross-pad .ctrl-btn:nth-child(4) {
  grid-column: 3;
  grid-row: 2;
}

.ctrl-btn,
.action-btn {
  border: 1px solid #2f7ad8;
  background: rgba(7, 24, 48, 0.72);
  color: #78c2ff;
  cursor: pointer;
}

.ctrl-btn {
  width: 32px;
  height: 32px;
  border-radius: 2px;
  font-size: 14px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
}

.ctrl-btn :deep(.el-icon) {
  font-size: 14px;
}

.ctrl-btn--camera {
  color: #9fd2ff;
}

.ctrl-btn--camera-side {
  .camera-main-icon {
    margin-right: 2px;
  }
}

.ctrl-btn--camera-bottom {
  flex-direction: column;
  .camera-main-icon {
    margin-bottom: 1px;
  }
}

.camera-main-icon {
  font-size: 13px !important;
  line-height: 1;
}

.camera-dir-icon {
  font-size: 10px !important;
  line-height: 1;
}

.step-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: auto;
  color: #61bdff;
}

.step-input-number {
  width: 88px;
}

.step-input-number--small {
  width: 72px;
}

.form-row {
  display: grid;
  grid-template-columns: 72px 1fr;
  align-items: center;
  gap: 8px;
  color: #61bdff;
}

.manual-select {
  width: 100%;
}

.manual-control-panel :deep(.el-input-number),
.manual-control-panel :deep(.el-select) {
  --el-bg-color: #1c222a;
  --el-fill-color-blank: #1c222a;
  --el-border-color: #2f7ad8;
  --el-border-color-hover: #4f6dd6;
  --el-border-color-light: #2f7ad8;
  --el-input-border-color: #07080c;
  --el-input-hover-border-color: #4f6dd6;
  --el-text-color-regular: #ffffff;
  --el-input-text-color: #ffffff;
  --el-text-color-placeholder: rgba(255, 255, 255, 0.45);
  --el-color-primary: #558efc;
}
:deep(.el-input-number.is-controls-right) {
  --el-input-number-control-height: 18px;
  height: 36px;
  flex-shrink: 0;

  .el-input__wrapper {
    height: 36px;
    padding-right: 32px;
    background: #03060a;
    box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.12) inset;
  }

  .el-input__inner {
    color: #fff;
    text-align: left;
    font-size: 14px;
    line-height: 36px;
  }

  .el-input-number__decrease,
  .el-input-number__increase {
    width: 30px;
    height: 50%;
    background: #15191e;
    border-color: rgba(255, 255, 255, 0.12);
    color: rgba(255, 255, 255, 0.65);

    &:hover:not(.is-disabled) {
      color: #fff;
      background: #252a33;
    }

    .el-icon {
      font-size: 12px;
    }
  }

  .el-input-number__decrease {
    top: calc(50% + 1px);
    border-left: 1px solid rgba(255, 255, 255, 0.12);
  }

  .el-input-number__increase {
    top: 1px;
    border-left: 1px solid rgba(255, 255, 255, 0.12);
  }
}
// .manual-control-panel :deep(.el-input-number .el-input__wrapper),
// .manual-control-panel :deep(.el-select .el-select__wrapper) {
//   box-shadow: 0 0 0 1px #2f7ad8 inset !important;
//   background: #1c222a !important;
//   border-radius: 2px;
// }

// .manual-control-panel :deep(.el-input-number .el-input__inner),
// .manual-control-panel :deep(.el-select .el-select__placeholder),
// .manual-control-panel :deep(.el-select .el-select__selected-item) {
//   color: #ffffff !important;
// }

// .manual-control-panel :deep(.el-input-number.is-controls-right .el-input-number__increase),
// .manual-control-panel :deep(.el-input-number.is-controls-right .el-input-number__decrease) {
//   width: 22px;
//   right: 1px;
//   background: #202a47;
//   color: #8cb7ff;
//   border-left: 1px solid #2f7ad8;
// }

// .manual-control-panel :deep(.el-input-number.is-controls-right .el-input-number__increase) {
//   border-bottom: 1px solid #2f7ad8;
// }

// .manual-control-panel :deep(.el-input-number.is-controls-right .el-input-number__increase .el-icon),
// .manual-control-panel :deep(.el-input-number.is-controls-right .el-input-number__decrease .el-icon) {
//   font-size: 12px;
//   font-weight: 700;
// }

:deep(.manual-select-popper.el-popper) {
  border: 1px solid #2f7ad8 !important;
  background: #1c222a !important;
}

:deep(.manual-select-popper .el-select-dropdown__item) {
  color: #ffffff;
}

:deep(.manual-select-popper .el-select-dropdown__item.is-hovering),
:deep(.manual-select-popper .el-select-dropdown__item:hover) {
  background: rgba(85, 142, 252, 0.2);
}

:deep(.manual-select-popper .el-select-dropdown__item.is-selected) {
  color: #77a8ff;
}

.focus-row {
  display: grid;
  grid-template-columns: 34px 1fr 52px;
  align-items: center;
  gap: 8px;
  color: #61bdff;
}

.action-btn {
  height: 34px;
  border-radius: 2px;
  font-size: 14px;

  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
}

.action-btn--recording {
  background: rgba(255, 77, 79, 0.22);
  border-color: #ff6d6f;
  color: #ffd7d8;
}

.action-btn--danger {
  border-color: #5aa9ff;
  color: #ffffff;
}

.close-btn {
  position: absolute;
  right: 1px;
  top: 1px;
  width: 24px;
  height: 24px;
  text-align: center;
  border-radius: 4px;
  border: 1px solid #2f7ad8;
  background: rgba(7, 24, 48, 0.72);
  color: #9fd2ff;
  cursor: pointer;
}
</style>
