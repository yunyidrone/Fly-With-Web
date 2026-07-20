import { requestData } from "@backend/utils/request.js";

export function fetchUserPage(params) {
  return requestData("/user/pageQuery", { params }, "GET");
}

export function fetchUserDetail(params) {
  return requestData("/user/detail", { params }, "GET");
}

export function createUser(data) {
  return requestData("/user/add", data, "POST");
}

export function updateUser(data) {
  return requestData("/user/update", data, "POST");
}

export function deleteUser(data) {
  return requestData("/user/delete", data, "POST");
}

export function resetUserPassword(data) {
  return requestData("/user/resetPassword", data, "POST");
}

export function updateUserStatus(data) {
  return requestData("/user/status/update", data, "POST");
}
