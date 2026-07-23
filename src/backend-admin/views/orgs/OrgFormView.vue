<template>
  <div class="org-form">
    <div class="org-form__section org-form__section--actions">
      <div class="org-form__actions">
        <el-button plain class="org-form__back-btn" @click="goBack">
          <el-icon><ArrowLeft /></el-icon>
          返回
        </el-button>
        <el-button type="primary" :loading="submitting" @click="submit">保存</el-button>
      </div>
    </div>

    <div class="org-form__section org-form__section--title">
      <div class="org-form__title">{{ isEdit ? "编辑单位" : "新建单位" }}</div>
    </div>

    <div class="org-form__section org-form__section--content">
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="120px"
        class="org-form__body"
      >
        <el-form-item label="选择单位集" prop="region">
          <OrgSetCascader
            v-model="form.region"
            :options="orgSetCascaderOptions"
            :loading="orgSetLoading"
            placeholder="请选择单位集"
            select-class="org-form__region-cascader"
          />
        </el-form-item>

        <el-form-item label="单位名称" prop="name">
          <el-input
            v-model="form.name"
            maxlength="64"
            show-word-limit
            placeholder="请输入单位名称"
          />
        </el-form-item>

        <el-form-item label="单位性质" prop="orgLabel">
          <el-radio-group v-model="form.orgLabel" class="org-form__radio-group">
            <el-radio
              v-for="item in orgLabelOptions"
              :key="item.value"
              :value="item.value"
            >
              {{ item.label }}
            </el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="描述" prop="description">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="3"
            maxlength="200"
            show-word-limit
            placeholder="请输入描述"
          />
        </el-form-item>

        <!-- <el-form-item label="单位联系人" prop="contactName">
          <el-input v-model="form.contactName" placeholder="请输入单位联系人" />
        </el-form-item>

        <el-form-item label="联系电话" prop="contactPhone">
          <el-input v-model="form.contactPhone" placeholder="请输入联系电话" />
        </el-form-item>

        <el-form-item label="是否为基层单位" prop="isGrassroots">
          <el-radio-group v-model="form.isGrassroots">
            <el-radio :value="true">是</el-radio>
            <el-radio :value="false">否</el-radio>
          </el-radio-group>
        </el-form-item> -->

        <el-form-item label="辖区范围设置" style="width: 80vw">
          <TiandituAreaMap
            v-model="form.jurisdictionArea"
            mode="draw"
            class="org-form__jurisdiction-map"
          />
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script setup>
import { ArrowLeft } from "@element-plus/icons-vue";
import { useRoute, useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import { createOrg, fetchOrgDetail, updateOrg } from "@backend/api/org.js";
import { useOrgSetOptions } from "@backend/composables/useOrgSetOptions.js";
import OrgSetCascader from "@backend/components/OrgSetCascader.vue";
import { BACKEND_BASE } from "@backend/router/routes.js";
import { buildOrgFormPayload, parseOrgFormDetail } from "@backend/utils/org-form.js";
import TiandituAreaMap from "@/components/TiandituAreaMap.vue";
import {
  DEFAULT_REGION,
  ORG_LABEL,
  ORG_LABEL_TEXT,
} from "@backend/config/constants.js";

const route = useRoute();
const router = useRouter();

const orgLabelOptions = Object.entries(ORG_LABEL_TEXT)
  .filter(([value]) => Number(value) !== ORG_LABEL.SET)
  .map(([value, label]) => ({ value: Number(value), label }));
const { loading: orgSetLoading, orgSetCascaderOptions, loadOrgSetOptions, syncRegionValue } =
  useOrgSetOptions();

const formRef = ref();
const submitting = ref(false);
const isEdit = computed(() => Boolean(route.params.id));

const form = reactive({
  region: DEFAULT_REGION,
  parentId: null,
  rootId: DEFAULT_REGION,
  name: "",
  orgLabel: ORG_LABEL.POLICE_STATION,
  status: 0,
  description: "",
  jurisdictionArea: null,
});

const rules = {
  region: [{ required: true, message: "请选择单位集", trigger: "change" }],
  name: [
    { required: true, message: "请输入单位名称", trigger: "blur" },
    { max: 64, message: "单位名称最多 64 个字符", trigger: "blur" },
  ],
  orgLabel: [{ required: true, message: "请选择单位性质", trigger: "change" }],
};

async function loadDetail() {
  if (!isEdit.value) return;
  const data = await fetchOrgDetail({ id: route.params.id });
  Object.assign(form, parseOrgFormDetail(data));
  syncRegionValue(toRef(form, "region"));
}

async function submit() {
  await formRef.value.validate();
  submitting.value = true;
  try {
    form.rootId = form.region;
    const payload = buildOrgFormPayload(form, isEdit.value ? { id: route.params.id } : {});
    if (isEdit.value) {
      await updateOrg(payload);
      ElMessage.success("保存成功");
    } else {
      await createOrg(payload);
      ElMessage.success("创建成功");
    }
    goBack();
  } finally {
    submitting.value = false;
  }
}

function goBack() {
  router.push(`${BACKEND_BASE}/orgs`);
}

onMounted(async () => {
  await loadOrgSetOptions();
  if (!isEdit.value) {
    syncRegionValue(toRef(form, "region"));
  }
  await loadDetail();
});
</script>

<style scoped lang="scss">
.org-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.org-form__section {
  background: #fff;
  border: 1px solid #ebeef5;
  border-radius: 4px;
}

.org-form__section--actions {
  padding: 12px 16px;
}

.org-form__section--title {
  padding: 14px 16px;
}

.org-form__section--content {
  padding: 20px 16px 24px;
}

.org-form__actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.org-form__back-btn {
  --el-button-text-color: #d87533;
  --el-button-border-color: #d87533;
  --el-button-hover-text-color: #d87533;
  --el-button-hover-border-color: #d87533;
  --el-button-hover-bg-color: #fdf6f0;
}

.org-form__title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.org-form__body {
  max-width: 720px;
}

.org-form__region-cascader {
  width: 100%;
}

.org-form__radio-group :deep(.el-radio) {
  margin-right: 24px;
}

.org-form__radio-group :deep(.el-radio__label) {
  color: #606266;
  font-size: 14px;
  line-height: 22px;
}

.org-form__radio-group :deep(.el-radio.is-checked .el-radio__label) {
  color: var(--el-color-primary);
}

.org-form__jurisdiction-map {
  width: 50vw;
  height: calc(100vh - 510px);
  min-height: 300px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  overflow: hidden;
}
</style>
