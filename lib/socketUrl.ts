import { API_BASE_URL } from "@/redux/constants";

/**
 * Origin for the Socket.IO gateways.
 *
 * Socket.IO reads everything after the origin as a *namespace*, not a path, so
 * a base URL carrying a prefix (`.../api/v1`) would make `io(base + "/chat")`
 * ask for the namespace `/api/v1/chat` and fail to connect with no useful
 * error. Taking the origin is what keeps the namespace correct whatever the
 * REST base turns out to be.
 *
 * `NEXT_PUBLIC_SOCKET_URL` overrides it outright, for the case where the
 * gateway is not served from the same origin as the API.
 */
export function getSocketBaseUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SOCKET_URL;
  if (explicit) return explicit;

  try {
    return new URL(API_BASE_URL).origin;
  } catch {
    return "http://localhost:3000";
  }
}
