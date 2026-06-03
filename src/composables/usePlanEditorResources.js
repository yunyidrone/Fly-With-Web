import { ref, computed } from "vue";
import { AccompanyingFlyService } from "@/api";
import { unwrapApiList } from "@/utils/request.js";

const DEFAULT_RESOURCE_ROWS = [
  { key: "drone", label: "无人机", defaultCount: undefined },
  { key: "dog", label: "无人犬", defaultCount: undefined },
  { key: "boat", label: "无人艇", defaultCount: undefined },
];

function parseApiSourceDefaultCount(rawValue) {
  if (rawValue === undefined || rawValue === null || rawValue === "") return null;
  const s = String(rawValue).trim();
  if (!/^-?\d+$/.test(s)) return null;
  return Math.max(0, Number(s));
}

function pickLabelFromSourceItem(raw) {
  const v = raw?.value != null ? String(raw.value).trim() : "";
  if (v) return v;
  const k = String(raw?.key ?? "").trim();
  return k || String(raw?.id ?? "").trim() || "资源";
}

function isAccompanyResourceSourceRow(raw) {
  const t = raw?.type;
  if (t === undefined || t === null || t === "") return true;
  return Number(t) === 1;
}

function buildResourceRowsFromSourceList(list) {
  const sorted = [...list].sort((a, b) => (Number(a?.sort) || 0) - (Number(b?.sort) || 0));
  const seen = new Set();
  const rows = [];
  for (const raw of sorted) {
    if (!isAccompanyResourceSourceRow(raw)) continue;
    const key = String(raw?.key ?? "").trim();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    const label = pickLabelFromSourceItem(raw) || key;
    const def = parseApiSourceDefaultCount(raw?.value);
    const sortN = Number(raw?.sort) || 0;
    const sourceId = raw?.id != null && raw?.id !== "" ? String(raw.id) : "";
    rows.push({
      key,
      label,
      ...(def !== null ? { defaultCount: def } : {}),
      sort: sortN,
      ...(sourceId ? { sourceId } : {}),
    });
  }
  return rows.sort((a, b) => a.sort - b.sort).map(({ sort: _, ...rest }) => rest);
}

export function usePlanEditorResources() {
  const resourceRowsFromApi = ref(null);

  const resourceRowsBaseline = computed(() =>
    resourceRowsFromApi.value?.length ? resourceRowsFromApi.value : DEFAULT_RESOURCE_ROWS,
  );

  async function loadResourceSourceDefs() {
    try {
      const data = await AccompanyingFlyService.getConfigSource({ type: 1 }, { silent: true });
      const list = unwrapApiList(data);
      const rows = buildResourceRowsFromSourceList(list);
      resourceRowsFromApi.value = rows.length ? rows : null;
    } catch {
      resourceRowsFromApi.value = null;
    }
  }

  return { resourceRowsBaseline, loadResourceSourceDefs };
}
