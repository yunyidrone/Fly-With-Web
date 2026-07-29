<template>
  <span class="count-up-number">{{ displayValue }}</span>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from "vue";

const props = defineProps({
  value: {
    type: Number,
    default: 0,
  },
  duration: {
    type: Number,
    default: 800,
  },
});

const displayValue = ref(0);
let rafId = 0;

function easeOutCubic(progress) {
  return 1 - (1 - progress) ** 3;
}

function animateTo(target) {
  cancelAnimationFrame(rafId);

  const from = displayValue.value;
  const to = Math.max(0, Math.round(Number(target) || 0));
  if (from === to) {
    displayValue.value = to;
    return;
  }

  const startAt = performance.now();
  const duration = Math.max(props.duration, 0);

  function frame(now) {
    const progress = duration === 0 ? 1 : Math.min((now - startAt) / duration, 1);
    displayValue.value = Math.round(from + (to - from) * easeOutCubic(progress));

    if (progress < 1) {
      rafId = requestAnimationFrame(frame);
    } else {
      displayValue.value = to;
    }
  }

  rafId = requestAnimationFrame(frame);
}

watch(
  () => props.value,
  (value) => {
    animateTo(value);
  },
);

onMounted(() => {
  animateTo(props.value);
});

onBeforeUnmount(() => {
  cancelAnimationFrame(rafId);
});
</script>
