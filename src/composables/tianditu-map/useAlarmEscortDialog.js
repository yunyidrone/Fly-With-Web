import { ElMessageBox } from "element-plus";

/**
 * 告警伴飞弹窗交互。
 *
 * 这部分只负责“怎么展示告警伴飞弹窗、怎么读取用户选择、怎么返回用户动作”：
 * - 普通模式：Element Plus 的确认按钮代表“开始伴飞”；
 * - 沉浸模式：弹窗内提供“开始伴飞”和“开始伴飞并跳转”两个自定义按钮；
 * - 业务数据获取、目标校验和真正提交伴飞动作都由主组件通过回调提供。
 */
export function useAlarmEscortDialog(options = {}) {
  const {
    ensureTargetBindAllowed,
    resolveCanonicalTargetId,
    findTargetByMqttKey,
    getTargets,
    getTargetTypeLabel,
    buildSuggestDronesQuery,
    getReadySuggestedDrones,
    mapSuggestedDronesForSelect,
    isImmersiveFlight,
    applyEscortFollowAction,
    warn = console.warn,
  } = options;

  function buildSuggestedDroneOptions(suggestedList) {
    if (!suggestedList.length) return '<option value="">暂无可用无人机</option>';
    return suggestedList
      .map(
        (drone, index) =>
          `<option value="${drone.id}" data-sn="${drone.sn}" ${index === 0 ? "selected" : ""}>${drone.label}</option>`,
      )
      .join("");
  }

  /**
   * 打开告警伴飞弹窗，并返回用户选择的动作。
   * @returns {Promise<null | 'follow-full' | 'follow-only' | 'follow-and-switch'>}
   */
  function promptAlarmEscortAction({
    vehicleName,
    targetTypeLabel,
    optionsHtml,
    isImmersive,
    hasSuggestedDrones,
  }) {
    const immersiveActionsHtml =
      isImmersive && hasSuggestedDrones
        ? `<div class="alarm-dialog__immersive-btns">
        <button type="button" id="alarm-start-follow-only" class="alarm-dialog__btn alarm-dialog__btn--primary">开始伴飞</button>
        <button type="button" id="alarm-start-follow-jump" class="alarm-dialog__btn alarm-dialog__btn--jump" title="将退出当前沉浸并切换到新伴飞目标">开始伴飞并跳转</button>
      </div>`
        : "";

    const html = `<style>
      #alarm-drone-select option { color: #fff; background: #1c222a; }
    </style>
    <div style="padding: 10px;">
      <h4 style="margin: 0 0 10px 0;">接收到伴飞请求</h4>
      <p style="margin: 0 0 10px 0;">目标设备：${vehicleName}（${targetTypeLabel}）</p>
      <div style="margin-top:10px;display: flex;">
        <label for="alarm-drone-select" style="margin-left: -18px;">推荐无人机：</label>
        <select id="alarm-drone-select" style="width:250px;height:32px;padding:8px;border:1px solid #30363b;background:rgba(255,255,255,0.08);border-radius:2px;color:#fff;">
          ${optionsHtml}
        </select>
      </div>
      ${immersiveActionsHtml}
    </div>`;

    return new Promise((resolve) => {
      let settled = false;
      const finish = (action) => {
        if (settled) return;
        settled = true;
        resolve(action);
      };

      ElMessageBox({
        title: "伴飞请求",
        message: html,
        dangerouslyUseHTMLString: true,
        showConfirmButton: !isImmersive && hasSuggestedDrones,
        showCancelButton: true,
        confirmButtonText: "开始伴飞",
        cancelButtonText: "取消",
        type: "warning",
        customClass: isImmersive
          ? "alarm-dialog alarm-dialog--immersive"
          : "alarm-dialog",
        closeOnClickModal: false,
        beforeClose: (action, _instance, done) => {
          if (!settled && (action === "cancel" || action === "close")) {
            finish(null);
          }
          done();
        },
      })
        .then(() => {
          if (!isImmersive && hasSuggestedDrones) finish("follow-full");
        })
        .catch(() => finish(null));

      if (isImmersive && hasSuggestedDrones) {
        requestAnimationFrame(() => {
          const bind = (elementId, action) => {
            const btn = document.getElementById(elementId);
            if (!btn) return;
            btn.addEventListener(
              "click",
              () => {
                ElMessageBox.close();
                finish(action);
              },
              { once: true },
            );
          };
          bind("alarm-start-follow-only", "follow-only");
          bind("alarm-start-follow-jump", "follow-and-switch");
        });
      }
    });
  }

  function readAlarmDroneSelection(suggestedList) {
    const selectEl = document.getElementById("alarm-drone-select");
    const selectedId = selectEl?.value || "";
    const selected = suggestedList.find(
      (drone) => String(drone?.id ?? drone?.sn ?? "") === String(selectedId),
    );
    const droneSn = String(selected?.sn || "");
    return { selectedId, droneSn };
  }

  async function showAlarmDialog(deviceId, devicePosition, terminalPhone) {
    const sn = String(terminalPhone ?? "").trim();
    if (!(await ensureTargetBindAllowed(sn))) return;

    const canonicalTargetId = resolveCanonicalTargetId(deviceId);
    if (!canonicalTargetId) {
      warn("告警伴飞：未在目标列表中解析到 targetId，跳过 suggestList", deviceId);
      return;
    }

    const vehicleData =
      findTargetByMqttKey(deviceId) ||
      (Array.isArray(getTargets?.()) ? getTargets() : []).find(
        (target) => String(target.id) === String(canonicalTargetId),
      );
    const vehicleName = vehicleData?.name || canonicalTargetId;
    const resolvedTargetTypeLabel = getTargetTypeLabel(vehicleData);
    const suggestedList = mapSuggestedDronesForSelect(
      await getReadySuggestedDrones(
        buildSuggestDronesQuery(canonicalTargetId, devicePosition),
        true,
      ),
    );

    const optionsHtml = buildSuggestedDroneOptions(suggestedList);
    const hasSuggestedDrones = suggestedList.length > 0;
    const action = await promptAlarmEscortAction({
      vehicleName,
      targetTypeLabel: resolvedTargetTypeLabel,
      optionsHtml,
      isImmersive: Boolean(isImmersiveFlight?.()),
      hasSuggestedDrones,
    });
    if (!action) return;

    const { selectedId, droneSn } = readAlarmDroneSelection(suggestedList);
    await applyEscortFollowAction(action, canonicalTargetId, droneSn, selectedId);
  }

  return {
    showAlarmDialog,
  };
}
