<template>
  <div class="vehicle-form">
    <div class="vehicle-form__section vehicle-form__section--actions">
      <div class="vehicle-form__actions">
        <el-button plain class="vehicle-form__back-btn" @click="goBack">
          <el-icon><ArrowLeft /></el-icon>
          返回
        </el-button>
        <el-button type="primary" :loading="submitting" @click="submit">保存</el-button>
      </div>
    </div>

    <div class="vehicle-form__section vehicle-form__section--title">
      <div class="vehicle-form__title">{{ isEdit ? "编辑车辆" : "新建车辆" }}</div>
    </div>

    <div class="vehicle-form__section vehicle-form__section--content">
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="140px"
        class="vehicle-form__body"
      >
        <el-form-item label="请输入车辆信息" prop="plateNumber">
          <div class="vehicle-form__plate">
            <el-select
              v-model="form.plateProvince"
              class="vehicle-form__plate-province"
              filterable
              default-first-option
              :filter-method="filterProvince"
              placeholder="省"
              @change="handlePlateChange"
              @visible-change="handleProvinceVisibleChange"
            >
              <el-option
                v-for="item in filteredProvinceOptions"
                :key="item.value"
                :label="item.value"
                :value="item.value"
              >
                <span class="vehicle-form__province-short">{{ item.value }}</span>
                <span class="vehicle-form__province-name">{{ item.name }}</span>
              </el-option>
            </el-select>

            <el-input
              v-model="form.plateLetter"
              class="vehicle-form__plate-letter"
              maxlength="1"
              placeholder="字母"
              @input="handlePlateLetterInput"
              @blur="handlePlateChange"
            />

            <span class="vehicle-form__plate-dot">·</span>

            <el-input
              v-model="form.plateBody"
              class="vehicle-form__plate-body"
              maxlength="8"
              placeholder="车牌号码"
              @input="handlePlateBodyInput"
              @blur="handlePlateChange"
            />
          </div>
        </el-form-item>

        <el-form-item label="设置车辆动力类型" prop="powerType">
          <el-select v-model="form.powerType" placeholder="燃油车/新能源" style="width: 100%">
            <el-option
              v-for="item in powerTypeOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ArrowLeft } from "@element-plus/icons-vue";
import { ElMessage } from "element-plus";
import {
  createVehicle,
  fetchVehicleDetail,
  updateVehicle,
} from "@backend/api/monitor-library.js";
import {
  VEHICLE_PLATE_PROVINCES,
  VEHICLE_POWER_TYPE,
  VEHICLE_POWER_TYPE_OPTIONS,
} from "@backend/config/constants.js";
import {
  buildVehiclePayload,
  parsePlateNumber,
  sanitizePlateBody,
  sanitizePlateLetter,
  validatePlateParts,
} from "@backend/utils/monitor-library.js";
import { INFRA_BASE } from "@backend/router/routes.js";

const route = useRoute();
const router = useRouter();
const provinceOptions = VEHICLE_PLATE_PROVINCES;
const filteredProvinceOptions = ref([...provinceOptions]);
const powerTypeOptions = VEHICLE_POWER_TYPE_OPTIONS;
const formRef = ref();
const submitting = ref(false);

const isEdit = computed(() => Boolean(route.params.id) && route.params.id !== "new");

const form = reactive({
  plateProvince: "",
  plateLetter: "",
  plateBody: "",
  plateNumber: "",
  powerType: VEHICLE_POWER_TYPE.FUEL,
});

function validatePlateNumber(_rule, _value, callback) {
  const message = validatePlateParts(form);
  if (message) {
    callback(new Error(message));
    return;
  }
  callback();
}

const rules = {
  plateNumber: [{ required: true, validator: validatePlateNumber, trigger: ["change", "blur"] }],
  powerType: [{ required: true, message: "请选择车辆动力类型", trigger: "change" }],
};

function filterProvince(query) {
  const keyword = String(query ?? "").trim();
  if (!keyword) {
    filteredProvinceOptions.value = provinceOptions;
    return;
  }

  filteredProvinceOptions.value = provinceOptions.filter(
    (item) => item.value.includes(keyword) || item.name.includes(keyword),
  );
}

