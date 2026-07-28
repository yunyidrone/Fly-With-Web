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
          <el-button class="infra-page__refresh-btn" :disabled="loading" @click="load">
            <el-icon :size="16" :class="{ 'infra-page__refresh-icon--spinning': loading }">
              <Refresh />
            </el-icon>
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
        <el-table-column label="类型" width="100">
          <template #default="{ row }">
            <el-tag size="small" effect="light">{{ row.typeLabel }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="coord" label="经纬度" min-width="160">
          <template #default="{ row }">
            <span class="infra-page__coord">({{ row.coord || "-" }})</span>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="描述" min-width="180" show-overflow-tooltip>
          <template #default="{ row }">
            {{ row.description || "-" }}
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
          :page-sizes="[10, 20, 50, 100]"
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
import { onMounted } from "vue";
import { useRouter } from "vue-router";
import { Refresh } from "@element-plus/icons-vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { deleteCheckpoint, fetchCheckpointPage } from "@backend/api/common.js";
import { useTableQuery } from "@backend/composables/useTableQuery.js";
import { INFRA_BASE } from "@backend/router/routes.js";

const router = useRouter();
const { loading, records, total, query, load, onPageChange, onSizeChange } = useTableQuery(
  fetchCheckpointPage,
  { pageSize: 10 },
);

function handleCreate() {
  router.push(`${INFRA_BASE}/checkpoints/new`);
}

function handleEdit(row) {
  router.push(`${INFRA_BASE}/checkpoints/${row.id}`);
}

async function handleDelete(row) {
  await ElMessageBox.confirm(`确定删除卡点「${row.name}」吗？`, "删除确认", {
    type: "warning",
    confirmButtonText: "删除",
  });
  await deleteCheckpoint({ id: row.id });
  ElMessage.success("删除成功");
  await load();
}

onMounted(load);
</script>

<style scoped lang="scss">
@use "./infra-page.scss";
</style>
