import { computed, ref } from "vue";
import { fetchOrgList } from "@backend/api/org.js";
import {
  buildOrgCascaderOptions,
  findFirstLeafOrgId,
  findOrgInTree,
  prependOrgNodeToTree,
} from "@backend/utils/org-set.js";

/**
 * 单位级联筛选
 * @param {{ autoSelectFirst?: boolean }} [options]
 */
export function useOrgCascader(options = {}) {
  const { autoSelectFirst = true } = options;
  const orgTreeOptions = ref([]);
  const selectedOrgId = ref(null);
  const loading = ref(false);

  const orgSetId = computed(
    () => orgTreeOptions.value[0]?.id ?? orgTreeOptions.value[0]?.rootOrgId ?? null,
  );

  async function loadOrgTreeOptions() {
    loading.value = true;
    try {
      const tree = (await fetchOrgList()) || [];
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
    if (explicitOrgId != null && explicitOrgId !== "") {
      selectedOrgId.value = explicitOrgId;
      return;
    }

    const userOrgId = authStore.orgId;
    if (userOrgId != null && userOrgId !== "") {
      selectedOrgId.value = userOrgId;
      return;
    }

    if (!autoSelectFirst || selectedOrgId.value != null) return;

    selectedOrgId.value =
      findFirstLeafOrgId(orgTreeOptions.value) ??
      orgTreeOptions.value[0]?.id ??
      null;
  }

  async function initOrgCascader(authStore, explicitOrgId) {
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
    loadOrgTreeOptions,
    initOrgCascader,
    initSelection,
    syncSelectedOrgId,
  };
}