function handleProvinceVisibleChange(visible) {
  if (!visible) {
    filteredProvinceOptions.value = provinceOptions;
  }
}

function syncPlateNumberField() {
  form.plateNumber = `${form.plateProvince}${form.plateLetter}·${form.plateBody}`;
}

function handlePlateLetterInput(value) {
  form.plateLetter = sanitizePlateLetter(value);
  syncPlateNumberField();
}

function handlePlateBodyInput(value) {
  form.plateBody = sanitizePlateBody(value);
  syncPlateNumberField();
}

function handlePlateChange() {
  syncPlateNumberField();
  formRef.value?.validateField("plateNumber");
}

async function loadDetail() {
  if (!isEdit.value) return;
  const data = await fetchVehicleDetail({ id: route.params.id });
  const plateParts = parsePlateNumber(data.plateNo || data.plateNumber);
  Object.assign(form, {
    plateProvince: plateParts.plateProvince,
    plateLetter: plateParts.plateLetter,
    plateBody: plateParts.plateBody,
    powerType: data.powerType || VEHICLE_POWER_TYPE.FUEL,
  });
  syncPlateNumberField();
}

async function submit() {
  await formRef.value.validate();
  submitting.value = true;
  try {
    const payload = buildVehiclePayload(form, isEdit.value ? { id: route.params.id } : {});

    if (isEdit.value) {
      await updateVehicle(payload);
      ElMessage.success("保存成功");
    } else {
      await createVehicle(payload);
      ElMessage.success("创建成功");
    }
    goBack();
  } finally {
    submitting.value = false;
  }
}

function goBack() {
  router.push(`${INFRA_BASE}/library`);
}

onMounted(loadDetail);
</script>

<style scoped lang="scss">
.vehicle-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.vehicle-form__section {
  background: #fff;
  border: 1px solid #ebeef5;
  border-radius: 4px;
}

.vehicle-form__section--actions {
  padding: 12px 16px;
}

.vehicle-form__section--title {
  padding: 14px 16px;
  background: #fafafa;
}

.vehicle-form__section--content {
  padding: 20px 16px 24px;
}

.vehicle-form__actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.vehicle-form__back-btn {
  --el-button-text-color: #d87533;
  --el-button-border-color: #d87533;
  --el-button-hover-text-color: #d87533;
  --el-button-hover-border-color: #d87533;
  --el-button-hover-bg-color: #fdf6f0;
}

.vehicle-form__title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.vehicle-form__body {
  max-width: 720px;
}

.vehicle-form__plate {
  display: flex;
  align-items: center;
  gap: 0;
  width: 100%;
}

.vehicle-form__plate-province {
  width: 108px;
  flex-shrink: 0;
  margin-right: 8px;
}

.vehicle-form__province-short {
  display: inline-block;
  min-width: 20px;
  margin-right: 8px;
  font-weight: 600;
}

.vehicle-form__province-name {
  color: #909399;
  font-size: 13px;
}

.vehicle-form__plate-letter {
  width: 72px;
  flex-shrink: 0;
}

.vehicle-form__plate-dot {
  flex-shrink: 0;
  margin: 0;
  padding: 0;
  color: #303133;
  font-size: 18px;
  line-height: 1;
  user-select: none;
}

.vehicle-form__plate-body {
  flex: 1;
  min-width: 0;
  margin-left: 0;
}

.vehicle-form__body :deep(.el-input__wrapper),
.vehicle-form__body :deep(.el-select__wrapper) {
  background: #fafafa;
  box-shadow: none;
  border: 1px solid #f0f2f5;
}

.vehicle-form__body :deep(.el-input__wrapper.is-focus),
.vehicle-form__body :deep(.el-select__wrapper.is-focused) {
  box-shadow: 0 0 0 1px var(--el-color-primary) inset;
  background: #fff;
}

.vehicle-form__body :deep(.el-form-item__label) {
  color: #606266;
}
</style>
