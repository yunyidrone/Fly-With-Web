import { hasRole } from "@backend/utils/permission.js";
import { useAuthStore } from "@backend/stores/auth.js";
import { appConfig } from "@backend/config/network.js";
import { ROLES } from "@backend/config/constants.js";

export function setupPermissionDirective(app) {
  app.directive("permission", {
    mounted(el, binding) {
      const authStore = useAuthStore();
      const roles = binding.value;
      const role = appConfig.skipAuth ? ROLES.SUPER_ADMIN : authStore.role;
      if (!hasRole(roles, role)) {
        el.parentNode?.removeChild(el);
      }
    },
  });
}
