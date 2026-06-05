<template>
  <Teleport to="body">
    <div
      v-if="visible && alerts.length"
      class="plan-upcoming-alerts"
      role="region"
      aria-label="即将执行提醒"
    >
      <div
        v-for="plan in alerts"
        :key="plan.id"
        class="plan-upcoming-alert"
        role="alert"
      >
        <div class="plan-upcoming-alert__left">
          <span class="plan-upcoming-alert__icon">
            <MountainRescueIcon v-if="plan.scenarioKey === 'mountain'" :width="18" :height="18" />
            <WaterObservationIcon v-else-if="plan.scenarioKey === 'water'" :width="18" :height="18" />
            <SecurityProtectionIcon v-else-if="plan.scenarioKey === 'security'" :width="18" :height="18" />
            <i v-else class="ri-flight-takeoff-line" />
          </span>
          <span class="plan-upcoming-alert__tag">{{ scenarioTitle(plan) }}</span>
        </div>

        <div class="plan-upcoming-alert__divider" aria-hidden="true" />

        <span class="plan-upcoming-alert__msg">
          {{ planLabel(plan) }} 即将自动开启执行
        </span>

        <button type="button" class="plan-upcoming-alert__btn" @click="onViewAllocation(plan)">
          查看分配
        </button>

        <button
          type="button"
          class="plan-upcoming-alert__close"
          aria-label="关闭提醒"
          @click="flightPlanStore.dismissUpcomingAlert(plan.id)"
        >
          <i class="ri-close-line" />
        </button>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { computed } from "vue";
import { useFlightPlanStore } from "@/stores/flightPlan.js";
import { SCENARIO_TITLE_BY_KEY } from "@/components/plan-panel/plan-scenarios.js";
import MountainRescueIcon from "@/components/icons/MountainRescueIcon.vue";
import WaterObservationIcon from "@/components/icons/WaterObservationIcon.vue";
import SecurityProtectionIcon from "@/components/icons/SecurityProtectionIcon.vue";

defineProps({
  visible: { type: Boolean, default: true },
});

const emit = defineEmits(["view-allocation"]);

const flightPlanStore = useFlightPlanStore();

const alerts = computed(() => flightPlanStore.upcomingAlertPlans);

function scenarioTitle(plan) {
  return SCENARIO_TITLE_BY_KEY[plan.scenarioKey] || "飞行计划";
}

function planLabel(plan) {
  return plan.subject || plan.locationLabel || plan.id;
}

function onViewAllocation(plan) {
  emit("view-allocation", plan);
}
</script>

<style lang="scss" scoped>
.plan-upcoming-alerts {
  position: fixed;
  top: 24px;
  left: 50%;
  z-index: 2600;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  width: min(720px, calc(100vw - 48px));
  transform: translateX(-50%);
  pointer-events: none;

  > * {
    pointer-events: auto;
  }
}

.plan-upcoming-alert {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 12px 18px;
  border-radius: 30px;
  background: rgba(3, 6, 10, 0.65);
  backdrop-filter: blur(8px);
  font-size: 14px;
  line-height: 1.4;
}

.plan-upcoming-alert__left {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.plan-upcoming-alert__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #558EFC;
}

.plan-upcoming-alert__tag {
  font-weight: 600;
  white-space: nowrap;
  color: #558EFC;
}

.plan-upcoming-alert__divider {
  width: 1px;
  height: 20px;
  background: #5C6169;
  flex-shrink: 0;
}

.plan-upcoming-alert__msg {
  flex: 1;
  min-width: 120px;
  color: #fff;
  font-weight: 500;
}

.plan-upcoming-alert__btn {
  padding: 6px 18px;
  border: 1px solid #558EFC;
  border-radius: 24px;
  background: #15191E;
  color: #fff;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
  flex-shrink: 0;

  &:hover {
    background: rgba(85, 142, 252, 0.1);
  }
}

.plan-upcoming-alert__close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  padding: 0;
  border: none;
  border-radius: 50%;
  background: transparent;
  color: #fff;
  font-size: 18px;
  cursor: pointer;
  flex-shrink: 0;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }
}
</style>
