<template>
  <div class="map-loading-overlay">
    <div class="map-loading-spinner"></div>
    <span class="map-loading-text">地图加载中...</span>
  </div>
</template>

<style lang="scss" scoped>
.map-loading-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  background: #292E38;
  z-index: 1000;
}

.map-loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(255, 255, 255, 0.15);
  border-top-color: #409eff;
  border-radius: 50%;
  animation: map-spin 0.8s linear infinite;
}

@keyframes map-spin {
  to {
    transform: rotate(360deg);
  }
}

.map-loading-text {
  color: rgba(255, 255, 255, 0.6);
  font-size: 14px;
}
</style>
