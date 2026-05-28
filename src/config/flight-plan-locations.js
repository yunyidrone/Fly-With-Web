/**
 * 飞行计划 — 地点树（支持多级 children）
 * 仅「叶子节点」配置 ring 时可勾选并上图
 * ring: 闭合多边形 [lng, lat, lng, lat, ...]（WGS84）
 */

// const R = (pairs) => pairs.flat();

// const RING_HUANGYAN_GOV = R([
//   [121.418, 28.6565],
//   [121.432, 28.6565],
//   [121.432, 28.6495],
//   [121.418, 28.6495],
// ]);

// const RING_JIAOJIANG_GOV = R([
//   [121.402, 28.672],
//   [121.418, 28.672],
//   [121.418, 28.664],
//   [121.402, 28.664],
// ]);

// const RING_CULTURE_PLAZA = R([
//   [121.424, 28.658],
//   [121.43, 28.658],
//   [121.4285, 28.652],
//   [121.422, 28.653],
// ]);

// const RING_STADIUM = R([
//   [121.438, 28.646],
//   [121.446, 28.646],
//   [121.446, 28.64],
//   [121.438, 28.64],
// ]);
// const RING_HUANGYAN_GOV = {
//   type: 'rectangle',
//   points: [{lng: 121.418, lat: 28.6565}, {lng: 121.432, lat: 28.6565}, {lng: 121.432, lat: 28.6495}, {lng: 121.418, lat: 28.6495}]
// }
// const RING_JIAOJIANG_GOV = {
//   type: 'rectangle',
//   points: [{lng: 121.402, lat: 28.672}, {lng: 121.418, lat: 28.672}, {lng: 121.418, lat: 28.664}, {lng: 121.402, lat: 28.664}]
// }
// const RING_CULTURE_PLAZA = {
//   type: 'rectangle',
//   points: [{lng: 121.424, lat: 28.658}, {lng: 121.43, lat: 28.658}, {lng: 121.4285, lat: 28.652}, {lng: 121.422, lat: 28.653}]
// }
// const RING_STADIUM = {
//   type: 'rectangle',
//   points: [{lng: 121.438, lat: 28.646}, {lng: 121.446, lat: 28.646}, {lng: 121.446, lat: 28.64}, {lng: 121.438, lat: 28.64}]
// }
// export const FLIGHT_LOCATION_CASCADER_OPTIONS = [
//   {
//     value: "gov",
//     label: "政府区域",
//     children: [
//       { value: "gov_huangyan", label: "黄岩区政府", regionData: RING_HUANGYAN_GOV },
//       { value: "gov_jiaojiang", label: "椒江行政中心", regionData: RING_JIAOJIANG_GOV },
//     ],
//   },
//   {
//     value: "culture",
//     label: "文娱场所",
//     children: [
//       { value: "culture_plaza", label: "市民文化广场", regionData: RING_CULTURE_PLAZA },
//       { value: "culture_stadium", label: "区体育馆", regionData: RING_STADIUM },
//     ],
//   },
// ];
const radius = 200; // 半径（米）
export const FLIGHT_LOCATION_CASCADER_OPTIONS = [{
  value: "xiaoxue",
  label: "小学",
  children: [{
    id: 1,
    value: "新前小学",
    label: "新前小学",
    address: "浙江省台州市黄岩区拱新大道999号",
    type: "round",
    radius: radius,
    lng: 121.196410,
    lat: 28.658590
  }, {
    id: 8,
    value: "台州市黄岩区九峰学校小学部",
    label: "台州市黄岩区九峰学校小学部",
    address: "浙江省台州市黄岩区康复路26号",
    type: "round",
    radius: radius,
    lng: 121.27364,
    lat:  28.679098
  }, {
    id: 9,
    value: "台州市黄岩区高桥中心小学",
    label: "台州市黄岩区高桥中心小学",
    address: "浙江省台州市黄岩区前店村高丰中路116号正北方向130米",
    type: "round",
    radius: radius,
    lng: 121.229297,
    lat: 28.590029
  }, {
    id: 10,
    value: "沙埠镇中心小学",
    label: "沙埠镇中心小学",
    address: "浙江省台州市黄岩区沙埠镇下街沙川路58号",
    type: "round",
    radius: radius,
    lng: 121.198003,
    lat: 28.566425
  }, {
    id: 11,
    value: "院桥中心小学",
    label: "院桥中心小学",
    address: "浙江省台州市黄岩区人民路与十路线交叉口东南方向194米左右",
    type: "round",
    radius: radius,
    lng: 121.257471,
    lat: 28.552956
  }, {
    id: 12,
    value: "北洋镇中心小学",
    label: "北洋镇中心小学",
    address: "浙江省台州市黄岩区北洋镇昌兴大道38号",
    type: "round",
    radius: radius,
    lng: 121.110648,
    lat: 28.615346
  }, {
    id: 13,
    value: "头陀镇中心小学",
    label: "头陀镇中心小学",
    address: "浙江省台州市黄岩区头陀镇讯发路162号向日葵优学教育",
    type: "round",
    radius: radius,
    lng: 121.141598,
    lat: 28.634004
  }, {
    id: 14,
    value: "黄岩区澄江街道中心小学",
    label: "黄岩区澄江街道中心小学",
    address: "浙江省台州市黄岩区澄江街道新江路62号",
    type: "round",
    radius: radius,
    lng: 121.199034,
    lat: 28.632512
  }, {
    id: 15,
    value: "王林小学",
    label: "王林小学",
    address: "浙江省台州市黄岩区北城街道黄岩高铁新区站西大道668号",
    type: "round",
    radius: radius,
    lng: 121.283240,
    lat: 28.680741
  }, {
    id: 16,
    value: "江口街道第二小学",
    label: "江口街道第二小学",
    address: "浙江省台州市黄岩区江口街道梅海路与梅青街交叉路口往东南约100米",
    type: "round",
    radius: radius,
    lng: 121.337371,
    lat: 28.677002
  }, {
    id: 17,
    value: "黄岩北城街道中心小学",
    label: "黄岩北城街道中心小学",
    address: "浙江省台州市黄岩区北城街道锦川社区锦川路6号(北城工业区)",
    type: "round",
    radius: radius,
    lng: 121.232613,
    lat: 28.665810
  }, {
    id: 18,
    value: "南城街道中心小学",
    label: "南城街道中心小学",
    address: "浙江省台州市黄岩区南城街道十院路90号附近",
    type: "round",
    radius: radius,
    lng: 121.261339,
    lat: 28.602538
  }, {
    id: 19,
    value: "黄岩区樊川书院教育集团",
    label: "黄岩区樊川书院教育集团",
    address: "浙江省台州市黄岩区仪凤街与沿河路交叉口西北方向167米左右",
    type: "round",
    radius: radius,
    lng: 121.246548,
    lat: 28.622428
  }, {
    id: 20,
    value: "黄岩区西江小学教育集团(耘轩校区)",
    label: "黄岩区西江小学教育集团(耘轩校区)",
    address: "浙江省台州市黄岩区西城街道仰山路5号(黄岩中学东侧约50米)",
    type: "round",
    radius: radius,
    lng: 121.231200,
    lat: 28.648230
  }, {
    id: 21,
    value: "黄岩区锦江小学(育才校区)",
    label: "黄岩区锦江小学(育才校区)",
    address: "浙江省台州市黄岩区环城西路南苑新村12号",
    type: "round",
    radius: radius,
    lng: 121.255373,
    lat: 28.642325
  }, {
    id: 33,
    value: "黄岩实验小学(九峰路)",
    label: "黄岩实验小学(九峰路)",
    address: "浙江省台州市黄岩区桔香楼",
    type: "round",
    radius: radius,
    lng: 121.270048,
    lat: 28.647987
  }]
},{
  value: "zhongxue",
  label: "中学",
  children: [{
    id: 2,
    value: "北京师范大学台州附属高级中学",
    label: "北京师范大学台州附属高级中学",
    address: "浙江省台州市黄岩区江口街道德俭路518号",
    type: "round",
    radius: radius,
    lng: 121.350768,
    lat: 28.671026
  }, {
    id: 3,
    value: "浙江黄岩实验中学",
    label: "浙江黄岩实验中学",
    address: "浙江省台州市黄岩区东城街道文盛街50号",
    type: "round",
    radius: radius,
    lng: 121.275091,
    lat: 28.649068
  },{
    id: 5,
    value: "北京师范大学台州实验学校",
    label: "北京师范大学台州实验学校",
    address: "浙江省台州市黄岩区东城街道新洋环路1号",
    type: "round",
    radius: radius,
    lng: 121.274200,
    lat: 28.678590
  },{
    id: 6,
    value: "台州市永宁中学",
    label: "台州市永宁中学",
    address: "浙江省台州市黄岩区院桥镇高洋路39号",
    type: "round",
    radius: radius,
    lng: 121.249755,
    lat: 28.567584
  },{
    id: 7,
    value: "黄岩江口中学",
    label: "黄岩江口中学",
    address: "浙江省台州市黄岩区江口街道下凌村二区88号",
    type: "round",
    radius: radius,
    lng: 121.326932,
    lat: 28.678402
  },{
    id: 22,
    value: "台州市黄岩区新前中学",
    label: "台州市黄岩区新前中学",
    address: "浙江省台州市黄岩区新前街道新前中学路1号",
    type: "round",
    radius: radius,
    lng: 121.211010,
    lat: 28.662317
  },{
    id: 23,
    value: "澄江中学",
    label: "澄江中学",
    address: "浙江省台州市黄岩区澄江街道新江路83-5号",
    type: "round",
    radius: radius,
    lng: 121.201783,
    lat: 28.633482
  },{
    id: 24,
    value: "黄岩北城中学",
    label: "黄岩北城中学",
    address: "浙江省台州市黄岩区北城街道大桥路621号693号",
    type: "round",
    radius: radius,
    lng: 121.248170,
    lat: 28.672637
  },{
    id: 25,
    value: "黄岩区初级中学教育集团成之书院",
    label: "黄岩区初级中学教育集团成之书院",
    address: "浙江省台州市黄岩区西城街道仰山路1号",
    type: "round",
    radius: radius,
    lng: 121.230716,
    lat: 28.648583
  },{
    id: 26,
    value: "浙江黄岩城关中学",
    label: "浙江黄岩城关中学",
    address: "浙江省台州市黄岩区西城街道引泉路1号",
    type: "round",
    radius: radius,
    lng: 121.257719,
    lat: 28.636242
  },{
    id: 27,
    value: "黄岩东浦中学",
    label: "黄岩东浦中学",
    address: "浙江省台州市黄岩区嘉木路与王西路交叉口正南方向156米左右",
    type: "round",
    radius: radius,
    lng: 121.269470,
    lat: 28.663140
  },{
    id: 28,
    value: "浙江黄岩实验中学",
    label: "浙江黄岩实验中学",
    address: "浙江省台州市黄岩区东城街道文盛街50号",
    type: "round",
    radius: radius,
    lng: 121.275300,
    lat: 28.650500
  },{
    id: 30,
    value: "浙江黄岩第二高级中学",
    label: "浙江黄岩第二高级中学",
    address: "浙江省台州市黄岩区横河村88号",
    type: "round",
    radius: radius,
    lng: 121.257204,
    lat: 28.625030
  },{
    id: 31,
    value: "黄岩中学",
    label: "黄岩中学",
    address: "浙江省台州市黄岩区嘉鱼路与庆丰大道交叉口东南方向353米左右",
    type: "round",
    radius: radius,
    lng: 121.228827,
    lat: 28.645443
  },{
    id: 32,
    value: "台州市院桥中学",
    label: "台州市院桥中学",
    address: "浙江省台州市黄岩区院中北路161号",
    type: "round",
    radius: radius,
    lng: 121.251898,
    lat: 28.550129
  }]
},{
  value: "gaoxiao",
  label: "高校",
  children: [{
    id: 4,
    value: "台州科技职业学院",
    label: "台州科技职业学院",
    address: "浙江省台州市黄岩区嘉木路288号台州科技职业学院",
    type: "round",
    radius: radius,
    lng: 121.258250,
    lat: 28.668536
  }, {
    id: 29,
    value: "黄岩第二职业技术学校",
    label: "黄岩第二职业技术学校",
    address: "浙江省台州市黄岩区江口街道山下郎村二区63号",
    type: "round",
    radius: radius,
    lng: 121.306727,
    lat: 28.665095
  }, {
    id: 34,
    value: "黄岩第一职业技术学校",
    label: "黄岩第一职业技术学校",
    address: "浙江省台州市黄岩区东城街道朱砂街151号",
    type: "round",
    radius: radius,
    lng: 121.281135,
    lat: 28.658316
  }]
},{
  value: "jiayouzhan",
  label: "加油站",
  children: [{
    id: 35,
    value: "中国石油黄岩火车站东加油站",
    label: "中国石油黄岩火车站东加油站",
    address: "浙江省台州市黄岩区下林村168号",
    type: "round",
    radius: radius,
    lng: 121.292990,
    lat: 28.684920
  },{
    id: 36,
    value: "中国石化马和头加油站",
    label: "中国石化马和头加油站",
    address: "台州市黄岩区北洋镇百亩垟村过林家桥向东",
    type: "round",
    radius: radius,
    lng: 121.125274,
    lat: 28.611455
  },{
    id: 37,
    value: "中国石油黄岩二环南路加油站",
    label: "中国石油黄岩二环南路加油站",
    address: "浙江省台州市黄岩区二环南路与迎薰路交叉口大润发斜对面",
    type: "round",
    radius: radius,
    lng: 121.253077,
    lat: 28.633745
  },{
    id: 38,
    value: "中国石油台州黄岩罗家汇加油站",
    label: "中国石油台州黄岩罗家汇加油站",
    address: "浙江省台州市黄岩区庆丰大道与黄前线交叉口东南角",
    type: "round",
    radius: radius,
    lng: 121.228070,
    lat: 28.642076
  },{
    id: 39,
    value: "中国石油黄岩鉴湖加油站",
    label: "中国石油黄岩鉴湖加油站",
    address: "浙江省台州市黄岩区梅北新村226号",
    type: "round",
    radius: radius,
    lng: 121.302887,
    lat: 28.565906
  },{
    id: 40,
    value: "中国石化江口加油站",
    label: "中国石化江口加油站",
    address: "浙江省台州市黄岩区马上线与三江路交叉口,路北,上辇工业园区办公室附近",
    type: "round",
    radius: radius,
    lng: 121.334385,
    lat: 28.680666
  },{
    id: 41,
    value: "中国石化院桥供销社加油站",
    label: "中国石化院桥供销社加油站",
    address: "浙江省台州市黄岩区学前街169号(黄岩国兴工艺有限公司南)",
    type: "round",
    radius: radius,
    lng: 121.245960,
    lat: 28.551750
  },{
    id: 42,
    value: "中国石油黄岩兴隆加油站",
    label: "中国石油黄岩兴隆加油站",
    address: "台州市黄岩区前郑路与院店路交汇处",
    type: "round",
    radius: radius,
    lng: 121.254694,
    lat: 28.564847
  },{
    id: 43,
    value: "中国石化黄岩沙埠加油站",
    label: "中国石化黄岩沙埠加油站",
    address: "浙江省台州市黄岩区十沙线沙埠镇柯村路段,路北侧",
    type: "round",
    radius: radius,
    lng: 121.199423,
    lat: 28.571791
  },{
    id: 44,
    value: "中国石化黄岩大州加油站",
    label: "中国石化黄岩大州加油站",
    address: "浙江省台州市黄岩区院桥镇横林村(大环幸福小区西北侧约290米)",
    type: "round",
    radius: radius,
    lng: 121.245868,
    lat: 28.556890
  },{
    id: 45,
    value: "中国石化加油站(院桥站)",
    label: "中国石化加油站(院桥站)",
    address: "浙江省台州市黄岩区院桥镇院店路与爱华路交叉口,路东,院桥派出所附近",
    type: "round",
    radius: radius,
    lng: 121.252874,
    lat: 28.559662
  },{
    id: 46,
    value: "中国石化宁溪加油站",
    label: "中国石化宁溪加油站",
    address: "浙江省台州市黄岩区宁溪镇长决线坦头村民委员会东北50米",
    type: "round",
    radius: radius,
    lng: 120.982766,
    lat: 28.603198
  },{
    id: 47,
    value: "中国石化拱复加油站",
    label: "中国石化拱复加油站",
    address: "浙江省台州市黄岩区S321与长决线交叉口正东方向359米左右",
    type: "round",
    radius: radius,
    lng: 121.179730,
    lat: 28.654516
  },{
    id: 48,
    value: "黄岩潮济加油站(长决线)",
    label: "黄岩潮济加油站(长决线)",
    address: "浙江省台州市黄岩区325省道潮济村路段,潮济小学附近",
    type: "round",
    radius: radius,
    lng: 121.080021,
    lat: 28.635881
  },{
    id: 49,
    value: "南城加油中心加油站",
    label: "南城加油中心加油站",
    address: "浙江省台州市黄岩区十里铺",
    type: "round",
    radius: radius,
    lng: 121.264529,
    lat: 28.615874
  },{
    id: 50,
    value: "台州黄岩焦坑加油站",
    label: "台州黄岩焦坑加油站",
    address: "浙江省台州市黄岩区澄江街道黄前线后林村路段路东侧,澄江街道临古社区卫生服务站附近",
    type: "round",
    radius: radius,
    lng: 121.148802,
    lat: 28.621573
  },{
    id: 51,
    value: "澄江加油站",
    label: "澄江加油站",
    address: "浙江省台州市黄岩区澄江镇桥头王81号",
    type: "round",
    radius: radius,
    lng: 121.211016,
    lat: 28.633156
  },{
    id: 52,
    value: "黄岩范丰石油加油站(北院大道)",
    label: "黄岩范丰石油加油站(北院大道)",
    address: "浙江省台州市黄岩区北院大道与新南路交叉口东北角,新前中学附近",
    type: "round",
    radius: radius,
    lng: 121.212661,
    lat: 28.659290
  },{
    id: 53,
    value: "中国石化黄岩马鞍山加油站",
    label: "中国石化黄岩马鞍山加油站",
    address: "浙江省台州市黄岩区104国道北城街道马鞍山村路段,路北侧",
    type: "round",
    radius: radius,
    lng: 121.262347,
    lat: 28.677475
  },{
    id: 54,
    value: "台州市黄岩区官庄梁加油站城市公共充电站(十院路)",
    label: "台州市黄岩区官庄梁加油站城市公共充电站(十院路)",
    address: "浙江省台州市黄岩区南城街道官庄梁村十院路",
    type: "round",
    radius: radius,
    lng: 121.263747,
    lat: 28.605247
  },{
    id: 55,
    value: "南城加油中心加油站",
    label: "南城加油中心加油站",
    address: "浙江省台州市黄岩区十里铺",
    type: "round",
    radius: radius,
    lng: 121.264094,
    lat: 28.616645
  },{
    id: 56,
    value: "中国石化万里加油站",
    label: "中国石化万里加油站",
    address: "浙江省台州市黄岩区南城方山下村",
    type: "round",
    radius: radius,
    lng: 121.262431,
    lat: 28.620750
  },{
    id: 57,
    value: "中国石化拱东加油站",
    label: "中国石化拱东加油站",
    address: "台州市黄岩区北城街道新宅村",
    type: "round",
    radius: radius,
    lng: 121.244825,
    lat: 28.683448
  },{
    id: 58,
    value: "屿下石化加油站(台州黄岩屿下加油站店)",
    label: "屿下石化加油站(台州黄岩屿下加油站店)",
    address: "浙江省台州市黄岩区道西工业园区新前街朝元路7号",
    type: "round",
    radius: radius,
    lng: 121.220982,
    lat: 28.673160
  },{
    id: 59,
    value: "海湾石油鼓屿加油站",
    label: "海湾石油鼓屿加油站",
    address: "浙江省台州市黄岩区西城街道黄石大道399号",
    type: "round",
    radius: radius,
    lng: 121.245694,
    lat: 28.622445
  },{
    id: 60,
    value: "浙江石油黄岩区高桥综合功能服务加油站",
    label: "浙江石油黄岩区高桥综合功能服务加油站",
    address: "浙江省台州市黄岩区党建公园西100米(石沙线南)",
    type: "round",
    radius: radius,
    lng: 121.230780,
    lat: 28.588560
  },{
    id: 61,
    value: "中国石化五里牌加油站",
    label: "中国石化五里牌加油站",
    address: "浙江省台州市黄岩区北城街道拱新大道2-1号",
    type: "round",
    radius: radius,
    lng: 121.242730,
    lat: 28.670490
  },{
    id: 62,
    value: "黄岩中江石化加油站",
    label: "黄岩中江石化加油站",
    address: "浙江省台州市黄岩区马上线台州黄岩江口供电营业厅斜对面",
    type: "round",
    radius: radius,
    lng: 121.337610,
    lat: 28.680760
  },{
    id: 63,
    value: "金鑫加油站",
    label: "金鑫加油站",
    address: "浙江省台州市黄岩区客运西站旁边",
    type: "round",
    radius: radius,
    lng: 121.244305,
    lat: 28.641575
  },{
    id: 64,
    value: "中国石化黄岩西门加油站",
    label: "中国石化黄岩西门加油站",
    address: "浙江省台州市黄岩区黄长路165号西门",
    type: "round",
    radius: radius,
    lng: 121.245782,
    lat: 28.648579
  },{
    id: 65,
    value: "中国石化九峰加油站",
    label: "中国石化九峰加油站",
    address: "浙江省台州市黄岩区二环东路与康复路交叉口正东方向92米左右",
    type: "round",
    radius: radius,
    lng: 121.277420,
    lat: 28.648490
  },{
    id: 66,
    value: "中国石化加油站(黄椒路)",
    label: "中国石化加油站(黄椒路)",
    address: "浙江省台州市黄岩区黄椒路169号(金艺花园西北)",
    type: "round",
    radius: radius,
    lng: 121.276743,
    lat: 28.661386
  },{
    id: 67,
    value: "中国石化黄岩中心加油站",
    label: "中国石化黄岩中心加油站",
    address: "浙江省台州市黄岩区印山路环城南路交汇处南行,南城新村附近",
    type: "round",
    radius: radius,
    lng: 121.264193,
    lat: 28.641001
  },{
    id: 68,
    value: "上垟加油站",
    label: "上垟加油站",
    address: "浙江省台州市黄岩区上垟中心小学西侧",
    type: "round",
    radius: radius,
    lng: 121.031081,
    lat: 28.521178
  },{
    id: 69,
    value: "中国石化(黄岩支公司)",
    label: "中国石化(黄岩支公司)",
    address: "浙江省台州市黄岩区东城街道环城东路88号1楼",
    type: "round",
    radius: radius,
    lng: 121.266257,
    lat: 28.645843
  }]
},{
  value: "dongchezhan",
  label: "动车站",
  children: [{
    id: 70,
    value: "台州西站",
    label: "台州西站",
    address: "浙江省台州市黄岩区王林村",
    type: "round",
    radius: radius,
    lng: 121.286240,
    lat: 28.688986
  }]
},{
  value: "qichezhan",
  label: "汽车站",
  children: [{
    id: 71,
    value: "黄岩汽车站",
    label: "黄岩汽车站",
    address: "浙江省台州市黄岩区二环西路大环明珠东侧约140米",
    type: "round",
    radius: radius,
    lng: 121.244108,
    lat: 28.643054
  }]
},{
  value: "yiyuan",
  label: "医院",
  children: [{
    id: 72,
    value: "台州市第一人民医院(新院区)",
    label: "台州市第一人民医院(新院区)",
    address: "浙江省台州市黄岩区西城街道九澄大道与二环西路交叉路口往东约150米(羽村华庭北侧约250米)",
    type: "round",
    radius: radius,
    lng: 121.246940,
    lat: 28.617348
  }, {
    id: 73,
    value: "台州市第一人民医院",
    label: "台州市第一人民医院",
    address: "浙江省台州市黄岩区横街218号",
    type: "round",
    radius: radius,
    lng: 121.260686,
    lat: 28.646408
  }, {
    id: 74,
    value: "黄岩中医院新院区",
    label: "黄岩中医院新院区",
    address: "浙江省台州市黄岩区新前街道世纪大道83号",
    type: "round",
    radius: radius,
    lng: 121.224637,
    lat: 28.653726
  }]
},{
  value: "gongyuan",
  label: "公园",
  children: [{
    id: 75,
    value: "九峰公园",
    label: "九峰公园",
    address: "浙江省台州市黄岩区九峰路243号",
    type: "round",
    radius: radius,
    lng: 121.275536,
    lat: 28.643504
  }]
},{
  value: "zhengfudanwei",
  label: "政府单位",
  children: [{
    id: 76,
    value: "黄岩区人民政府",
    label: "黄岩区人民政府",
    address: "浙江省台州市黄岩区塔院头路与县前街交叉口东北角",
    type: "round",
    radius: radius,
    lng: 121.257643,
    lat: 28.653181
  }, {
    id: 77,
    value: "黄岩区人民政府政务服务中心",
    label: "黄岩区人民政府政务服务中心",
    address: "浙江省台州市黄岩区劳动北路118号",
    type: "round",
    radius: radius,
    lng: 121.260210,
    lat: 28.653833
  }]
}]
const PATH_SEP = "/";

