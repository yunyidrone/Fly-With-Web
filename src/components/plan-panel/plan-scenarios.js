/** 场景 Tab → 接口 type：1山林救援 2水上观察 3重点安保 */
export const TAB_TO_API_TYPE = { mountain: 1, water: 2, security: 3 };

export const PLAN_SCENARIOS = [
  { key: "mountain", title: "山林救援", icon: "ri-plant-line" },
  { key: "water", title: "水上观察", icon: "ri-water-flash-line" },
  { key: "security", title: "重点安保", icon: "ri-shield-line" },
];

export const PLAN_EDITOR_TITLE_ID = "plan-editor-dialog-title";

const PLAN_PICKER_Z_INDEX = 3600;

export const planPickerPopperOptions = {
  modifiers: [
    {
      name: "computeStyles",
      options: { gpuAcceleration: false },
    },
    {
      name: "zIndex",
      enabled: true,
      phase: "write",
      fn: ({ state }) => {
        state.styles.popper.zIndex = String(PLAN_PICKER_Z_INDEX);
      },
    },
  ],
};
