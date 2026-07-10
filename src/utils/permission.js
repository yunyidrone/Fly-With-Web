import { ROLES } from "@/config/constants.js";

/**
 * @param {string|string[]} roles
 * @param {string} userRole
 */
export function hasRole(roles, userRole) {
  if (!roles || (Array.isArray(roles) && roles.length === 0)) return true;
  const list = Array.isArray(roles) ? roles : [roles];
  return list.includes(userRole);
}

export function isSuperAdmin(role) {
  return role === ROLES.SUPER_ADMIN;
}

export function canWriteDrone(role) {
  return role === ROLES.SUPER_ADMIN || role === ROLES.ORG_ADMIN;
}

export function canManageOrg(role) {
  return role === ROLES.SUPER_ADMIN;
}

export function canManageUser(role) {
  return role === ROLES.SUPER_ADMIN || role === ROLES.ORG_ADMIN;
}
