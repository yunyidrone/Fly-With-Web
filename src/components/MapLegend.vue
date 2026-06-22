<!--
 * @Author: ml
 * @Date: 2026-05-13
 * @FilePath: /accompanying-fly-project/src/components/MapLegend.vue
 * @Description: bottom-center map annotation legend with lockdown button
-->
<template>
  <Teleport to="body">
    <div v-if="showLockdownConfirm" class="lockdown-confirm">
      <div class="lockdown-confirm__title">一键封城</div>
      <div class="lockdown-confirm__desc">确认是否一键封锁当前区域</div>
      <div class="lockdown-confirm__actions">
        <button
          type="button"
          class="lockdown-confirm__btn lockdown-confirm__btn--cancel"
          @click="cancelLockdown"
        >
          取消
        </button>
        <button
          type="button"
          class="lockdown-confirm__btn lockdown-confirm__btn--confirm"
          @click="confirmLockdown"
        >
          确认
        </button>
      </div>
    </div>
  </Teleport>

  <div class="map-legend-wrapper" @click.stop>
    <div class="legend-toolbar">
      <div class="legend-actions" aria-label="图例快捷操作">
        <button
          type="button"
          class="legend-action-btn"
          @click.stop="restoreDefault"
        >
          <img
            :src="hfmrPng"
            alt=""
            class="legend-action-icon-img"
            width="16"
            height="16"
          />
          <span>恢复默认</span>
        </button>
        <button
          type="button"
          class="legend-action-btn"
          @click.stop="clearAllSelection"
        >
          <img
            :src="qkxzPng"
            alt=""
            class="legend-action-icon-img"
            width="16"
            height="16"
          />
          <span>清空选中</span>
        </button>
      </div>

      <div class="legend-layout">
      <div class="legend-panel legend-panel--main">
        <div class="legend-items">
          <template v-for="item in legendItems" :key="item.key">
            <span
              v-if="item.key === 'checkpoint' || item.key === 'divider'"
              class="legend-divider"
              aria-hidden="true"
            />
            <div
              v-if="item.key !== 'divider'"
              class="legend-item"
              :class="{ active: item.active }"
              @click="toggleItem(item)"
            >
              <span class="legend-ring-outer">
                <span class="legend-ring-inner">
                  <img :src="item.iconSrc" :alt="item.label" class="legend-icon-img" />
                </span>
              </span>
              <span class="legend-label">{{ item.label }}</span>
            </div>
          </template>
        </div>
      </div>

      <div class="legend-panel legend-panel--lockdown">
        <button class="lockdown-btn" @click="handleLockdown">
          <span class="legend-ring-outer legend-ring-outer--danger">
            <span class="legend-ring-inner legend-ring-inner--danger">
              <img :src="lockdownItem.iconSrc" alt="一键封城" class="legend-icon-img" />
            </span>
          </span>
          <span class="legend-label">{{ lockdownItem.label }}</span>
        </button>
      </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { ElMessage } from "element-plus";
import { AccompanyingFlyService } from "@/api";
import { unwrapApiList } from "@/utils/request.js";
import dbWrjPng from "@/assets/images/db_wrj.png";
import dbWrgPng from "@/assets/images/db_wrg.png";
import dbWrtPng from "@/assets/images/db_wrt.png";
import dbJyPng from "@/assets/images/db_jy.png";
import dbJqrPng from "@/assets/images/db_jqr.png";
import dbJcPng from "@/assets/images/db_jc.png";
import dbKdPng from "@/assets/images/db_kd.png";
import dbBflxPng from "@/assets/images/db_bflx.png";
import dbYjfcPng from "@/assets/images/db_yjfc.png";
import hfmrPng from "@/assets/images/hfmr.png";
import qkxzPng from "@/assets/images/qkxz.png";

/** 与初次进入页一致的图例开关（恢复默认用） */
const DEFAULT_LEGEND_ACTIVE = {
  drone: true,
  robotDog: false,
  unmannedBoat: false,
  officer: false,
  robot: false,
  policeCar: true,
  checkpoint: false,
  route: false,
};

