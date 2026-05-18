/**
 * 统一测试设备种子数据
 * ResourcePanel（左侧面板）和 TiandituMap（地图测试）共用此数据源
 */

export const TEST_POLICE_VEHICLES = [
  {
    id: "POLICE-001",
    name: "椒江-警车01",
    sn: "PV20260101",
    lng: 121.422,
    lat: 28.656,
    alert: "可疑车辆由东向西行驶，车牌浙J·XXXXX",
  },
  {
    id: "POLICE-002",
    name: "黄岩-警车02",
    sn: "PV20260102",
    lng: 121.438,
    lat: 28.648,
    alert: "接到报警，附近有异常聚集，请前往查看",
  },
  {
    id: "POLICE-003",
    name: "路桥-警车03",
    sn: "PV20260103",
    lng: 121.410,
    lat: 28.643,
    alert: "重点区域布控中，注意可疑人员",
  },
];

export const TEST_DRONES = [
  {
    id: "DRONE-001",
    name: "无人机-M300-01",
    sn: "SN20260101",
    lng: 121.425,
    lat: 28.660,
    battery: 85,
    endurance: "2.5h",
  },
  {
    id: "DRONE-002",
    name: "无人机-M300-02",
    sn: "SN20260102",
    lng: 121.440,
    lat: 28.652,
    battery: 72,
    endurance: "2.1h",
  },
  {
    id: "DRONE-003",
    name: "无人机-M300-03",
    sn: "SN20260103",
    lng: 121.414,
    lat: 28.646,
    battery: 60,
    endurance: "1.8h",
  },
];
