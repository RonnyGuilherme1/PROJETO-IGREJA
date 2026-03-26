import {
  MASTER_AUTH_SESSION_COOKIE,
  MASTER_AUTH_TOKEN_COOKIE,
  getCookieValue,
  getStoredAuthUser,
} from "@/modules/auth/lib/auth-session";
import type { AuthUser } from "@/modules/auth/types/auth";

export function getStoredMasterUser(): AuthUser | null {
  if (typeof document === "undefined") {
    return null;
  }

  const accessToken = getCookieValue(MASTER_AUTH_TOKEN_COOKIE);
  const sessionCookieValue = getCookieValue(MASTER_AUTH_SESSION_COOKIE);

  return getStoredAuthUser(accessToken, sessionCookieValue);
}
