<template>
  <div class="infra-page">
    <div class="infra-page__section infra-page__section--title">
      <div class="infra-page__header">
        <div class="infra-page__title">卡点设置</div>
        <div class="infra-page__actions">
          <el-button
            v-permission="['super_admin', 'org_admin']"
            class="infra-page__create-btn"
            @click="handleCreate"
          >
            新建卡点
          </el-button>
          <el-button class="infra-page__refresh-btn" @click="load">
            <el-icon :size="16"><Refresh /></el-icon>
          </el-button>
        </div>
      </div>
    </div>

    <div class="infra-page__section infra-page__section--content">
      <el-table v-loading="loading" :data="records" stripe>
        <el-table-column type="index" label="序号" width="70" />
        <el-table-column prop="name" label="卡点名称" min-width="160">
          <template #default="{ row }">
            <span class="infra-page__name-tag">{{ row.name }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="coord" label="经纬度" min-width="160">
          <template #default="{ row }">
            <span class="infra-page__coord">({{ row.coord }})</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{ row }">
            <el-button
              v-permission="['super_admin', 'org_admin']"
              link
              type="primary"
              @click="handleEdit(row)"
            >
              编辑
            </el-button>
            <el-button
              v-permission="['super_admin', 'org_admin']"
              link
              type="danger"
              @click="handleDelete(row)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="infra-page__pagination">
        <el-pagination
          :current-page="query.current"
          :page-size="query.pageSize"
          :total="total"
          :page-sizes="[5, 10, 20, 50]"
          layout="total, sizes, prev, pager, next, jumper"
          background
          @current-change="onPageChange"
          @size-change="onSizeChange"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from "vue";
import { Refresh } from "@element-plus/icons-vue";
import { ElMessage, ElMessageBox } from "element-plus";

const DEMO_CHECKPOINTS = [
  { id: 1, name: "幸福街小站1", coord: "121, 53, 8" },
  { id: 2, name: "幸福街小站2", coord: "121, 53, 8" },
  { id: 3, name: "幸福街小站3", coord: "121, 53, 8" },
  { id: 4, name: "幸福街小站4", coord: "121, 53, 8" },
  { id: 5, name: "幸福街小站5", coord: "121, 53, 8" },
  { id: 6, name: "幸福街小站6", coord: "121, 53, 8" },
];

const loading = ref(false);
const records = ref([]);
const total = ref(0);
const query = reactive({ current: 1, pageSize: 5 });

async function load() {
  loading.value = true;
  try {
    const start = (query.current - 1) * query.pageSize;
    const end = start + query.pageSize;
    records.value = DEMO_CHECKPOINTS.slice(start, end);
    total.value = DEMO_CHECKPOINTS.length;
  } finally {
    loading.value = false;
  }
}

function onPageChange(page) {
  query.current = page;
  load();
}

function onSizeChange(size) {
  query.pageSize = size;
  query.current = 1;
  load();
}

function handleCreate() {
  ElMessage.info("新建卡点功能开发中");
}

function handleEdit(row) {
  ElMessage.info(`编辑卡点「${row.name}」功能开发中`);
}

async function handleDelete(row) {
  await ElMessageBox.confirm(`确定删除卡点「${row.name}」吗？`, "删除确认", {
    type: "warning",
    confirmButtonText: "删除",
  });
  ElMessage.info("删除卡点功能开发中");
}

onMounted(load);
</script>

<style scoped lang="scss">
@import "./infra-page.scss";
</style>