const STATIC_LEGEND_ITEMS = [
  { key: "drone", iconSrc: dbWrjPng, label: "无人机", active: true },
  { key: "robotDog", iconSrc: dbWrgPng, label: "无人犬", active: false },
  { key: "unmannedBoat", iconSrc: dbWrtPng, label: "无人艇", active: false },
  { key: "officer", iconSrc: dbJyPng, label: "警员", active: false },
  { key: "robot", iconSrc: dbJqrPng, label: "机器人", active: false },
  { key: "policeCar", iconSrc: dbJcPng, label: "警车", active: true },
  { key: "checkpoint", iconSrc: dbKdPng, label: "卡点", active: false },
  { key: "route", iconSrc: dbBflxPng, label: "伴飞路线", active: false },
];

const STATIC_LEGEND_EXTRA_ITEMS = [
  { key: "checkpoint", iconSrc: dbKdPng, label: "卡点", active: false },
  { key: "route", iconSrc: dbBflxPng, label: "伴飞路线", active: false },
];

const legendItems = ref(STATIC_LEGEND_ITEMS.map((item) => ({ ...item })));
const lockdownItem = { iconSrc: dbYjfcPng, label: "一键封城" };
const showLockdownConfirm = ref(false);

const emit = defineEmits(["lockdown", "toggle"]);

const legendIconModules = import.meta.glob("../assets/images/db_*.png", {
  eager: true,
  import: "default",
});

function normalizeLegendPayload(data) {
  return unwrapApiList(data)
    .filter((item) => item?.key)
    .sort((a, b) => (Number(a?.sort) || 0) - (Number(b?.sort) || 0));
}

function resolveLegendKey(item, expectedType) {
  const rawKey = String(item?.key ?? "").trim();
  const label = String(item?.value ?? item?.key ?? "").trim();
  const text = `${rawKey} ${label}`.toLowerCase();

  if (expectedType === 1) {
    if (rawKey === "drone" || /无人机|drone|plane|uav|wrj/.test(text)) return "drone";
    if (rawKey === "robotDog" || /无人犬|无人狗|dog|robotdog|wrg/.test(text)) return "robotDog";
    if (rawKey === "unmannedBoat" || /无人艇|boat|ship|vessel|wrt/.test(text))
      return "unmannedBoat";
  }

  if (expectedType === 2) {
    if (rawKey === "robot" || rawKey === "jqr" || /机器人|jqr/.test(text)) return "robot";
    if (rawKey === "police" || rawKey === "officer" || /警员|人员|officer|police.?man|jy/.test(text)) return "officer";
    if (rawKey === "car" || rawKey === "policeCar" || /警车|车辆|car|vehicle|police.?car|jc/.test(text))
      return "policeCar";
  }

  return "";
}

function resolveLegendIcon(item, legendKey) {
  const rawKey = String(item?.key ?? "").trim();
  const iconFileKey = rawKey === "robot" || legendKey === "robot" ? "jqr" : rawKey;
  return (
    legendIconModules[`../assets/images/db_${iconFileKey}.png`] ||
    {
      drone: dbWrjPng,
      robotDog: dbWrgPng,
      unmannedBoat: dbWrtPng,
      officer: dbJyPng,
      robot: dbJqrPng,
      policeCar: dbJcPng,
    }[legendKey]
  );
}

function buildLegendItemsFromSource(list, expectedType) {
  const out = [];
  const seen = new Set();
  for (const item of list) {
    if (item?.type != null && item.type !== "" && Number(item.type) !== expectedType) continue;
    const key = resolveLegendKey(item, expectedType);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push({
      key,
      iconSrc: resolveLegendIcon(item, key),
      label: String(item?.value || item?.key || "").trim(),
      active: DEFAULT_LEGEND_ACTIVE[key] ?? false,
    });
  }
  return out;
}

