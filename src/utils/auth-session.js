let sessionId = 0;

export function getAuthSessionId() {
  return sessionId;
}

export function rotateAuthSession() {
  sessionId += 1;
  return sessionId;
}

/**
 * 换账号 / 退出时清空前台列表缓存。
 * 动态 import 避免 auth store 与 device/flightPlan 循环依赖。
 */
export async function clearClientSessionStores() {
  const sid = getAuthSessionId();
  try {
    const { useDeviceStore } = await import("@/stores/device.js");
    if (getAuthSessionId() !== sid) return;
    useDeviceStore().resetSession();
  } catch {
    // ignore
  }
  try {
    const { useFlightPlanStore } = await import("@/stores/flightPlan.js");
    if (getAuthSessionId() !== sid) return;
    useFlightPlanStore().resetSession();
  } catch {
    // ignore
  }
}

export async function resetClientSession() {
  rotateAuthSession();
  await clearClientSessionStores();
}
