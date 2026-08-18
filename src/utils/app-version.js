import { ElMessageBox } from "element-plus";

const CHECK_INTERVAL = 10 * 60 * 1000;

let timerId = null;
let checking = false;
let suppressedVersion = null;

function getVersionUrl() {
  const base = import.meta.env.BASE_URL || "/";
  return `${base.replace(/\/?$/, "/")}version.json?t=${Date.now()}`;
}

async function fetchLatestVersion() {
  const response = await fetch(getVersionUrl(), {
    cache: "no-store",
    headers: {
      "Cache-Control": "no-cache",
      Pragma: "no-cache",
    },
  });
  if (!response.ok) return "";
  const data = await response.json();
  return String(data?.version || "").trim();
}

async function checkAppVersion() {
  if (checking) return;
  checking = true;

  try {
    const latestVersion = await fetchLatestVersion();
    if (!latestVersion || latestVersion === __APP_VERSION__) return;
    if (suppressedVersion === latestVersion) return;

    try {
      await ElMessageBox.confirm("系统已发布新版本，是否立即刷新？", "版本更新", {
        confirmButtonText: "立即刷新",
        cancelButtonText: "稍后",
        type: "info",
      });
      window.location.reload();
    } catch {
      // 用户选择「稍后」：仅当前页面生命周期内不再提示，刷新页面后会再次提醒。
      suppressedVersion = latestVersion;
    }
  } catch {
    // 检查失败（网络异常等）时静默处理。
  } finally {
    checking = false;
  }
}

function handleVisibilityChange() {
  if (document.visibilityState === "visible") {
    checkAppVersion();
  }
}

export function startAppVersionChecker() {
  if (import.meta.env.DEV || timerId != null) return;

  window.setTimeout(checkAppVersion, 3000);
  timerId = window.setInterval(checkAppVersion, CHECK_INTERVAL);
  document.addEventListener("visibilitychange", handleVisibilityChange);
}
