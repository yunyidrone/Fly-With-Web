<template>
  <div v-if="hasTasks" class="pat-list">
    <article
      v-for="item in executingItems"
      :key="`run-${item.planId}`"
      class="pat-card"
    >
      <header class="pat-card__head">
        <span class="pat-card__head-left">
          {{ item.scenarioTitle }}<span class="pat-card__sep">|</span>{{ item.startModeLabel }}
        </span>
        <span class="pat-card__status pat-card__status--running">
          <i class="pat-card__status-dot" aria-hidden="true" />
          正在执行任务
        </span>
      </header>
      <div class="pat-card__body" @click="emit('monitor', item.planId)">
        <div class="pat-card__icon" :class="`pat-card__icon--${item.scenarioKey}`">
          <MountainRescueIcon v-if="item.scenarioKey === 'mountain'" :width="22" :height="22" />
          <WaterObservationIcon v-else-if="item.scenarioKey === 'water'" :width="22" :height="22" />
          <SecurityProtectionIcon v-else-if="item.scenarioKey === 'security'" :width="22" :height="22" />
          <i v-else class="ri-flight-takeoff-line" />
        </div>
        <div class="pat-card__lines">
          <p v-for="(line, idx) in item.bodyLines" :key="idx" class="pat-card__line">
            {{ line }}
          </p>
        </div>
      </div>
      <footer class="pat-card__foot">
        <button type="button" class="pat-btn pat-btn--full" @click="emit('cancel', item.plan)">
          取消任务
        </button>
      </footer>
    </article>

    <article
      v-for="item in upcomingItems"
      :key="`up-${item.planId}`"
      class="pat-card"
    >
      <header class="pat-card__head">
        <span class="pat-card__head-left">
          {{ item.scenarioTitle }}<span class="pat-card__sep">|</span>{{ item.countdown }}
        </span>
        <span class="pat-card__status pat-card__status--upcoming">
          <i class="pat-card__status-dot" aria-hidden="true" />
          即将启动
        </span>
      </header>
      <div class="pat-card__body" @click="emit('monitor', item.planId)">
        <div class="pat-card__icon" :class="`pat-card__icon--${item.scenarioKey}`">
          <MountainRescueIcon v-if="item.scenarioKey === 'mountain'" :width="22" :height="22" />
          <WaterObservationIcon v-else-if="item.scenarioKey === 'water'" :width="22" :height="22" />
          <SecurityProtectionIcon v-else-if="item.scenarioKey === 'security'" :width="22" :height="22" />
          <i v-else class="ri-flight-takeoff-line" />
        </div>
        <div class="pat-card__lines">
          <p class="pat-card__line">{{ item.bodyLine }}</p>
        </div>
      </div>
      <footer class="pat-card__foot pat-card__foot--split">
        <button type="button" class="pat-btn pat-btn--half" @click="emit('emergency-start', item.plan)">
          紧急启动
        </button>
        <button type="button" class="pat-btn pat-btn--half pat-btn--danger-text" @click="emit('cancel', item.plan)">
          取消任务
        </button>
      </footer>
    </article>
  </div>
</template>

<script setup>
import { ref, computed, watch } from "vue";
import { useFlightPlanStore } from "@/stores/flightPlan.js";
import { usePlanCountdownNow } from "@/composables/usePlanCountdownNow.js";
import { FlightPlanService } from "@/api/plan.js";
import { normalizeWarnDataToFlatEvents } from "@/utils/plan-algorithm-data.js";
import MountainRescueIcon from "@/components/icons/MountainRescueIcon.vue";
import WaterObservationIcon from "@/components/icons/WaterObservationIcon.vue";
import SecurityProtectionIcon from "@/components/icons/SecurityProtectionIcon.vue";
import { SCENARIO_TITLE_BY_KEY } from "@/components/plan-panel/plan-scenarios.js";
import {
  resolveLocationLabelsFromPaths,
  normalizePlanLocationPaths,
} from "@/config/flight-plan-locations.js";
import {
  formatPlanDateTimeLine,
  formatPlanUpcomingClock,
  resolvePlanStartModeLabel,
} from "@/utils/plan-task.js";

const emit = defineEmits(["monitor", "emergency-start", "cancel"]);

const flightPlanStore = useFlightPlanStore();

const hasUpcomingPlans = computed(() => flightPlanStore.upcomingPlans.length > 0);
const countdownNow = usePlanCountdownNow(hasUpcomingPlans);

/** @type {import('vue').Ref<Record<string, {latestEvent: Record<string,any>|null}>>} */
const warnDataMap = ref({});

