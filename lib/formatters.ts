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

export function formatCurrencyUsd(amount: number) {
  return usdFormatter.format(amount);
}

export function formatShortDate(dateLike: Date | string) {
  return shortDateFormatter.format(new Date(dateLike));
}

export function formatMonthDay(dateLike: Date | string) {
  return shortMonthDayFormatter.format(new Date(dateLike));
}

export function formatLongDate(dateLike: Date | string) {
  return longDateFormatter.format(new Date(dateLike));
}

export function formatShortDateTime(dateLike: Date | string) {
  return shortDateTimeFormatter.format(new Date(dateLike));
}

export function formatTime(dateLike: Date | string) {
  return timeFormatter.format(new Date(dateLike));
}
