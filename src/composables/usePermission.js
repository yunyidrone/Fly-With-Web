import { computed } from "vue";
import { useAuthStore } from "@/stores/auth.js";
import { hasRole } from "@/utils/permission.js";
import { ROLES } from "@/config/constants.js";

const skipAuth = import.meta.env.VITE_BACKEND_SKIP_AUTH === "true";

export function usePermission() {
  const authStore = useAuthStore();

  function checkRole(roles) {
    return hasRole(roles, skipAuth ? ROLES.SUPER_ADMIN : authStore.role);
  }

  return {
    role: computed(() => (skipAuth ? ROLES.SUPER_ADMIN : authStore.role)),
    isSuperAdmin: computed(() => (skipAuth ? true : authStore.isSuperAdmin)),
    checkRole,
  };
}
