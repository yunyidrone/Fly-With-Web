import { requestData } from "@backend/utils/request.js";

export function fetchOrgPage(params) {
  return requestData("/org/pageQuery", { params }, "GET");
}

export function fetchOrgDetail(params) {
  return requestData("/org/detail", { params }, "GET");
}

export function createOrg(data) {
  return requestData("/org/add", data, "POST");
}

export function updateOrg(data) {
  return requestData("/org/update", data, "POST");
}

export function deleteOrg(data) {
  return requestData("/org/delete", data, "POST");
}

export function fetchOrgTree() {
  return requestData("/org/tree", {}, "GET");
}