/**
 * @param {string[]} path
 * @param {typeof FLIGHT_LOCATION_CASCADER_OPTIONS} [roots]
 * @param {typeof FLIGHT_LOCATION_CASCADER_OPTIONS} [extraRoots]
 * @returns {{ value: string, label: string, ring?: number[], children?: unknown[] } | null}
 */
export function findLocationNodeByPath(path, roots = FLIGHT_LOCATION_CASCADER_OPTIONS, extraRoots = []) {
  if (!Array.isArray(path) || !path.length) return null;
  const searchIn = (tree) => {
    let level = tree;
    let node = null;
    for (const seg of path) {
      node = level?.find((n) => n.value === seg) ?? null;
      if (!node) return null;
      level = node.children || [];
    }
    return node;
  };
  return searchIn(roots) || searchIn(extraRoots);
}

/** 叶子：无 children 或 children 为空，且带 ring */
export function isLocationLeafNode(node) {
  if (!node) return false;
  const hasChildren = Array.isArray(node.children) && node.children.length > 0;
  return !hasChildren && Array.isArray(node.ring) && node.ring.length >= 6;
}

/**
 * @param {string[]} path
 * @param {Array} [extraRoots] 可选的自定义地点树，优先查预设树再查此树
 * @returns {number[] | null}
 */