watch(
  () => flightPlanStore.executingPlans.map((p) => p.id),
  async (ids) => {
    const newIds = ids.filter((id) => !warnDataMap.value[id]);
    if (!newIds.length) return;
    const results = await Promise.allSettled(
      newIds.map((id) => FlightPlanService.planWarnData({ id })),
    );
    const next = { ...warnDataMap.value };
    results.forEach((r, i) => {
      if (r.status === "fulfilled" && r.value) {
        const events = normalizeWarnDataToFlatEvents(r.value);
        next[newIds[i]] = { latestEvent: events[0] || null };
      } else {
        next[newIds[i]] = { latestEvent: null };
      }
    });
    const idSet = new Set(ids);
    for (const key of Object.keys(next)) {
      if (!idSet.has(key)) delete next[key];
    }
    warnDataMap.value = next;
  },
  { immediate: true },
);

function formatWarnTime(timeStr) {
  if (!timeStr) return "—";
  return String(timeStr).trim();
}

function planTitle(plan) {
  return (
    plan.subject ||
    plan.locationLabel ||
    resolveLocationLabelsFromPaths(normalizePlanLocationPaths(plan)) ||
    plan.id
  );
}

function buildBodyLine(plan, useEnd = false) {
  const title = planTitle(plan);
  const dt = formatPlanDateTimeLine(
    plan.flightDate,
    useEnd ? plan.timeEnd : plan.timeStart,
  );
  return dt ? `${title} | ${dt}` : title;
}

function mapExecuting(plan) {
  const lines = [buildBodyLine(plan, false)];

  // 第二行优先展示最新 AI 事件（类型 + 时间）
  const warnInfo = warnDataMap.value[plan.id];
  if (warnInfo?.latestEvent) {
    const ev = warnInfo.latestEvent;
    lines.push(`${ev.warnType} ${formatWarnTime(ev.eventTime)}`);
  } else if (plan.timeEnd && plan.flightDate) {
    const endLine = buildBodyLine(plan, true);
    if (endLine !== lines[0]) lines.push(endLine);
  }

  return {
    plan,
    planId: plan.id,
    scenarioKey: plan.scenarioKey,
    scenarioTitle: SCENARIO_TITLE_BY_KEY[plan.scenarioKey] || "飞行计划",
    startModeLabel: resolvePlanStartModeLabel(plan),
    bodyLines: lines.slice(0, 2),
  };
}

const executingItems = computed(() =>
  flightPlanStore.executingPlans.map(mapExecuting),
);

const upcomingItems = computed(() => {
  const now = countdownNow.value;
  return flightPlanStore.upcomingPlans.map((plan) => ({
    plan,
    planId: plan.id,
    scenarioKey: plan.scenarioKey,
    scenarioTitle: SCENARIO_TITLE_BY_KEY[plan.scenarioKey] || "飞行计划",
    countdown: formatPlanUpcomingClock(plan, now),
    bodyLine: buildBodyLine(plan, false),
  }));
});

const hasTasks = computed(
  () => executingItems.value.length > 0 || upcomingItems.value.length > 0,
);
</script>

<style lang="scss" scoped>
.pat-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.pat-card {
  border-radius: 8px;
  background: #1e1e1e;
  border: 1px solid rgba(255, 255, 255, 0.08);
  overflow: hidden;
}

.pat-card__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 10px 12px 8px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.pat-card__head-left {
  font-size: 13px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.88);
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pat-card__sep {
  margin: 0 6px;
  color: rgba(255, 255, 255, 0.28);
  font-weight: 400;
}

.pat-card__status {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  flex-shrink: 0;
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
}

.pat-card__status-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
}

.pat-card__status--running {
  color: #4cd964;

  .pat-card__status-dot {
    background: #4cd964;
    box-shadow: 0 0 6px rgba(76, 217, 100, 0.6);
  }
}

.pat-card__status--upcoming {
  color: #ff9f0a;

  .pat-card__status-dot {
    background: #ff9f0a;
    box-shadow: 0 0 6px rgba(255, 159, 10, 0.5);
  }
}

.pat-card__body {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px 12px;
  cursor: pointer;
}

.pat-card__icon {
  flex-shrink: 0;
  width: 44px;
  height: 44px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  color: #4a9eff;
  background: rgba(74, 158, 255, 0.12);
}

.pat-card__lines {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.pat-card__line {
  margin: 0;
  font-size: 12px;
  line-height: 1.45;
  color: rgba(255, 255, 255, 0.82);
  word-break: break-all;
}

.pat-card__foot {
  display: flex;
  padding: 0 12px 12px;
  gap: 8px;

  &--split {
    gap: 10px;
  }
}

.pat-btn {
  height: 36px;
  border-radius: 6px;
  border: 1px solid #3b6fd8;
  background: transparent;
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition:
    background 0.15s,
    border-color 0.15s;

  &:hover {
    background: rgba(59, 111, 216, 0.12);
  }

  &--full {
    flex: 1;
    width: 100%;
  }

  &--half {
    flex: 1;
    min-width: 0;
  }

  &--danger-text {
    color: #ff5c5c;
    border-color: #3b6fd8;
  }
}
</style>
