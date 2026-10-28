<template>
  <button ref="petRef" type="button" class="robot-pet" aria-label="和小机器人打招呼" @pointerenter="play" @focus="play" @click="openChat">
<svg aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 250" width="240" height="250">
  <g stroke-linecap="round" stroke-linejoin="round">
    <ellipse data-part="shadow" cx="120" cy="234" rx="58" ry="9" fill="#71D6FF" opacity=".23"/>
    <g data-part="body">
    <!-- Floating orbit and side fins -->
    <path d="M47 138 C21 128 15 111 29 98 C37 91 46 92 57 97Z" fill="#83B9F7" stroke="#315485" stroke-width="3"/>
    <path d="M193 138 C219 128 225 111 211 98 C203 91 194 92 183 97Z" fill="#83B9F7" stroke="#315485" stroke-width="3"/>
    <path d="M33 147 C49 168 191 171 207 147" fill="none" stroke="#59D6F8" stroke-width="7" opacity=".65"/>
    <!-- One small navigation antenna -->
    <path d="M120 58 L120 32" fill="none" stroke="#315485" stroke-width="7"/>
    <path d="M120 58 L120 32" fill="none" stroke="#80DAFF" stroke-width="3"/>
    <g data-part="antenna">
    <path d="M120 13 L124 22 L133 26 L124 30 L120 39 L116 30 L107 26 L116 22Z" fill="#A7F3FF" stroke="#315485" stroke-width="2.5"/>
    <circle cx="120" cy="26" r="2.5" fill="#FFFFFF"/>
    </g>
    <!-- Rounded hovering shell -->
    <path d="M120 52 C159 52 185 69 195 103 C203 128 198 166 181 188 C168 206 145 216 120 216 C95 216 72 206 59 188 C42 166 37 128 45 103 C55 69 81 52 120 52Z" fill="#C7D9FF" stroke="#315485" stroke-width="4"/>
    <!-- Dark display with one expressive optical eye -->
    <path d="M76 82 C95 70 145 70 164 82 C180 92 185 110 182 139 C180 156 169 166 152 170 C134 174 106 174 88 170 C71 166 60 156 58 139 C55 110 60 92 76 82Z" fill="#1A315B" stroke="#67BFEF" stroke-width="3.5"/>
    <path d="M78 91 C91 83 108 81 121 81" fill="none" stroke="#5C86B7" stroke-width="3"/>
    <g data-part="eye">
    <circle cx="120" cy="120" r="35" fill="#4077AC"/>
    <circle cx="120" cy="120" r="28" fill="#B6E9FF"/>
    <circle cx="120" cy="120" r="18" fill="#4777B9"/>
    <circle cx="120" cy="120" r="10" fill="#203F75"/>
    <circle cx="110" cy="109" r="8" fill="#FFFFFF" opacity=".95"/>
    <circle cx="130" cy="130" r="3" fill="#86E9FF"/>
    </g>
    <path d="M103 154 C112 160 128 160 137 154" fill="none" stroke="#88DBF9" stroke-width="3"/>
    <circle cx="78" cy="143" r="3.5" fill="#A989E6"/>
    <circle cx="162" cy="143" r="3.5" fill="#A989E6"/>
    <!-- Small floating hands -->
    <path d="M55 156 C41 153 32 160 32 172 C32 184 42 191 55 186 L65 178Z" fill="#E5E2FF" stroke="#315485" stroke-width="3"/>
    <g data-part="hand">
    <path d="M185 156 C199 153 208 160 208 172 C208 184 198 191 185 186 L175 178Z" fill="#E5E2FF" stroke="#315485" stroke-width="3"/>
    <circle cx="195" cy="172" r="4" fill="#70DFFA"/>
    </g>
    <circle cx="45" cy="172" r="4" fill="#70DFFA"/>
    <!-- AI core and hover jets -->
    <path d="M102 184 C111 179 129 179 138 184 C144 191 142 203 135 208 C128 213 112 213 105 208 C98 203 96 191 102 184Z" fill="#EEF7FF" stroke="#7598CD" stroke-width="2.5"/>
    <g data-part="core">
    <path d="M120 186 L123 193 L130 196 L123 199 L120 206 L117 199 L110 196 L117 193Z" fill="#68DBF5" stroke="#368EB3" stroke-width="2"/>
    </g>
    <path d="M83 215 C88 224 99 229 109 228 M131 228 C141 229 152 224 157 215" fill="none" stroke="#73DDFD" stroke-width="5"/>
    <circle cx="73" cy="220" r="3" fill="#A4EEFF"/>
    <circle cx="166" cy="222" r="2.5" fill="#A4EEFF"/>
    </g>
  </g>
