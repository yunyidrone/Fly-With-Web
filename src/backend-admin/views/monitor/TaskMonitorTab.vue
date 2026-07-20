<template>
  <div class="task-monitor">
    <section class="task-monitor__panel task-monitor__panel--tasks">
      <div class="task-monitor__panel-head">
        <span class="task-monitor__panel-title">待执行任务</span>
        <span class="task-monitor__panel-count">{{ pendingTasks.length }}个</span>
      </div>
      <ul class="task-monitor__task-list">
        <li v-for="(item, index) in pendingTasks" :key="item.id" class="task-monitor__task-item">
          <span class="task-monitor__task-index">{{ index + 1 }}</span>
          <span class="task-monitor__task-name">{{ item.name }}</span>
          <span class="task-monitor__task-location">{{ item.location }}</span>
          <button type="button" class="task-monitor__task-action" @click="viewTaskDetail(item)">
            查看详情
          </button>
        </li>
      </ul>
      <button type="button" class="task-monitor__panel-link" @click="handleConfigure">
        配置&gt;&gt;
      </button>
    </section>

    <section class="task-monitor__panel task-monitor__panel--wide">
      <div class="task-monitor__panel-title">今日任务执行详情</div>
      <div class="task-monitor__panel-body task-monitor__panel-body--empty">
        <span class="task-monitor__placeholder">暂无任务执行数据</span>
      </div>
    </section>

    <section class="task-monitor__panel task-monitor__panel--wide">
      <div class="task-monitor__panel-title">今日AI事件</div>
      <div class="task-monitor__panel-body task-monitor__panel-body--empty">
        <span class="task-monitor__placeholder">暂无 AI 事件数据</span>
      </div>
    </section>

    <section class="task-monitor__stat">
      <div class="task-monitor__stat-head">
        <span class="task-monitor__stat-title">无人设备任务中</span>
        <el-tooltip content="当前处于任务执行中的无人设备占比" placement="top">
          <span class="task-monitor__stat-info">
            <el-icon><InfoFilled /></el-icon>
          </span>
        </el-tooltip>
      </div>
      <div class="task-monitor__stat-content">
        <div class="task-monitor__stat-value">{{ taskStats.deviceOnMissionRate }}%</div>
        <div
          class="task-monitor__donut"
          :style="{ '--rate': `${taskStats.deviceOnMissionRate}%` }"
          aria-hidden="true"
        />
      </div>
    </section>

    <section class="task-monitor__stat">
      <div class="task-monitor__stat-head">
        <span class="task-monitor__stat-title">今日AI事件数量</span>
        <el-tooltip content="今日 AI 事件数量占目标值比例" placement="top">
          <span class="task-monitor__stat-info">
            <el-icon><InfoFilled /></el-icon>
          </span>
        </el-tooltip>
      </div>
      <div class="task-monitor__stat-value task-monitor__stat-value--solo">
        {{ taskStats.aiEventRate }}%
      </div>
      <div class="task-monitor__progress">
        <div
          class="task-monitor__progress-fill"
          :style="{ width: `${taskStats.aiEventRate}%` }"
        />
        <div
          class="task-monitor__progress-marker"
          :style="{ left: `${taskStats.aiEventRate}%` }"
        />
      </div>
      <div class="task-monitor__trends">
        <span class="task-monitor__trend task-monitor__trend--up">
          周同比
          <el-icon><CaretTop /></el-icon>
          {{ taskStats.weekCompare }}%
        </span>
        <span class="task-monitor__trend task-monitor__trend--down">
          日环比
          <el-icon><CaretBottom /></el-icon>
          {{ taskStats.dayCompare }}%
        </span>
      </div>
    </section>
  </div>
</template>

<script setup>
import { InfoFilled, CaretTop, CaretBottom } from "@element-plus/icons-vue";
import { ElMessage } from "element-plus";

defineProps({
  taskStats: {
    type: Object,
    default: () => ({
      deviceOnMissionRate: 78,
      aiEventRate: 78,
      weekCompare: 12,
      dayCompare: 11,
    }),
  },
  pendingTasks: {
    type: Array,
    default: () => [],
  },
});

function handleConfigure() {
  ElMessage.info("tasks配置功能开发中");
}

function viewTaskDetail(task) {
  ElMessage.info(`任务「${task.name}」详情功能开发中`);
}
</script>

