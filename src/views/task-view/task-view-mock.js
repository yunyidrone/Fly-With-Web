/**
 * 任务查看页占位数据。
 * 后续接入真实接口时，仅需替换 index.vue 里的数据装配逻辑，各子组件的 props 契约保持不变。
 */

export const TASK_TRIGGER_MODES = [
  { value: "alarm", label: "警情触发" },
  { value: "no-alarm", label: "无警情触发" },
];

export function createMockTaskInfo() {
  return {
    taskId: "BF09673",
    startTime: "2026-4-12 13:32",
    status: "运行中",
    triggerMode: "alarm",
    equipment: "无人机 + 单兵终端",
  };
}

export function createMockTaskCatalog() {
  return [
    { key: "c1", title: "无人机启动", desc: "无人机启动完成", time: "2026-3-12 9:32" },
    { key: "c2", title: "无线警用装备 IoT", desc: "IoT 域已激活", time: "2026-3-12 9:02" },
    { key: "c3", title: "无人机运动", desc: "无人机准备就绪", time: "2026-3-12 9:32" },
    { key: "c4", title: "无人机运动", desc: "无人机起飞", time: "2026-3-12 9:32" },
    { key: "c5", title: "无人机拍照", desc: "无人机开始拍照", time: "2026-3-12 9:32" },
    { key: "c6", title: "无人机运动", desc: "无人机图传回传成功", time: "2026-3-12 9:32" },
    { key: "c7", title: "无人机运动", desc: "无人机悬停巡查", time: "2026-3-12 9:52" },
    { key: "c8", title: "无人机拍照", desc: "无人机抓拍上报", time: "2026-3-12 9:52" },
    { key: "c9", title: "无人机返航", desc: "无人机开始返航", time: "2026-3-12 9:31" },
    { key: "c10", title: "无人机运动", desc: "无人机降落停机", time: "2026-3-12 9:32" },
    { key: "c11", title: "ID:BF09903I", desc: "伴飞任务创建", time: "2026-3-12 9:32" },
    { key: "c12", title: "警情结束", desc: "任务归档", time: "2026-3-12 9:32" },
  ];
}

export function createMockDevice() {
  return {
    name: "头盔无人机设备",
    model: "机型2",
    batteryLevel: 44,
    signalQuality: 45,
    sn: "324567890",
    id: "76543210",
    lng: 121.54343,
    lat: 28.589061,
    height: null,
    head: null,
    pitch: null,
    roll: null,
    targetType: "警员",
    locationNo: "2345678904567890",
  };
}

export function createMockVideo() {
  return {
    title: "指挥为无人机视角",
    poster: "",
    src: "",
    currentTime: 75,
    duration: 150,
  };
}

export function createMockAiEvents() {
  return [
    {
      key: "ai1",
      type: "人脸预警",
      time: "2026-6-12 19:31:45",
      image: "",
      personCount: 1,
      accuracy: "已确定",
    },
    {
      key: "ai2",
      type: "人体预警",
      time: "2026-6-12 19:30:12",
      image: "",
      personCount: 2,
      accuracy: "疑似",
    },
  ];
}
