/**
 * ============================================
 * 【本地模拟】执行任务记录 Mock 数据
 *
 * 用途：历史记录面板 UI 联调；后端无数据时仍可预览表格与展开行。
 * 说明：字段命名与飞行计划 / 执行记录接口保持一致（type、name、placeNames、
 *       executeDate、resourceConfig、algorithmIds、eventList 等）。
 *       AI 事件图片使用 src/assets 内本地图（imageUrl / imgUrl），可点预览。
 *
 * 开关：开发环境默认开启；生产构建不会打包启用逻辑（见 isPlanHistoryMockEnabled）。
 *       可在 .env.development 设置 VITE_PLAN_HISTORY_MOCK=false 关闭。
 *
 * 注意：模拟记录的「删除」「快捷创建」仅本地处理或提示，不会调用真实接口。
 * ============================================
 */

import { formatDateYmd, getTodayYmd } from "@/utils/plan-history.js";
import mockImgSnapshot from "@/assets/images/screenshot.png";
import mockImgMapA from "@/assets/images/img-map-default.png";
import mockImgMapB from "@/assets/images/img-map-default2.png";
import mockImgAlarm from "@/assets/images/yjzh.png";
import mockImgPatrol from "@/assets/images/yjfc.png";
import mockImgScene from "@/assets/images/cjbf.png";

/** 面板顶部提示文案 */
export const PLAN_HISTORY_MOCK_REMARK =
  "【本地模拟数据】以下记录为前端造数，非后端返回；字段与飞行计划一致，仅供 UI 联调。展开行内图片为本地素材模拟 AI 抓拍，可点击预览。删除/快捷创建对模拟行仅做本地提示。";

/** 【模拟图】与接口字段 imageUrl / imgUrl / pictureUrl 等对应 */
const MOCK_AI_EVENT_IMAGES = {
  "mock-ev-001": { imageUrl: mockImgSnapshot, imgUrl: mockImgSnapshot },
  "mock-ev-002": { imageUrl: mockImgMapA },
  "mock-ev-003": { imageUrl: mockImgAlarm, pictureUrl: mockImgAlarm },
  "mock-ev-004": { imageUrl: mockImgMapB },
  "mock-ev-005a": { imageUrl: mockImgSnapshot },
  "mock-ev-005b": { imageUrl: mockImgScene },
  "mock-ev-005c": { imageUrl: mockImgPatrol },
};

/**
 * @param {Record<string, any>} event
 */
function withMockEventImage(event) {
  const extra = MOCK_AI_EVENT_IMAGES[event?.id];
  if (!extra) return event;
  return { ...event, ...extra, _mockImage: true };
}

/** @param {string} id */
export function isMockHistoryRecordId(id) {
  return String(id ?? "").startsWith("mock-rec-");
}

/** 开发环境是否注入模拟记录 */
export function isPlanHistoryMockEnabled() {
  if (import.meta.env.PROD) return false;
  if (import.meta.env.VITE_PLAN_HISTORY_MOCK === "false") return false;
  return import.meta.env.DEV || import.meta.env.VITE_PLAN_HISTORY_MOCK === "true";
}

/**
 * 按查询日期返回原始接口形态的 mock 列表（再经 normalizeHistoryRecord 规范化）
 * @param {string} startDate YYYY-MM-DD
 */