export function resolvePolygonRingByPath(path, extraRoots = []) {
  const node = findLocationNodeByPath(path, FLIGHT_LOCATION_CASCADER_OPTIONS, extraRoots);
  if (!isLocationLeafNode(node)) return null;
  return node.ring;
}

/**
 * @param {string[]} path
 * @param {Array} [extraRoots]
 * @returns {string}
 */
export function resolveLocationLabelByPath(path, extraRoots = []) {
  if (!Array.isArray(path) || !path.length) return "";
  const labels = [];
  let level = FLIGHT_LOCATION_CASCADER_OPTIONS;
  let extraLevel = extraRoots;
  for (const seg of path) {
    let node = level?.find((n) => n.value === seg);
    if (!node && extraLevel) {
      node = extraLevel?.find((n) => n.value === seg);
    }
    if (!node) break;
    labels.push(node.label);
    level = node.children || [];
    extraLevel = null;
  }
  return labels.join(" / ");
}

/** 节点 id（路径各段用 / 连接，value 中请勿包含 /） */
export function pathToLocationNodeKey(path) {
  if (!Array.isArray(path) || !path.length) return "";
  return path.join(PATH_SEP);
}

/** @returns {string[] | null} */
export function locationNodeKeyToPath(nodeKey) {
  if (!nodeKey || typeof nodeKey !== "string") return null;
  const parts = nodeKey.split(PATH_SEP).filter(Boolean);
  return parts.length ? parts : null;
}