<style scoped lang="scss">
.task-monitor {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1.2fr) minmax(0, 1.2fr) minmax(240px, 0.8fr) minmax(240px, 0.8fr);
  gap: 16px;
  align-items: stretch;
}

.task-monitor__panel,
.task-monitor__stat {
  border: 1px solid #ebeef5;
  border-radius: 4px;
  background: #fff;
  min-height: 320px;
}

.task-monitor__panel {
  padding: 16px;
  display: flex;
  flex-direction: column;
}

.task-monitor__panel--tasks {
  grid-row: span 2;
}

.task-monitor__panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.task-monitor__panel-title,
.task-monitor__stat-title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

.task-monitor__panel-count {
  font-size: 14px;
  font-weight: 600;
  color: var(--el-color-primary);
}

.task-monitor__task-list {
  list-style: none;
  margin: 12px 0 0;
  padding: 0;
  flex: 1;
}

.task-monitor__task-item {
  display: grid;
  grid-template-columns: 28px 72px 1fr auto;
  align-items: center;
  gap: 8px;
  min-height: 40px;
  padding: 8px 0;
  border-bottom: 1px solid #f2f3f5;
  font-size: 13px;
  color: #606266;
}

.task-monitor__task-index {
  color: #909399;
}

.task-monitor__task-name {
  color: #303133;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.task-monitor__task-location {
  color: #909399;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.task-monitor__task-action {
  border: none;
  background: none;
  padding: 0;
  color: var(--el-color-primary);
  cursor: pointer;
  font-size: 13px;
  white-space: nowrap;
}

.task-monitor__panel-link {
  align-self: flex-end;
  margin-top: 12px;
  border: none;
  background: none;
  padding: 0;
  color: var(--el-color-primary);
  cursor: pointer;
  font-size: 13px;
}

.task-monitor__panel-body {
  flex: 1;
  margin-top: 12px;
}

.task-monitor__panel-body--empty {
  border: 1px dashed #ebeef5;
  border-radius: 4px;
  background: #fafafa;
  display: flex;
  align-items: center;
  justify-content: center;
}

.task-monitor__placeholder {
  color: #909399;
  font-size: 13px;
}

.task-monitor__stat {
  padding: 16px;
  display: flex;
  flex-direction: column;
}

.task-monitor__stat-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.task-monitor__stat-info {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: 1px solid #dcdfe6;
  color: #909399;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  cursor: help;
}

.task-monitor__stat-content {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-top: 24px;
}

.task-monitor__stat-value {
  font-size: 48px;
  font-weight: 700;
  line-height: 1;
  color: #303133;
}

.task-monitor__stat-value--solo {
  margin-top: 24px;
}

.task-monitor__donut {
  width: 96px;
  height: 96px;
  border-radius: 50%;
  flex-shrink: 0;
  background: conic-gradient(#409eff 0 var(--rate), #eef1f6 var(--rate) 100%);
  position: relative;

  &::after {
    content: "";
    position: absolute;
    inset: 18px;
    border-radius: 50%;
    background: #fff;
  }
}

.task-monitor__progress {
  position: relative;
  height: 8px;
  margin-top: 20px;
  background: #eef1f6;
  border-radius: 999px;
  overflow: visible;
}

.task-monitor__progress-fill {
  height: 100%;
  background: #409eff;
  border-radius: 999px;
}

.task-monitor__progress-marker {
  position: absolute;
  top: -4px;
  width: 0;
  height: 16px;
  border-left: 1px dashed #909399;
  transform: translateX(-0.5px);
}

.task-monitor__trends {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: auto;
  padding-top: 24px;
  font-size: 13px;
}

.task-monitor__trend {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: #606266;
}

.task-monitor__trend--up {
  color: #67c23a;
}

.task-monitor__trend--down {
  color: #f56c6c;
}

@media (max-width: 1400px) {
  .task-monitor {
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) minmax(240px, 0.8fr) minmax(240px, 0.8fr);
  }

  .task-monitor__panel--tasks {
    grid-column: 1 / -1;
    grid-row: auto;
    min-height: 240px;
  }
}

@media (max-width: 1200px) {
  .task-monitor {
    grid-template-columns: 1fr 1fr;
  }

  .task-monitor__panel,
  .task-monitor__stat {
    min-height: 260px;
  }
}

@media (max-width: 768px) {
  .task-monitor {
    grid-template-columns: 1fr;
  }
}
</style>
