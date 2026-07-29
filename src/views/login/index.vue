<template>
  <div class="login-v2">
    <div class="login-v2__bg" :style="{ backgroundImage: `url(${loginBg})` }" />

    <aside class="login-v2__panel">
      <div class="login-v2__content">
        <div class="login-v2__top-spacer" />

        <header class="login-v2__brand">
          <h1 class="login-v2__title">伴飞客户端调度中心</h1>
          <p class="login-v2__subtitle">Companion Flight Client Dispatch Center</p>
        </header>

        <div class="login-v2__title-gap" />

        <div class="login-v2__form-wrap">
          <el-form
            ref="formRef"
            class="login-v2__form"
            :model="form"
            :rules="rules"
            @keyup.enter="submit"
          >
            <div class="login-v2__field">
              <label class="login-v2__label">账号</label>
              <el-form-item prop="username" class="login-v2__form-item">
                <el-input
                  v-model="form.username"
                  placeholder="请输入账号"
                  clearable
                  class="login-v2__input"
                >
                  <template #prefix>
                    <img :src="loginUserIcon" alt="" class="login-v2__input-icon" />
                  </template>
                </el-input>
              </el-form-item>
            </div>

            <div class="login-v2__field">
              <label class="login-v2__label">密码</label>
              <el-form-item prop="password" class="login-v2__form-item">
                <el-input
                  v-model="form.password"
                  type="password"
                  placeholder="请输入密码"
                  show-password
                  class="login-v2__input"
                >
                  <template #prefix>
                    <img :src="loginPasswordIcon" alt="" class="login-v2__input-icon" />
                  </template>
                </el-input>
              </el-form-item>
            </div>

            <label class="login-v2__remember">
              <input v-model="rememberPassword" type="checkbox" class="login-v2__remember-input" />
              <span class="login-v2__remember-box" />
              <span>记住密码</span>
            </label>

            <button
              type="button"
              class="login-v2__submit"
              :disabled="loading"
              @click="submit"
            >
              {{ loading ? "登录中..." : "登录" }}
            </button>
          </el-form>

          <div v-if="useMock" class="login-v2__hint">
            Mock：admin / admin123、org1 / org123、viewer1 / view123
          </div>
        </div>

        <div class="login-v2__bottom-spacer" />
      </div>
    </aside>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, ref, reactive } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import { networkConfig } from "@/config/network.js";
import { useAuthStore } from "@/stores/auth.js";
import loginBg from "@/assets/images/login.png";
import loginUserIcon from "@/assets/images/login_user.png";
import loginPasswordIcon from "@/assets/images/login_password.png";

const REMEMBER_KEY = "admin-login-remember";

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const useMock = networkConfig.useMock;

const formRef = ref();
const loading = ref(false);
const rememberPassword = ref(false);

const form = reactive({
  username: "",
  password: "",
});

const rules = {
  username: [{ required: true, message: "请输入账号", trigger: "blur" }],
  password: [{ required: true, message: "请输入密码", trigger: "blur" }],
};

function loadRememberedAccount() {
  try {
    const raw = localStorage.getItem(REMEMBER_KEY);
    if (!raw) return;
    const data = JSON.parse(raw);
    form.username = data.username || "";
    form.password = data.password || "";
    rememberPassword.value = true;
  } catch {
    localStorage.removeItem(REMEMBER_KEY);
  }
}

function persistRememberAccount() {
  if (rememberPassword.value) {
    localStorage.setItem(
      REMEMBER_KEY,
      JSON.stringify({ username: form.username, password: form.password }),
    );
    return;
  }
  localStorage.removeItem(REMEMBER_KEY);
}

async function submit() {
  await formRef.value.validate();
  loading.value = true;
  try {
    await authStore.login(form);
    persistRememberAccount();
    if (authStore.mustChangePassword) {
      ElMessage.warning("首次登录请先修改初始密码");
      router.replace({ path: "/force-change-password" });
      return;
    }
    const redirect = route.query.redirect || "/";
    router.replace(String(redirect));
  } finally {
    loading.value = false;
  }
}

