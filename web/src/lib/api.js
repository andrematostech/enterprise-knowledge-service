export const extractDetail = (data) => {
  if (!data) return "";
  if (typeof data === "string") return data;
  if (Array.isArray(data.detail)) {
    return data.detail.map((item) => item.msg || item.message || JSON.stringify(item)).join(", ");
  }
  if (typeof data.detail === "object") {
    return JSON.stringify(data.detail);
  }
  return data.detail || data.message || data.error || "";
};

export const buildHeaders = ({ apiKey, token, json = false, includeAuth = true, includeApiKey = true } = {}) => {
  const headers = {};
  if (json) {
    headers["Content-Type"] = "application/json";
  }
  if (includeApiKey && apiKey) {
    headers["X-API-Key"] = apiKey;
  }
  if (includeAuth && token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
};

export const apiRequest = async ({ baseUrl, path, method = "GET", headers = {}, body }) => {
  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
    body
  });
  let data = null;
  try {
    data = await res.json();
  } catch (err) {
    data = null;
  }
  return { res, data };
};
