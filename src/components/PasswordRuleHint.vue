<template>
  <p class="password-rule-hint">{{ PASSWORD_COMPLEXITY_MESSAGE }}</p>
</template>

<script setup>
import { PASSWORD_COMPLEXITY_MESSAGE } from "@backend/utils/password.js";
</script>

<style scoped lang="scss">
.password-rule-hint {
  margin: 8px 0 0;
  font-size: 12px;
  color: #909399;
  line-height: 1.6;
}
</style>
