import AdminLayout from "@backend/layouts/AdminLayout.vue";

export const BACKEND_BASE = "/backend";

export const MONITOR_BASE = `${BACKEND_BASE}/monitor`;

export const INFRA_BASE = `${BACKEND_BASE}/infra`;

export const MENU_GROUPS = {
  monitor: {
    title: "监控中心",
    icon: "Monitor",
  },
  infra: {
    title: "伴飞基建管理",
    icon: "Setting",
  },
};

export const backendRoutes = [
  {
    path: `${BACKEND_BASE}/login`,
    redirect: "/login",
    meta: { requiresAuth: false, title: "登录" },
  },
  {
    path: BACKEND_BASE,
    component: AdminLayout,
    redirect: MONITOR_BASE,
    meta: { requiresAuth: true },
    children: [
      {
        path: "monitor",
        name: "BackendMonitor",
        component: () => import("@backend/views/monitor/MonitorCenterView.vue"),
        meta: {
          title: "监控中心",
          menu: true,
          menuGroup: "monitor",
          roles: ["super_admin", "org_admin", "org_viewer"],
        },
      },
      {
        path: "monitor/drones",
        name: "BackendDroneList",
        component: () => import("@backend/views/devices/DeviceListView.vue"),
        meta: {
          title: "无人机管理",
          menu: true,
          menuGroup: "monitor",
          roles: ["super_admin", "org_admin", "org_viewer"],
        },
      },
      {
        path: "monitor/drones/new",
        name: "BackendDroneCreate",
        component: () => import("@backend/views/devices/DeviceFormView.vue"),
        meta: {
          title: "新建无人机",
          activeMenu: `${MONITOR_BASE}/drones`,
          roles: ["super_admin", "org_admin"],
        },
      },
      {
        path: "monitor/drones/:id",
        name: "BackendDroneEdit",
        component: () => import("@backend/views/devices/DeviceFormView.vue"),
        meta: {
          title: "编辑无人机",
          activeMenu: `${MONITOR_BASE}/drones`,
          roles: ["super_admin", "org_admin"],
        },
      },
      {
        path: "monitor/boats",
        name: "BackendBoatList",
        component: () => import("@backend/views/monitor/BoatListView.vue"),
        meta: {
          title: "无人艇管理",
          menu: true,
          menuGroup: "monitor",
          roles: ["super_admin", "org_admin", "org_viewer"],
        },
      },
      {
        path: "monitor/dogs",
        name: "BackendDogList",
        component: () => import("@backend/views/monitor/DogListView.vue"),
        meta: {
          title: "无人犬管理",
          menu: true,
          menuGroup: "monitor",
          roles: ["super_admin", "org_admin", "org_viewer"],
        },
      },
      {
        path: "monitor/targets/new",
        redirect: (to) => ({
          path: `${INFRA_BASE}/targets/new`,
          query: to.query,
        }),
      },
      {
        path: "monitor/targets/:id",
        redirect: (to) => `${INFRA_BASE}/targets/${to.params.id}`,
      },
      {
        path: "dashboard",
        redirect: MONITOR_BASE,
      },
      {
        path: "devices",
        redirect: `${MONITOR_BASE}/drones`,
      },
      {
        path: "devices/new",
        redirect: `${MONITOR_BASE}/drones/new`,
      },
      {
        path: "devices/:id",
        redirect: (to) => `${MONITOR_BASE}/drones/${to.params.id}`,
      },
      {
        path: "orgs",
        name: "BackendOrgList",
        component: () => import("@backend/views/orgs/OrgListView.vue"),
        meta: {
          title: "单位管理",
          icon: "OfficeBuilding",
          menu: true,
          roles: ["super_admin"],
        },
      },
      {
        path: "orgs/new",
        name: "BackendOrgCreate",
        component: () => import("@backend/views/orgs/OrgFormView.vue"),
        meta: {
          title: "新建单位",
          activeMenu: `${BACKEND_BASE}/orgs`,
          roles: ["super_admin"],
        },
      },
      {
        path: "orgs/:id",
        name: "BackendOrgEdit",
        component: () => import("@backend/views/orgs/OrgFormView.vue"),
        meta: {
          title: "编辑单位",
          activeMenu: `${BACKEND_BASE}/orgs`,
          roles: ["super_admin"],
        },
      },
      {
        path: "users",
        name: "BackendUserList",
        component: () => import("@backend/views/users/UserListView.vue"),
        meta: {
          title: "账户管理",
          icon: "User",
          menu: true,
          roles: ["super_admin", "org_admin"],
          hideForGrassroots: true,
        },
      },
      {
        path: "users/new",
        name: "BackendUserCreate",
        component: () => import("@backend/views/users/UserFormView.vue"),
        meta: {
          title: "新增账户",
          activeMenu: `${BACKEND_BASE}/users`,
          roles: ["super_admin", "org_admin"],
          hideForGrassroots: true,
        },
      },
      {
        path: "users/:id",
        name: "BackendUserEdit",
        component: () => import("@backend/views/users/UserFormView.vue"),
        meta: {
          title: "编辑账户",
          activeMenu: `${BACKEND_BASE}/users`,
          roles: ["super_admin", "org_admin"],
          hideForGrassroots: true,
        },
      },
      {
        path: "account",
        name: "BackendProfile",
        component: () => import("@backend/views/account/ProfileView.vue"),
        meta: {
          title: "个人中心",
        },
      },
      {
        path: "infra/checkpoints",
        name: "BackendCheckpointList",
        component: () => import("@backend/views/infra/CheckpointListView.vue"),
        meta: {
          title: "卡点设置",
          menu: true,
          menuGroup: "infra",
          roles: ["super_admin", "org_admin"],
        },
      },
      {
        path: "infra/targets",
        name: "BackendTargetList",
        component: () => import("@backend/views/infra/TargetListView.vue"),
        meta: {
          title: "目标设备管理",
          menu: true,
          menuGroup: "infra",
          roles: ["super_admin", "org_admin", "org_viewer"],
        },
      },
      {
        path: "infra/targets/new",
        name: "BackendTargetCreate",
        component: () => import("@backend/views/targets/TargetFormView.vue"),
        meta: {
          title: "新建目标设备",
          activeMenu: `${INFRA_BASE}/targets`,
          roles: ["super_admin", "org_admin"],
        },
      },
      {
        path: "infra/targets/:id",
        name: "BackendTargetEdit",
        component: () => import("@backend/views/targets/TargetFormView.vue"),
        meta: {
          title: "编辑目标设备",
          activeMenu: `${INFRA_BASE}/targets`,
          roles: ["super_admin", "org_admin"],
        },
      },
      {
        path: "infra/locations",
        name: "BackendKeyLocationList",
        component: () => import("@backend/views/infra/KeyLocationListView.vue"),
        meta: {
          title: "重点地点管理",
          menu: true,
          menuGroup: "infra",
          roles: ["super_admin", "org_admin"],
        },
      },
    ],
  },
  {
    path: `${BACKEND_BASE}/403`,
    name: "BackendForbidden",
    component: () => import("@backend/views/error/ForbiddenView.vue"),
    meta: { requiresAuth: false, title: "无权限" },
  },
  {
    path: `${BACKEND_BASE}/:pathMatch(.*)*`,
    redirect: MONITOR_BASE,
  },
];

export function getMenuRoutes() {
  const adminRoute = backendRoutes.find((r) => r.path === BACKEND_BASE);
  return (adminRoute?.children || []).filter((r) => r.meta?.menu);
}

export function getMenuTree(role, user, canAccess) {
  const menus = getMenuRoutes().filter((item) => canAccess(item, role, user));
  const groupMap = new Map();
  const tree = [];

  for (const item of menus) {
    const groupKey = item.meta?.menuGroup;
    if (groupKey) {
      if (!groupMap.has(groupKey)) {
        const groupMeta = MENU_GROUPS[groupKey] || { title: groupKey, icon: "Menu" };
        const groupNode = {
          type: "group",
          key: groupKey,
          title: groupMeta.title,
          icon: groupMeta.icon,
          children: [],
        };
        groupMap.set(groupKey, groupNode);
        tree.push(groupNode);
      }
      groupMap.get(groupKey).children.push({ type: "item", route: item });
      continue;
    }

    tree.push({
      type: "item",
      route: item,
      icon: item.meta?.icon,
      title: item.meta?.title,
    });
  }

  return tree;
}
