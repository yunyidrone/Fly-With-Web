# 🚁 无人机伴飞系统 (Drone Accompanying Fly System)

  🎥 实时视频流 | 🗺️ 三维地图 | 📡 MQTT 遥测 | 🎮 远程控制

---

## 📖 项目概述

**无人机伴飞系统**是一款专业的无人机伴飞任务实时监控与指挥平台，专为车辆伴随无人机飞行场景设计。系统通过 MQTT 协议实时接收车辆和无人机的遥测数据，结合 Cesium 三维地图引擎可视化展示两者的位置、姿态和飞行轨迹，同时提供低延迟视频流查看和远程控制功能，实现对伴飞任务的全面掌控。

### 核心能力

- ✅ **实时监控**：毫秒级遥测数据更新，支持 10Hz 高频数据推送
- ✅ **三维可视化**：基于 Cesium 的三维地图渲染，支持卫星/矢量地图切换
- ✅ **低延迟视频**：WebRTC 技术实现低延迟视频流播放
- ✅ **远程控制**：一键起飞、一键返航等远程指令下发
- ✅ **多视图布局**：可拖拽分屏布局，灵活切换主次视图

---

## ✨ 功能特性

### 🎥 实时视频流模块

| 功能 | 描述 |
|------|------|
| WebRTC 播放 | 基于 WebRTC 技术实现低延迟视频流播放 |
| WHEP 协议 | 支持 WHEP (WebRTC-HTTP Egress Protocol) 视频推流协议 |
| 飞行状态叠加 | 实时显示无人机位置（经度、纬度、高度）和姿态角信息 |
| 自动重连 | 网络异常时自动尝试恢复视频连接 |

### 🗺️ 三维地图可视化模块

| 功能 | 描述 |
|------|------|
| 天地图集成 | 集成天地图卫星影像和矢量地图服务 |
| 3D 模型展示 | 支持车辆（GLB）和无人机（GLB）3D 模型实时渲染 |
| 轨迹绘制 | 实时绘制车辆运行路线和无人机飞行轨迹 |
| 视场锥可视化 | FOV 视场锥动态展示无人机拍摄范围，支持变焦计算 |
| 2D/3D 切换 | 支持俯视 2D 和倾斜 3D 视角切换 |
| 锁定跟随 | 支持锁定模式自动跟随车辆/无人机移动 |
| 地图选点 | 支持地图点击选点，获取坐标信息 |

### 📡 遥测数据通信模块

| 功能 | 描述 |
|------|------|
| MQTT 5.x | 基于 MQTT 5.x 协议的实时双向通信 |
| 车辆数据 | 接收车辆 GPS 位置、速度等实时数据 |
| 无人机数据 | 接收无人机位置、姿态、云台角度、变焦倍数等 |
| 连接状态 | 实时显示 MQTT 连接状态指示灯 |
| 自动重连 | 断线自动重连机制，保障通信稳定性 |

### 🎮 远程控制模块

| 功能 | 描述 |
|------|------|
| 一键起飞 | 触发无人机伴飞模式起飞指令 |
| 一键返航 | 触发无人机返航指令 |
| 指令确认 | 带参数输入的确认对话框，防止误操作 |
| 状态反馈 | 实时显示指令执行状态和结果 |

### 🖥️ 多视图布局模块

| 功能 | 描述 |
|------|------|
| 可拖拽分屏 | Element Plus Splitter 实现可拖拽分屏布局 |
| 视图切换 | 支持主视图与子视图动态切换 |
| 全屏扩展 | 支持单视图全屏显示 |
| 响应式适配 | 自适应不同屏幕尺寸 |

---

## 🛠️ 技术栈

### 核心技术

| 类别 | 技术 | 版本 | 说明 |
|------|------|------|------|
| 前端框架 | Vue | 3.5.24 | Composition API + `<script setup>` 语法 |
| 构建工具 | Vite | 7.2.4 | 极速冷启动，按需编译 |
| 三维地图 | Cesium | 1.129.0 | 开源三维地球和地图可视化引擎 |
| UI 组件库 | Element Plus | 2.13.1 | 基于 Vue 3 的桌面端组件库 |
| 状态管理 | Pinia | 3.0.4 | Vue 官方推荐的状态管理方案 |
| 路由管理 | Vue Router | 4.6.4 | 单页应用路由管理 |
| 通信协议 | MQTT.js | 5.14.1 | MQTT over WebSocket 客户端 |
| HTTP 客户端 | Axios | 1.13.2 | 支持请求拦截、响应拦截、自动重试 |
| 地图服务 | 天地图 | - | 国家地理信息公共服务平台 |

### 开发工具

| 工具 | 用途 |
|------|------|
| unplugin-auto-import | 自动导入 Vue API |
| unplugin-vue-components | 自动导入组件 |
| vite-plugin-cesium | Cesium 资源自动处理 |
| sass | SCSS 样式预处理 |

---

## 📁 项目结构

