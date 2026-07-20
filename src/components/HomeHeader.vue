<!--
 * @Author: ml
 * @Date: 2026-03-12 08:37:46
 * @FilePath: /accompanying-fly-project/src/components/HomeHeader.vue
 * @Description: 顶栏 — 设计基准 1920×1080，左右上各 24px 边距（切图占位后续替换）
-->
<template>
  <header class="home-header">
    <div class="home-header__inner">
      <div class="home-header__left">
        <!-- 左侧 Logo 占位 36×36，有切图后改为 <img src="..." alt="" /> -->
        <div class="brand-logo-slot" aria-hidden="true">
          <img class="brand-logo-img" src="../assets/images/logo.png" alt="" />
        </div>
        <div class="brand-text">
          <div class="brand-text__zh">伴飞调度中心</div>
          <div class="brand-text__en">ESCORT FLIGHT DISPATCH CENTER</div>
        </div>
      </div>

      <div class="home-header__right">
        <!-- 右侧头像占位 56×56，有切图后改为 <img ... /> -->
        <div class="user-avatar-slot" aria-hidden="true">
          <img class="user-avatar-img" src="../assets/images/account.png" alt="" />
        </div>
        <!-- <button type="button" class="backend-btn" title="进入后台管理" @click="handleEnterBackend">
          <span>后台管理</span>
        </button> -->
        <!-- 设置 -->
        <!-- <button
          type="button"
          class="settings-btn"
          title="设置"
          aria-label="设置"
          @click="settingsVisible = true"
        >
          <i class="ri-settings-3-line" />
        </button> -->
        <button type="button" class="reload-btn" title="重新加载页面" @click="handleReload">
          <i class="ri-refresh-line" />
        </button>
      </div>
    </div>

    <SettingsDrawer v-model:visible="settingsVisible" />
  </header>
</template>

<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import SettingsDrawer from "@/components/SettingsDrawer.vue";

const settingsVisible = ref(false);
const router = useRouter();

function handleEnterBackend() {
  router.push("/backend");
}

function handleReload() {
  window.location.reload();
}
</script>

<style lang="scss" scoped>
/* 设计稿 1920×1080；顶栏相对视口左上右各 24px */
.home-header {
  position: absolute;
  top: 24px;
  left: 24px;
  right: 24px;
  z-index: 100;
  pointer-events: none;
}

.home-header__inner {
  display: flex;
  justify-content: space-between;
  align-items: center;
  min-height: 56px;
  pointer-events: auto;
}

.home-header__left {
  display: flex;
  align-items: center;
  gap: 12px;
}

/* 左侧 Logo 占位 36×36 */
.brand-logo-slot {
  width: 36px;
  height: 36px;
  flex-shrink: 0;
  border-radius: 50%;
  box-sizing: border-box;
}

.brand-logo-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  border-radius: 50%;
  display: block;
}

/* 中英文同一栏宽，左右齐平，视觉长度接近 */
.brand-text {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 4px;
  width: 188px;
  box-sizing: content-box;
}

.brand-text__zh {
  font-family:
    "HarmonyOS Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif;
  font-size: 24px;
  font-style: normal;
  font-weight: 700;
  line-height: normal;
  color: #ffffff;
  white-space: nowrap;
  letter-spacing: 3px;
}

.brand-text__en {
  font-family: "Alibaba PuHuiTi", "PingFang SC", "Microsoft YaHei", sans-serif;
  font-size: 9px;
  font-style: normal;
  font-weight: 500;
  line-height: normal;
  letter-spacing: 0.18px;
  color: rgba(255, 255, 255, 0.72);
  text-transform: uppercase;
  width: 100%;
  word-break: break-word;
  overflow-wrap: anywhere;
}

.home-header__right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.settings-btn,
.reload-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: rgba(255, 255, 255, 0.65);
  font-size: 24px;
  cursor: pointer;

  &:hover {
    color: #fff;
    background: rgba(255, 255, 255, 0.1);
  }
}

.backend-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 40px;
  padding: 0 12px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 4px;
  background: transparent;
  color: rgba(255, 255, 255, 0.85);
  font-family: "Alibaba PuHuiTi", "PingFang SC", "Microsoft YaHei", sans-serif;
  font-size: 14px;
  cursor: pointer;
  transition:
    color 0.2s ease,
    border-color 0.2s ease,
    background 0.2s ease;

  &:hover {
    color: #fff;
    border-color: rgba(255, 255, 255, 0.75);
    background: rgba(255, 255, 255, 0.1);
  }

  i {
    font-size: 16px;
  }
}

/* 右侧用户图占位 56×56 */
.user-avatar-slot {
  width: 56px;
  height: 56px;
  flex-shrink: 0;
  box-sizing: border-box;
  border-radius: 34px;
  border: 1px solid #071a3e;
  background: rgba(0, 52, 152, 0.38);
  box-shadow: 2px 2px 0.2px 0 rgba(255, 255, 255, 0.1) inset;
}

.user-avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
  display: block;
}

</style>
