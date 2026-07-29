<template>
  <div class="key-location-form">
    <div class="key-location-form__section key-location-form__section--actions">
      <div class="key-location-form__actions">
        <el-button plain class="key-location-form__back-btn" @click="goBack">
          <el-icon><ArrowLeft /></el-icon>

          返回
        </el-button>

        <el-button type="primary" :loading="submitting" @click="submit"
          >保存</el-button
        >
      </div>
    </div>

    <div class="key-location-form__section key-location-form__section--title">
      <div class="key-location-form__title">
        {{ isEdit ? "编辑重点地点" : "新建重点地点" }}
      </div>
    </div>

    <div class="key-location-form__section key-location-form__section--content">
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="120px"
        class="key-location-form__body"
      >
        <el-form-item label="计划类型" prop="type">
          <el-radio-group v-model="form.type" class="key-location-form__radio-group">
            <el-radio
              v-for="item in planTypeOptions"
              :key="item.value"
              :value="item.value"
            >
              {{ item.label }}
            </el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="所属单位" prop="orgId">
          <OrgCascader
            v-model="form.orgId"
            :options="orgTreeOptions"
            :loading="orgCascaderLoading"
            select-class="key-location-form__org-cascader"
            @change="handleOrgChange"
          />
        </el-form-item>

        <el-form-item label="地点名称" prop="name">
          <el-input
            v-model="form.name"
            maxlength="64"
            show-word-limit
            placeholder="请输入地点名称"
          />
        </el-form-item>

        <el-form-item label="地点类型" prop="placeType">
          <el-select
            v-model="form.placeType"
            placeholder="请选择地点类型"
            style="width: 100%"
          >
            <el-option
              v-for="item in placeTypeOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="经度" prop="longitude">
          <el-input v-model="form.longitude" placeholder="请输入经度" />
        </el-form-item>

        <el-form-item label="纬度" prop="latitude">
          <el-input v-model="form.latitude" placeholder="请输入纬度" />
        </el-form-item>

        <el-form-item label="半径(米)" prop="radius">
          <el-input v-model="form.radius" placeholder="请输入半径" />
        </el-form-item>

        <el-form-item label="描述" prop="description">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="3"
            maxlength="200"
            show-word-limit
            placeholder="选填"
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

import {
  createKeyLocation,
  fetchKeyLocationDetail,
  updateKeyLocation,
} from "@backend/api/place.js";

import OrgCascader from "@backend/components/OrgCascader.vue";

import { useOrgCascader } from "@backend/composables/useOrgCascader.js";

import {
  PLACE_TYPE,
  PLACE_TYPE_OPTIONS,
  PLAN_TYPE,
  PLAN_TYPE_OPTIONS,
} from "@backend/config/constants.js";

import { INFRA_BASE } from "@backend/router/routes.js";

import { buildKeyLocationPayload } from "@backend/utils/key-location.js";

import { resolveOrgContextFromTree } from "@backend/utils/org-set.js";

import { useAuthStore } from "@/stores/auth.js";

const route = useRoute();

const router = useRouter();

const authStore = useAuthStore();

const planTypeOptions = PLAN_TYPE_OPTIONS;

const placeTypeOptions = PLACE_TYPE_OPTIONS;

const {
  orgSetId,

  orgTreeOptions,

  loading: orgCascaderLoading,

  initOrgCascader,
} = useOrgCascader({ autoSelectFirst: false });

const formRef = ref();

const submitting = ref(false);

const isEdit = computed(
  () => Boolean(route.params.id) && route.params.id !== "new",
);

const initialPlanType = Number(route.query.type);

const form = reactive({
  type:
    Number.isFinite(initialPlanType) && initialPlanType > 0
      ? initialPlanType
      : PLAN_TYPE.MOUNTAIN,

  orgId: null,

  rootOrgId: null,

  name: "",

  placeType: PLACE_TYPE.UNIVERSITY,

  longitude: "",

  latitude: "",

  radius: "",

  description: "",
});

function validateCoordinate(_rule, value, callback) {
  const num = Number(value);

  if (!Number.isFinite(num)) {
    callback(new Error("请输入有效数字"));

    return;
  }

  callback();
}

function validateRadius(_rule, value, callback) {
  const num = Number(value);

  if (!Number.isFinite(num) || num <= 0) {
    callback(new Error("请输入有效半径"));

    return;
  }

  callback();
}

const rules = {
  type: [{ required: true, message: "请选择计划类型", trigger: "change" }],

  orgId: [{ required: true, message: "请选择所属单位", trigger: "change" }],

  name: [{ required: true, message: "请输入地点名称", trigger: "blur" }],

  placeType: [{ required: true, message: "请选择地点类型", trigger: "change" }],

  longitude: [
    { required: true, message: "请输入经度", trigger: "blur" },

    { validator: validateCoordinate, trigger: "blur" },
  ],

  latitude: [
    { required: true, message: "请输入纬度", trigger: "blur" },

    { validator: validateCoordinate, trigger: "blur" },
  ],

  radius: [
    { required: true, message: "请输入半径", trigger: "blur" },

    { validator: validateRadius, trigger: "blur" },
  ],
};