```
accompanying-fly-project/
├── public/                          # 静态资源
│   ├── models/                      # 3D 模型文件
│   │   ├── car.glb                  # 车辆 3D 模型
│   │   └── uav.glb                  # 无人机 3D 模型
│   └── favicon.ico                  # 网站图标
├── src/
│   ├── api/                         # API 接口层
│   │   └── index.js                 # 伴飞服务 API 封装
│   ├── assets/                      # 静态资源
│   │   ├── images/                  # 图片资源
│   │   └── test.json                # 测试数据
│   ├── components/                  # Vue 组件
│   │   ├── DroneStream.vue          # 无人机视频流组件
│   │   ├── HomeHeader.vue           # 页面头部组件
│   │   ├── SubMap.vue               # 子地图组件（无人机视角）
│   │   ├── SwitchView.vue           # 视图切换控制组件
│   │   └── TiandituMap.vue          # 天地图主地图组件
│   ├── composables/                 # 组合式函数
│   │   └── useCesiumConfig.js       # Cesium 通用配置
│   ├── config/                      # 配置文件
│   │   ├── app-config.js            # 应用配置中心
│   │   └── network.js               # 网络配置
│   ├── router/                      # 路由配置
│   │   └── index.js                 # Vue Router 配置
│   ├── stores/                      # Pinia 状态管理
│   │   └── index.js                 # 系统状态存储
│   ├── utils/                       # 工具函数
│   │   ├── cameraFrustum.js         # 相机视场锥工具类
│   │   ├── companionFrustum.js      # 伴飞视场锥工具类
│   │   ├── mqtt-service.js          # MQTT 服务封装
│   │   ├── request.js               # Axios 请求封装
│   │   └── zoomFrustumManager.js    # 变焦视场管理器
│   ├── views/                       # 页面视图
│   │   └── home-view/
│   │       └── index.vue            # 首页（主布局）
│   ├── App.vue                      # 根组件
│   ├── main.js                      # 入口文件
│   └── style.css                    # 全局样式
├── .env.development                 # 开发环境配置
├── .env.example                     # 环境变量示例
├── index.html                       # HTML 模板
├── jsconfig.json                    # JavaScript 配置
├── package.json                     # 依赖配置
├── README.md                        # 项目说明
└── vite.config.js                   # Vite 配置
```

---

## 📦 模块说明

### 组件模块

#### DroneStream.vue
**功能**：无人机视频流播放与飞行控制面板

| 属性/方法 | 说明 |
|-----------|------|
| `currentPlayUrl` | 视频流播放地址 |
| `initPlayVideo()` | 初始化 WebRTC 视频播放 |
| `handleTakeOff()` | 一键起飞操作处理 |
| `handleReturnHome()` | 一键返航操作处理 |
| `lastPosition` | 实时位置信息（经度/纬度/高度） |
| `droneCurrentState` | 无人机姿态数据 |

#### TiandituMap.vue
**功能**：天地图三维地图主视图

| 属性/方法 | 说明 |
|-----------|------|
| `initViewer()` | 初始化 Cesium Viewer |
| `initScene()` | 加载车辆和无人机 3D 模型 |
| `toggleSceneMode()` | 切换 2D/3D 视角 |
| `toggleLockMode()` | 切换锁定跟随模式 |
| `toggleDisplayMode()` | 切换车辆显示模式（模型/点） |
| `addDJIZoomFrustum()` | 绘制 DJI 视场锥（支持变焦） |
| `vehicleDisplayMode` | 车辆显示模式 |
| `isPitch2D` | 是否 2D 俯视模式 |
| `isLockMode` | 是否锁定跟随模式 |

#### SubMap.vue
**功能**：子地图窗口（无人机视角预览）

| 属性/方法 | 说明 |
|-----------|------|
| `initSubViewer()` | 初始化子地图 Viewer |
| `addCameraHUD()` | 添加相机取景框 HUD 效果 |
| `syncSubViewer()` | 同步无人机状态到子视图 |

#### HomeHeader.vue
**功能**：页面顶部状态栏

| 属性/方法 | 说明 |
|-----------|------|
| `lightClass` | 连接状态指示灯样式 |
| `lightStatusText` | 连接状态文字描述 |

#### SwitchView.vue
**功能**：视图切换控制组件

| 事件 | 说明 |
|------|------|
| `update:toMainView` | 切换到主视图 |
| `update:isFullscreen` | 切换全屏状态 |

### 工具模块

#### mqtt-service.js
MQTT 通信服务封装，提供以下功能：
- 单例模式的 MQTT 客户端管理
- 自动重连机制
- 主题订阅与消息分发
- 连接状态管理

#### request.js
Axios HTTP 请求封装，特性包括：
- 请求/响应拦截器
- 自动重试机制（axios-retry）
- 请求节流控制
- 统一错误处理

#### cameraFrustum.js
相机视场锥工具类，用于：
- 计算相机视场角
- 绘制视场锥可视化范围
- 支持动态更新

### 状态管理

#### stores/index.js
Pinia 状态存储，包含：