/**
 * @param {typeof FLIGHT_LOCATION_CASCADER_OPTIONS} nodes
 * @param {string[]} ancestorPath
 */
function mapNodesToTreeData(nodes, ancestorPath = []) {
  if (!Array.isArray(nodes)) return [];
  return nodes.map((node) => {
    const path = [...ancestorPath, node.value];
    const hasChildren = Array.isArray(node.children);
    const children = hasChildren && node.children.length
      ? mapNodesToTreeData(node.children, path)
      : undefined;
    const item = {
      id: pathToLocationNodeKey(path),
      value: node.value,
      label: node.label,
      path,
    };
    // 透传自定义节点的 ring / regionData
    if (node.ring?.length) item.ring = node.ring;
    if (node.regionData) item.regionData = node.regionData;
    // 保留 children 数组（即使为空），以便区分分类与地区
    if (hasChildren) {
      item.children = children || [];
    }
    return item;
  });
}

/** el-tree 数据（递归，任意层级） */
export function buildFlightLocationTreeData() {
  return mapNodesToTreeData(FLIGHT_LOCATION_CASCADER_OPTIONS);
}

/**
 * @param {string[][]} paths
 * @param {Array} [extraRoots]
 * @returns {string}
 */
export function resolveLocationLabelsFromPaths(paths, extraRoots = []) {
  if (!Array.isArray(paths) || !paths.length) return "";
  return paths
    .map((p) => resolveLocationLabelByPath(p, extraRoots))
    .filter(Boolean)
    .join("、");
}

