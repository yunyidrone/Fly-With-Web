<!--
 * @FilePath: /accompanying-fly-project/src/components/AreaDrawPopup.vue
 * @Description: 独立地图框选弹窗 — 矩形/圆形工具，天地图 2D API，支持拖拽编辑
-->
<template>
  <Teleport to="body">
    <Transition name="area-draw-fade">
      <div
        v-if="visible"
        class="area-draw-overlay"
        @click.self="handleCancel"
      >
        <div class="area-draw-modal">
          <!-- 工具栏 -->
          <div class="area-draw-toolbar">
            <div class="area-draw-tools">
              <button
                type="button"
                class="area-draw-tool"
                :class="{ 'area-draw-tool--active': currentTool === 'rectangle' }"
                @click="setTool('rectangle')"
              >
                <i class="ri-checkbox-blank-line" />
                <span>矩形</span>
              </button>
              <button
                type="button"
                class="area-draw-tool"
                :class="{ 'area-draw-tool--active': currentTool === 'circle' }"
                @click="setTool('circle')"
              >
                <i class="ri-checkbox-blank-circle-line" />
                <span>圆形</span>
              </button>
            </div>
            <div class="area-draw-hint" v-if="!drawnResult">
              在地图上拖拽绘制...
            </div>
            <div class="area-draw-hint area-draw-hint--ok" v-else>
              拖拽蓝色方块可调整形状
            </div>
            <div class="area-draw-spacer" />
            <button type="button" class="area-draw-btn area-draw-btn--cancel" @click="handleCancel">
              取消
            </button>
            <button
              type="button"
              class="area-draw-btn area-draw-btn--save"
              :disabled="!drawnResult"
              @click="handleSave"
            >
              保存
            </button>
          </div>

          <!-- 天地图 2D 容器 -->
          <div :id="mapContainerId" ref="mapContainerRef" class="area-draw-viewer" />

          <!-- 加载遮罩 -->
          <div v-if="mapLoading" class="area-draw-loading">
            <span>地图加载中...</span>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, watch, nextTick, onBeforeUnmount } from "vue";
import { MAP_CONFIG, TIANDITU_CONFIG } from "@/config/app-config.js";

const TK = TIANDITU_CONFIG.keyList[0];

const props = defineProps({
  visible: { type: Boolean, default: false },
  initialCenter: { type: Object, default: () => ({ lng: MAP_CONFIG.defaultCenter.lng, lat: MAP_CONFIG.defaultCenter.lat }) },
  initialArea: { type: Object, default: null },
});

const emit = defineEmits(["save", "cancel"]);

const mapContainerRef = ref(null);
const mapLoading = ref(true);
const currentTool = ref("rectangle");
const drawnResult = ref(null);

let mapContainerId = "";
let apiLoaded = false;
let map = null;
let currentDrawTool = null;
// 编辑手柄
let editPolygon = null;   // T.Polygon — 当前结果图形
let editHandles = [];     // T.Marker[] — 拖拽手柄
let _ignoreHandleDrag = false;

// ===== 坐标计算 =====
function circleToRing(lng, lat, radiusMeters, segments = 64) {
  const ring = [];
  for (let i = 0; i < segments; i++) {
    const bearing = (Math.PI * 2 * i) / segments;
    const [dlng, dlat] = pointAtDistanceAndBearing(lng, lat, radiusMeters, bearing);
    ring.push(dlng, dlat);
  }
  ring.push(ring[0], ring[1]);
  return ring;
}

function pointAtDistanceAndBearing(lng, lat, dist, bearing) {
  const R = 6378137;
  const dLat = (dist * Math.cos(bearing)) / R;
  const dLng = (dist * Math.sin(bearing)) / (R * Math.cos((lat * Math.PI) / 180));
  return [lng + (dLng * 180) / Math.PI, lat + (dLat * 180) / Math.PI];
}

// 计算两点间距离（米，Haversine近似）
function haversineDistance(lng1, lat1, lng2, lat2) {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180)
    * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ===== 加载天地图 JS API =====
function loadAPI() {
  if (apiLoaded) return Promise.resolve();
  if (window.T) { apiLoaded = true; return Promise.resolve(); }
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `http://api.tianditu.gov.cn/api?v=4.0&tk=${TK}`;
    script.onload = () => { apiLoaded = true; resolve(); };
    script.onerror = () => reject(new Error("天地图 API 加载失败"));
    document.head.appendChild(script);
  });
}

