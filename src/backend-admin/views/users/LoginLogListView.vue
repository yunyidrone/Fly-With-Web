<template>
  <div class="login-log">
    <div class="login-log__section login-log__section--header">
      <div class="login-log__title">登录日志</div>
    </div>

    <div class="login-log__section login-log__section--content">
      <div class="login-log__filters">
        <el-input
          v-model="query.userName"
          placeholder="根据账户昵称搜索账户"
          clearable
          class="login-log__filter-item login-log__keyword"
          @keyup.enter="search"
          @clear="search"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>

        <el-input
          v-model="query.ipAddress"
          placeholder="根据IP进行查询"
          clearable
          class="login-log__filter-item login-log__ip"
          @keyup.enter="search"
          @clear="search"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>

        <div class="login-log__daterange-wrap">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="~"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            class="login-log__daterange"
            :style="{ '--el-date-editor-daterange-width': '300px' }"
            @change="handleDateRangeChange"
          />
        </div>

        <el-select
          v-model="quickRange"
          class="login-log__filter-item login-log__quick-range"
          @change="handleQuickRangeChange"
        >
          <el-option label="今日" value="today" />
          <el-option label="近三日" value="3days" />
          <el-option label="近七日" value="7days" />
        </el-select>

        <el-button type="primary" class="login-log__filter-btn" @click="search">查询</el-button>
        <el-button class="login-log__filter-btn" @click="resetFilters">重置</el-button>
      </div>

      <el-table
        v-loading="loading"
        :data="records"
        class="login-log__table"
        :default-sort="{ prop: 'createTime', order: 'descending' }"
        @sort-change="handleSortChange"
      >
        <el-table-column prop="userId" label="账户ID" min-width="180">
          <template #default="{ row }">
            <span class="login-log__id">{{ row.userId ?? row.id ?? "-" }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="userName" label="账户昵称" min-width="100">
          <template #default="{ row }">
            <span class="text-primary">{{ row.userName || "-" }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="roleName" label="角色" min-width="100">
          <template #default="{ row }">
            {{ row.roleName || "-" }}
          </template>
        </el-table-column>
        <el-table-column
          prop="createTime"
          label="登录时间"
          min-width="140"
          sortable="custom"
          :sort-orders="['descending', 'ascending']"
        >
          <template #default="{ row }">
            {{ row.createTime || "-" }}
          </template>
        </el-table-column>
        <el-table-column prop="ipAddress" label="所属IP" min-width="140">
          <template #default="{ row }">
            {{ row.ipAddress || "-" }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100" fixed="right" align="center">
          <template #default="{ row }">
            <el-button link type="danger" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="login-log__pagination">
        <el-pagination
          :current-page="query.current"
          :page-size="query.pageSize"
          :total="total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next"
          background
          @current-change="onPageChange"
          @size-change="onSizeChange"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref, watch } from "vue";
import { Search } from "@element-plus/icons-vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { deleteLoginLog, fetchLoginLogPage } from "@backend/api/login-log.js";
import { useTableQuery } from "@backend/composables/useTableQuery.js";
import {
  buildDateRangeTime,
  buildQuickTimeRange,
  toDatePickerRange,
} from "@backend/utils/login-log.js";

const quickRange = ref("today");
const dateRange = ref(null);

const { loading, records, total, query, load, search, reset, onPageChange, onSizeChange } =
  useTableQuery(fetchLoginLogPage, {
    pageSize: 10,
    userName: "",
    ipAddress: "",
    startTime: "",
    endTime: "",
    isAsc: false,
  });

function applyTimeRange(range) {
  query.startTime = range.startTime || "";
  query.endTime = range.endTime || "";
  dateRange.value = toDatePickerRange(range);
}

function applyQuickRange(preset) {
  applyTimeRange(buildQuickTimeRange(preset));
}

function handleQuickRangeChange(preset) {
  if (!preset) return;
  applyQuickRange(preset);
  search();
}

function handleDateRangeChange(range) {
  quickRange.value = "";
  if (!Array.isArray(range) || range.length !== 2) {
    query.startTime = "";
    query.endTime = "";
    search();
    return;
  }
  applyTimeRange(buildDateRangeTime(range, { endAtNow: true }));
  search();
}

function handleSortChange({ prop, order }) {
  if (prop !== "createTime") return;
  query.isAsc = order === "ascending";
  search();
}

function resetFilters() {
  quickRange.value = "today";
  applyQuickRange("today");
  reset({
    pageSize: query.pageSize,
    userName: "",
    ipAddress: "",
    startTime: query.startTime,
    endTime: query.endTime,
    isAsc: false,
  });
}

async function handleDelete(row) {
  const logId = row.id;
  if (logId == null || logId === "") {
    ElMessage.warning("该日志缺少 ID，无法删除");
    return;
  }

  const name = row.userName || logId;
  await ElMessageBox.confirm(`确定删除账户「${name}」的这条登录日志吗？`, "删除确认", {
    type: "warning",
    confirmButtonText: "删除",
    cancelButtonText: "取消",
  });

  await deleteLoginLog({ id: logId });
  ElMessage.success("删除成功");
  await load();
}

watch(
  () => query.userName,
  (value, oldValue) => {
    if (value === "" && oldValue !== "") search();
  },
);

watch(
  () => query.ipAddress,
  (value, oldValue) => {
    if (value === "" && oldValue !== "") search();
  },
);

onMounted(() => {
  applyQuickRange("today");
  load();
});
</script>

<style scoped lang="scss">
.login-log {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.login-log__section {
  background: #fff;
  border: 1px solid #ebeef5;
  border-radius: 4px;
}

.login-log__section--header {
  padding: 14px 16px;
}

.login-log__section--content {
  padding: 20px 16px 24px;
  display: flex;
  flex-direction: column;
  gap: 0;
}

.login-log__title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.login-log__filters {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.login-log__filter-item {
  :deep(.el-input__wrapper),
  :deep(.el-select__wrapper) {
    min-height: 36px;
    height: 36px;
    box-sizing: border-box;
  }
}

.login-log__daterange-wrap {
  width: 300px;
  max-width: 300px;
  flex: 0 0 300px;
}

.login-log__daterange-wrap :deep(.el-date-editor--daterange) {
  --el-date-editor-daterange-width: 300px;
  --el-date-editor-width: 300px;
  width: 300px;
  max-width: 300px;
  min-height: 36px;
  height: 36px;
  box-sizing: border-box;
}

.login-log__daterange-wrap :deep(.el-range-input) {
  width: 32%;
  font-size: 13px;
}

.login-log__daterange-wrap :deep(.el-range-separator) {
  flex: none;
  padding: 0 2px;
  line-height: 36px;
}

.login-log__keyword {
  width: 240px;
}

.login-log__ip {
  width: 200px;
}

.login-log__quick-range {
  width: 120px;
}

.login-log__filter-btn {
  height: 36px;
  padding-top: 0;
  padding-bottom: 0;
}

.login-log__table {
  width: 100%;
}

.login-log__id {
  font-variant-numeric: tabular-nums;
  color: #303133;
}

.text-primary {
  color: var(--el-color-primary);
}

.login-log__pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
