import { ref, shallowRef } from "vue";
import { MAP_CONFIG, TIANDITU_CONFIG } from "@/config/app-config.js";
import {
  circleToRing,
  getMapCenter,
  haversineDistance,
  isValidRing,
  normalizeAreaData,
  pointAtDistanceAndBearing,
  ringToLngLats,
} from "@/utils/tianditu-area.js";

const TK = TIANDITU_CONFIG.keyList[0];
let apiLoaded = false;

const AREA_STYLE = {
  color: "#4965c9",
  weight: 2,
  opacity: 0.8,
  fillColor: "#4965c9",
  fillOpacity: 0.2,
};

const DRAW_STYLE = {
  color: "#4965c9",
  weight: 2,
  opacity: 0.65,
  fillColor: "#4965c9",
  fillOpacity: 0.25,
  cursor: "crosshair",
};

export function loadTiandituAPI() {
  if (apiLoaded) return Promise.resolve();
  if (window.T) {
    apiLoaded = true;
    return Promise.resolve();
  }
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `http://api.tianditu.gov.cn/api?v=4.0&tk=${TK}`;
    script.onload = () => {
      apiLoaded = true;
      resolve();
    };
    script.onerror = () => reject(new Error("天地图 API 加载失败"));
    document.head.appendChild(script);
  });
}

