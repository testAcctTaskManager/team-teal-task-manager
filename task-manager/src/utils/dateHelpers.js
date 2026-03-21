// SQLite CURRENT_TIMESTAMP returns "YYYY-MM-DD HH:MM:SS" with no timezone
// indicator. Without normalization, new Date() treats it as local time instead
// of UTC, which shifts the displayed time by the viewer's UTC offset.
function toDate(value) {
  if (!value) return null;
  if (value instanceof Date) return value;
  const s = String(value);
  // If there's no timezone indicator, assume UTC
  const normalized =
    !s.includes("Z") && !s.includes("+") && !s.match(/[+-]\d{2}:\d{2}$/)
      ? s.replace(" ", "T") + "Z"
      : s;
  const d = new Date(normalized);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function formatDate(value) {
  if (!value) return "—";
  const d = toDate(value);
  if (!d) return String(value);
  return d.toLocaleDateString();
}

export function formatDateTime(value, timeZone) {
  if (!value) return "—";
  const d = toDate(value);
  if (!d) return String(value);
  if (timeZone) {
    return new Intl.DateTimeFormat(undefined, {
      month: "numeric",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      timeZone,
      timeZoneName: "short",
    }).format(d);
  }
  return d.toLocaleString(undefined, { dateStyle: "short", timeStyle: "short" });
}

export function isDateOverdue(dueValue) {
  if (!dueValue) return false;
  const due = new Date(dueValue);
  if (Number.isNaN(due.getTime())) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return due < today;
}