const MOBILE_LOGIN_ROOT_FONT = "16px";

function applyPageScrollLock() {
  const isMobile = window.matchMedia("(max-width: 768px)").matches;
  const overflow = isMobile ? "auto" : "hidden";
  document.documentElement.style.overflow = overflow;
  document.body.style.overflow = overflow;
}

function applyLoginMobileLayout() {
  const isMobile = window.matchMedia("(max-width: 768px)").matches;
  if (isMobile) {
    document.documentElement.style.fontSize = MOBILE_LOGIN_ROOT_FONT;
    return;
  }
  document.documentElement.style.fontSize = "";
  window.dispatchEvent(new Event("resize"));
}

onMounted(() => {
  applyLoginMobileLayout();
  applyPageScrollLock();
  window.addEventListener("resize", applyLoginMobileLayout);
  loadRememberedAccount();
});

onUnmounted(() => {
  window.removeEventListener("resize", applyLoginMobileLayout);
  document.documentElement.style.fontSize = "";
  window.dispatchEvent(new Event("resize"));
  document.documentElement.style.overflow = "";
  document.body.style.overflow = "";
});
</script>

<style scoped lang="scss">
$login-primary: #3047ff;

.login-v2 {
  --design-h: 1080;
  --panel-w: 792;

  --login-panel-width: calc(var(--panel-w) / 1920 * 100%);
  --login-pad-x: calc(130 / var(--panel-w) * 100%);
  --login-space-title-gap: calc(74 / var(--design-h) * 100vh);

  --login-title-size: clamp(28px, calc(48 / var(--design-h) * 100vh), 48px);
  --login-subtitle-size: clamp(12px, calc(18 / var(--design-h) * 100vh), 18px);
  --login-subtitle-gap: calc(12 / var(--design-h) * 100vh);
  --login-label-size: clamp(20px, calc(16 / var(--design-h) * 100vh), 16px);
  --login-field-gap: calc(54 / var(--design-h) * 100vh);
  --login-label-gap: calc(16 / var(--design-h) * 100vh);
  --login-input-height: calc(84 / var(--design-h) * 100vh);
  --login-remember-size: clamp(16px, calc(16 / var(--design-h) * 100vh), 16px);
  --login-remember-gap: calc(8 / var(--design-h) * 100vh);
  --login-remember-box: calc(18 / var(--design-h) * 100vh);
  --login-remember-margin-top: calc(24 / var(--design-h) * 100vh);
  --login-remember-margin-bottom: calc(46 / var(--design-h) * 100vh);
  --login-btn-height: calc(84 / var(--design-h) * 100vh);
  --login-btn-size: clamp(20px, calc(20 / var(--design-h) * 100vh), 20px);
  --login-btn-letter: calc(4 / var(--design-h) * 100vh);
  --login-hint-size: clamp(11px, calc(12 / var(--design-h) * 100vh), 12px);
  --login-hint-gap: calc(16 / var(--design-h) * 100vh);

  position: fixed;
  inset: 0;
  width: 100%;
  height: 100%;
  height: 100dvh;
  overflow: hidden;
  overscroll-behavior: none;
  background: #020814;
}

.login-v2__bg {
  position: absolute;
  inset: 0;
  background-color: #020814;
  background-repeat: no-repeat;
  background-position: center center;
  background-size: 100% 100%;
}

.login-v2__panel {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 1;
  width: var(--login-panel-width);
  height: 100%;
  background: linear-gradient(270deg, rgba(3, 6, 10, 0) 0%, rgba(19, 20, 23, 0.85) 50%);
}

.login-v2__content {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  padding: 0 var(--login-pad-x);
  box-sizing: border-box;
  overflow: hidden;
}

.login-v2__top-spacer {
  flex: 187 1 0;
  min-height: 0;
}

.login-v2__title-gap {
  flex-shrink: 0;
  height: var(--login-space-title-gap);
}

