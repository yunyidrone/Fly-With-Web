<template>
  <div class="manual-control-wrapper" @click.stop>
    <div class="manual-control-panel">
      <div class="control-column control-column--task">
        <button
          type="button"
          class="task-btn task-btn--pause"
          @click="onPauseTask"
        >
          暂停任务
        </button>
        <button
          type="button"
          class="task-btn task-btn--resume"
          @click="onResumeTask"
        >
          恢复任务
        </button>
      </div>

      <div class="control-column control-column--left">
        <div class="control-title">前进</div>
        <div class="cross-pad">
          <button type="button" class="ctrl-btn" :class="{ 'ctrl-btn--busy': isControlBusy('move:forward') }" @click="onMoveControl('forward')"><el-icon><CaretTop /></el-icon></button>
          <button type="button" class="ctrl-btn" :class="{ 'ctrl-btn--busy': isControlBusy('move:left') }" @click="onMoveControl('left')"><el-icon><CaretLeft /></el-icon></button>
          <button type="button" class="ctrl-btn" :class="{ 'ctrl-btn--busy': isControlBusy('move:backward') }" @click="onMoveControl('backward')"><el-icon><CaretBottom /></el-icon></button>
          <button type="button" class="ctrl-btn" :class="{ 'ctrl-btn--busy': isControlBusy('move:right') }" @click="onMoveControl('right')"><el-icon><CaretRight /></el-icon></button>
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
            :min="DRONE_STEP_MIN"
            controls-position="right"
            @change="onMoveStepChange"
          />
        </div>
      </div>

      <div class="control-column control-column--left">
        <div class="control-title">上升</div>
        <div class="cross-pad">
          <button type="button" class="ctrl-btn" :class="{ 'ctrl-btn--busy': isControlBusy('attitude:up') }" @click="onAttitudeControl('up')">↑</button>
          <button type="button" class="ctrl-btn" :class="{ 'ctrl-btn--busy': isControlBusy('attitude:yawLeft') }" @click="onAttitudeControl('yawLeft')">↶</button>
          <button type="button" class="ctrl-btn" :class="{ 'ctrl-btn--busy': isControlBusy('attitude:pitchDown') }" @click="onAttitudeControl('pitchDown')">↓</button>
          <button type="button" class="ctrl-btn" :class="{ 'ctrl-btn--busy': isControlBusy('attitude:yawRight') }" @click="onAttitudeControl('yawRight')">↷</button>
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
            :min="DRONE_STEP_MIN"
            controls-position="right"
            @change="onRotateStepChange"
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
            :disabled="isControlBusy('lens:change')"
            :suffix-icon="CaretBottom"
            :show-arrow="false"
            popper-class="manual-select-popper"
            @change="onCameraLensChange"
          >
            <el-option label="默认" value="normal" />
            <el-option label="广角" value="wide" />
            <el-option label="变焦" value="zoom" />
            <el-option label="红外" value="ir" />
          </el-select>
        </label>
        <!-- <label class="form-row">
          <span>挂载镜头</span>
          <el-select
            v-model="payloadLens"
            class="manual-select"
            placeholder="请选择挂载"
            :suffix-icon="CaretBottom"
            :show-arrow="false"
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
            :suffix-icon="CaretBottom"
            :show-arrow="false"
            popper-class="manual-select-popper"
            @change="onSelectChange('cameraMode', $event)"
          >
            <el-option label="拍照" value="photo" />
            <el-option label="录像" value="video" />
          </el-select>
        </label> -->
        <div class="focus-row">
          <span>焦距</span>
          <div class="focus-row__controls">
            <input
              v-model.number="focusValue"
              type="range"
              min="1"
              max="20"
              :disabled="isControlBusy('zoom:change')"
              @change="onFocusSliderChange"
            />
            <el-input-number
              v-model="focusValue"
              class="step-input-number"
              :min="1"
              :max="20"
              :disabled="isControlBusy('zoom:change')"
              controls-position="right"
              @change="onFocusNumberChange"
            />
          </div>
        </div>
      </div>

      <div class="control-column control-column--left">
        <div class="control-title">向上</div>
        <div class="cross-pad">
          <button type="button" class="ctrl-btn ctrl-btn--camera ctrl-btn--camera-side" :class="{ 'ctrl-btn--busy': isControlBusy('gimbal:up') }" @click="onCameraControl('up')">
            <el-icon class="camera-main-icon"><CameraFilled /></el-icon>
            <el-icon class="camera-dir-icon"><Top /></el-icon>
          </button>
          <button type="button" class="ctrl-btn ctrl-btn--camera ctrl-btn--camera-bottom" :class="{ 'ctrl-btn--busy': isControlBusy('gimbal:left') }" @click="onCameraControl('left')">
            <el-icon class="camera-main-icon"><CameraFilled /></el-icon>
            <el-icon class="camera-dir-icon"><Back /></el-icon>
          </button>
          <button type="button" class="ctrl-btn ctrl-btn--camera ctrl-btn--camera-side" :class="{ 'ctrl-btn--busy': isControlBusy('gimbal:down') }" @click="onCameraControl('down')">
            <el-icon class="camera-main-icon"><CameraFilled /></el-icon>
            <el-icon class="camera-dir-icon"><Bottom /></el-icon>
          </button>
          <button type="button" class="ctrl-btn ctrl-btn--camera ctrl-btn--camera-bottom" :class="{ 'ctrl-btn--busy': isControlBusy('gimbal:right') }" @click="onCameraControl('right')">
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
            controls-position="right"
            @change="onAngleStepChange"
          />
        </div>
      </div>

      <div class="control-column control-column--right">
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
import { ElMessage } from "element-plus";
import {
  CameraFilled,
  CaretBottom,
  CaretLeft,
  CaretRight,
  CaretTop,
} from "@element-plus/icons-vue";
import { DroneControlService } from "@/api/droneControl.js";