async function loadLegendItems() {
  try {
    const [resourceData, targetData] = await Promise.all([
      AccompanyingFlyService.getConfigSource({ type: 1 }, { silent: true }),
      AccompanyingFlyService.getConfigSource({ type: 2 }, { silent: true }),
    ]);

    const resourceItems = buildLegendItemsFromSource(
      normalizeLegendPayload(resourceData),
      1,
    );
    const targetItems = buildLegendItemsFromSource(normalizeLegendPayload(targetData), 2);
    const dividerItem = { key: "divider", label: "", iconSrc: "", active: false };
    const nextItems = [
      ...resourceItems,
      ...(resourceItems.length && targetItems.length ? [dividerItem] : []),
      ...targetItems,
      ...STATIC_LEGEND_EXTRA_ITEMS,
    ];
    if (resourceItems.length || targetItems.length) {
      legendItems.value = nextItems.map((item) => ({ ...item }));
    }
  } catch (_) {
    legendItems.value = STATIC_LEGEND_ITEMS.map((item) => ({ ...item }));
  }
}

onMounted(() => {
  loadLegendItems();
});

const toggleItem = (item) => {
  if (item.key === "divider") return;
  item.active = !item.active;
  emit("toggle", { key: item.key, active: item.active });

  if (item.key === "checkpoint") {
    ElMessage.success(item.active ? "已开启卡点" : "已关闭卡点");
  } else if (item.key === "route") {
    ElMessage.success(item.active ? "已开启伴飞路线" : "已关闭伴飞路线");
  }
};

const handleLockdown = () => {
  showLockdownConfirm.value = true;
};

const cancelLockdown = () => {
  showLockdownConfirm.value = false;
};

const confirmLockdown = () => {
  showLockdownConfirm.value = false;
  const checkpointItem = legendItems.value.find((item) => item.key === "checkpoint");
  if (checkpointItem && !checkpointItem.active) {
    checkpointItem.active = true;
  }
  emit("lockdown");
};

/** 恢复默认：图例开关回到初始状态并同步地图图层显隐 */
function restoreDefault() {
  legendItems.value.forEach((item) => {
    const next = DEFAULT_LEGEND_ACTIVE[item.key];
    if (next === undefined) return;
    if (item.active !== next) {
      item.active = next;
      emit("toggle", { key: item.key, active: item.active });
    }
  });
}

/** 清空选中：关闭全部图例对应地图图层（始终向地图同步一遍，避免图例状态与地图已脱节时第一次无效） */
function clearAllSelection() {
  legendItems.value.forEach((item) => {
    item.active = false;
    emit("toggle", { key: item.key, active: false });
  });
}
</script>

<style lang="scss" scoped>
.map-legend-wrapper {
  position: absolute;
  bottom: 20px;
  left: 0;
  right: 0;
  z-index: 100;
  display: flex;
  justify-content: center;
  pointer-events: none;
}

.legend-toolbar {
  display: inline-flex;
  align-items: stretch;
  gap: 10px;
  pointer-events: auto;
}

.legend-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex-shrink: 0;
}

.legend-action-btn {
  display: inline-flex;
  flex-direction: row;
  flex: 1;
  min-height: 0;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin: 0;
  padding: 0 14px;
  min-width: 92px;
  border-radius: 6px;
  border: 1px solid #30363b;
  background: rgba(3, 6, 10, 0.65);
  color: #fff;
  font-family: "HarmonyOS Sans SC", "Segoe UI", sans-serif;
  font-size: 14px;
  font-weight: 500;
  line-height: 1.2;
  cursor: pointer;
  box-sizing: border-box;
  user-select: none;
  backdrop-filter: blur(10px);
  transition:
    border-color 0.18s ease,
    background 0.18s ease,
    color 0.18s ease;

  &:hover {
    border-color: rgba(73, 101, 201, 0.55);
    background: rgba(12, 18, 28, 0.82);
  }

  &:active {
    opacity: 0.92;
  }
}

.legend-action-icon-img {
  width: 16px;
  height: 16px;
  object-fit: contain;
  flex-shrink: 0;
  display: block;
}