.login-v2__bottom-spacer {
  flex: 255 1 0;
  min-height: 0;
}

.login-v2__brand {
  flex-shrink: 0;
}

.login-v2__form-wrap {
  flex-shrink: 0;
}

.login-v2__title {
  margin: 0;
  color: rgba(255, 255, 255, 0.9);
  font-family: Alibaba PuHuiTi, Alibaba PuHuiTi;
  font-size: var(--login-title-size);
  font-style: normal;
  font-weight: 700;
  line-height: 1.2;
  letter-spacing: 0.05em;
}

.login-v2__subtitle {
  margin: var(--login-subtitle-gap) 0 0;
  color: rgba(255, 255, 255, 0.55);
  font-family: Alibaba PuHuiTi, Alibaba PuHuiTi;
  font-size: var(--login-subtitle-size);
  font-weight: 400;
  letter-spacing: 0.15em;
}

.login-v2__form {
  width: 100%;
}

.login-v2__field {
  margin-bottom: var(--login-field-gap);
}

.login-v2__field:last-of-type {
  margin-bottom: 0;
}

.login-v2__label {
  display: block;
  margin-bottom: var(--login-label-gap);
  color: #FFF;
  font-family: "HarmonyOS Sans SC";
  font-style: normal;
  font-weight: 500;
  font-size: var(--login-label-size);
  line-height: 1;
}

.login-v2__form-item {
  margin-bottom: 0;
}

.login-v2__form-item :deep(.el-form-item__error) {
  padding-top: calc(10 / var(--design-h) * 100vh);
  color: #f56c6c;
  font-size: 16px;
}

.login-v2__input {
  width: 100%;
  --el-input-bg-color: transparent;
  --el-input-hover-bg-color: transparent;
  --el-input-focus-bg-color: transparent;
  --el-input-disabled-bg-color: transparent;
}

.login-v2__input :deep(.el-input__wrapper) {
  display: inline-flex;
  align-items: center;
  gap: 0;
  box-sizing: border-box;
  height: var(--login-input-height);
  min-height: var(--login-input-height);
  padding: 0 12px 0 32px !important;
  border: 1px solid #fff;
  border-radius: 6px;
  box-shadow: none !important;
}

.login-v2__input :deep(.el-input__wrapper:hover),
.login-v2__input :deep(.el-input__wrapper.is-focus) {
  border-color: #fff;
  box-shadow: none !important;
}

.login-v2__form-item.is-error :deep(.el-input__wrapper),
.login-v2__form-item.is-error :deep(.el-input__wrapper:hover),
.login-v2__form-item.is-error :deep(.el-input__wrapper.is-focus) {
  border-color: #f56c6c !important;
  box-shadow: none !important;
}

.login-v2__input :deep(.el-input__prefix) {
  display: inline-flex;
  align-items: center;
  flex-shrink: 0;
  margin: 0 24px 0 0;
  padding: 0 !important;
}

.login-v2__input :deep(.el-input__prefix-inner) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin: 0;
  padding: 0;
  gap: 0;
}

.login-v2__input :deep(.el-input__prefix-inner > :last-child) {
  margin: 0;
}

.login-v2__input :deep(.el-input__inner),
.login-v2__input :deep(input) {
  flex: 1;
  min-width: 0;
  height: 100%;
  line-height: var(--login-input-height);
  padding: 0;
  border: none;
  outline: none;
  background: transparent !important;
  background-color: transparent !important;
  background-image: none !important;
  box-shadow: none !important;
  overflow: hidden;
  color: #fff;
  caret-color: #fff;
  -webkit-text-fill-color: #fff;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-family: "Alibaba PuHuiTi", "PingFang SC", "Microsoft YaHei", sans-serif;
  font-size: 20px;
  font-style: normal;
  font-weight: 500;
}