export function getMockPlanHistoryRawList(startDate) {
  const query = String(startDate || "").slice(0, 10);
  if (!query) return [];

  const today = getTodayYmd();
  const yesterday = formatDateYmd(new Date(Date.now() - 86400000));

  /** @type {Record<string, any>[]} */
  const all = [
    {
      id: "mock-rec-001",
      _mock: true,
      _mockRemark: "模拟·重点安保已完成；含 2 条 AI 预警，可展开查看",
      planId: "plan-mock-1001",
      type: 3,
      name: "重点区域巡逻",
      placeNames: "东门岗、会展中心北侧",
      executeDate: today,
      executeStartTime: "08:30:00",
      executeEndTime: "11:15:00",
      startType: 2,
      algorithmIds: "algo-vision-01,algo-thermal-02",
      resourceConfig: [
        { resourceTypeName: "无人机", resourceCount: 2 },
        { resourceTypeName: "无人犬", resourceCount: 1 },
      ],
      aiEventCount: 2,
      eventList: [
        withMockEventImage({
          id: "mock-ev-001",
          warnType: "人员聚集",
          eventTime: `${today} 09:12:08`,
          recognizeType: "视觉识别",
          recognizeName: "异常聚集",
          longitude: 120.153218,
          latitude: 30.287459,
          deviceName: "无人机-01",
        }),
        withMockEventImage({
          id: "mock-ev-002",
          warnType: "车辆违停",
          eventTime: `${today} 10:05:33`,
          recognizeType: "视觉识别",
          recognizeName: "机动车",
          longitude: 120.154102,
          latitude: 30.286881,
          deviceName: "无人机-02",
        }),
      ],
    },
    {
      id: "mock-rec-002",
      _mock: true,
      _mockRemark: "模拟·水上观察；无 AI 事件，测试展开空态",
      planId: "plan-mock-1002",
      type: 2,
      name: "河道日常巡查",
      placeNames: "西侧河道、桥南水面",
      executeDate: today,
      executeStartTime: "14:00:00",
      executeEndTime: "16:30:00",
      startType: 2,
      algorithmIds: "algo-water-01",
      resourceConfig: [
        { resourceTypeName: "无人机", resourceCount: 1 },
        { resourceTypeName: "无人艇", resourceCount: 1 },
      ],
      aiEventCount: 0,
      eventList: [],
    },
    {
      id: "mock-rec-003",
      _mock: true,
      _mockRemark: "模拟·山林救援·紧急启动",
      planId: "plan-mock-1003",
      type: 1,
      name: "山区搜救演练",
      placeNames: "北山森林公园入口",
      executeDate: today,
      executeStartTime: "06:45:00",
      executeEndTime: "09:20:00",
      startType: 1,
      algorithmIds: "algo-vision-01",
      resourceDroneCount: 3,
      resourceDogCount: 2,
      aiEventCount: 1,
      eventList: [
        withMockEventImage({
          id: "mock-ev-003",
          warnType: "烟雾检测",
          eventTime: `${today} 07:18:00`,
          recognizeType: "热成像",
          recognizeName: "烟雾",
          longitude: 120.148002,
          latitude: 30.291205,
          deviceName: "无人机-山地组",
        }),
      ],
    },
    {
      id: "mock-rec-004",
      _mock: true,
      _mockRemark: "模拟·昨日记录；切换日期为昨天可见",
      planId: "plan-mock-1004",
      type: 3,
      name: "夜间联防巡检",
      placeNames: "南侧围墙、仓库区",
      executeDate: yesterday,
      executeStartTime: "20:00:00",
      executeEndTime: "22:45:00",
      startType: 2,
      resourceConfig: [{ resourceTypeName: "无人机", resourceCount: 1 }],
      algorithmIds: "algo-night-01",
      aiEventCount: 1,
      eventList: [
        withMockEventImage({
          id: "mock-ev-004",
          warnType: "越界告警",
          eventTime: `${yesterday} 21:33:17`,
          recognizeType: "电子围栏",
          recognizeName: "人员越界",
          longitude: 120.15188,
          latitude: 30.28802,
          deviceName: "固定哨兵相机-A3",
        }),
      ],
    },
    {
      id: "mock-rec-005",
      _mock: true,
      _mockRemark: "模拟·重点安保·仅日期/时间字段（与计划 schedule 字段重叠）",
      planId: "plan-mock-1005",
      type: 3,
      name: "大型活动保障",
      locationLabel: "主体育场、P2 停车场",
      executeDate: today,
      executeStartTime: "13:00:00",
      executeEndTime: "18:00:00",
      startType: 2,
      resourceConfig: [
        { resourceTypeName: "无人机", resourceCount: 4 },
        { resourceTypeName: "无人犬", resourceCount: 2 },
      ],
      algorithmIds: "algo-crowd-01,algo-plate-02",
      aiEventCount: 3,
      eventCount: 3,
      eventList: [
        withMockEventImage({
          id: "mock-ev-005a",
          warnType: "人群密度",
          eventTime: `${today} 14:22:00`,
          recognizeType: "视觉识别",
          recognizeName: "高密度人群",
          deviceName: "无人机-编队1",
        }),
        withMockEventImage({
          id: "mock-ev-005b",
          warnType: "可疑物品",
          eventTime: `${today} 15:40:11`,
          recognizeType: "视觉识别",
          recognizeName: "遗留物",
          deviceName: "无人机-编队2",
        }),
        withMockEventImage({
          id: "mock-ev-005c",
          warnType: "车牌识别",
          eventTime: `${today} 16:08:55`,
          recognizeType: "OCR",
          recognizeName: "浙A·12345",
          deviceName: "路口相机-B1",
        }),
      ],
    },
  ];

  return all.filter((r) => String(r.executeDate).slice(0, 10) === query);
}

/**
 * 合并接口列表与 mock（mock 在前，同 id 不重复）
 * @param {Record<string, any>[]} apiList
 * @param {string} startDate
 */
export function mergePlanHistoryWithMock(apiList, startDate) {
  if (!isPlanHistoryMockEnabled()) return apiList;
  const mockRaw = getMockPlanHistoryRawList(startDate);
  if (!mockRaw.length) return apiList;

  const seen = new Set(apiList.map((r) => String(r?.id ?? "")));
  const merged = [...apiList];
  for (const raw of mockRaw) {
    const id = String(raw.id);
    if (!seen.has(id)) {
      merged.unshift(raw);
      seen.add(id);
    }
  }
  return merged;
}
