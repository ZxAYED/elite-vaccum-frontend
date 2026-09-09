/**
 * The API reports failures as `{ statusCode, message }` and the guide says to
 * surface `message` directly. NestJS validation errors send `message` as an
 * array, so both shapes are handled here.
 */
export function readApiMessage(error: unknown, fallback: string): string {
  if (!error || typeof error !== "object") return fallback;

  const data = (error as { data?: unknown }).data;
  const body = data && typeof data === "object" ? (data as Record<string, unknown>) : {};

  const message = body.message ?? body.error;
  if (Array.isArray(message)) {
    const joined = message.filter((part) => typeof part === "string").join(", ");
    if (joined) return joined;
  }
  if (typeof message === "string" && message.trim()) return message;

  const direct = (error as { message?: unknown }).message;
  if (typeof direct === "string" && direct.trim()) return direct;

  return fallback;
}