</svg>
  </button>
</template>

<script setup>
import { onMounted, onUnmounted, ref } from "vue";

const emit = defineEmits(["open-chat"]);

const petRef = ref(null);
let timer;
let active = [];
let reduced;

function cancelAnimations() {
  active.forEach((animation) => animation.cancel());
  active = [];
}

function later() {
  clearTimeout(timer);
  if (!document.hidden && !reduced?.matches) timer = setTimeout(play, 3000 + Math.random() * 2000);
}

function animate(part, frames) {
  const el = petRef.value?.querySelector('[data-part="' + part + '"]');
  if (el?.animate) active.push(el.animate(frames, { duration: 1200, easing: "ease-in-out" }));
}

function play() {
  clearTimeout(timer);
  cancelAnimations();
  if (document.hidden || reduced?.matches) return;
  animate('body', [{transform:'translateY(0)'},{transform:'translateY(-8px)',offset:.28},{transform:'translateY(-5px)',offset:.5},{transform:'translateY(-8px)',offset:.72},{transform:'translateY(0)'}]);
  animate('hand', [{transform:'rotate(0deg)'},{transform:'rotate(-22deg)',offset:.28},{transform:'rotate(10deg)',offset:.5},{transform:'rotate(-22deg)',offset:.72},{transform:'rotate(0deg)'}]);
  animate('eye', [{transform:'scaleY(1)'},{transform:'scaleY(1)',offset:.38},{transform:'scaleY(.13)',offset:.46},{transform:'scaleY(1)',offset:.54},{transform:'scaleY(1)'}]);
  animate('antenna', [{opacity:1},{opacity:.45},{opacity:1},{opacity:.55},{opacity:1}]);
  animate('core', [{opacity:1},{opacity:.55},{opacity:1}]);
  animate('shadow', [{transform:'scaleX(1)'},{transform:'scaleX(.83)',offset:.28},{transform:'scaleX(.88)',offset:.5},{transform:'scaleX(.83)',offset:.72},{transform:'scaleX(1)'}]);
  later();
}

function openChat() {
  emit("open-chat");
  play();
}

function onVisibilityChange() {
  if (document.hidden) {
    clearTimeout(timer);
    cancelAnimations();
  } else later();
}

function onMotionChange() {
  cancelAnimations();
  later();
}

onMounted(() => {
  reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  document.addEventListener('visibilitychange', onVisibilityChange);
  reduced.addEventListener('change', onMotionChange);
  later();
});

onUnmounted(() => {
  clearTimeout(timer);
  cancelAnimations();
  document.removeEventListener('visibilitychange', onVisibilityChange);
  reduced?.removeEventListener('change', onMotionChange);
});
</script>

<style scoped>
.robot-pet {
  box-sizing: border-box;
  width: 150px;
  height: 169px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 0;
  padding: 0;
  background: transparent;
  cursor: pointer;
  border-radius: 24px;
  color: inherit;
  -webkit-tap-highlight-color: transparent;
}
.robot-pet:focus-visible { outline: 2px solid #70dffa; outline-offset: 6px; }
.robot-pet svg { width: 108px; height: 112.5px; overflow: visible; }
.robot-pet [data-part="hand"] { transform-origin: 181px 159px; }
.robot-pet [data-part="eye"] { transform-origin: 120px 120px; }
.robot-pet [data-part="shadow"] { transform-origin: 120px 234px; }
</style>
