<template>
  <div class="device-form">
    <div class="device-form__section device-form__section--actions">
      <div class="device-form__actions">
        <el-button plain class="device-form__back-btn" @click="goBack">
          <el-icon><ArrowLeft /></el-icon>
          返回
        </el-button>
        <el-button type="primary" :loading="submitting" @click="submit">保存</el-button>
      </div>
    </div>

    <div class="device-form__section device-form__section--title">
      <div class="device-form__title">{{ isEdit ? "编辑无人机" : "新建无人机" }}</div>
    </div>

    <div class="device-form__section device-form__section--content">
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="120px"
        class="device-form__body"
      >
        <el-form-item label="无人机名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入无人机名称" />
        </el-form-item>

        <el-form-item label="无人机SN号" prop="sn">
          <el-input
            v-model="form.sn"
            placeholder="请输入无人机 SN 号"
          />
        </el-form-item>

        <el-form-item label="航线ID" prop="waylineId">
          <el-input
            v-model="form.waylineId"
            placeholder="请输入航线 ID"
          />
        </el-form-item>

        <el-form-item label="机场经度" prop="longitude">
          <el-input
            v-model="form.longitude"
            placeholder="请输入机场经度（选填）"
            @blur="validateDockCoordinateFields"
          />
        </el-form-item>

        <el-form-item label="机场纬度" prop="latitude">
          <el-input
            v-model="form.latitude"
            placeholder="请输入机场纬度（选填）"
            @blur="validateDockCoordinateFields"
          />
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
import { createDrone, fetchDroneDetail, updateDrone } from "@backend/api/drone.js";
import { useOrgCascader } from "@backend/composables/useOrgCascader.js";
import { MONITOR_BASE } from "@backend/router/routes.js";
import {
  buildDronePayload,
  resolveDroneFormCoordinates,
  validateOptionalDockCoordinates,
} from "@backend/utils/drone.js";
import { resolveOrgContextFromTree } from "@backend/utils/org-set.js";
import { useAuthStore } from "@/stores/auth.js";

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const { orgSetId, orgTreeOptions, initOrgCascader } = useOrgCascader({ autoSelectFirst: false });

const formRef = ref();
const submitting = ref(false);
const orgId = ref(null);
const rootOrgId = ref(null);
const isEdit = computed(() => Boolean(route.params.id) && route.params.id !== "new");

const form = reactive({
  name: "",
  sn: "",
  waylineId: "",
  longitude: "",
  latitude: "",
});

function validateDockCoordinateField(_rule, _value, callback) {
  const result = validateOptionalDockCoordinates(form.longitude, form.latitude);
  if (!result.valid) {
    callback(new Error(result.message));
    return;
  }
  callback();
}

function validateDockCoordinateFields() {
  formRef.value?.validateField(["longitude", "latitude"]).catch(() => {});
}

const rules = {
  name: [{ required: true, message: "请输入无人机名称", trigger: "blur" }],
  sn: [{ required: true, message: "请输入无人机 SN 号", trigger: "blur" }],
  waylineId: [{ required: true, message: "请输入航线 ID", trigger: "blur" }],
  longitude: [{ validator: validateDockCoordinateField, trigger: "blur" }],
  latitude: [{ validator: validateDockCoordinateField, trigger: "blur" }],
};

async function initOrgContext() {
  if (isEdit.value) return;

  const queryOrgId = route.query.orgId;
  const queryRootOrgId = route.query.rootOrgId;

  if (queryOrgId != null && queryOrgId !== "") {
    orgId.value = Number(queryOrgId) || queryOrgId;
  } else if (!authStore.isSuperAdmin && authStore.orgId != null) {
    orgId.value = authStore.orgId;
  }

  if (queryRootOrgId != null && queryRootOrgId !== "") {
    rootOrgId.value = Number(queryRootOrgId) || queryRootOrgId;
    return;
  }

  if (orgId.value == null) return;

  await initOrgCascader(authStore);
  const ctx = resolveOrgContextFromTree(orgTreeOptions.value, orgId.value, orgSetId.value);
  rootOrgId.value = ctx?.rootOrgId ?? null;
}

async function loadDetail() {
  if (!isEdit.value) return;
  const data = await fetchDroneDetail({ id: route.params.id });
  const coords = resolveDroneFormCoordinates(data);
  orgId.value = data.orgId ?? null;
  rootOrgId.value = data.rootOrgId ?? null;
  Object.assign(form, {
    name: data.name,
    sn: data.sn,
    waylineId: data.waylineId ?? "",
    longitude: coords.longitude,
    latitude: coords.latitude,
  });

  if (rootOrgId.value == null && orgId.value != null) {
    await initOrgCascader(authStore);
    const ctx = resolveOrgContextFromTree(orgTreeOptions.value, orgId.value, orgSetId.value);
    rootOrgId.value = ctx?.rootOrgId ?? null;
  }
}

async function submit() {
  await formRef.value.validate();
  if (orgId.value == null || rootOrgId.value == null) {
    ElMessage.warning("缺少单位信息，请从列表页重新进入");
    return;
  }

  submitting.value = true;
  try {
    const payload = buildDronePayload(form, {
      id: isEdit.value ? route.params.id : undefined,
      orgId: orgId.value,
      rootOrgId: rootOrgId.value,
    });
    if (isEdit.value) {
      await updateDrone(payload);
      ElMessage.success("保存成功");
    } else {
      await createDrone(payload);
      ElMessage.success("创建成功");
    }
    goBack();
  } finally {
    submitting.value = false;
  }
}

function goBack() {
  router.push(`${MONITOR_BASE}/drones`);
}

onMounted(async () => {
  await initOrgContext();
  await loadDetail();
});
</script>

<style scoped lang="scss">
.device-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.device-form__section {
  background: #fff;
  border: 1px solid #ebeef5;
  border-radius: 4px;
}

.device-form__section--actions {
  padding: 12px 16px;
}

.device-form__section--title {
  padding: 14px 16px;
  background: #fafafa;
}

.device-form__section--content {
  padding: 20px 16px 24px;
}

.device-form__actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.device-form__back-btn {
  --el-button-text-color: #d87533;
  --el-button-border-color: #d87533;
  --el-button-hover-text-color: #d87533;
  --el-button-hover-border-color: #d87533;
  --el-button-hover-bg-color: #fdf6f0;
}

.device-form__title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.device-form__body {
  max-width: 720px;
}

.device-form__body :deep(.el-input__wrapper) {
  background: #fafafa;
  box-shadow: none;
  border: 1px solid #f0f2f5;
}

.device-form__body :deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1px var(--el-color-primary) inset;
  background: #fff;
}

.device-form__body :deep(.el-form-item__label) {
  color: #606266;
}

</style>