// ===== 手柄图标 =====
function makeHandleIcon(color) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16">
    <rect x="2" y="2" width="12" height="12" rx="2" fill="${color}" stroke="#fff" stroke-width="2"/>
  </svg>`;
  return new T.Icon({
    iconUrl: "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svg))),
    iconSize: new T.Point(16, 16),
    iconAnchor: new T.Point(8, 8),
  });
}

// ===== 编辑系统：清除旧手柄+图形 =====
function clearEditOverlays() {
  editHandles.forEach((h) => { try { map?.removeOverLay?.(h); } catch (_) {} });
  editHandles = [];
  if (editPolygon) {
    try { map?.removeOverLay?.(editPolygon); } catch (_) {}
    editPolygon = null;
  }
}

// ===== 矩形编辑模式 =====
function enterRectangleEdit(points, ring) {
  clearEditOverlays();

  // 绘制静态矩形
  const lngLats = [
    new T.LngLat(points[0].lng, points[0].lat),
    new T.LngLat(points[1].lng, points[1].lat),
    new T.LngLat(points[2].lng, points[2].lat),
    new T.LngLat(points[3].lng, points[3].lat),
  ];
  editPolygon = new T.Polygon(lngLats, {
    color: "#4965c9", weight: 2, opacity: 0.8,
    fillColor: "#4965c9", fillOpacity: 0.2,
  });
  map.addOverLay(editPolygon);

  // 四个角手柄
  const handleIcon = makeHandleIcon("#4965c9");
  points.forEach((pt, idx) => {
    const marker = new T.Marker(new T.LngLat(pt.lng, pt.lat), {
      icon: handleIcon,
      draggable: true,
    });
    marker.addEventListener("drag", (e) => {
      if (_ignoreHandleDrag) return;
      const newPt = e.lnglat;
      points[idx] = { lng: newPt.lng, lat: newPt.lat };
      updateRectangleFromPoints(points);
    });
    marker.addEventListener("dragend", () => {
      updateRectangleFromPoints(points);
    });
    map.addOverLay(marker);
    editHandles.push(marker);
  });
}

function updateRectangleFromPoints(points) {
  if (!editPolygon) return;
  const lngLats = points.map((p) => new T.LngLat(p.lng, p.lat));
  editPolygon.setLngLats(lngLats);

  const ring = [
    points[0].lng, points[0].lat,
    points[1].lng, points[1].lat,
    points[2].lng, points[2].lat,
    points[3].lng, points[3].lat,
    points[0].lng, points[0].lat,
  ];
  const centerLng = (points[0].lng + points[2].lng) / 2;
  const centerLat = (points[0].lat + points[2].lat) / 2;
  drawnResult.value = {
    type: "rectangle",
    points: points.map((p) => ({ ...p })),
    ring,
    center: { lng: centerLng, lat: centerLat },
  };
}

// ===== 圆形编辑模式 =====
function enterCircleEdit(center, radius, ring) {
  clearEditOverlays();

  // 绘制静态圆
  const lngLats = ringToLngLats(ring);
  editPolygon = new T.Polygon(lngLats, {
    color: "#4965c9", weight: 2, opacity: 0.8,
    fillColor: "#4965c9", fillOpacity: 0.2,
  });
  map.addOverLay(editPolygon);

  const handleIcon = makeHandleIcon("#4965c9");
  const centerIcon = makeHandleIcon("#e6a23c");

  // 圆心手柄（黄色）
  const cMarker = new T.Marker(new T.LngLat(center.lng, center.lat), {
    icon: centerIcon, draggable: true,
  });
  cMarker.addEventListener("drag", (e) => {
    if (_ignoreHandleDrag) return;
    center.lng = e.lnglat.lng;
    center.lat = e.lnglat.lat;
    updateCircleFromCenterRadius(center, radius);
  });
  cMarker.addEventListener("dragend", () => {
    updateCircleFromCenterRadius(center, radius);
  });
  map.addOverLay(cMarker);
  editHandles.push(cMarker);

  // 边缘手柄（蓝色，0°方位角方向）
  const [edgeLng, edgeLat] = pointAtDistanceAndBearing(center.lng, center.lat, radius, 0);
  const eMarker = new T.Marker(new T.LngLat(edgeLng, edgeLat), {
    icon: handleIcon, draggable: true,
  });
  eMarker.addEventListener("drag", (e) => {
    if (_ignoreHandleDrag) return;
    radius = haversineDistance(center.lng, center.lat, e.lnglat.lng, e.lnglat.lat);
    updateCircleFromCenterRadius(center, radius);
  });
  eMarker.addEventListener("dragend", () => {
    updateCircleFromCenterRadius(center, radius);
  });
  map.addOverLay(eMarker);
  editHandles.push(eMarker);
}

function updateCircleFromCenterRadius(center, radius) {
  if (!editPolygon) return;
  const ring = circleToRing(center.lng, center.lat, radius);
  editPolygon.setLngLats(ringToLngLats(ring));
  drawnResult.value = {
    type: "circle",
    center: { lng: center.lng, lat: center.lat },
    radius,
    ring,
  };
}

function ringToLngLats(ring) {
  const result = [];
  for (let i = 0; i < ring.length - 2; i += 2) {
    result.push(new T.LngLat(ring[i], ring[i + 1]));
  }
  return result;
}

// ===== 地图 & 绘制 =====
function initMap() {
  const container = document.getElementById(mapContainerId);
  if (!container) return null;

  const mapInstance = new T.Map(mapContainerId);
  mapInstance.centerAndZoom(
    new T.LngLat(props.initialCenter.lng, props.initialCenter.lat),
    14,
  );
  return mapInstance;
}

function startDrawing(mode) {
  if (!map) return;

  // 完全清理上一轮
  if (currentDrawTool) {
    currentDrawTool.close();
    currentDrawTool = null;
  }
  clearEditOverlays();
  map.clearOverLays();
  drawnResult.value = null;

  if (mode === "rectangle") {
    const tool = new T.RectangleTool(map, {
      color: "#4965c9", weight: 2, opacity: 0.65,
      fillColor: "#4965c9", fillOpacity: 0.25,
      cursor: "crosshair",
    });
    tool.open();

    tool.addEventListener("draw", (e) => {
      if (!e.currentBounds) return;
      tool.close();
      currentDrawTool = null;

      const b = e.currentBounds;
      const sw = b.getSouthWest();
      const ne = b.getNorthEast();

      const points = [
        { lng: sw.lng, lat: sw.lat },
        { lng: ne.lng, lat: sw.lat },
        { lng: ne.lng, lat: ne.lat },
        { lng: sw.lng, lat: ne.lat },
      ];
      const ring = [
        points[0].lng, points[0].lat,
        points[1].lng, points[1].lat,
        points[2].lng, points[2].lat,
        points[3].lng, points[3].lat,
        points[0].lng, points[0].lat,
      ];
      drawnResult.value = {
        type: "rectangle",
        points: points.map((p) => ({ ...p })),
        ring,
        center: { lng: (sw.lng + ne.lng) / 2, lat: (sw.lat + ne.lat) / 2 },
      };

      map.clearOverLays(); // 清除工具生成的临时矩形
      enterRectangleEdit(points, ring);
    });

    currentDrawTool = tool;
  } else if (mode === "circle") {
    const tool = new T.CircleTool(map, {
      color: "#4965c9", weight: 2, opacity: 0.65,
      fillColor: "#4965c9", fillOpacity: 0.25,
      cursor: "crosshair",
    });
    tool.open();

    tool.addEventListener("drawend", (e) => {
      if (!e.currentCenter || !e.currentRadius) return;
      tool.close();
      currentDrawTool = null;

      const c = { lng: e.currentCenter.lng, lat: e.currentCenter.lat };
      const r = e.currentRadius;
      const ring = circleToRing(c.lng, c.lat, r);
      drawnResult.value = {
        type: "circle",
        center: { ...c },
        radius: r,
        ring,
      };

      map.clearOverLays();
      enterCircleEdit(c, r, ring);
    });

    currentDrawTool = tool;
  }
}

// ===== 编辑已有区域（回显模式） =====
function startEditingExistingArea(area) {
  if (!map || !area) return;
  clearEditOverlays();
  console.log('地图数据', area) 
  if (area.type === "rectangle" && area.points?.length === 4) {
    const points = area.points.map((p) => ({ lng: p.lng, lat: p.lat }));
    const ring = area.ring?.length >= 10 ? [...area.ring] : [
      points[0].lng, points[0].lat,
      points[1].lng, points[1].lat,
      points[2].lng, points[2].lat,
      points[3].lng, points[3].lat,
      points[0].lng, points[0].lat,
    ];
    currentTool.value = "rectangle";
    enterRectangleEdit(points, ring);
  } else if (area.type === "circle" && area.center && area.radius) {
    const center = { lng: area.center.lng, lat: area.center.lat };
    const radius = area.radius;
    const ring = circleToRing(center.lng, center.lat, radius);
    currentTool.value = "circle";
    enterCircleEdit(center, radius, ring);
  }
}

// ===== 工具切换 =====
function setTool(mode) {
  if (currentTool.value === mode && drawnResult.value) {
    // 同工具且有结果：重新绘制
    startDrawing(mode);
    return;
  }
  currentTool.value = mode;
  startDrawing(mode);
}

// ===== 取消 / 保存 =====
function handleCancel() {
  emit("cancel");
  // cleanup 由 watch else 分支处理
}

function handleSave() {
  console.log('绘制结果', drawnResult.value )
  if (!drawnResult.value) return;
  emit("save", { ...drawnResult.value });
}

function cleanup() {
  if (currentDrawTool) {
    try { currentDrawTool.close(); } catch (_) {}
    currentDrawTool = null;
  }
  clearEditOverlays();
  if (map) {
    try { map.clearOverLays(); } catch (_) {}
    try { map.destroy(); } catch (_) {}
    map = null;
  }
  // 手动清空容器 DOM（防止 T.Map.destroy 未完全清理）
  if (mapContainerId) {
    const el = document.getElementById(mapContainerId);
    if (el) el.innerHTML = "";
  }
  drawnResult.value = null;
}

// ===== 生命周期 =====
watch(
  () => props.visible,
  async (v) => {
    if (v) {
      // 每次打开生成新 ID，避免 Tianditu 内部缓存冲突
      mapContainerId = "area-draw-map-" + Math.random().toString(36).slice(2, 9);
      mapLoading.value = true;
      const isEdit = !!(props.initialArea && props.initialArea.type);
      currentTool.value = isEdit ? props.initialArea.type : "rectangle";
      drawnResult.value = null;
      editHandles = [];
      editPolygon = null;

      await nextTick();
      await loadAPI();
      map = initMap();
      mapLoading.value = false;

      if (isEdit) {
        startEditingExistingArea(props.initialArea);
      } else {
        startDrawing("rectangle");
      }
    } else {
      cleanup();
    }
  },
);

onBeforeUnmount(() => {
  cleanup();
});
</script>

<style lang="scss" scoped>
.area-draw-overlay {
  position: fixed;
  inset: 0;
  z-index: 5000;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.65);
  backdrop-filter: blur(4px);
}

.area-draw-modal {
  width: min(1200px, calc(100vw - 48px));
  height: min(700px, calc(100vh - 80px));
  display: flex;
  flex-direction: column;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #30363b;
  background: #0d1117;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.55);
}

.area-draw-toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  background: #161b22;
  border-bottom: 1px solid #25272b;
  flex-shrink: 0;
}

.area-draw-tools {
  display: flex;
  gap: 4px;
}

.area-draw-tool {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 14px;
  border-radius: 4px;
  border: 1px solid #30363b;
  background: transparent;
  color: rgba(255, 255, 255, 0.6);
  font-size: 14px;
  cursor: pointer;
  transition: all 0.15s ease;

  i { font-size: 16px; }

  &:hover {
    border-color: #4965c9;
    color: #fff;
  }

  &--active {
    border-color: #4965c9;
    background: rgba(73, 101, 201, 0.18);
    color: #fff;
  }
}

.area-draw-hint {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.35);
  margin-left: 8px;

  &--ok {
    color: #67c23a;
  }
}

.area-draw-spacer {
  flex: 1;
}

.area-draw-btn {
  padding: 6px 18px;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  border: 1px solid #30363b;
  background: transparent;
  color: rgba(255, 255, 255, 0.7);
  transition: all 0.15s ease;

  &:hover { color: #fff; }

  &--save {
    border-color: #4965c9;
    color: #4965c9;
    &:hover { background: rgba(73, 101, 201, 0.2); }
    &:disabled { opacity: 0.35; cursor: not-allowed; }
  }

  &--cancel {
    &:hover { border-color: #f56c6c; color: #f56c6c; }
  }
}

.area-draw-viewer {
  flex: 1;
  min-height: 0;
  position: relative;
}

.area-draw-loading {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #0d1117;
  color: rgba(255, 255, 255, 0.45);
  font-size: 14px;
  z-index: 10;
}

.area-draw-fade-enter-active,
.area-draw-fade-leave-active {
  transition: opacity 0.2s ease;
}
.area-draw-fade-enter-from,
.area-draw-fade-leave-to {
  opacity: 0;
}
</style>
