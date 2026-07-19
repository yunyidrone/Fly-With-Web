<template>
  <header class="task-topbar">
    <div class="task-topbar__left">
      <img class="task-topbar__logo" src="@/assets/images/logo.png" alt="" />
      <span class="task-topbar__title">{{ title }}</span>
    </div>
    <nav class="task-topbar__right">
      <button type="button" class="task-topbar__link" @click="emit('open-center')">
        <i class="ri-apps-2-line" />
        <span>任务中心</span>
      </button>
      <button type="button" class="task-topbar__link" @click="emit('open-settings')">
        <i class="ri-settings-3-line" />
        <span>设置</span>
      </button>
      <span class="task-topbar__user">
        <i class="ri-user-3-line" />
        <span>{{ userName }}</span>
        <span class="task-topbar__dot" aria-hidden="true" />
      </span>
    </nav>
  </header>
</template>

<script setup>
defineProps({
  title: { type: String, default: "伴飞调度中心" },
  userName: { type: String, default: "admin" },
});

const emit = defineEmits(["open-center", "open-settings"]);
</script>

<style scoped lang="scss">
.task-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 48px;
  padding: 0 20px;
  border-bottom: 1px solid #30363b;
  background: rgba(3, 6, 10, 0.65);
  color: rgba(255, 255, 255, 0.88);
  flex-shrink: 0;

  &__left {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  &__logo {
    width: 24px;
    height: 24px;
    object-fit: contain;
    border-radius: 50%;
  }

  &__title {
    font-size: 16px;
    font-weight: 600;
    letter-spacing: 2px;
    color: #fff;
  }

  &__right {
    display: flex;
    align-items: center;
    gap: 22px;
  }

  &__link {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 0;
    border: 0;
    background: transparent;
    color: rgba(255, 255, 255, 0.65);
    font-size: 13px;
    cursor: pointer;
    transition: color 0.15s ease;

    &:hover {
      color: #61bdff;
    }
  }

  &__user {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    color: rgba(255, 255, 255, 0.9);
    font-size: 13px;
    font-weight: 500;
  }

  &__dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #ff4d4f;
    box-shadow: 0 0 6px rgba(255, 77, 79, 0.6);
  }
}
</style>
