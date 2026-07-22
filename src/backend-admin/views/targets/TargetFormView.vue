<template>
  <div class="target-form">
    <div class="target-form__section target-form__section--actions">
      <div class="target-form__actions">
        <el-button plain class="target-form__back-btn" @click="goBack">
          <el-icon><ArrowLeft /></el-icon>
          返回
        </el-button>
        <el-button type="primary" :loading="submitting" @click="submit">保存</el-button>
      </div>
    </div>

    <div class="target-form__section target-form__section--title">
      <div class="target-form__title">{{ isEdit ? "编辑目标设备" : "新建目标设备" }}</div>
    </div>

    <div class="target-form__section target-form__section--content">
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="140px"
        class="target-form__body"
      >
        <el-form-item label="目标设备名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入目标设备名�? />
        </el-form-item>

        <el-form-item label="输入设备SN�? prop="sn">
          <el-input
            v-model="form.sn"
            placeholder="请输入设�?SN �?
            :disabled="isEdit"
          />
        </el-form-item>

        <el-form-item label="选择类型" prop="type">
          <el-select v-model="form.type" placeholder="警员/警车/机器�? style="width: 100%">
            <el-option
              v-for="item in targetTypeOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="选择优先关联单位" prop="orgId">
          <el-select v-model="form.orgId" placeholder="请选择单位" style="width: 100%">
            <el-option
              v-for="org in orgOptions"
              :key="org.id"
              :label="org.name"
              :value="org.id"
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
import { createTarget, fetchTargetDetail, updateTarget } from "@backend/api/target.js";
import { fetchOrgTree } from "@backend/api/org.js";
import { TARGET_TYPE, TARGET_TYPE_OPTIONS } from "@backend/config/constants.js";
import { INFRA_BASE } from "@backend/router/routes.js";
import { useAuthStore } from "@/stores/auth.js";
import { buildTargetPayload } from "@backend/utils/target.js";

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

const targetTypeOptions = TARGET_TYPE_OPTIONS;
const formRef = ref();
const submitting = ref(false);
const orgOptions = ref([]);
const isEdit = computed(() => Boolean(route.params.id) && route.params.id !== "new");

const initialType = Number(route.query.type);
const form = reactive({
  name: "",
  sn: "",
  type: Number.isFinite(initialType) && initialType > 0 ? initialType : TARGET_TYPE.POLICE_CAR,
  orgId: null,
});

const rules = {
  name: [{ required: true, message: "请输入目标设备名�?, trigger: "blur" }],
  sn: [{ required: true, message: "请输入设�?SN �?, trigger: "blur" }],
  type: [{ required: true, message: "请选择类型", trigger: "change" }],
  orgId: [{ required: true, message: "请选择优先关联单位", trigger: "change" }],
};

function flattenOrgTree(nodes, result = []) {
  for (const node of nodes || []) {
    if (node.id != null) result.push({ id: node.id, name: node.name });
    if (node.children?.length) flattenOrgTree(node.children, result);
  }
  return result;
}

async function loadOrgOptions() {
  try {
    const tree = (await fetchOrgTree()) || [];
    const flat = flattenOrgTree(tree);
    orgOptions.value = flat.length ? flat : [{ id: 1, name: "派出所1" }];
  } catch {
    orgOptions.value = [{ id: 1, name: "派出所1" }];
  }

  if (!authStore.isSuperAdmin && authStore.orgId != null) {
    if (!orgOptions.value.some((item) => String(item.id) === String(authStore.orgId))) {
      orgOptions.value.unshift({
        id: authStore.orgId,
        name: authStore.user?.orgName || "当前单位",
      });
    }
    if (form.orgId == null) form.orgId = authStore.orgId;
    return;
  }

  const queryOrgId = route.query.orgId;
  if (queryOrgId != null && queryOrgId !== "") {
    form.orgId = Number(queryOrgId) || queryOrgId;
  } else if (form.orgId == null) {
    form.orgId = orgOptions.value[0]?.id ?? null;
  }
}

async function loadDetail() {
  if (!isEdit.value) return;
  const data = await fetchTargetDetail({ id: route.params.id });
  Object.assign(form, {
    name: data.name,
    sn: data.sn,
    type: data.type,
    orgId: data.orgId,
  });
}

async function submit() {
  await formRef.value.validate();
  submitting.value = true;
  try {
    const payload = buildTargetPayload(form, isEdit.value ? { id: route.params.id } : {});
    if (isEdit.value) {
      await updateTarget(payload);
      ElMessage.success("保存成功");
    } else {
      await createTarget(payload);
      ElMessage.success("创建成功");
    }
    goBack();
  } finally {
    submitting.value = false;
  }
}

function goBack() {
  router.push(`${INFRA_BASE}/targets`);
}

onMounted(async () => {
  await loadOrgOptions();
  await loadDetail();
});
</script>

<style scoped lang="scss">
.target-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.target-form__section {
  background: #fff;
  border: 1px solid #ebeef5;
  border-radius: 4px;
}

.target-form__section--actions {
  padding: 12px 16px;
}

.target-form__section--title {
  padding: 14px 16px;
  background: #fafafa;
}

.target-form__section--content {
  padding: 20px 16px 24px;
}

.target-form__actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.target-form__back-btn {
  --el-button-text-color: #d87533;
  --el-button-border-color: #d87533;
  --el-button-hover-text-color: #d87533;
  --el-button-hover-border-color: #d87533;
  --el-button-hover-bg-color: #fdf6f0;
}

.target-form__title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.target-form__body {
  max-width: 720px;
}

.target-form__body :deep(.el-input__wrapper),
.target-form__body :deep(.el-select__wrapper) {
  background: #fafafa;
  box-shadow: none;
  border: 1px solid #f0f2f5;
}

.target-form__body :deep(.el-input__wrapper.is-focus),
.target-form__body :deep(.el-select__wrapper.is-focused) {
  box-shadow: 0 0 0 1px var(--el-color-primary) inset;
  background: #fff;
}

.target-form__body :deep(.el-form-item__label) {
  color: #606266;
}
</style>
