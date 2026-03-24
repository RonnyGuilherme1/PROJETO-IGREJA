const API_BASE_URL = "/api";
const API_CONFIG_SOURCE = "next-proxy";

export function getApiConfig() {
  return {
    baseUrl: API_BASE_URL,
    isConfigured: true,
    envKey: API_CONFIG_SOURCE,
  };
}

export const apiConfig = {
  get baseUrl() {
    return API_BASE_URL;
  },
  get isConfigured() {
    return true;
  },
  get envKey() {
    return API_CONFIG_SOURCE;
  },
};