.login-v2__input :deep(.el-input__inner:-webkit-autofill),
.login-v2__input :deep(.el-input__inner:-webkit-autofill:hover),
.login-v2__input :deep(.el-input__inner:-webkit-autofill:focus),
.login-v2__input :deep(.el-input__inner:-webkit-autofill:active),
.login-v2__input :deep(input:-webkit-autofill),
.login-v2__input :deep(input:-webkit-autofill:hover),
.login-v2__input :deep(input:-webkit-autofill:focus),
.login-v2__input :deep(input:-webkit-autofill:active) {
  background: transparent !important;
  background-color: transparent !important;
  -webkit-box-shadow: 0 0 0 1000px transparent inset !important;
  box-shadow: 0 0 0 1000px transparent inset !important;
  -webkit-text-fill-color: #fff !important;
  caret-color: #fff;
  transition: background-color 99999s ease-out 0s;
}

.login-v2__input :deep(.el-input__inner::placeholder) {
  overflow: hidden;
  color: rgba(255, 255, 255, 0.65);
  text-overflow: ellipsis;
  white-space: nowrap;
  font-family: "Alibaba PuHuiTi", "PingFang SC", "Microsoft YaHei", sans-serif;
  font-size: 20px;
  font-style: normal;
  font-weight: 500;
}

.login-v2__input-icon {
  width: 18px;
  height: 18px;
  margin: 0;
  object-fit: contain;
  flex-shrink: 0;
  display: block;
}

.login-v2__input :deep(.el-input__suffix) {
  display: inline-flex;
  align-items: center;
  flex-shrink: 0;
  margin: 0;
  padding: 0;
  color: rgba(255, 255, 255, 0.85);
}

.login-v2__input :deep(.el-input__suffix-inner) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin: 0;
  padding: 0;
  gap: 0;
}

.login-v2__input :deep(.el-input__clear),
.login-v2__input :deep(.el-input__password) {
  margin: 0;
  font-size: 18px;
  color: rgba(255, 255, 255, 0.85);
}

.login-v2__input :deep(.el-input__clear:hover),
.login-v2__input :deep(.el-input__password:hover) {
  color: #fff;
}

.login-v2__remember {
  display: inline-flex;
  align-items: center;
  gap: var(--login-remember-gap);
  margin: var(--login-remember-margin-top) 0 var(--login-remember-margin-bottom);
  color: rgba(255, 255, 255, 0.72);
  font-size: var(--login-remember-size);
  cursor: pointer;
  user-select: none;
}

.login-v2__remember-input {
  position: absolute;
  width: 0;
  height: 0;
  opacity: 0;
  pointer-events: none;
}

.login-v2__remember-box {
  position: relative;
  flex-shrink: 0;
  width: var(--login-remember-box);
  height: var(--login-remember-box);
  border: 1px solid rgba(255, 255, 255, 0.35);
  border-radius: 50%;
  box-sizing: border-box;
  transition: border-color 0.2s ease, background-color 0.2s ease;
}

.login-v2__remember-input:checked + .login-v2__remember-box {
  border-color: $login-primary;
  background-color: $login-primary;
}

.login-v2__remember-input:checked + .login-v2__remember-box::after {
  content: "";
  position: absolute;
  left: 50%;
  top: 46%;
  width: calc(4 / var(--design-h) * 100vh);
  height: calc(7 / var(--design-h) * 100vh);
  border: solid #fff;
  border-width: 0 calc(2 / var(--design-h) * 100vh) calc(2 / var(--design-h) * 100vh) 0;
  box-sizing: border-box;
  transform: translate(-50%, -50%) rotate(45deg);
}

.login-v2__submit {
  display: block;
  width: 100%;
  height: var(--login-btn-height);
  border: 1px solid #fff;
  border-radius: 6px;
  color: #fff;
  font-family: "Alibaba PuHuiTi", "PingFang SC", "Microsoft YaHei", sans-serif;
  font-size: var(--login-btn-size);
  font-weight: 500;
  letter-spacing: var(--login-btn-letter);
  line-height: 1;
  cursor: pointer;
  appearance: none;
  -webkit-appearance: none;
  -webkit-tap-highlight-color: transparent;
  background-color: $login-primary;

  &:hover,&:visited,&:disabled {
    opacity: 0.8;
  }
}

