/** 设置抽屉 — 低电量阈值默认型号（接口无数据时使用） */
export const DEFAULT_BATTERY_THRESHOLDS = {
  drone: [
    { modelId: "dock2", modelName: "机场2", threshold: 40 },
    { modelId: "dock3", modelName: "机场3", threshold: 40 },
    { modelId: "m4t", modelName: "M4T", threshold: 40 },
  ],
  boat: [
    // { modelId: "boat-a", modelName: "型号A", threshold: 40 },
    // { modelId: "boat-b", modelName: "型号B", threshold: 40 },
  ],
  dog: [
    // { modelId: "dog-a", modelName: "型号A", threshold: 40 },
    // { modelId: "dog-b", modelName: "型号B", threshold: 40 },
  ],
};

/** 设备类型 Tab 配置 */
export const SETTINGS_DEVICE_TABS = [
  { key: "drone", label: "无人机", nameLabel: "无人机名称" },
  { key: "boat", label: "无人艇", nameLabel: "无人艇名称" },
  { key: "dog", label: "无人犬", nameLabel: "无人犬名称" },
];

export const BATTERY_THRESHOLD_MIN = 10;
export const BATTERY_THRESHOLD_MAX = 90;

export const BATTERY_THRESHOLD_TIP =
  "设备电量下降至当前阈值或不满大于此阈值时不参与无人机伴飞任务";
