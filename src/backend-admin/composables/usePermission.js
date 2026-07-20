import { computed } from "vue";
import { useAuthStore } from "@backend/stores/auth.js";
import { hasRole } from "@backend/utils/permission.js";
import { appConfig } from "@backend/config/network.js";
import { ROLES } from "@backend/config/constants.js";

export function usePermission() {
  const authStore = useAuthStore();

  function checkRole(roles) {
    return hasRole(roles, appConfig.skipAuth ? ROLES.SUPER_ADMIN : authStore.role);
  }

  return {
    role: computed(() => (appConfig.skipAuth ? ROLES.SUPER_ADMIN : authStore.role)),
    isSuperAdmin: computed(() => (appConfig.skipAuth ? true : authStore.isSuperAdmin)),
    checkRole,
  };
}