.login-v2__hint {
  margin-top: var(--login-hint-gap);
  color: rgba(255, 255, 255, 0.45);
  font-size: var(--login-hint-size);
  line-height: 1.6;
}

@media (max-width: 768px) {
  .login-v2 {
    --login-panel-width: 100%;
    --login-pad-x: 40px;
    --login-space-title-gap: 36px;
    --login-title-size: 36px;
    --login-subtitle-size: 14px;
    --login-subtitle-gap: 14px;
    --login-label-size: 18px;
    --login-field-gap: 32px;
    --login-label-gap: 16px;
    --login-input-height: 56px;
    --login-remember-size: 17px;
    --login-remember-gap: 12px;
    --login-remember-box: 22px;
    --login-remember-margin-top: 28px;
    --login-remember-margin-bottom: 36px;
    --login-btn-height: 56px;
    --login-btn-size: 20px;
    --login-btn-letter: 2px;
    --login-hint-size: 15px;
    --login-hint-gap: 20px;

    font-size: 16px;
    position: relative;
    min-height: 100dvh;
    overflow-x: hidden;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
  }

  .login-v2__bg {
    position: fixed;
    background-size: cover;
    background-position: center;
  }

  .login-v2__panel {
    position: relative;
    width: 100%;
    min-height: 100dvh;
    background: linear-gradient(
      180deg,
      rgba(2, 8, 20, 0.55) 0%,
      rgba(2, 8, 20, 0.88) 45%,
      rgba(2, 8, 20, 0.95) 100%
    );
  }

  .login-v2__content {
    min-height: 100dvh;
    padding: max(48px, env(safe-area-inset-top)) var(--login-pad-x)
      max(56px, env(safe-area-inset-bottom));
    justify-content: center;
    overflow: visible;
  }

  .login-v2__form-wrap {
    width: 100%;
    max-width: 100%;
  }

  .login-v2__top-spacer,
  .login-v2__bottom-spacer {
    flex: 0 0 0;
    display: none;
  }

  .login-v2__title {
    letter-spacing: 0.02em;
    word-break: break-word;
  }

  .login-v2__subtitle {
    letter-spacing: 0.06em;
    line-height: 1.5;
    word-break: break-word;
  }

  .login-v2__form-item :deep(.el-form-item__error) {
    padding-top: 8px;
    font-size: 14px;
  }

  .login-v2__input :deep(.el-input__wrapper) {
    width: 100%;
    padding: 0 18px 0 22px !important;
  }

  .login-v2__input :deep(.el-input__prefix) {
    margin: 0 18px 0 0;
  }

  .login-v2__input :deep(.el-input__inner),
  .login-v2__input :deep(input) {
    font-size: 18px;
    line-height: var(--login-input-height);
  }

  .login-v2__input :deep(.el-input__inner::placeholder) {
    font-size: 18px;
  }

  .login-v2__input-icon {
    width: 22px;
    height: 22px;
  }

  .login-v2__remember-input:checked + .login-v2__remember-box::after {
    width: 4px;
    height: 7px;
    border-width: 0 2px 2px 0;
  }

  .login-v2__hint {
    text-align: center;
    word-break: break-word;
  }
}

@media (max-width: 375px) {
  .login-v2 {
    --login-pad-x: 36px;
    --login-title-size: 32px;
    --login-subtitle-size: 13px;
  }
}
</style>

<style lang="scss">
$login-primary: #3047ff;

/* 覆盖全局 style.css 对 button 的默认样式 */
.login-v2 button.login-v2__submit,
.login-v2 button.login-v2__submit:hover,
.login-v2 button.login-v2__submit:focus,
.login-v2 button.login-v2__submit:focus-visible,
.login-v2 button.login-v2__submit:active,
.login-v2 button.login-v2__submit:disabled {
  background-color: $login-primary !important;
  border: 1px solid #fff !important;
  color: #fff !important;
  outline: none !important;
  box-shadow: none !important;
}
</style>
