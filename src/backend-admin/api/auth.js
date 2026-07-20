import { requestData } from "@backend/utils/request.js";

export function login(data) {
  return requestData("/auth/login", data, "POST");
}

export function logout() {
  return requestData("/auth/logout", {}, "POST");
}

export function changePassword(data) {
  return requestData("/auth/changePassword", data, "POST");
}

export function fetchMe() {
  return requestData("/auth/me", {}, "GET");
}
