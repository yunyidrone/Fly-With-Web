<template>
  <div class="device-page">
    <div class="device-page__section device-page__section--title">
      <div class="device-page__title">无人艇管理</div>
    </div>

    <div class="device-page__section device-page__section--content">
      <el-empty description="无人艇管理功能开发中" />
    </div>
  </div>
</template>

<style scoped lang="scss">
.device-page {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.device-page__section {
  background: #fff;
  border: 1px solid #ebeef5;
  border-radius: 4px;
}

.device-page__section--title {
  padding: 14px 16px;
}

.device-page__section--content {
  padding: 48px 16px;
}

.device-page__title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}
</style>
