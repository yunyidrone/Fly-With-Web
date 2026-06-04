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
        <span class="plan-upcoming-alert__tag">【{{ scenarioTitle(plan) }}】</span>
        <span class="plan-upcoming-alert__msg">
          {{ planLabel(plan) }} 即将自动开启执行
        </span>
        <button type="button" class="plan-upcoming-alert__link" @click="onViewAllocation(plan)">
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

defineProps({
  /** 沉浸飞行等场景下由父级关闭展示（勿在 Teleport 根组件上用 v-show） */
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
  top: 88px;
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
  flex-wrap: wrap;
  gap: 6px 10px;
  width: 100%;
  padding: 10px 14px 10px 18px;
  border: 1px dashed #e85d5d;
  border-radius: 999px;
  background: rgba(255, 252, 252, 0.97);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.12);
  font-size: 14px;
  line-height: 1.4;
  color: #d93030;
}

.plan-upcoming-alert__tag {
  font-weight: 600;
  white-space: nowrap;
}

.plan-upcoming-alert__msg {
  flex: 1;
  min-width: 120px;
  font-weight: 500;
}

.plan-upcoming-alert__link {
  padding: 0;
  border: none;
  background: none;
  color: #3b6fd8;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  text-decoration: underline;
  white-space: nowrap;

  &:hover {
    color: #5a8ae8;
  }
}

.plan-upcoming-alert__close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  margin-left: 2px;
  padding: 0;
  border: none;
  border-radius: 50%;
  background: transparent;
  color: #1a1a1a;
  font-size: 18px;
  cursor: pointer;
  flex-shrink: 0;

  &:hover {
    background: rgba(0, 0, 0, 0.06);
  }
}
</style>
