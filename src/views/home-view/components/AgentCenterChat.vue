<template>
  <Teleport to="body">
  <aside v-if="visible && viewMode === 'chat' && membersVisible" class="agent-members" aria-label="成员列表">
    <header class="agent-members__header">
      <span class="agent-members__header-icon"><i class="ri-team-line" /></span>
      <div class="agent-members__heading">
        <strong>成员列表</strong>
        <span>在线 3 · 离线 2</span>
      </div>
    </header>
    <div class="agent-members__content">
      <div class="agent-members__search"><i class="ri-search-line" /><span>搜索成员名称或编号</span></div>
      <section class="agent-members__group">
        <h3>在线成员 · 3</h3>
        <div v-for="member in onlineMembers" :key="member.name" class="agent-member">
          <span class="agent-member__icon" :class="`agent-member__icon--${member.type}`"><i :class="member.icon" /></span>
          <span class="agent-member__info"><strong>{{ member.name }}</strong><small>{{ member.detail }}</small></span>
          <span class="agent-member__status"><i />在线</span>
        </div>
      </section>
      <section class="agent-members__group agent-members__group--offline">
        <h3>离线成员 · 2</h3>
        <div v-for="member in offlineMembers" :key="member.name" class="agent-member agent-member--offline">
          <span class="agent-member__icon"><i :class="member.icon" /></span>
          <span class="agent-member__info"><strong>{{ member.name }}</strong><small>{{ member.detail }}</small></span>
          <span class="agent-member__status"><i />离线</span>
        </div>
      </section>
    </div>
    <footer class="agent-members__footer">
      <span>成员状态实时更新</span>
      <span class="agent-members__refresh"><i class="ri-refresh-line" />刷新</span>
    </footer>
  </aside>
  <aside v-if="visible" class="agent-center" role="dialog" aria-label="智能体中心">
    <header v-if="viewMode === 'chat'" class="agent-center__header">
      <div class="agent-center__identity">
        <span class="agent-center__avatar"><i class="ri-team-line" /></span>
        <div>
          <h2>智能体中心</h2>
          <p>4 个智能体 · 内部协同</p>
        </div>
      </div>
      <div class="agent-center__actions">
        <button type="button" class="agent-center__action" @click="startNewChat"><i class="ri-edit-box-line" aria-hidden="true" /><span>新对话</span></button>
        <span class="agent-center__divider" />
        <button type="button" class="agent-center__action" @click="viewMode = 'history'"><i class="ri-history-line" aria-hidden="true" /><span>历史对话</span></button>
        <button type="button" class="agent-center__close" aria-label="关闭智能体中心" @click="emit('close')"><i class="ri-close-line" /></button>
      </div>
    </header>

    <template v-if="viewMode === 'chat'">
    <section ref="messageListRef" class="agent-center__messages" aria-live="polite">
      <div v-if="conversationStartLabel" class="agent-center__date">{{ conversationStartLabel }}</div>
      <template v-if="messages.length">
        <template v-for="message in messages" :key="message.id">
        <div class="agent-message" :class="`agent-message--${message.role}`">
          <span class="agent-message__avatar">{{ message.role === 'user' ? '指' : 'AI' }}</span>
          <div class="agent-message__body">
            <span class="agent-message__meta">{{ message.author }} · {{ message.time }}</span>
            <div class="agent-message__bubble">{{ message.text }}</div>
          </div>
        </div>
        <div v-if="message.taskVisible" class="agent-task-card">
          <div class="agent-task-card__title"><span />本次任务分工</div>
          <div class="agent-task-card__item"><span class="agent-task-card__icon"><i class="ri-flight-takeoff-line" /></span><span><b>空中巡检</b><small>无人机智能体 · 前往长潭水库执行空中巡检</small></span></div>
          <div class="agent-task-card__item"><span class="agent-task-card__icon"><i class="ri-ship-line" /></span><span><b>水面巡检</b><small>无人船智能体 · 前往长潭水库执行水面巡检</small></span></div>
        </div>
        <div v-if="message.pending" class="agent-center__pending"><i class="ri-checkbox-blank-circle-fill" />正在分配执行设备…</div>
        <article v-for="device in message.devices" :key="device.type" class="agent-execution-card">
          <div class="agent-execution-card__header">
            <span class="agent-execution-card__icon" :class="`agent-execution-card__icon--${device.type}`"><i :class="device.type === 'drone' ? 'ri-flight-takeoff-line' : 'ri-ship-line'" /></span>
            <div class="agent-execution-card__identity"><strong>{{ device.author }}</strong><small>执行设备：{{ device.name }}</small></div>
            <span class="agent-execution-card__status" :class="{ 'agent-execution-card__status--inspecting': device.inspecting }">{{ device.inspecting ? '巡检中' : '前往中' }}</span>
          </div>
          <p>{{ device.text }}</p>
        </article>
        <article v-if="message.summaryVisible" class="agent-summary-card">
          <div class="agent-summary-card__title"><i class="ri-check-line" />总调度 · 阶段汇总</div>
          <p>{{ message.summary }}</p>
        </article>
        </template>
      </template>
      <div v-else class="agent-center__empty">
        <span class="agent-center__empty-icon"><i class="ri-robot-2-line" /></span>
        <strong>开始一段新的对话</strong>
        <span>描述目标，或选择下方快捷入口</span>
      </div>
    </section>

    <footer class="agent-center__composer">
      <div class="agent-center__quick-row">
        <button type="button" class="agent-center__member" :aria-expanded="membersVisible" @click="membersVisible = !membersVisible"><i :class="membersVisible ? 'ri-arrow-right-s-line' : 'ri-arrow-left-s-line'" />{{ membersVisible ? '收起成员列表' : '展开成员列表' }}</button>
        <span class="agent-center__quick-label">快捷指令</span>
        <button v-for="quick in quickActions" :key="quick" type="button" class="agent-center__quick" @click="sendQuick(quick)"><i :class="quick === '一键封控' ? 'ri-shield-check-line' : quick === '拍车牌' ? 'ri-car-line' : 'ri-user-search-line'" />{{ quick }}</button>
      </div>
      <textarea v-model="draft" aria-label="输入任务" placeholder="输入任务，调度无人机、无人船或机器人…" @keydown="onComposerKeydown" />
      <div class="agent-center__toolbar"><button type="button" class="agent-center__voice" aria-label="语音"><i class="ri-mic-line" /></button><span>Enter 发送</span><button type="button" class="agent-center__send" :disabled="!draft.trim()" @click="sendMessage">发送</button></div>
    </footer>
    </template>

    <template v-else>
      <header class="agent-history__header">
        <button type="button" class="agent-history__back" aria-label="返回聊天" @click="viewMode = 'chat'"><i class="ri-arrow-left-line" /></button>
        <div class="agent-history__title"><h2>历史对话</h2><p>智能体中心 · 近期会话</p></div>
        <div class="agent-history__actions"><button type="button" @click="startNewChat"><i class="ri-edit-box-line" />新对话</button><b>共 5 条</b></div>
      </header>
      <div class="agent-history__search"><div><i class="ri-search-line" /><span>搜索对话主题、任务或设备</span></div></div>
      <section class="agent-history__list" aria-label="历史对话列表">
        <template v-for="group in historyGroups" :key="group.title">
          <div class="agent-history__group-heading"><h3>{{ group.title }}</h3><span>{{ group.count }}</span></div>
          <article v-for="item in group.items" :key="item.title" class="agent-history__item">
            <span class="agent-history__item-icon" :class="`agent-history__item-icon--${item.type}`"><i :class="item.icon" /></span>
            <div class="agent-history__item-content">
              <div class="agent-history__item-top"><h4>{{ item.title }}</h4><time>{{ item.time }}</time></div>
              <p>{{ item.summary }}</p>
              <div class="agent-history__item-bottom">
                <span class="agent-history__devices">{{ item.devices }}</span>
                <span class="agent-history__status" :class="{ 'agent-history__status--running': item.status === '执行中' }"><i />{{ item.status }}</span>
              </div>
            </div>
          </article>
        </template>
      </section>
    </template>
  </aside>
  </Teleport>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, ref, watch } from "vue";