const DRONE_STEP_MIN = 0;

/** @type {Record<string, number>} */
const MOVE_ACTION_TYPE = {
  forward: 4,
  backward: 5,
  left: 2,
  right: 3,
};

/** @type {Record<string, number>} */
const ATTITUDE_ACTION_TYPE = {
  up: 0,
  pitchDown: 1,
  yawLeft: 6,
  yawRight: 7,
};

/** @type {Record<string, number>} */
const GIMBAL_PITCH_MOTION = {
  up: 0,
  down: 1,
  left: 2,
  right: 3,
};

const emit = defineEmits(["close", "control-event"]);
const props = defineProps({
  recordingActive: { type: Boolean, default: false },
  /** 当前操控无人机 SN（serialNumber / airportSn） */
  droneSerialNumber: { type: String, default: "" },
  /** 镜头设备 SN（cameraSn）；来源待定，由父组件传入 */
  cameraDeviceSn: { type: String, default: "" },
});

const moveStep = ref(2);
const rotateStep = ref(2);
const angleStep = ref(6);
const focusValue = ref(2);
const lastAppliedZoom = ref(2);
const cameraLens = ref("");
const payloadLens = ref("");
const cameraMode = ref("");

/** 同一按键防抖间隔（毫秒） */
const CONTROL_DEBOUNCE_MS = 300;
/** @type {import('vue').Ref<Set<string>>} 正在请求中的控件 key */
const loadingKeys = ref(new Set());
/** @type {Map<string, number>} 各控件上次触发时间 */
const lastTriggerAt = new Map();

function isControlBusy(key) {
  return loadingKeys.value.has(key);
}

/** 通过防抖且未在请求中则标记为 loading，返回是否可继续 */
function beginControl(key) {
  if (loadingKeys.value.has(key)) return false;
  const now = Date.now();
  const last = lastTriggerAt.get(key) || 0;
  if (now - last < CONTROL_DEBOUNCE_MS) return false;
  lastTriggerAt.set(key, now);
  const next = new Set(loadingKeys.value);
  next.add(key);
  loadingKeys.value = next;
  return true;
}

function endControl(key) {
  const next = new Set(loadingKeys.value);
  next.delete(key);
  loadingKeys.value = next;
}

function clampDroneStep(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return DRONE_STEP_MIN;
  return Math.max(DRONE_STEP_MIN, n);
}

function resolveSerialNumber() {
  return String(props.droneSerialNumber || "").trim();
}

function resolveCameraDeviceSn() {
  return String(props.cameraDeviceSn || "").trim();
}

