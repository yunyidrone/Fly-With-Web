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

  <div class="map-legend-wrapper">
    <div class="legend-layout">
      <div class="legend-panel legend-panel--main">
        <div class="legend-items">
          <template v-for="(item, index) in legendItems" :key="item.key">
            <div
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
            <span v-if="index === 4" class="legend-divider" aria-hidden="true" />
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
</template>

<script setup>
import { reactive, ref } from "vue";
import dbWrjPng from "@/assets/images/db_wrj.png";
import dbWrgPng from "@/assets/images/db_wrg.png";
import dbWrtPng from "@/assets/images/db_wrt.png";
import dbJyPng from "@/assets/images/db_jy.png";
import dbJcPng from "@/assets/images/db_jc.png";
import dbKdPng from "@/assets/images/db_kd.png";
import dbBflxPng from "@/assets/images/db_bflx.png";
import dbYjfcPng from "@/assets/images/db_yjfc.png";

const legendItems = reactive([
  { key: "drone", iconSrc: dbWrjPng, label: "无人机", active: true },
  { key: "robotDog", iconSrc: dbWrgPng, label: "无人犬", active: false },
  { key: "unmannedBoat", iconSrc: dbWrtPng, label: "无人艇", active: false },
  { key: "officer", iconSrc: dbJyPng, label: "警员", active: false },
  { key: "policeCar", iconSrc: dbJcPng, label: "警车", active: true },
  { key: "checkpoint", iconSrc: dbKdPng, label: "卡点", active: false },
  { key: "route", iconSrc: dbBflxPng, label: "伴飞路线", active: false },
]);
const lockdownItem = { iconSrc: dbYjfcPng, label: "一键封城" };
const showLockdownConfirm = ref(false);

const emit = defineEmits(["lockdown", "toggle"]);

const toggleItem = (item) => {
  item.active = !item.active;
  emit("toggle", { key: item.key, active: item.active });
};

const handleLockdown = () => {
  showLockdownConfirm.value = true;
};

const cancelLockdown = () => {
  showLockdownConfirm.value = false;
};

const confirmLockdown = () => {
  showLockdownConfirm.value = false;
  emit("lockdown");
};
</script>

<style lang="scss" scoped>
.map-legend-wrapper {
  position: absolute;
  bottom: 40px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 100;
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
    background: #4965c9;
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
