import axios from "axios";
import {
  getClientAccessToken,
} from "@/modules/auth/lib/auth-session";

export const http = axios.create({
  baseURL: "/api",
  timeout: 15000,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

function isAuthLoginRequest(url?: string) {
  const normalizedUrl = String(url ?? "");

  return ["/auth/login", "/auth/master/login"].some((path) =>
    normalizedUrl.includes(path),
  );
}

http.interceptors.request.use((config) => {
  if (typeof window === "undefined") {
    return config;
  }

  if (isAuthLoginRequest(config.url)) {
    return config;
  }

  const accessToken = getClientAccessToken();

  if (!accessToken) {
    return config;
  }

  config.headers = config.headers ?? {};
  config.headers.Authorization = `Bearer ${accessToken}`;

  return config;
});

export function ensureApiConfigured() {
  if (!http.defaults.baseURL) {
    throw new Error("Nao foi possivel preparar o sistema para esta operacao.");
  }
}

function sanitizeApiMessage(message: string) {
  const normalizedMessage = message.trim();

  if (!normalizedMessage) {
    return null;
  }

  const technicalPatterns = [
    /axios/i,
    /timeout/i,
    /\bstatus\b/i,
    /\bproxy\b/i,
    /\bfrontend\b/i,
    /\bbackend\b/i,
    /\bnetwork\b/i,
    /\brequest\b/i,
    /\bresponse\b/i,
    /\bapi\b/i,
    /\bECONN/i,
    /\bETIMEDOUT/i,
  ];

  if (
    normalizedMessage.length > 180 ||
    technicalPatterns.some((pattern) => pattern.test(normalizedMessage))
  ) {
    return null;
  }

  return normalizedMessage;
}

export function getApiErrorMessage(
  error: unknown,
  fallback = "Nao foi possivel concluir sua solicitacao agora.",
) {
  if (axios.isAxiosError(error)) {
    const responseData = error.response?.data;

    if (typeof responseData === "string" && responseData.trim()) {
      return sanitizeApiMessage(responseData) ?? fallback;
    }

    if (responseData && typeof responseData === "object") {
      const message =
        "message" in responseData
          ? responseData.message
          : "error" in responseData
            ? responseData.error
            : null;

      if (typeof message === "string" && message.trim()) {
        return sanitizeApiMessage(message) ?? fallback;
      }

      if (Array.isArray(message) && message.length > 0) {
        return sanitizeApiMessage(String(message[0])) ?? fallback;
      }
    }

    if (error.response) {
      switch (error.response.status) {
        case 400:
        case 422:
          return "Revise os dados informados e tente novamente.";
        case 401:
          return "Sua sessao expirou. Entre novamente para continuar.";
        case 403:
          return "Voce nao tem permissao para realizar esta acao.";
        case 404:
          return "Nao encontramos as informacoes solicitadas.";
        case 409:
          return "Ja existe um registro com esses dados ou a operacao entrou em conflito.";
        default:
          return fallback;
      }
    }

    if (error.request) {
      return "Nao conseguimos conectar ao sistema no momento.";
    }
  }

  if (error instanceof Error && error.message.trim()) {
    return sanitizeApiMessage(error.message) ?? fallback;
  }

  return fallback;
}