defineProps({ visible: { type: Boolean, default: false } });
const emit = defineEmits(["close"]);
const draft = ref("");
const messageListRef = ref(null);
const membersVisible = ref(false);
const viewMode = ref("chat");
function formatTime(timestamp) {
  const date = new Date(timestamp);
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

const todayHistoryTimestamp = ref(Date.now());
const historyGroups = computed(() => [
  { title: "今天", count: "2 条对话", items: [
    { title: "长潭水库无人机无人船协同巡检", time: formatTime(todayHistoryTimestamp.value), summary: "无人机与无人船已前往长潭水库执行巡检任务", devices: "无人机 A01 · 无人船 S02", status: "执行中", icon: "ri-flight-takeoff-line", type: "drone", current: true },
    { title: "西岸入口一键封控", time: formatTime(todayHistoryTimestamp.value - 60 * 60 * 1000), summary: "已完成封控指令下发，警车与无人机到位", devices: "警车 02 · 无人机 A01", status: "已完成", icon: "ri-shield-check-line", type: "control" },
  ] },
  { title: "昨天", count: "3 条对话", items: [
    { title: "辖区夜间巡航", time: "18:40", summary: "完成东侧道路与河岸巡查，未发现异常", devices: "无人机 A01", status: "已完成", icon: "ri-flight-takeoff-line", type: "drone" },
    { title: "重点车辆车牌采集", time: "15:26", summary: "已采集目标车辆车牌与经过时间", devices: "警车 02 · 路口相机", status: "已完成", icon: "ri-car-line", type: "vehicle" },
    { title: "北侧水面巡检", time: "09:12", summary: "无人船完成巡检航线并回传水面状态", devices: "无人船 S02", status: "已完成", icon: "ri-ship-line", type: "boat" },
  ] },
]);
const quickActions = ["一键封控", "拍车牌", "拍人脸"];
const onlineMembers = [
  { type: "drone", icon: "ri-flight-takeoff-line", name: "无人机 A01", detail: "空中巡检中" },
  { type: "boat", icon: "ri-ship-line", name: "无人船 S02", detail: "水面巡检中" },
  { type: "robot", icon: "ri-robot-2-line", name: "机器人 R06", detail: "待命中" },
];
const offlineMembers = [
  { icon: "ri-flight-takeoff-line", name: "无人机 A03", detail: "最后在线 10:25" },
  { icon: "ri-ship-line", name: "无人船 S05", detail: "最后在线 昨日 18:40" },
];
const messages = ref([]);
const conversationStartLabel = computed(() => {
  const firstMessage = messages.value[0];
  if (!firstMessage) return "";
  const date = new Date(firstMessage.timestamp);
  const today = new Date();
  const day = date.toDateString() === today.toDateString()
    ? "今天"
    : `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  return `${day} ${formatTime(firstMessage.timestamp)}`;
});
// 后续在此替换或补充智能体的固定回复。
const fixedReply = "收到。我将安排无人机和无人船前往长潭水库执行巡检任务，并分别反馈空中与水面巡检结果。";
const fixedSummary = "无人机和无人船均已抵达长潭水库，正在分别执行空中与水面巡检，巡检结果将持续同步。";
let nextMessageId = 1;
let conversationVersion = 0;
const pendingTimers = new Map();

function cancelPlayback() {
  conversationVersion++;
  for (const [timer, resolve] of pendingTimers) {
    clearTimeout(timer);
    resolve(false);
  }
  pendingTimers.clear();
}

function waitForPlayback(delay, version) {
  if (version !== conversationVersion) return Promise.resolve(false);
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      pendingTimers.delete(timer);
      resolve(version === conversationVersion);
    }, delay);
    pendingTimers.set(timer, resolve);
  });
}

async function typeText(target, field, text, version) {
  for (const character of text) {
    if (!await waitForPlayback(45, version)) return false;
    target[field] += character;
  }
  return true;
}

async function playTask(message, version) {
  if (!await typeText(message, "text", fixedReply, version)) return;
  message.taskVisible = true;
  if (!await waitForPlayback(3000, version)) return;
  message.pending = true;
  if (!await waitForPlayback(2000, version)) return;
  message.pending = false;
  message.devices.push({ type: "drone", author: "无人机智能体", name: "无人机 A01", inspecting: false, text: "已接收长潭水库巡检任务，正在前往巡检区域" });
  if (!await waitForPlayback(5000, version)) return;
  message.devices.push({ type: "boat", author: "无人船智能体", name: "无人船 S02", inspecting: false, text: "已接收长潭水库巡检任务，正在前往巡检区域。" });
  if (!await waitForPlayback(5000, version)) return;
  Object.assign(message.devices[0], { inspecting: true, text: "已抵达长潭水库巡检位置，正在回传现场画面。" });
  if (!await waitForPlayback(3000, version)) return;
  Object.assign(message.devices[1], { inspecting: true, text: "已抵达长潭水库水域，正在执行水面巡检。" });
  if (!await waitForPlayback(4000, version)) return;
  message.summaryVisible = true;
  await typeText(message, "summary", fixedSummary, version);
}

onBeforeUnmount(cancelPlayback);

function startNewChat() {
  cancelPlayback();
  messages.value = [];
  draft.value = "";
  membersVisible.value = false;
  viewMode.value = "chat";
}
function onComposerKeydown(event) {
  if (event.key !== "Enter" || event.shiftKey || event.ctrlKey || event.altKey || event.metaKey || event.isComposing || event.keyCode === 229) return;
  event.preventDefault();
  sendMessage();
}
function sendQuick(text) {
  draft.value = text;
  sendMessage();
}
function sendMessage() {
  const text = draft.value.trim();
  if (!text) return;
  const timestamp = Date.now();
  if (!messages.value.length) todayHistoryTimestamp.value = timestamp;
  const time = formatTime(timestamp);
  messages.value.push({ id: nextMessageId++, role: "user", author: "指挥员", timestamp, time, text });
  messages.value.push({ id: nextMessageId++, role: "assistant", author: "总调度智能体", timestamp, time, text: "", taskVisible: false, pending: false, devices: [], summaryVisible: false, summary: "" });
  draft.value = "";
  void playTask(messages.value[messages.value.length - 1], conversationVersion);
}
watch(messages, () => nextTick(() => { if (messageListRef.value) messageListRef.value.scrollTop = messageListRef.value.scrollHeight; }), { deep: true });
</script>

<style scoped>
.agent-center {
  position: fixed;
  right: 24px;
  bottom: 24px;
  z-index: 2100;
  width: min(584px, calc(100vw - 32px));
  height: min(672px, calc(100dvh - 112px));
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid #e5e9ef;
  border-radius: 14px;
  background: #f6f7f9;
  box-shadow: 0 20px 70px rgba(0,0,0,.28);
  color: #1f2329;
  font-family: Inter, "PingFang SC", sans-serif;
}

.agent-members {
  position: fixed;
  right: 620px;
  bottom: 24px;
  z-index: 2099;
  width: min(322px, calc(100vw - 32px));
  height: min(672px, calc(100dvh - 112px));
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid #e5e9ef;
  border-radius: 14px;
  background: #f7f8fa;
  box-shadow: 0 20px 70px rgba(0, 0, 0, .22);
  color: #1f2329;
  font-family: Inter, "PingFang SC", sans-serif;
}

.agent-members__header {
  position: relative;
  flex: 0 0 76px;
  height: 76px;
  box-sizing: border-box;
  border-bottom: 1px solid #e9ecf1;
  background: #fff;
}

.agent-members__header-icon {
  position: absolute;
  left: 17px;
  top: 29px;
  width: 17px;
  height: 18px;
  display: grid;
  place-items: center;
  color: #1677ff;
  font-size: 17px;
}

.agent-members__heading {
  position: absolute;
  left: 45px;
  top: 15px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.agent-members__heading strong {
  font-size: 16px;
  line-height: 24px;
  font-weight: 600;
}

.agent-members__heading > span {
  color: #86909c;
  font-size: 12px;
  line-height: 18px;
}

.agent-members__content {
  flex: 1 1 auto;
  min-height: 0;
  overflow: auto;
  padding: 15px 16px 20px;
}

.agent-members__search {
  height: 36px;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 11px;
  border: 1px solid #e4e8ee;
  border-radius: 7px;
  background: #fff;
  color: #a4acb7;
  font-size: 12px;
}

.agent-members__search i {
  font-size: 13px;
}

.agent-members__group {
  margin-top: 15px;
}

.agent-members__group h3 {
  height: 18px;
  margin: 0 0 8px;
  color: #606a78;
  font-size: 12px;
  line-height: 18px;
  font-weight: 600;
}

.agent-member {
  height: 70px;
  box-sizing: border-box;
  position: relative;
  display: flex;
  align-items: center;
  margin-bottom: 8px;
  padding: 0 12px;
  border: 1px solid #ebedf1;
  border-radius: 10px;
  background: #fff;
}

.agent-member__icon {
  width: 44px;
  height: 44px;
  flex: 0 0 44px;
  display: grid;
  place-items: center;
  border-radius: 9px;
  background: #f0f1f3;
  color: #aeb5bf;
  font-size: 20px;
}

.agent-member__icon--drone {
  background: #eaf3ff;
  color: #1677ff;
}

.agent-member__icon--boat {
  background: #e8f9f8;
  color: #07aab5;
}

.agent-member__icon--robot {
  background: #f1eeff;
  color: #7968d6;
}

.agent-member__info {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 1px;
  margin-left: 12px;
}

.agent-member__info strong {
  color: #1f2329;
  font-size: 13px;
  line-height: 20px;
  font-weight: 600;
}

.agent-member__info small {
  color: #86909c;
  font-size: 12px;
  line-height: 18px;
  white-space: nowrap;
}

.agent-member__status {
  position: absolute;
  right: 11px;
  bottom: 9px;
  display: flex;
  align-items: center;
  gap: 4px;
  color: #2ba573;
  font-size: 11px;
  line-height: 17px;
}

.agent-member__status > i {
  position: absolute;
  right: 4px;
  bottom: 27px;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #2db67d;
}

.agent-members__group--offline {
  margin-top: 0;
}

.agent-members__group--offline h3 {
  color: #8c949f;
}

.agent-member--offline .agent-member__info strong {
  color: #969da8;
}

.agent-member--offline .agent-member__info small {
  color: #aeb4bd;
}

.agent-member--offline .agent-member__status {
  right: 11px;
  bottom: 9px;
  color: #a0a7b1;
}

.agent-member--offline .agent-member__status > i {
  background: #b5bbc4;
}

.agent-members__footer {
  flex: 0 0 63px;
  height: 63px;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 17px;
  border-top: 1px solid #e9ecf1;
  background: #fff;
  color: #98a0aa;
  font-size: 12px;
}

.agent-members__refresh {
  height: 29px;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 0 9px;
  border-radius: 6px;
  background: #f1f6ff;
  color: #1677ff;
}

.agent-center__header {
  height: 68px;
  flex: 0 0 68px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 18px;
  border-bottom: 1px solid #e8ebf0;
  background: #fff;
}

.agent-history__header {
  height: 68px;
  flex: 0 0 68px;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  padding: 0 18px;
  border-bottom: 1px solid #e8ebf0;
  background: #fff;
}

.agent-history__back {
  width: 30px;
  height: 32px;
  display: grid;
  place-items: center;
  margin-right: 9px;
  padding: 0;
  border: 0;
  background: transparent;
  color: #4e5969;
  font-size: 18px;
  cursor: pointer;
}

.agent-history__title { min-width: 0; }
.agent-center .agent-history__title h2 { font-size: 14px; line-height: 20px; }
.agent-center .agent-history__title p { margin-top: 1px; font-size: 11px; line-height: 16px; }
.agent-history__actions { display: flex; align-items: center; gap: 10px; margin-left: auto; }
.agent-history__actions > button { display: flex; align-items: center; gap: 5px; padding: 0; border: 0; background: transparent; color: #4e5969; font: inherit; font-size: 12px; line-height: 18px; white-space: nowrap; cursor: pointer; }
.agent-history__actions > button i { font-size: 14px; }
.agent-history__actions > b { padding: 4px 7px; border-radius: 10px; background: #f1f6ff; color: #1677ff; font-size: 10px; font-weight: 500; white-space: nowrap; }
.agent-history__search { height: 72px; flex: 0 0 72px; box-sizing: border-box; display: flex; align-items: center; padding: 0 18px; background: #f6f7f9; }
.agent-history__search > div { width: 100%; height: 38px; box-sizing: border-box; display: flex; align-items: center; gap: 9px; padding: 0 12px; border: 1px solid #e4e8ee; border-radius: 7px; background: #fff; color: #a4acb7; font-size: 12px; }
.agent-history__search i { font-size: 14px; }
.agent-history__list { flex: 1; min-height: 0; overflow: auto; padding: 0 18px 15px; }
.agent-history__group-heading { height: 22px; display: flex; align-items: center; justify-content: space-between; margin: 0 0 8px; }
.agent-history__group-heading:not(:first-child) { margin-top: 0; }
.agent-history__group-heading h3 { margin: 0; color: #7a8390; font-size: 12px; line-height: 18px; font-weight: 600; }
.agent-history__group-heading > span { color: #a2a9b3; font-size: 11px; line-height: 17px; }
.agent-history__item { box-sizing: border-box; height: 80px; display: flex; align-items: flex-start; gap: 11px; margin-bottom: 8px; padding: 12px; border: 1px solid #e7ebf0; border-radius: 9px; background: #fff; }
.agent-history__item--current { height: 83px; border-color: #b9d9ff; background: #eaf3ff; }
.agent-history__item-icon { width: 34px; height: 34px; flex: 0 0 34px; display: grid; place-items: center; border-radius: 8px; background: #eaf3ff; color: #1677ff; font-size: 15px; }
.agent-history__item-icon--drone { background: #eaf3ff; color: #1677ff; }
.agent-history__item-icon--control,.agent-history__item-icon--vehicle { background: #eaf3ff; color: #1677ff; }
.agent-history__item-icon--boat { background: #e8f9f8; color: #07aab5; }
.agent-history__item-content { min-width: 0; flex: 1; display: flex; flex-direction: column; gap: 5px; }
.agent-history__item-top { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.agent-history__item h4 { overflow: hidden; margin: 0; color: #252b35; font-size: 12px; line-height: 18px; font-weight: 600; text-overflow: ellipsis; white-space: nowrap; }
.agent-history__item time { flex: 0 0 auto; color: #929aa5; font-size: 10px; line-height: 16px; }
.agent-history__item-content > p { overflow: hidden; margin: 0; color: #86909c; font-size: 11px; line-height: 17px; text-overflow: ellipsis; white-space: nowrap; }
.agent-history__item-bottom { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.agent-history__devices { overflow: hidden; display: inline-flex; align-items: center; color: #86909c; font-size: 10px; line-height: 15px; text-overflow: ellipsis; white-space: nowrap; }
.agent-history__status { flex: 0 0 auto; display: inline-flex; align-items: center; gap: 4px; color: #24a06b; font-size: 10px; }
.agent-history__status > i { width: 5px; height: 5px; border-radius: 50%; background: #2db67d; }
.agent-history__status--running { color: #1677ff; }
.agent-history__status--running > i { background: #1677ff; }

.agent-center__identity {
  display: flex;
  align-items: center;
  gap: 10px;
}

.agent-center__avatar {
  width: 38px;
  height: 38px;
  display: grid;
  place-items: center;
  border-radius: 10px;
  background: #1677ff;
  color: #fff;
  font-size: 18px;
}

.agent-center h2 {
  margin: 0;
  font-size: 15px;
  line-height: 21px;
  font-weight: 600;
}

.agent-center p {
  margin: 1px 0 0;
  color: #86909c;
  font-size: 12px;
  line-height: 17px;
}

.agent-center__actions {
  display: flex;
  align-items: center;
  gap: 15px;
}

.agent-center__action,.agent-center__close,.agent-center__member,.agent-center__quick,.agent-center__voice {
  border: 0;
  background: transparent;
  color: #4e5969;
  cursor: pointer;
}

.agent-center__action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  padding: 0;
  height: 28px;
  font-size: 12px;
  line-height: 20px;
}

.agent-center__action i {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 20px;
  font-size: 14px;
  line-height: 1;
}

.agent-center__close {
  display: grid;
  place-items: center;
  padding: 2px;
  font-size: 18px;
}

.agent-center__divider {
  width: 1px;
  height: 16px;
  background: #e5e9ef;
}

.agent-center__messages {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 14px 18px 8px;
}

.agent-center__date {
  margin: 0 auto 12px;
  text-align: center;
  color: #9aa1ab;
  font-size: 12px;
  line-height: 18px;
}

.agent-message {
  display: flex;
  gap: 9px;
  margin-bottom: 14px;
}

.agent-message--user {
  flex-direction: row-reverse;
}

.agent-message__avatar {
  width: 34px;
  height: 34px;
  flex: 0 0 34px;
  display: grid;
  place-items: center;
  border-radius: 8px;
  background: #1677ff;
  color: #fff;
  font-size: 13px;
  font-weight: 600;
}

.agent-message--user .agent-message__avatar {
  background: #d4e9ff;
  color: #1677ff;
}

.agent-message__body {
  min-width: 0;
  max-width: 451px;
}

.agent-message--user .agent-message__body {
  text-align: right;
}

.agent-message__meta {
  display: block;
  margin-bottom: 5px;
  color: #86909c;
  font-size: 12px;
  line-height: 17px;
}

.agent-message__bubble {
  padding: 10px 13px;
  border-radius: 8px;
  background: #fff;
  line-height: 22px;
  font-size: 14px;
  text-align: left;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.agent-message--user .agent-message__bubble {
  background: #dceeff;
}

.agent-task-card {
  margin: 2px 0 10px 43px;
  border: 1px solid #e4e8ed;
  border-radius: 8px;
  background: #fff;
}

.agent-task-card__title {
  height: 37px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 13px;
  border-bottom: 1px solid #eef0f3;
  font-size: 13px;
  font-weight: 600;
}

.agent-task-card__title > span {
  width: 3px;
  height: 15px;
  border-radius: 2px;
  background: #1677ff;
}

.agent-task-card__item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 13px 0;
}

.agent-task-card__item:last-child {
  padding-bottom: 10px;
}

.agent-task-card__icon {
  width: 30px;
  height: 30px;
  display: grid;
  place-items: center;
  border-radius: 7px;
  background: #eaf3ff;
  color: #1677ff;
  font-size: 15px;
}

.agent-task-card__item b,.agent-task-card__item small {
  display: block;
}

.agent-task-card__item b {
  font-size: 13px;
  line-height: 18px;
  font-weight: 500;
}

.agent-task-card__item small {
  color: #86909c;
  font-size: 12px;
  line-height: 17px;
}

.agent-center__pending {
  margin-left: 43px;
  margin-bottom: 14px;
  color: #86909c;
  font-size: 12px;
}

.agent-execution-card {
  margin: 12px 0;
  padding: 12px;
  border: 1px solid #e4e8ed;
  border-radius: 9px;
  background: #fff;
}

.agent-execution-card__header {
  display: flex;
  align-items: center;
  gap: 10px;
}

.agent-execution-card__icon {
  width: 32px;
  height: 32px;
  flex: 0 0 32px;
  display: grid;
  place-items: center;
  border-radius: 8px;
  background: #eaf3ff;
  color: #1677ff;
  font-size: 18px;
}

.agent-execution-card__icon--boat {
  background: #e8f9f8;
  color: #07aab5;
}

.agent-execution-card__identity {
  min-width: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.agent-execution-card__identity strong {
  font-size: 14px;
  line-height: 20px;
  font-weight: 600;
}

.agent-execution-card__identity small {
  color: #86909c;
  font-size: 11px;
  line-height: 17px;
}

.agent-execution-card__status {
  flex: 0 0 auto;
  padding: 4px 9px;
  border-radius: 4px;
  background: #eaf3ff;
  color: #1677ff;
  font-size: 11px;
  line-height: 17px;
}

.agent-execution-card__status--inspecting {
  background: #e8f7ef;
  color: #2ba573;
}

.agent-center .agent-execution-card > p {
  margin: 10px 0 0;
  color: #66717f;
  font-size: 12px;
  line-height: 20px;
  overflow-wrap: anywhere;
}

.agent-summary-card {
  margin: 12px 0;
  padding: 12px;
  border: 1px solid #b7dfd0;
  border-radius: 8px;
  background: #effaf6;
}

.agent-summary-card__title {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #278976;
  font-size: 13px;
  line-height: 20px;
  font-weight: 600;
}

.agent-summary-card__title > i {
  display: grid;
  place-items: center;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: #e2f5eb;
  color: #4bab88;
  font-size: 17px;
}

.agent-center .agent-summary-card > p {
  margin: 10px 0 0;
  color: #5f7e73;
  font-size: 12px;
  line-height: 20px;
  overflow-wrap: anywhere;
}

.agent-center__pending i {
  margin-right: 7px;
  color: #1677ff;
  font-size: 7px;
}

.agent-center__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: 100%;
  min-height: 114px;
  color: #86909c;
  font-size: 12px;
  line-height: 18px;
  text-align: center;
}

.agent-center__empty-icon {
  width: 56px;
  height: 56px;
  flex: 0 0 56px;
  display: grid;
  place-items: center;
  border-radius: 16px;
  background: #eaf3ff;
  color: #1677ff;
  font-size: 25px;
}

.agent-center__empty strong {
  color: #1f2329;
  font-size: 16px;
  line-height: 24px;
  font-weight: 600;
}

.agent-center__composer {
  flex: 0 0 166px;
  height: 166px;
  background: #fff;
  border-top: 1px solid #e6e9ef;
}

.agent-center__quick-row {
  height: 49px;
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 0 16px;
  border-bottom: 1px solid #f0f1f3;
}

.agent-center__member {
  height: 26px;
  padding: 4px 8px;
  border: 1px solid #e5e9ef;
  border-radius: 8px;
  background: #eaf3ff;
  color: #1f2329;
  font-size: 12px;
}

.agent-center__quick-label {
  margin-left: 5px;
  color: #86909c;
  font-size: 12px;
}

.agent-center__quick {
  height: 25px;
  padding: 0 9px 0 28px;
  border-radius: 8px;
  background: #f1f6ff;
  color: #1f2329;
  font-size: 12px;
  position: relative;
}

.agent-center__quick i {
  position: absolute;
  left: 9px;
  top: 6px;
  color: #1677ff;
}

.agent-center textarea {
  box-sizing: border-box;
  width: 100%;
  height: 77px;
  resize: none;
  border: 0;
  outline: 0;
  padding: 11px 17px 0;
  color: #1f2329;
  font: 13px/20px Inter,"PingFang SC",sans-serif;
}

.agent-center textarea::placeholder {
  color: #a2a9b3;
}

.agent-center__toolbar {
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 17px;
  color: #a2a9b3;
  font-size: 11px;
}

.agent-center__voice {
  font-size: 15px;
}

.agent-center__toolbar > span {
  margin-left: auto;
  margin-right: 9px;
}

.agent-center__send {
  height: 30px;
  padding: 0 15px;
  border: 0;
  border-radius: 5px;
  background: #1677ff;
  color: #fff;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}

.agent-center__send:disabled {
  cursor: not-allowed;
  opacity: .45;
}

@media (max-width: 767px) {
  .agent-members {
    left: 8px;
    right: auto;
    bottom: 210px;
    z-index: 2101;
    width: min(322px, calc(100vw - 16px));
    height: min(672px, calc(100dvh - 228px));
  }
  .agent-center {
    right: 8px;
    bottom: 86px;
    width: calc(100vw - 16px);
    height: min(672px, calc(100vh - 104px));
  }
  .agent-center__actions {
    gap: 8px;
  }
  .agent-center__action:nth-of-type(2),.agent-center__divider {
    display: none;
  }
  .agent-center__close {
    display: block;
  }
  .agent-center__quick-row {
    overflow-x: auto;
    white-space: nowrap;
  }
  .agent-center__quick {
    flex: 0 0 auto;
  }
}
</style>
