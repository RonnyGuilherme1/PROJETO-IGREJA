const API_ENV_KEY = "NEXT_PUBLIC_API_URL";

function normalizeApiBaseUrl(value?: string | null) {
  return value?.trim().replace(/\/+$/, "") ?? "";
}

function readServerApiUrl() {
  return normalizeApiBaseUrl(process.env.NEXT_PUBLIC_API_URL);
}

function readClientApiUrl() {
  if (typeof document === "undefined") {
    return "";
  }

  return normalizeApiBaseUrl(document.documentElement.dataset.apiUrl);
}

export function getApiConfig() {
  const baseUrl =
    typeof window === "undefined" ? readServerApiUrl() : readClientApiUrl() || readServerApiUrl();

  return {
    baseUrl,
    isConfigured: baseUrl.length > 0,
    envKey: API_ENV_KEY,
  };
}

export const apiConfig = {
  get baseUrl() {
    return getApiConfig().baseUrl;
  },
  get isConfigured() {
    return getApiConfig().isConfigured;
  },
  get envKey() {
    return API_ENV_KEY;
  },
};
