import { ref } from "vue";
import { fetchOrgSetList } from "@/api/auth.js";
import {
  findFirstLeafOrgId,
  findOrgInTree,
  mapOrgSetCascaderOptions,
  mapOrgSetOptions,
} from "@backend/utils/org-set.js";
import { DEFAULT_REGION, DEFAULT_REGION_LABEL } from "@backend/config/constants.js";

const defaultCascaderOptions = [{ id: DEFAULT_REGION, name: DEFAULT_REGION_LABEL }];
const defaultOptions = [{ label: DEFAULT_REGION_LABEL, value: DEFAULT_REGION }];

function flattenOrgSetSelectOptions(nodes, result = []) {
  for (const node of nodes || []) {
    if (node?.id != null) {
      result.push({ label: node.name, value: node.id });
    }
    if (node?.children?.length) {
      flattenOrgSetSelectOptions(node.children, result);
    }
  }
  return result;
}

/**
 * 单位集级联选项
 * @param {{ fallbackDefault?: boolean }} [options]
 */
export function useOrgSetOptions(options = {}) {
  const { fallbackDefault = true } = options;
  const loading = ref(false);
  const orgSetCascaderOptions = ref(fallbackDefault ? [...defaultCascaderOptions] : []);
  const orgSetOptions = ref(fallbackDefault ? [...defaultOptions] : []);

  async function loadOrgSetOptions() {
    loading.value = true;
    try {
      const data = await fetchOrgSetList();
      const nextCascader = mapOrgSetCascaderOptions(data);
      if (nextCascader.length) {
        orgSetCascaderOptions.value = nextCascader;
        orgSetOptions.value = flattenOrgSetSelectOptions(nextCascader);
        return;
      }

      const nextFlat = mapOrgSetOptions(data);
      if (nextFlat.length) {
        orgSetOptions.value = nextFlat;
        orgSetCascaderOptions.value = nextFlat.map(({ label, value }) => ({
          id: value,
          name: label,
        }));
      }
    } catch {
      if (!fallbackDefault) {
        orgSetCascaderOptions.value = [];
        orgSetOptions.value = [];
      }
    } finally {
      loading.value = false;
    }
  }

  function syncRegionValue(regionRef) {
    if (!orgSetCascaderOptions.value.length) return;
    if (!findOrgInTree(orgSetCascaderOptions.value, regionRef.value)) {
      regionRef.value =
        findFirstLeafOrgId(orgSetCascaderOptions.value) ??
        orgSetCascaderOptions.value[0]?.id ??
        null;
    }
  }

  return {
    loading,
    orgSetCascaderOptions,
    orgSetOptions,
    loadOrgSetOptions,
    syncRegionValue,
  };
}
