function pad(value: number) {
  return String(value).padStart(2, "0");
}

function toIsoDate(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function getMockTodayIso() {
  return toIsoDate(new Date());
}

export function isFutureOrToday(date: string) {
  return date >= getMockTodayIso();
}

export function isToday(date: string) {
  return date === getMockTodayIso();
}
