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
          <el-select v-model="form.region" placeholder="请选择单位集" style="width: 100%">
            <el-option
              v-for="item in parentUnitOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="单位名称" prop="name">
          <el-input
            v-model="form.name"
            maxlength="64"
            show-word-limit
            placeholder="请输入单位名称"
          />
        </el-form-item>

        <el-form-item label="单位性质" prop="nature">
          <el-radio-group v-model="form.nature" class="org-form__radio-group">
            <el-radio
              v-for="(text, key) in orgNatureLabels"
              :key="key"
              :value="key"
            >
              {{ text }}
            </el-radio>
          </el-radio-group>
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

        <el-form-item label="辖区范围设置">
          <div class="org-form__jurisdiction">
            <span class="org-form__jurisdiction-tip">地图选区功能开发中，后续将接入天地图</span>
          </div>
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
import { BACKEND_BASE } from "@backend/router/routes.js";
import {
  DEFAULT_REGION,
  DEFAULT_REGION_LABEL,
  ORG_NATURE,
  ORG_NATURE_LABELS,
} from "@backend/config/constants.js";

const route = useRoute();
const router = useRouter();

const orgNatureLabels = ORG_NATURE_LABELS;
const parentUnitOptions = [{ label: DEFAULT_REGION_LABEL, value: DEFAULT_REGION }];

const formRef = ref();
const submitting = ref(false);
const isEdit = computed(() => Boolean(route.params.id));

const form = reactive({
  region: DEFAULT_REGION,
  name: "",
  nature: ORG_NATURE.POLICE_STATION,
  contactName: "",
  contactPhone: "",
  isGrassroots: true,
});

const rules = {
  region: [{ required: true, message: "请选择单位集", trigger: "change" }],
  name: [
    { required: true, message: "请输入单位名称", trigger: "blur" },
    { max: 64, message: "单位名称最多 64 个字符", trigger: "blur" },
  ],
  nature: [{ required: true, message: "请选择单位性质", trigger: "change" }],
  isGrassroots: [{ required: true, message: "请选择是否为基层单位", trigger: "change" }],
};

async function loadDetail() {
  if (!isEdit.value) return;
  const data = await fetchOrgDetail({ id: route.params.id });
  Object.assign(form, {
    region: data.region || DEFAULT_REGION,
    name: data.name,
    nature: data.nature || ORG_NATURE.POLICE_STATION,
    contactName: data.contactName || "",
    contactPhone: data.contactPhone || "",
    isGrassroots: data.isGrassroots !== false,
  });
}

async function submit() {
  await formRef.value.validate();
  submitting.value = true;
  try {
    const payload = { ...form };
    if (isEdit.value) {
      await updateOrg({ id: route.params.id, ...payload });
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

onMounted(loadDetail);
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

.org-form__jurisdiction {
  width: 100%;
  min-height: 160px;
  border: 1px dashed #dcdfe6;
  border-radius: 4px;
  background: #fafafa;
  display: flex;
  align-items: center;
  justify-content: center;
}

.org-form__jurisdiction-tip {
  color: #909399;
  font-size: 14px;
}
</style>
