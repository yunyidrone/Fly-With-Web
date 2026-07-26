<template>
  <el-container class="admin-layout backend-admin-root">
    <el-aside :width="asideWidth" class="admin-layout__aside">
      <div class="admin-layout__logo">
        <img class="admin-layout__logo-icon" :src="logoImage" alt="伴飞后台管理 logo" />
        <span v-if="!appStore.sidebarCollapsed" class="admin-layout__logo-text">
          {{ appTitle }}
        </span>
      </div>

      <el-scrollbar class="admin-layout__menu-scroll">
        <el-menu
          v-loading="menuStore.loading"
          :default-active="activeMenu"
          :default-openeds="defaultOpeneds"
          :collapse="appStore.sidebarCollapsed"
          :collapse-transition="false"
          background-color="#001529"
          text-color="rgba(255,255,255,0.75)"
          active-text-color="#fff"
          router
        >
          <AdminMenuTree :nodes="visibleMenuTree" :title-route-path-map="titleRoutePathMap" />
        </el-menu>
      </el-scrollbar>
    </el-aside>

    <el-container class="admin-layout__main-wrap">
      <el-header class="admin-layout__header">
        <div class="admin-layout__header-left">
          <el-button link @click="appStore.toggleSidebar()">
            <el-icon :size="20">
              <Fold v-if="!appStore.sidebarCollapsed" />
              <Expand v-else />
            </el-icon>
          </el-button>
          <el-breadcrumb separator="/">
            <el-breadcrumb-item v-for="item in breadcrumbItems" :key="item">
              {{ item }}
            </el-breadcrumb-item>
          </el-breadcrumb>
        </div>

        <div class="admin-layout__header-right">
          <el-dropdown trigger="click" popper-class="backend-admin-header-dropdown" @command="handleCommand">
            <span class="admin-layout__user">
              <el-avatar :size="28">{{ avatarText }}</el-avatar>
              <span class="admin-layout__user-meta">
                <span v-if="authStore.orgName" class="admin-layout__org-name">
                  {{ authStore.orgName }}
                </span>
                <span class="admin-layout__username">{{ authStore.displayName }}</span>
              </span>
              <el-icon><ArrowDown /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">个人中心</el-dropdown-item>
                <el-dropdown-item command="frontend">伴飞调度</el-dropdown-item>
                <el-dropdown-item divided command="logout" class="el-dropdown-menu__item--logout">
                  退出登录
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>

      <el-main class="admin-layout__content">
        <router-view v-slot="{ Component }">
          <transition name="fade-transform" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { computed, onMounted, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { Fold, Expand, ArrowDown } from "@element-plus/icons-vue";
import { useAppStore } from "@backend/stores/app.js";
import { useAuthStore } from "@/stores/auth.js";
import { useMenuStore } from "@backend/stores/menu.js";
import AdminMenuTree from "@backend/components/AdminMenuTree.vue";
import { buildMenuTitleRoutePathMap, collectOpenMenuIds, resolveMenuBreadcrumb } from "@backend/utils/menu.js";
import { appConfig } from "@backend/config/network.js";
import logoImage from "@/assets/images/logo.png";

const route = useRoute();
const router = useRouter();
const appStore = useAppStore();
const authStore = useAuthStore();
const menuStore = useMenuStore();

const appTitle = appConfig.title;

const asideWidth = computed(() =>
  appStore.sidebarCollapsed ? "64px" : "220px",
);

const visibleMenuTree = computed(() => menuStore.tree);

const titleRoutePathMap = computed(() =>
  buildMenuTitleRoutePathMap(router.getRoutes()),
);

const defaultOpeneds = computed(() =>
  collectOpenMenuIds(menuStore.tree, activeMenu.value, titleRoutePathMap.value),
);

const activeMenu = computed(
  () => route.meta?.activeMenu || route.path,
);

const breadcrumbItems = computed(() => {
  const items = resolveMenuBreadcrumb(
    menuStore.tree,
    activeMenu.value,
    titleRoutePathMap.value,
  );
  if (items.length) return items;
  const title = String(route.meta?.title || "").trim();
  return title ? [title] : [];
});

const avatarText = computed(() =>
  (authStore.displayName || "U").slice(0, 1).toUpperCase(),
);

async function refreshMenu(force = false) {
  if (!authStore.isLoggedIn && !appConfig.skipAuth) {
    menuStore.resetMenu();
    return;
  }
  await menuStore.loadMenu(force);
}

watch(
  () => authStore.effectiveOrgId,
  () => {
    refreshMenu(true);
  },
);

watch(
  () => authStore.isLoggedIn,
  (loggedIn) => {
    if (loggedIn) {
      refreshMenu(true);
      return;
    }
    menuStore.resetMenu();
  },
);

onMounted(() => {
  refreshMenu();
});

async function handleCommand(command) {
  if (command === "profile") {
    router.push("/backend/account");
    return;
  }
  if (command === "frontend") {
    router.push("/");
    return;
  }
  if (command === "logout") {
    await authStore.logout();
    router.push("/login");
  }
}
</script>

<style scoped lang="scss">
.admin-layout {
  height: 100vh;
  overflow: hidden;
}

.admin-layout__aside {
  display: flex;
  flex-direction: column;
  background: $sidebar-bg;
  transition: width 0.2s;
  overflow: hidden;
}

.admin-layout__logo {
  height: $header-height;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 8px;
  background: $primary-color;
  color: #fff;
  font-size: 16px;
  font-weight: 600;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  padding: 5px 20px;
  white-space: nowrap;
  overflow: hidden;
}

.admin-layout__logo-text {
  letter-spacing: 0.5px;
}

.admin-layout__logo-icon {
  width: 24px;
  height: 24px;
  object-fit: contain;
  flex-shrink: 0;
}

.admin-layout__menu-scroll {
  padding: 30px 0;
  flex: 1;
}

.admin-layout__aside :deep(.el-menu) {
  border-right: none;
}

.admin-layout__aside :deep(.el-menu-item.is-active) {
  background-color: $sidebar-active-bg !important;
}

.admin-layout__main-wrap {
  min-width: 0;
}

.admin-layout__header {
  height: $header-height;
  background: #fff;
  border-bottom: 1px solid #ebeef5;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
}

.admin-layout__header-left,
.admin-layout__header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.admin-layout__user {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  color: #606266;
}

.admin-layout__user-meta {
  display: inline-flex;
  flex-direction: column;
  align-items: flex-start;
  min-width: 0;
  max-width: 160px;
  line-height: 1.2;
}

.admin-layout__org-name {
  max-width: 160px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #909399;
  font-size: 12px;
  font-weight: 400;
}

.admin-layout__username {
  max-width: 160px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: $primary-color;
  font-weight: 500;
  font-size: 14px;
}

.admin-layout__content {
  background: $page-bg;
  padding: $content-padding;
  overflow: auto;
}

.fade-transform-enter-active,
.fade-transform-leave-active {
  transition: all 0.2s ease;
}

.fade-transform-enter-from {
  opacity: 0;
  transform: translateX(12px);
}

.fade-transform-leave-to {
  opacity: 0;
  transform: translateX(-12px);
}
</style>