async function onCameraLensChange(cameraType) {
  const controlKey = "lens:change";
  const airportSn = resolveSerialNumber();
  const cameraSn = resolveCameraDeviceSn();
  if (!airportSn) {
    ElMessage.warning("未获取到无人机 SN");
    cameraLens.value = "";
    return;
  }
  //if (!cameraSn) {
  //  ElMessage.warning("镜头设备 SN 暂未配置");
  //  cameraLens.value = "";
  //  return;
  //}
  if (!beginControl(controlKey)) return;
  try {
    await DroneControlService.changeLens({
      airportSn,
      cameraSn,
      cameraType: String(cameraType || "").trim(),
    });
    ElMessage.success("镜头切换成功");
    dispatchControlEvent("setting", "cameraLensChange", {
      cameraType,
      airportSn,
      cameraSn,
    });
  } catch {
    cameraLens.value = "";
  } finally {
    endControl(controlKey);
  }
}

async function onPauseTask() {
  const controlKey = "task:pause";
  const serialNumber = resolveSerialNumber();
  if (!serialNumber) {
    ElMessage.warning("未获取到无人机 SN");
    return;
  }
  if (!beginControl(controlKey)) return;
  try {
    await DroneControlService.taskSuspension(serialNumber);
    ElMessage.success("已暂停任务");
    dispatchControlEvent("task", "pause", { serialNumber });
  } catch {
    // 失败提示由 request 拦截器处理
  } finally {
    endControl(controlKey);
  }
}

async function onResumeTask() {
  const controlKey = "task:resume";
  const serialNumber = resolveSerialNumber();
  if (!serialNumber) {
    ElMessage.warning("未获取到无人机 SN");
    return;
  }
  if (!beginControl(controlKey)) return;
  try {
    await DroneControlService.recoveryTask(serialNumber);
    ElMessage.success("已恢复任务");
    dispatchControlEvent("task", "resume", { serialNumber });
  } catch {
    // 失败提示由 request 拦截器处理
  } finally {
    endControl(controlKey);
  }
}

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
}

async function applyDroneHeight(controlKey, actionType, pfs, actionName) {
  const serialNumber = resolveSerialNumber();
  if (!serialNumber) {
    ElMessage.warning("未获取到无人机 SN");
    return;
  }
  const stepMeters = clampDroneStep(pfs);
  if (!beginControl(controlKey)) return;
  try {
    await DroneControlService.droneHeight({
      serialNumber,
      actionType,
      pfs: stepMeters,
    });
    dispatchControlEvent("pose", actionName, {
      serialNumber,
      actionType,
      pfs: stepMeters,
    });
  } catch {
    // 失败提示由 request 拦截器处理
  } finally {
    endControl(controlKey);
  }
}

async function onMoveControl(action) {
  const actionType = MOVE_ACTION_TYPE[action];
  if (actionType == null) return;
  await applyDroneHeight(`move:${action}`, actionType, moveStep.value, action);
}

async function onAttitudeControl(action) {
  const actionType = ATTITUDE_ACTION_TYPE[action];
  if (actionType == null) return;
  await applyDroneHeight(`attitude:${action}`, actionType, rotateStep.value, action);
}

async function applyGimbalPosture(controlKey, pitchingMotion, actionName) {
  const serialNumber = resolveSerialNumber();
  if (!serialNumber) {
    ElMessage.warning("未获取到无人机 SN");
    return;
  }
  const pitchAngle = Number(angleStep.value);
  if (!Number.isFinite(pitchAngle)) return;
  if (!beginControl(controlKey)) return;
  try {
    await DroneControlService.gimbalPostureAdjustment({
      serialNumber,
      pitchAngle,
      pitchingMotion,
    });
    dispatchControlEvent("gimbal", actionName, {
      serialNumber,
      pitchAngle,
      pitchingMotion,
    });
  } catch {
    // 失败提示由 request 拦截器处理
  } finally {
    endControl(controlKey);
  }
}

async function onCameraControl(action) {
  const pitchingMotion = GIMBAL_PITCH_MOTION[action];
  if (pitchingMotion == null) return;
  await applyGimbalPosture(`gimbal:${action}`, pitchingMotion, action);
}