function makeHandleIcon(color) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16">
    <rect x="2" y="2" width="12" height="12" rx="2" fill="${color}" stroke="#fff" stroke-width="2"/>
  </svg>`;
  return new T.Icon({
    iconUrl: `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`,
    iconSize: new T.Point(16, 16),
    iconAnchor: new T.Point(8, 8),
  });
}

export function useTiandituAreaMap() {
  const loading = ref(true);
  const currentTool = ref("rectangle");
  const drawnResult = ref(null);
  const polygonPointCount = ref(0);
  const isPolygonDrawing = ref(false);
  const map = shallowRef(null);

  let mapContainerId = "";
  let currentDrawTool = null;
  let editPolygon = null;
  let editHandles = [];
  let drawPointMarkers = [];
  let drawPolyline = null;
  let drawPolygon = null;
  let displayPolygon = null;
  let polygonClickHandler = null;
  let draftMarkerDragging = false;
  let draftMarkerDragSuppressUntil = 0;
  let _ignoreHandleDrag = false;

  function clearEditOverlays() {
    editHandles.forEach((handle) => {
      try { map.value?.removeOverLay?.(handle); } catch (_) { /* ignore */ }
    });
    editHandles = [];
    if (editPolygon) {
      try { map.value?.removeOverLay?.(editPolygon); } catch (_) { /* ignore */ }
      editPolygon = null;
    }
  }

  function clearDisplayOverlay() {
    if (displayPolygon) {
      try { map.value?.removeOverLay?.(displayPolygon); } catch (_) { /* ignore */ }
      displayPolygon = null;
    }
  }

  function clearDrawDraftOverlays() {
    drawPointMarkers.forEach((marker) => {
      try { map.value?.removeOverLay?.(marker); } catch (_) { /* ignore */ }
    });
    drawPointMarkers = [];

    if (drawPolyline) {
      try { map.value?.removeOverLay?.(drawPolyline); } catch (_) { /* ignore */ }
      drawPolyline = null;
    }
    if (drawPolygon) {
      try { map.value?.removeOverLay?.(drawPolygon); } catch (_) { /* ignore */ }
      drawPolygon = null;
    }
  }

  function removePolygonClickListener() {
    if (map.value && polygonClickHandler) {
      try { map.value.removeEventListener("click", polygonClickHandler); } catch (_) { /* ignore */ }
    }
    polygonClickHandler = null;
    isPolygonDrawing.value = false;
  }

  function fitMapToArea(area) {
    if (!map.value || !area) return;
    const normalized = normalizeAreaData(area);
    if (!normalized || !isValidRing(normalized.ring)) return;

    const points = ringToLngLats(normalized.ring, T);
    if (points.length >= 3 && typeof map.value.setViewport === "function") {
      map.value.setViewport(points);
      return;
    }

    const center = getMapCenter(normalized);
    map.value.centerAndZoom(new T.LngLat(center.lng, center.lat), 14);
  }

  function showArea(area, { fit = true } = {}) {
    if (!map.value) return;
    const normalized = normalizeAreaData(area);
    clearDisplayOverlay();
    clearEditOverlays();

    if (!normalized || !isValidRing(normalized.ring)) {
      drawnResult.value = null;
      return;
    }

    displayPolygon = new T.Polygon(ringToLngLats(normalized.ring, T), AREA_STYLE);
    map.value.addOverLay(displayPolygon);
    drawnResult.value = { ...normalized };

    if (fit) fitMapToArea(normalized);
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
    drawnResult.value = {
      type: "rectangle",
      points: points.map((p) => ({ ...p })),
      ring,
      center: {
        lng: (points[0].lng + points[2].lng) / 2,
        lat: (points[0].lat + points[2].lat) / 2,
      },
    };
  }

  function updateCircleFromCenterRadius(center, radius) {
    if (!editPolygon) return;
    const ring = circleToRing(center.lng, center.lat, radius);
    editPolygon.setLngLats(ringToLngLats(ring, T));
    drawnResult.value = {
      type: "circle",
      center: { lng: center.lng, lat: center.lat },
      radius,
      ring,
    };
  }

  function updatePolygonFromPoints(points) {
    if (!editPolygon || !Array.isArray(points) || points.length < 3) return;
    const lngLats = points.map((p) => new T.LngLat(p.lng, p.lat));
    editPolygon.setLngLats(lngLats);

    const ring = [];
    points.forEach((p) => {
      ring.push(p.lng, p.lat);
    });
    ring.push(points[0].lng, points[0].lat);

    drawnResult.value = {
      type: "polygon",
      points: points.map((p) => ({ ...p })),
      ring,
      center: {
        lng: points.reduce((sum, p) => sum + p.lng, 0) / points.length,
        lat: points.reduce((sum, p) => sum + p.lat, 0) / points.length,
      },
    };
  }

  function enterRectangleEdit(points) {
    clearEditOverlays();
    clearDisplayOverlay();

    const lngLats = points.map((p) => new T.LngLat(p.lng, p.lat));
    editPolygon = new T.Polygon(lngLats, AREA_STYLE);
    map.value.addOverLay(editPolygon);

    const handleIcon = makeHandleIcon("#4965c9");
    points.forEach((pt, idx) => {
      const marker = new T.Marker(new T.LngLat(pt.lng, pt.lat), {
        icon: handleIcon,
        draggable: true,
      });
      marker.addEventListener("drag", (e) => {
        if (_ignoreHandleDrag) return;
        points[idx] = { lng: e.lnglat.lng, lat: e.lnglat.lat };
        updateRectangleFromPoints(points);
      });
      marker.addEventListener("dragend", () => {
        updateRectangleFromPoints(points);
      });
      map.value.addOverLay(marker);
      editHandles.push(marker);
    });
    updateRectangleFromPoints(points);
  }

  function enterCircleEdit(center, radius) {
    clearEditOverlays();
    clearDisplayOverlay();

    const ring = circleToRing(center.lng, center.lat, radius);
    editPolygon = new T.Polygon(ringToLngLats(ring, T), AREA_STYLE);
    map.value.addOverLay(editPolygon);

    const handleIcon = makeHandleIcon("#4965c9");
    const centerIcon = makeHandleIcon("#e6a23c");

    const cMarker = new T.Marker(new T.LngLat(center.lng, center.lat), {
      icon: centerIcon,
      draggable: true,
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
    map.value.addOverLay(cMarker);
    editHandles.push(cMarker);

    const [edgeLng, edgeLat] = pointAtDistanceAndBearing(center.lng, center.lat, radius, 0);
    const eMarker = new T.Marker(new T.LngLat(edgeLng, edgeLat), {
      icon: handleIcon,
      draggable: true,
    });
    eMarker.addEventListener("drag", (e) => {
      if (_ignoreHandleDrag) return;
      radius = haversineDistance(center.lng, center.lat, e.lnglat.lng, e.lnglat.lat);
      updateCircleFromCenterRadius(center, radius);
    });
    eMarker.addEventListener("dragend", () => {
      updateCircleFromCenterRadius(center, radius);
    });
    map.value.addOverLay(eMarker);
    editHandles.push(eMarker);
    updateCircleFromCenterRadius(center, radius);
  }

  function enterPolygonEdit(points) {
    clearEditOverlays();
    clearDisplayOverlay();

    if (!Array.isArray(points) || points.length < 3) return;

    editPolygon = new T.Polygon(
      points.map((p) => new T.LngLat(p.lng, p.lat)),
      AREA_STYLE,
    );
    map.value.addOverLay(editPolygon);

    const handleIcon = makeHandleIcon("#4965c9");
    points.forEach((pt, idx) => {
      const marker = new T.Marker(new T.LngLat(pt.lng, pt.lat), {
        icon: handleIcon,
        draggable: true,
      });
      marker.addEventListener("drag", (e) => {
        if (_ignoreHandleDrag) return;
        points[idx] = { lng: e.lnglat.lng, lat: e.lnglat.lat };
        updatePolygonFromPoints(points);
      });
      marker.addEventListener("dragend", () => {
        updatePolygonFromPoints(points);
      });
      map.value.addOverLay(marker);
      editHandles.push(marker);
    });

    updatePolygonFromPoints(points);
  }

  function startEditingExistingArea(area) {
    if (!map.value || !area) return;
    const normalized = normalizeAreaData(area);
    if (!normalized) return;

    if (normalized.type === "rectangle" && normalized.points?.length === 4) {
      currentTool.value = "rectangle";
      enterRectangleEdit(normalized.points.map((p) => ({ lng: p.lng, lat: p.lat })));
      return;
    }

    if (normalized.type === "circle" && normalized.center && normalized.radius) {
      currentTool.value = "circle";
      enterCircleEdit(
        { lng: normalized.center.lng, lat: normalized.center.lat },
        normalized.radius,
      );
      return;
    }

    if (isValidRing(normalized.ring)) {
      const points = [];
      for (let i = 0; i < normalized.ring.length - 2; i += 2) {
        points.push({ lng: normalized.ring[i], lat: normalized.ring[i + 1] });
      }
      if (points.length >= 3) {
        currentTool.value = "polygon";
        enterPolygonEdit(points);
      } else {
        showArea(normalized);
      }
    }
  }

  function closeDrawTool() {
    removePolygonClickListener();
    clearDrawDraftOverlays();
    polygonPointCount.value = 0;
    draftMarkerDragging = false;
    draftMarkerDragSuppressUntil = 0;
    if (currentDrawTool) {
      try { currentDrawTool.close(); } catch (_) { /* ignore */ }
      currentDrawTool = null;
    }
  }

  function updatePolygonDraftGeometry(points) {
    if (!Array.isArray(points) || !points.length) {
      if (drawPolyline) {
        try { map.value?.removeOverLay?.(drawPolyline); } catch (_) { /* ignore */ }
        drawPolyline = null;
      }
      if (drawPolygon) {
        try { map.value?.removeOverLay?.(drawPolygon); } catch (_) { /* ignore */ }
        drawPolygon = null;
      }
      drawnResult.value = null;
      return;
    }

    const lngLats = points.map((pt) => new T.LngLat(pt.lng, pt.lat));

    if (points.length >= 2) {
      if (!drawPolyline) {
        drawPolyline = new T.Polyline(lngLats, {
          color: DRAW_STYLE.color,
          weight: 2,
          opacity: 0.85,
        });
        map.value.addOverLay(drawPolyline);
      } else {
        drawPolyline.setLngLats(lngLats);
      }
    } else if (drawPolyline) {
      try { map.value?.removeOverLay?.(drawPolyline); } catch (_) { /* ignore */ }
      drawPolyline = null;
    }

    if (points.length >= 3) {
      if (!drawPolygon) {
        drawPolygon = new T.Polygon(lngLats, AREA_STYLE);
        map.value.addOverLay(drawPolygon);
      } else {
        drawPolygon.setLngLats(lngLats);
      }

      const ring = [];
      points.forEach((p) => ring.push(p.lng, p.lat));
      ring.push(points[0].lng, points[0].lat);
      drawnResult.value = {
        type: "polygon",
        points: points.map((p) => ({ ...p })),
        ring,
        center: {
          lng: points.reduce((sum, p) => sum + p.lng, 0) / points.length,
          lat: points.reduce((sum, p) => sum + p.lat, 0) / points.length,
        },
      };
    } else {
      if (drawPolygon) {
        try { map.value?.removeOverLay?.(drawPolygon); } catch (_) { /* ignore */ }
        drawPolygon = null;
      }
      drawnResult.value = null;
    }
  }

  function renderPolygonDraft(points) {
    clearDrawDraftOverlays();
    if (!Array.isArray(points) || !points.length) return;

    const handleIcon = makeHandleIcon("#4965c9");
    points.forEach((pt, idx) => {
      const marker = new T.Marker(new T.LngLat(pt.lng, pt.lat), {
        icon: handleIcon,
        draggable: true,
      });
      marker.addEventListener("dragstart", () => {
        draftMarkerDragging = true;
      });
      marker.addEventListener("drag", (e) => {
        points[idx] = { lng: e.lnglat.lng, lat: e.lnglat.lat };
        updatePolygonDraftGeometry(points);
      });
      marker.addEventListener("dragend", (e) => {
        points[idx] = { lng: e.lnglat.lng, lat: e.lnglat.lat };
        updatePolygonDraftGeometry(points);
        draftMarkerDragging = false;
        // 抑制拖拽结束后紧跟的地图 click，避免误新增点
        draftMarkerDragSuppressUntil = Date.now() + 250;
      });
      map.value.addOverLay(marker);
      drawPointMarkers.push(marker);
    });

    updatePolygonDraftGeometry(points);
  }

  function startDrawing(mode) {
    if (!map.value) return;

    closeDrawTool();
    clearEditOverlays();
    clearDisplayOverlay();
    try { map.value.clearOverLays(); } catch (_) { /* ignore */ }
    drawnResult.value = null;

    if (mode === "rectangle") {
      const tool = new T.RectangleTool(map.value, DRAW_STYLE);
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

        try { map.value.clearOverLays(); } catch (_) { /* ignore */ }
        enterRectangleEdit(points);
      });
      currentDrawTool = tool;
      return;
    }

    if (mode === "circle") {
      const tool = new T.CircleTool(map.value, DRAW_STYLE);
      tool.open();
      tool.addEventListener("drawend", (e) => {
        if (!e.currentCenter || !e.currentRadius) return;
        tool.close();
        currentDrawTool = null;

        const center = { lng: e.currentCenter.lng, lat: e.currentCenter.lat };
        const radius = e.currentRadius;
        try { map.value.clearOverLays(); } catch (_) { /* ignore */ }
        enterCircleEdit(center, radius);
      });
      currentDrawTool = tool;
      return;
    }

    if (mode === "polygon") {
      const points = [];
      isPolygonDrawing.value = true;
      polygonPointCount.value = 0;
      drawnResult.value = null;

      polygonClickHandler = (e) => {
        if (draftMarkerDragging || Date.now() < draftMarkerDragSuppressUntil) return;
        const lng = Number(e?.lnglat?.lng);
        const lat = Number(e?.lnglat?.lat);
        if (!Number.isFinite(lng) || !Number.isFinite(lat)) return;

        points.push({ lng, lat });
        polygonPointCount.value = points.length;
        renderPolygonDraft(points);
      };

      map.value.addEventListener("click", polygonClickHandler);
    }
  }

  function setTool(mode) {
    if (currentTool.value === mode && drawnResult.value) {
      startDrawing(mode);
      return;
    }
    currentTool.value = mode;
    startDrawing(mode);
  }

  function clearArea() {
    closeDrawTool();
    clearEditOverlays();
    clearDisplayOverlay();
    try { map.value?.clearOverLays?.(); } catch (_) { /* ignore */ }
    drawnResult.value = null;
    polygonPointCount.value = 0;

    if (currentTool.value) {
      startDrawing(currentTool.value);
    }
  }

  async function initMap(containerId, { center, zoom = 14 } = {}) {
    mapContainerId = containerId;
    loading.value = true;
    await loadTiandituAPI();

    const container = document.getElementById(mapContainerId);
    if (!container) {
      loading.value = false;
      return null;
    }

    const mapCenter = center || MAP_CONFIG.defaultCenter;
    const mapInstance = new T.Map(mapContainerId);
    mapInstance.centerAndZoom(new T.LngLat(mapCenter.lng, mapCenter.lat), zoom);
    map.value = mapInstance;
    loading.value = false;
    return mapInstance;
  }

  function setupMode(mode, area) {
    if (!map.value) return;

    closeDrawTool();
    clearEditOverlays();
    clearDisplayOverlay();
    try { map.value.clearOverLays(); } catch (_) { /* ignore */ }

    if (mode === "view") {
      showArea(area, { fit: true });
      return;
    }

    const normalized = normalizeAreaData(area);
    if (normalized) {
      startEditingExistingArea(normalized);
      return;
    }

    currentTool.value = "rectangle";
    startDrawing("rectangle");
  }

  function cleanup() {
    closeDrawTool();
    clearEditOverlays();
    clearDisplayOverlay();
    if (map.value) {
      try { map.value.clearOverLays(); } catch (_) { /* ignore */ }
      try { map.value.destroy(); } catch (_) { /* ignore */ }
      map.value = null;
    }
    if (mapContainerId) {
      const el = document.getElementById(mapContainerId);
      if (el) el.innerHTML = "";
    }
    drawnResult.value = null;
    polygonPointCount.value = 0;
    isPolygonDrawing.value = false;
    loading.value = true;
  }

  function createContainerId(prefix = "tianditu-area-map") {
    return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
  }

  return {
    loading,
    currentTool,
    drawnResult,
    map,
    initMap,
    setupMode,
    setTool,
    showArea,
    fitMapToArea,
    startEditingExistingArea,
    clearArea,
    polygonPointCount,
    isPolygonDrawing,
    cleanup,
    createContainerId,
    getArea: () => (drawnResult.value ? { ...drawnResult.value } : null),
  };
}
