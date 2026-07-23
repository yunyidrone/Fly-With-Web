import { ref } from "vue";
import { DEFAULT_REGION } from "@backend/config/constants.js";
import { useOrgSetOptions } from "@backend/composables/useOrgSetOptions.js";

/**
 * 当前选中的单位集合 id（默认取 setList 第一项）
 */
export function useCurrentOrgSet() {
  const id = ref(DEFAULT_REGION);
  const { loading, orgSetOptions, loadOrgSetOptions, syncRegionValue } = useOrgSetOptions();

  async function initOrgSet() {
    await loadOrgSetOptions();
    syncRegionValue(id);
    return id.value;
  }

  return {
    id,
    orgSetLoading: loading,
    orgSetOptions,
    initOrgSet,
    loadOrgSetOptions,
  };
}
