import { hasRole } from "@/utils/permission.js";
import { useAuthStore } from "@/stores/auth.js";
import { ROLES } from "@/config/constants.js";

const skipAuth = import.meta.env.VITE_BACKEND_SKIP_AUTH === "true";

export function setupPermissionDirective(app) {
  app.directive("permission", {
    mounted(el, binding) {
      const authStore = useAuthStore();
      const roles = binding.value;
      const role = skipAuth ? ROLES.SUPER_ADMIN : authStore.role;
      if (!hasRole(roles, role)) {
        el.parentNode?.removeChild(el);
      }
    },
  });
}
