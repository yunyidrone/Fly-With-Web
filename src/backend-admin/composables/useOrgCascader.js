import { computed, ref } from "vue";
import { fetchOrgTree } from "@backend/api/org.js";
import { useCurrentOrgSet } from "@backend/composables/useCurrentOrgSet.js";
import {
  buildOrgCascaderOptions,
  collectLeafOrgIds,
  findFirstLeafOrgId,
  findOrgInTree,
  prependOrgNodeToTree,
} from "@backend/utils/org-set.js";

/**
 * 单位级联筛选
 * @param {{ autoSelectFirst?: boolean, autoSelectUserOrg?: boolean }} [options]
 */
export function useOrgCascader(options = {}) {
  const { autoSelectFirst = true, autoSelectUserOrg = true } = options;
  const { id: orgSetId, initOrgSet } = useCurrentOrgSet();
  const orgTreeOptions = ref([]);
  const selectedOrgId = ref(null);
  const loading = ref(false);

  const cascaderDisabled = computed(() => collectLeafOrgIds(orgTreeOptions.value).length <= 1);

  async function loadOrgTreeOptions() {
    loading.value = true;
    try {
      const tree = (await fetchOrgTree(orgSetId.value)) || [];
      orgTreeOptions.value = buildOrgCascaderOptions(tree);
    } catch {
      orgTreeOptions.value = [];
    } finally {
      loading.value = false;
    }
  }

  function ensureUserOrg(authStore) {
    if (authStore.orgId == null) return;
    orgTreeOptions.value = prependOrgNodeToTree(orgTreeOptions.value, {
      id: authStore.orgId,
      name: authStore.user?.orgName || "当前单位",
    });
  }

  function initSelection(authStore, explicitOrgId) {
    if (autoSelectUserOrg && !authStore.isSuperAdmin && authStore.orgId != null) {
      selectedOrgId.value = authStore.orgId;
      return;
    }

    if (explicitOrgId != null && explicitOrgId !== "") {
      selectedOrgId.value = explicitOrgId;
      return;
    }

    if (!autoSelectFirst || selectedOrgId.value != null) return;

    selectedOrgId.value =
      findFirstLeafOrgId(orgTreeOptions.value) ??
      orgTreeOptions.value[0]?.id ??
      null;
  }

  async function initOrgCascader(authStore, explicitOrgId) {
    await initOrgSet();
    await loadOrgTreeOptions();
    ensureUserOrg(authStore);
    initSelection(authStore, explicitOrgId);
  }

  function syncSelectedOrgId(orgId) {
    if (orgId == null || orgId === "") {
      selectedOrgId.value = null;
      return;
    }
    if (findOrgInTree(orgTreeOptions.value, orgId)) {
      selectedOrgId.value = orgId;
    }
  }

  return {
    orgSetId,
    orgTreeOptions,
    selectedOrgId,
    loading,
    cascaderDisabled,
    loadOrgTreeOptions,
    initOrgCascader,
    initSelection,
    syncSelectedOrgId,
  };
}