/**
 * @param {string[][]} paths
 * @param {Array} [extraRoots]
 * @returns {number[][]}
 */
export function resolvePolygonRingsFromPaths(paths, extraRoots = []) {
  if (!Array.isArray(paths)) return [];
  return paths
    .map((p) => resolvePolygonRingByPath(p, extraRoots))
    .filter((ring) => ring && ring.length >= 6);
}

/**
 * @param {{ locationPaths?: string[][], locationPath?: string[] }} plan
 * @returns {string[][]}
 */
export function normalizePlanLocationPaths(plan) {
  let paths = [];
  if (plan?.locationPaths?.length) {
    paths = plan.locationPaths.filter((p) => Array.isArray(p) && p.length > 0);
  } else if (Array.isArray(plan?.locationPath) && plan.locationPath.length > 0) {
    paths = [plan.locationPath];
  }
  return paths.map((p) => migrateLegacyLocationPath(p));
}

// ===== 自定义地点树（地点设置） =====

let customCategorySeq = 0;
let customRegionSeq = 0;

/** 深拷贝预设地点树作为自定义地点初始数据 */
export function createCustomLocationTree() {
  return [];
}

/** 从中文 label 生成拼音风格的 value */
function labelToValue(label, prefix) {
  const sanitized = String(label || "")
    .trim()
    .replace(/[^一-龥a-zA-Z0-9]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "")
    .toLowerCase()
    || "item";
  return `${prefix}_${sanitized}_${Date.now().toString(36)}`;
}

