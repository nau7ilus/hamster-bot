const axios = require("axios");
const API_URL = "https://discord.com/api";

const request = async (endpoint, { method = "get", body, userData = {} } = {}) => {
  if (!userData) throw new TypeError("Не указаны данные для входа");

  const res = await axios[method](`${API_URL}${endpoint}`, {
    headers: { Authorization: `${userData.token_type} ${userData.access_token}` },
    body: body ? JSON.stringify(body) : undefined,
    method,
  });
  const isSuccess = res && res.status === 200;
  return isSuccess ? res.data : null;
};

module.exports = request;