function syncRootOrgId(orgId) {
  if (orgId == null || orgId === "") {
    form.rootOrgId = null;

    return;
  }

  const ctx = resolveOrgContextFromTree(
    orgTreeOptions.value,
    orgId,
    orgSetId.value,
  );

  form.rootOrgId = ctx?.rootOrgId ?? null;
}

function handleOrgChange(orgId) {
  form.orgId = orgId;

  syncRootOrgId(orgId);
}

function applyOrgFromQuery() {
  const queryOrgId = route.query.orgId;

  const queryRootOrgId = route.query.rootOrgId;

  if (queryOrgId != null && queryOrgId !== "") {
    form.orgId = Number(queryOrgId) || queryOrgId;
  } else if (authStore.orgId != null) {
    form.orgId = authStore.orgId;
  }

  if (queryRootOrgId != null && queryRootOrgId !== "") {
    form.rootOrgId = Number(queryRootOrgId) || queryRootOrgId;
  } else if (form.orgId != null) {
    syncRootOrgId(form.orgId);
  }
}

async function loadOrgOptions() {
  await initOrgCascader(authStore);

  if (!isEdit.value) {
    applyOrgFromQuery();
  }
}

async function loadDetail() {
  if (!isEdit.value) return;

  const data = await fetchKeyLocationDetail({ id: route.params.id });

  Object.assign(form, {
    type: data.type ?? PLAN_TYPE.MOUNTAIN,

    orgId: data.orgId ?? null,

    rootOrgId: data.rootOrgId ?? null,

    name: data.name,

    placeType: data.placeType ?? PLACE_TYPE.UNIVERSITY,

    longitude: data.longitude != null ? String(data.longitude) : "",

    latitude: data.latitude != null ? String(data.latitude) : "",

    radius: data.radius != null ? String(data.radius) : "",

    description: data.description ?? "",
  });

  if (form.rootOrgId == null && form.orgId != null) {
    syncRootOrgId(form.orgId);
  }
}

async function submit() {
  await formRef.value.validate();

  syncRootOrgId(form.orgId);

  if (form.orgId == null || form.rootOrgId == null) {
    ElMessage.warning("请选择所属单位");

    return;
  }

  submitting.value = true;

  try {
    const payload = buildKeyLocationPayload(
      form,
      isEdit.value ? { id: route.params.id } : {},
    );

    if (isEdit.value) {
      await updateKeyLocation(payload);

      ElMessage.success("保存成功");
    } else {
      await createKeyLocation(payload);

      ElMessage.success("创建成功");
    }

    goBack();
  } finally {
    submitting.value = false;
  }
}

function goBack() {
  router.push(`${INFRA_BASE}/locations`);
}

onMounted(async () => {
  await loadOrgOptions();

  await loadDetail();
});
</script>

<style scoped lang="scss">
.key-location-form {
  display: flex;

  flex-direction: column;

  gap: 12px;
}

.key-location-form__section {
  background: #fff;

  border: 1px solid #ebeef5;

  border-radius: 4px;
}

.key-location-form__section--actions {
  padding: 12px 16px;
}

.key-location-form__section--title {
  padding: 14px 16px;

  background: #fafafa;
}

.key-location-form__section--content {
  padding: 20px 16px 24px;
}

.key-location-form__actions {
  display: flex;

  justify-content: space-between;

  align-items: center;
}

.key-location-form__back-btn {
  --el-button-text-color: #d87533;

  --el-button-border-color: #d87533;

  --el-button-hover-text-color: #d87533;

  --el-button-hover-border-color: #d87533;
  --el-button-hover-bg-color: #fdf6f0;
}

.key-location-form__title {
  font-size: 16px;

  font-weight: 600;

  color: #303133;
}

.key-location-form__body {
  max-width: 720px;
}

.key-location-form__org-cascader {
  width: 100%;
}

.key-location-form__radio-group :deep(.el-radio) {
  margin-right: 24px;
}

.key-location-form__radio-group :deep(.el-radio__label) {
  color: #606266;
  font-size: 14px;
  line-height: 22px;
}

.key-location-form__radio-group :deep(.el-radio.is-checked .el-radio__label) {
  color: var(--el-color-primary);
}

.key-location-form__body :deep(.el-input__wrapper),
.key-location-form__body :deep(.el-select__wrapper) {
  background: #fafafa;

  box-shadow: none;

  border: 1px solid #f0f2f5;
}

.key-location-form__body :deep(.el-input__wrapper.is-focus),
.key-location-form__body :deep(.el-select__wrapper.is-focused) {
  box-shadow: 0 0 0 1px var(--el-color-primary) inset;

  background: #fff;
}

.key-location-form__body :deep(.el-form-item__label) {
  color: #606266;
}
</style>