function onAction(action) {
  if (action === "gimbalReset") {
    ElMessage.info("云台复位功能开发中");
    return;
  }
  dispatchControlEvent("action", action);
}

function onStepChange(field, value) {
  dispatchControlEvent("setting", "stepChange", { field, value });
}

function onMoveStepChange(value) {
  moveStep.value = clampDroneStep(value ?? moveStep.value);
  onStepChange("moveStep", moveStep.value);
}

function onRotateStepChange(value) {
  rotateStep.value = clampDroneStep(value ?? rotateStep.value);
  onStepChange("rotateStep", rotateStep.value);
}

function onAngleStepChange(value) {
  onStepChange("angleStep", value ?? angleStep.value);
}

function onSelectChange(field, value) {
  dispatchControlEvent("setting", "selectChange", { field, value });
}

async function applyCameraZoom(zoomRatio) {
  const controlKey = "zoom:change";
  const serialNumber = resolveSerialNumber();
  const ratio = Number(zoomRatio);
  if (!serialNumber) {
    ElMessage.warning("未获取到无人机 SN");
    focusValue.value = lastAppliedZoom.value;
    return;
  }
  if (!Number.isFinite(ratio) || ratio < 1 || ratio > 20) {
    focusValue.value = lastAppliedZoom.value;
    return;
  }
  if (!beginControl(controlKey)) return;
  try {
    await DroneControlService.cameraZoom({ serialNumber, zoomRatio: ratio });
    lastAppliedZoom.value = ratio;
    focusValue.value = ratio;
    dispatchControlEvent("setting", "cameraZoom", { zoomRatio: ratio, serialNumber });
  } catch {
    focusValue.value = lastAppliedZoom.value;
  } finally {
    endControl(controlKey);
  }
}

function onFocusSliderChange() {
  void applyCameraZoom(focusValue.value);
}

function onFocusNumberChange(value) {
  void applyCameraZoom(value ?? focusValue.value);
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
  --ctrl-btn-size: 32px;
  --ctrl-btn-gap: 4px;
  position: relative;
  // width: min(1180px, calc(100vw - 48px));
  // min-height: 100px;
  padding: 18px 18px 14px;
  border: 1px solid #30363b;
  border-radius: 6px;
  background: rgba(3, 6, 10, 0.8);
  display: flex;
  align-items: stretch;
  gap: 10px;
  box-sizing: border-box;
  pointer-events: auto;
  margin-left: 0;
}

/* 横屏（宽高比 ≥ 1）保持左偏；竖屏居中 */
@media (min-aspect-ratio: 1/1) {
  .manual-control-panel {
    margin-left: -30rem;
  }
}

.control-column {
  display: flex;
  flex-direction: column;
  color: #9fd2ff;
  font-size: 14px;
}

.control-column--left {
  width: 160px;
  flex-shrink: 0;
}

.control-column--task {
  width: 80px;
  flex-shrink: 0;
  gap: 8px;
  justify-content: flex-start;
  padding-top: 2px;
}

.task-btn {
  height: 28px;
  border-radius: 2px;
  border: 1px solid rgba(85, 142, 252, 0.85);
  background: rgba(7, 24, 48, 0.72);
  box-shadow: inset 0 0 7px rgba(85, 142, 252, 0.55);
  color: #9fd2ff;
  font-size: 13px;
  cursor: pointer;
  padding: 0 6px;
  white-space: nowrap;

  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
}

.task-btn--pause {
  box-shadow: inset 0 0 7px rgba(253, 127, 55, 0.8);
  border-color: rgba(253, 127, 55, 0.85);
  color: #ffd4b8;
}

.control-column--center {
  width: 280px;
  gap: 10px;
}

.control-column--right {
  margin-left: auto;
  width: 80px;
  gap: 6px;
}

.control-title {
  text-align: center;
  margin-bottom: 8px;
  color: #61bdff;
}

.direction-row {
  display: grid;
  grid-template-columns: repeat(3, var(--ctrl-btn-size));
  column-gap: var(--ctrl-btn-gap);
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
  grid-template-columns: repeat(3, var(--ctrl-btn-size));
  grid-template-rows: repeat(2, var(--ctrl-btn-size));
  gap: var(--ctrl-btn-gap);
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
  border: 1px solid rgba(85, 142, 252, 0.85);
  background: rgba(7, 24, 48, 0.72);
  box-shadow: inset 0 0 7px rgba(85, 142, 252, 0.55);
  color: #9fd2ff;
  cursor: pointer;
}

