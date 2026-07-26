/** 密码强度：8-20 位，含数字、字母（大小写均可）、特殊字符，且无空格 */
export const PASSWORD_COMPLEXITY_MESSAGE =
  "密码必须包含数字、字母和特殊字符，长度为 8-20 位，且不能有空格";

/**
 * @param {unknown} value
 */
export function isComplexPassword(value) {
  const password = String(value ?? "");
  if (!password || /\s/.test(password)) return false;
  if (password.length < 8 || password.length > 20) return false;
  if (!/[0-9]/.test(password)) return false;
  if (!/[A-Za-z]/.test(password)) return false;
  if (!/[^A-Za-z0-9]/.test(password)) return false;
  return true;
}

/**
 * Element Plus 表单校验器
 * @param {import('element-plus').FormItemRule} _rule
 * @param {unknown} value
 * @param {(error?: Error) => void} callback
 */
export function validateComplexPassword(_rule, value, callback) {
  if (!value) {
    callback();
    return;
  }
  if (!isComplexPassword(value)) {
    callback(new Error(PASSWORD_COMPLEXITY_MESSAGE));
    return;
  }
  callback();
}