.legend-action-btn > span:last-of-type {
  line-height: 1;
  display: inline-flex;
  align-items: center;
}

.lockdown-confirm {
  position: fixed;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  z-index: 3000;
  display: flex;
  width: 364px;
  padding: 20px 24px;
  flex-direction: column;
  align-items: flex-start;
  gap: 14px;
  border-radius: 6px;
  background: rgba(3, 6, 10, 0.65);
  box-sizing: border-box;

  &__title {
    color: var(--Grey-palette-White, #fff);
    font-feature-settings:
      "liga" off,
      "clig" off;
    font-family: "Segoe UI";
    font-size: 20px;
    font-style: normal;
    font-weight: 600;
    line-height: 28px;
  }

  &__desc {
    color: var(--Grey-palette-White, #fff);
    font-family: "Segoe UI";
    font-size: 14px;
    font-style: normal;
    font-weight: 400;
    line-height: 20px;
  }

  &__actions {
    width: 100%;
    display: flex;
    justify-content: flex-end;
    gap: 10px;
  }

  &__btn {
    border-radius: 999px;
    color: #fff;
    font-family: "Segoe UI";
    font-size: 16px;
    font-style: normal;
    font-weight: 400;
    line-height: 1.2;
    padding: 6px 20px;
    cursor: pointer;
    border: 0;
    background: transparent;
  }

  &__btn--cancel {
    border: 1px solid #4965c9;
    background: transparent;
  }

  &__btn--confirm {
    background: #ff4d4f;
  }
}

.legend-layout {
  display: flex;
  align-items: center;
  gap: 8px;
}

.legend-panel {
  padding: 13px 16px 11px 16px;
  border-radius: 6px;
  border: 1px solid #30363b;
  background: rgba(3, 6, 10, 0.65);
  box-sizing: border-box;
}

.legend-panel--main {
  display: flex;
  align-items: center;
}

.legend-panel--lockdown {
  padding: 13px 14px 11px;
}

.legend-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  gap: 6px;
  min-width: 58px;
  cursor: pointer;
  user-select: none;
  transition: opacity 0.2s ease;
  white-space: nowrap;
  opacity: 0.9;
}

.legend-items {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.legend-ring-outer {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  border: 1px solid #25272b;
  background: rgba(3, 6, 10, 0.6);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  transition: border-color 0.2s ease, border-width 0.2s ease;
}

.legend-ring-inner {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 1px solid #25272b;
  background: rgba(0, 0, 0, 0.65);
  box-shadow:
    4px -1px 4px 0 rgba(0, 52, 152, 0.25) inset,
    -5px 0 4px 0 rgba(0, 52, 152, 0.25) inset;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
}

.legend-icon-img {
  width: 24px;
  height: 24px;
  object-fit: contain;
  display: block;
}

.legend-item.active .legend-ring-outer {
  border: 2px solid #4564c9;
  background: rgba(3, 6, 10, 0.6);
}

.legend-item:not(.active) {
  opacity: 0.5;
}

.legend-label {
  color: #fff;
  text-align: center;
  font-family: "Alibaba PuHuiTi";
  font-size: 12px;
  font-style: normal;
  font-weight: 500;
  line-height: normal;
}

.legend-divider {
  width: 1px;
  height: 58px;
  background: #30363b;
  margin: 0 4px;
  flex-shrink: 0;
}

.lockdown-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 0;
  margin: 0;
  background: transparent;
  border: none;
  cursor: pointer;
  user-select: none;
  transition: opacity 0.2s ease;
  white-space: nowrap;
}

.lockdown-btn:hover {
  opacity: 0.88;
}

.legend-ring-outer--danger {
  border: 2px solid #c94547;
  background: rgba(3, 6, 10, 0.6);
}

.legend-ring-inner--danger {
  border: 1px solid #25272b;
  background: rgba(0, 0, 0, 0.65);
  box-shadow:
    4px -1px 4px 0 rgba(201, 69, 71, 0.25) inset,
    -5px 0 4px 0 rgba(201, 69, 71, 0.25) inset;
}
</style>