/** 创建一级分类节点 */
export function createCategoryNode(label) {
  return {
    value: labelToValue(label, `cat_${++customCategorySeq}`),
    label: String(label || "").trim(),
    children: [],
  };
}

/** 创建二级地区节点（初始无 ring） */
export function createRegionNode(label) {
  return {
    value: labelToValue(label, `reg_${++customRegionSeq}`),
    label: String(label || "").trim(),
    ring: null,
  };
}

/**
 * 将自定义地点树转为 el-tree data + cascader options 双格式
 * 复用已有的 mapNodesToTreeData
 */
export function buildCustomLocationTreeData(tree) {
  if (!Array.isArray(tree)) return [];
  return mapNodesToTreeData(tree);
}

/**
 * 在自定义树中按 value 查找节点（浅层：仅查 category + 其 children）
 * @returns {{ category: object, categoryIndex: number, region: object | null, regionIndex: number } | null}
 */
export function findCustomLocationNode(tree, categoryValue, regionValue) {
  if (!Array.isArray(tree)) return null;
  const catIdx = tree.findIndex((n) => n.value === categoryValue);
  if (catIdx < 0) return null;
  const category = tree[catIdx];
  if (!regionValue) return { category, categoryIndex: catIdx, region: null, regionIndex: -1 };
  const children = category.children || [];
  const regIdx = children.findIndex((n) => n.value === regionValue);
  if (regIdx < 0) return { category, categoryIndex: catIdx, region: null, regionIndex: -1 };
  return { category, categoryIndex: catIdx, region: children[regIdx], regionIndex: regIdx };
}

/** 兼容旧二级路径：gov + gov_huangyan → gov + huangyan + gov_huangyan */
export function migrateLegacyLocationPath(path) {
  if (!Array.isArray(path) || path.length !== 2) return path;
  if (path[0] === "gov" && path[1] === "gov_huangyan") {
    return ["gov", "huangyan", "gov_huangyan"];
  }
  if (path[0] === "gov" && path[1] === "gov_jiaojiang") {
    return ["gov", "jiaojiang", "gov_jiaojiang"];
  }
  return path;
}