| State | 类型 | 说明 |
|-------|------|------|
| `mqttStatus` | Number | MQTT 连接状态 (0-未连接, 1-连接中, 2-已连接, 3-连接失败) |
| `carMessageList` | Array | 车辆消息历史列表 |
| `droneMessageList` | Array | 无人机消息历史列表 |
| `droneStatus` | Number | 无人机状态 (0-未起飞, 1-已起飞) |
| `droneCurrentState` | Object | 无人机当前姿态数据 |

---

## 🚀 本地运行说明

### 环境要求

- **Node.js**: >= 18.0
- **npm**: >= 9.0
- **浏览器**: Chrome >= 90 / Firefox >= 88 / Edge >= 90 / Safari >= 14

> ⚠️ **注意**: 系统使用 Cesium 进行三维渲染，需要浏览器支持 **WebGL**

### 快速开始

#### 1. 克隆项目

```bash
git clone <repository-url>
cd accompanying-fly-project
```

#### 2. 安装依赖

```bash
npm install
```

#### 3. 配置环境变量

复制环境变量示例文件：

```bash
cp .env.example .env.development.local
```

编辑 `.env.development.local` 文件，填入实际配置：

```env
# MQTT 配置
VITE_MQTT_PROTOCOL=ws
VITE_MQTT_HOST=your-mqtt-host
VITE_MQTT_PORT=8083
VITE_MQTT_PATH=/mqtt
VITE_MQTT_USERNAME=your-username
VITE_MQTT_PASSWORD=your-password

# API 配置
VITE_API_BASE_URL=http://your-api-server:port/api

# 视频流配置
VITE_VIDEO_STREAM_URL=http://your-srs-server:port/rtc/v1/whep/?app=live&stream=your-stream

# 目标设备配置
VITE_TARGET_ID=your-target-id
VITE_DRONE_ID=your-drone-id

# 天地图配置
VITE_TIANDITU_KEY=your-tianditu-key
```

#### 4. 准备 3D 模型

将车辆模型 `car.glb` 和无人机模型 `uav.glb` 放置在 `public/models/` 目录下。

#### 5. 启动开发服务器

```bash
npm run dev
```

服务将启动在 `http://localhost:5177`

#### 6. 构建生产版本

```bash
npm run build
```

构建产物输出到 `dist/` 目录。

#### 7. 预览生产构建

```bash
npm run preview
```

---

## ⚙️ 配置说明

### MQTT 主题说明

| 主题 | 说明 | 方向 | 数据格式 |
|------|------|------|----------|
| `flywith/target/{target_id}` | 车辆位置数据 | 订阅 | JSON |
| `flywith/uav/{drone_id}` | 无人机遥测数据 | 订阅 | JSON |

### 无人机遥测数据格式

```json
{
  "current_longitude": 121.427000,
  "current_latitude": 28.652800,
  "current_height": 150.0,
  "attitude_head": 0.0,
  "attitude_pitch": 0.0,
  "attitude_roll": 0.0,
  "gimbal_pitch": -90.0,
  "gimbal_roll": 0.0,
  "gimbal_yaw": 0.0,
  "zoom_factor": 1.0
}
```

### API 接口

#### 一键起飞
```http
POST /flywith/start
Content-Type: application/json

{
  "target_id": "string",
  "mode": 1  // 1 或 5
}
```

#### 一键返航
```http
POST /flywith/stop
Content-Type: application/json

{
  "target_id": "string",
  "mode": 1
}
```

### Vite 代理配置

在 `vite.config.js` 中配置后端 API 代理：

```javascript
server: {
  proxy: {
    "/api": {
      target: "http://your-api-server:port/api",
      changeOrigin: true,
      rewrite: (path) => path.replace(/^\/api/, ""),
    },
  },
}
```

---

## 🌐 浏览器兼容性

| 浏览器 | 最低版本 | 说明 |
|--------|----------|------|
| Chrome | 90+ | 推荐使用 |
| Firefox | 88+ | 完全支持 |
| Edge | 90+ | 完全支持 |
| Safari | 14+ | 完全支持 |

---

## 📝 注意事项

1. **WebGL 支持**：系统使用 Cesium 进行三维渲染，需要浏览器支持 WebGL。如遇显示问题，请检查浏览器设置是否启用了硬件加速。

2. **CORS 配置**：确保视频流服务器和 API 服务器已配置跨域访问（CORS），允许前端域名访问。

3. **MQTT WebSocket**：确保 MQTT 服务器已启用 WebSocket 支持，且防火墙允许相应端口通信。

4. **3D 模型**：请将 `car.glb` 和 `uav.glb` 模型文件放置在 `public/models/` 目录下。模型文件应符合 GLTF/GLB 2.0 标准。

5. **天地图 Key**：系统使用天地图服务，需要有效的天地图 Key。可在 [天地图官网](https://www.tianditu.gov.cn/) 申请。

6. **视频流格式**：系统使用 WebRTC 协议播放视频流，确保视频服务器支持 WHEP 协议。

---
