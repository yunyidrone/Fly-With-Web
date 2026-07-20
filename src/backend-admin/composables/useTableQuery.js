import { ref, reactive } from "vue";
import { unwrapApiList } from "@backend/utils/request.js";

/**
 * 表格分页查询通用逻辑
 * @param {(params: object) => Promise<any>} fetcher
 * @param {object} [defaultQuery]
 */
export function useTableQuery(fetcher, defaultQuery = {}) {
  const loading = ref(false);
  const records = ref([]);
  const total = ref(0);
  const query = reactive({
    current: 1,
    pageSize: 10,
    ...defaultQuery,
  });

  let loadSeq = 0;

  async function load() {
    const seq = ++loadSeq;
    loading.value = true;
    try {
      const data = await fetcher({ ...query });
      if (seq !== loadSeq) return;
      records.value = unwrapApiList(data);
      total.value = Number(data?.total ?? records.value.length) || 0;
    } finally {
      if (seq === loadSeq) {
        loading.value = false;
      }
    }
  }

  function search() {
    query.current = 1;
    return load();
  }

  function reset(resetFields = {}) {
    Object.assign(query, { current: 1, pageSize: 10, ...resetFields });
    return load();
  }

  function onPageChange(page) {
    if (query.current === page) return;
    query.current = page;
    return load();
  }

  function onSizeChange(size) {
    if (query.pageSize === size && query.current === 1) return;
    query.pageSize = size;
    query.current = 1;
    return load();
  }

  return {
    loading,
    records,
    total,
    query,
    load,
    search,
    reset,
    onPageChange,
    onSizeChange,
  };
}