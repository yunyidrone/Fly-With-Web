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
        <div class="brand-logo-slot" aria-hidden="true">
          <img class="brand-logo-img" src="../assets/images/logo.png" alt="" />
        </div>
        <div class="brand-text">
          <div class="brand-text__zh">伴飞调度中心</div>
          <div class="brand-text__en">ESCORT FLIGHT DISPATCH CENTER</div>
        </div>
      </div>

      <div class="home-header__right">
        <div
          ref="userMenuRef"
          class="user-menu"
          :class="{ 'user-menu--open': userMenuOpen }"
        >
          <button
            type="button"
            class="user-menu-trigger"
            :class="{ 'user-menu-trigger--open': userMenuOpen }"
            @click="toggleUserMenu"
          >
            <div class="user-avatar-slot" aria-hidden="true">
              <img class="user-avatar-img" src="../assets/images/account.png" alt="" />
            </div>
            <span class="user-menu-trigger__name">{{ displayName }}</span>
            <i
              class="ri-arrow-down-s-line user-menu-trigger__arrow"
              :class="{ 'user-menu-trigger__arrow--open': userMenuOpen }"
            />
          </button>

          <Transition name="user-menu-fade">
            <div v-show="userMenuOpen" class="user-menu__panel">
              <button type="button" class="user-menu__item" @click="handleEnterBackend">
                <i class="ri-settings-3-line user-menu__item-icon" aria-hidden="true" />
                <span>后台管理</span>
              </button>
              <div class="user-menu__divider" aria-hidden="true" />
              <button type="button" class="user-menu__item user-menu__item--danger" @click="handleLogout">
                <i class="ri-logout-box-r-line user-menu__item-icon" aria-hidden="true" />
                <span>退出登录</span>
              </button>
            </div>
          </Transition>
        </div>

        <button type="button" class="reload-btn" title="重新加载页面" @click="handleReload">
          <i class="ri-refresh-line" />
        </button>
      </div>
    </div>

    <SettingsDrawer v-model:visible="settingsVisible" />
  </header>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth.js";
import SettingsDrawer from "@/components/SettingsDrawer.vue";

const settingsVisible = ref(false);
const userMenuOpen = ref(false);
const userMenuRef = ref(null);
const router = useRouter();
const authStore = useAuthStore();

const displayName = computed(
  () => authStore.displayName || authStore.user?.username || "账号",
);

function toggleUserMenu() {
  userMenuOpen.value = !userMenuOpen.value;
}

function closeUserMenu() {
  userMenuOpen.value = false;
}

function onDocumentClick(event) {
  if (!userMenuRef.value?.contains(event.target)) {
    closeUserMenu();
  }
}

async function handleLogout() {
  closeUserMenu();
  await authStore.logout();
  router.push("/login");
}

function handleEnterBackend() {
  closeUserMenu();
  router.push("/backend");
}

function handleReload() {
  window.location.reload();
}

onMounted(() => {
  document.addEventListener("click", onDocumentClick);
});

onUnmounted(() => {
  document.removeEventListener("click", onDocumentClick);
});
</script>

<style lang="scss" scoped>
/* 设计稿 1920×1080；顶栏相对视口左上右各 24px */
.home-header {
  position: absolute;
  top: 24px;
  left: 24px;
  right: 24px;
  z-index: 10000;
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

.user-menu {
  position: relative;
}

.user-menu-trigger {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 4px 12px 4px 4px;
  border: 1px solid transparent;
  border-radius: 6px;
  background: transparent;
  cursor: pointer;
  color: rgba(255, 255, 255, 0.9);
  font-family: "HarmonyOS Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif;
  font-size: 16px;
  font-weight: 500;
  line-height: 1;
  transition:
    border-color 0.2s ease,
    background 0.2s ease,
    color 0.2s ease;

  &:hover,
  &--open {
    border-color: rgba(73, 101, 201, 0.55);
    background: rgba(3, 6, 10, 0.45);
    color: #fff;
  }
}

.user-menu-trigger__name {
  max-width: 140px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.user-menu-trigger__arrow {
  font-size: 18px;
  color: rgba(255, 255, 255, 0.72);
  transition: transform 0.2s ease;
}

.user-menu-trigger__arrow--open {
  transform: rotate(180deg);
}

.user-menu__panel {
  position: absolute;
  top: calc(100% + 10px);
  right: 0;
  z-index: 10001;
  min-width: 148px;
  padding: 8px;
  border: 1px solid #30363b;
  border-radius: 6px;
  background: rgba(3, 6, 10, 0.65);
  backdrop-filter: blur(10px);
  box-sizing: border-box;
}

.user-menu__divider {
  height: 1px;
  margin: 4px 0;
  background: #30363b;
}

.user-menu__item {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  min-height: 40px;
  padding: 8px 14px;
  border: 1px solid transparent;
  border-radius: 6px;
  background: transparent;
  color: rgba(255, 255, 255, 0.88);
  font-family: "HarmonyOS Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif;
  font-size: 14px;
  font-weight: 500;
  line-height: 1.2;
  text-align: center;
  cursor: pointer;
  white-space: nowrap;
  box-sizing: border-box;
  transition:
    border-color 0.18s ease,
    background 0.18s ease,
    color 0.18s ease;

  &:hover {
    border-color: rgba(73, 101, 201, 0.55);
    background: rgba(12, 18, 28, 0.82);
    color: #fff;
  }

  &--danger:hover {
    border-color: rgba(255, 77, 79, 0.45);
    background: rgba(255, 77, 79, 0.12);
    color: #ff7875;
  }
}

.user-menu__item-icon {
  font-size: 16px;
  flex-shrink: 0;
}

.user-menu-fade-enter-active,
.user-menu-fade-leave-active {
  transition:
    opacity 0.18s ease,
    transform 0.18s ease;
}

.user-menu-fade-enter-from,
.user-menu-fade-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

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
