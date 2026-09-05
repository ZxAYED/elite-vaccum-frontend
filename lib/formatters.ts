const usdFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

const shortDateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

const shortMonthDayFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
});

const longDateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "long",
  day: "numeric",
  year: "numeric",
});

const shortDateTimeFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

const timeFormatter = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit",
});

function parseSafeDate(dateLike?: Date | string | null): Date | null {
  if (!dateLike) return null;
  if (dateLike instanceof Date) {
    return Number.isNaN(dateLike.getTime()) ? null : dateLike;
  }
  if (typeof dateLike === "string") {
    const trimmed = dateLike.trim();
    if (!trimmed || trimmed.toLowerCase() === "invalid date") return null;
    // Parse YYYY-MM-DD as local date to avoid timezone day-shift
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      const [year, month, day] = trimmed.split("-").map(Number);
      const d = new Date(year, month - 1, day);
      return Number.isNaN(d.getTime()) ? null : d;
    }
    const d = new Date(trimmed);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  return null;
}

function safeFallback(dateLike?: Date | string | null): string {
  if (typeof dateLike === "string") {
    const trimmed = dateLike.trim();
    if (trimmed && trimmed.toLowerCase() !== "invalid date") {
      return trimmed;
    }
  }
  return "—";
}

export function formatCurrencyUsd(amount?: number | string | null) {
  if (amount === undefined || amount === null || amount === "") return "$0";
  const numeric = typeof amount === "number" ? amount : Number(amount);
  if (Number.isNaN(numeric)) return "$0";
  return usdFormatter.format(numeric);
}

export function formatShortDate(dateLike?: Date | string | null): string {
  const d = parseSafeDate(dateLike);
  if (!d) return safeFallback(dateLike);
  return shortDateFormatter.format(d);
}

export function formatMonthDay(dateLike?: Date | string | null): string {
  const d = parseSafeDate(dateLike);
  if (!d) return safeFallback(dateLike);
  return shortMonthDayFormatter.format(d);
}

export function formatLongDate(dateLike?: Date | string | null): string {
  const d = parseSafeDate(dateLike);
  if (!d) return safeFallback(dateLike);
  return longDateFormatter.format(d);
}

export function formatShortDateTime(dateLike?: Date | string | null): string {
  const d = parseSafeDate(dateLike);
  if (!d) return safeFallback(dateLike);
  return shortDateTimeFormatter.format(d);
}

export function formatTime(dateLike?: Date | string | null): string {
  const d = parseSafeDate(dateLike);
  if (!d) return safeFallback(dateLike);
  return timeFormatter.format(d);
}

export function formatBytes(bytes: number, decimals = 1): string {
  if (!bytes || bytes === 0) return "0 B";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}
