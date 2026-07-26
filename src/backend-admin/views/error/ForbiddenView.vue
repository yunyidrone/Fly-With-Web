<template>
  <div class="forbidden-page backend-admin-root">
    <el-result icon="warning" title="403" sub-title="您没有权限访问该页面">
      <template #extra>
        <el-button type="primary" @click="goHome">返回首页</el-button>
        <el-button plain @click="goLogin">重新登录</el-button>
      </template>
    </el-result>
  </div>
</template>

<script setup>
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth.js";

const router = useRouter();
const authStore = useAuthStore();

function goHome() {
  // 无权限时回到前台，避免再次落到默认监控页循环 403
  router.push("/");
}

async function goLogin() {
  await authStore.logout();
  router.push("/login");
}
</script>

<style scoped lang="scss">
.forbidden-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fff;
}
</style>