.ctrl-btn {
  width: var(--ctrl-btn-size);
  height: var(--ctrl-btn-size);
  border-radius: 2px;
  font-size: 14px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  box-sizing: border-box;
}

/* 姿态/云台忙碌：仅变暗，不显示禁用光标；pointer-events 阻断点击 */
.ctrl-btn--busy {
  opacity: 0.45;
  cursor: pointer;
  pointer-events: none;
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
  font-size: 14px !important;
  line-height: 1;
}

.camera-dir-icon {
  font-size: 13px !important;
  line-height: 1;
}

.step-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 10px;
  color: #61bdff;
}

.step-input-number {
  width: 88px;
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

.manual-control-panel :deep(.manual-select.el-select) {
  --el-fill-color-blank: #03060a;
  --el-bg-color: #03060a;
  --el-border-color: rgba(255, 255, 255, 0.12);
  --el-border-color-hover: rgba(255, 255, 255, 0.12);
  --el-color-primary: #4f6dd6;
  --el-input-text-color: #fff;
  --el-text-color-placeholder: rgba(255, 255, 255, 0.45);
  --el-select-input-color: rgba(255, 255, 255, 0.55);

  .el-select__wrapper {
    min-height: 36px;
    height: 36px;
    padding: 0 12px;
    border-radius: 2px;
    background: #03060a;
    box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.12) inset;
  }

  .el-select__wrapper.is-hovering:not(.is-focused),
  .el-select__wrapper.is-focused {
    background: #03060a;
    box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.12) inset;
  }

  .el-select__placeholder,
  .el-select__selected-item .el-select__tags-text,
  .el-select__selected-item > span {
    color: #fff;
    font-size: 14px;
    line-height: 36px;
  }

  .el-select__placeholder,
  .el-select__placeholder.is-transparent {
    color: rgba(255, 255, 255, 0.45);
  }

  .el-select__suffix {
    .el-select__caret {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 14px;
      height: 14px;
      color: rgba(255, 255, 255, 0.55);
      font-size: 14px;
      line-height: 1;

      svg {
        display: block;
        width: 14px;
        height: 14px;
      }
    }
  }
}

.manual-control-panel :deep(.el-input-number) {
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

.focus-row {
  display: grid;
  grid-template-columns: 72px 1fr;
  align-items: center;
  gap: 8px;
  color: #61bdff;
}

.focus-row__controls {
  display: grid;
  grid-template-columns: 1fr 88px;
  align-items: center;
  gap: 8px;
  min-width: 0;

  input[type="range"] {
    width: 100%;
    min-width: 0;
    accent-color: #558efc;
  }
}

.action-btn {
  height: 28px;
  border-radius: 2px;
  font-size: 13px;

  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
}

.action-btn--recording {
  box-shadow: inset 0 0 7px rgba(255, 77, 79, 0.65);
  background: rgba(255, 77, 79, 0.15);
  border-color: rgba(255, 109, 111, 0.85);
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

<!-- 下拉层 teleport 到 body，需非 scoped 才能生效 -->
<style lang="scss">
.manual-select-popper.el-popper {
  --el-bg-color-overlay: #15191e;
  --el-fill-color-blank: #15191e;
  --el-text-color-regular: rgba(255, 255, 255, 0.88);
  --el-border-color-light: rgba(255, 255, 255, 0.12);
  background: #15191e !important;
  border: 1px solid rgba(255, 255, 255, 0.12) !important;
  border-radius: 2px !important;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.45) !important;

  .el-select-dropdown__list {
    padding: 4px 0;
  }

  .el-select-dropdown__item {
    color: rgba(255, 255, 255, 0.88);
    font-size: 14px;
    height: 34px;
    line-height: 34px;

    &.is-hovering,
    &:hover {
      background: rgba(85, 142, 252, 0.15);
    }

    &.is-selected {
      color: #78c2ff;
      font-weight: 500;
    }
  }

  .el-popper__arrow {
    display: none;
  }
}
</style>
