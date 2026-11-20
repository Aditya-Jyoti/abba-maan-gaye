// Date formatting for ISO dates (YYYY-MM-DD) stored without a time zone.

const parse = (iso: string) => new Date(`${iso}T00:00:00Z`);
const fmt = (iso: string, opts: Intl.DateTimeFormatOptions) =>
  parse(iso).toLocaleDateString("en-GB", { ...opts, timeZone: "UTC" });

/** "Jul 2025" */
export const monthYear = (iso: string | null) => (iso ? fmt(iso, { month: "short", year: "numeric" }) : "");

/** "12 Jul" */
export const dayMonth = (iso: string | null) => (iso ? fmt(iso, { day: "numeric", month: "short" }) : "");

/** "12-13 July 2025", "30 June - 2 July 2025", or "12 July 2025". */
export function dateLong(start: string | null, end: string | null): string {
  if (!start) return "";
  if (!end || end === start) return fmt(start, { day: "numeric", month: "long", year: "numeric" });
  const [s, e] = [parse(start), parse(end)];
  if (s.getUTCFullYear() !== e.getUTCFullYear()) {
    return `${fmt(start, { day: "numeric", month: "long", year: "numeric" })} - ${fmt(end, { day: "numeric", month: "long", year: "numeric" })}`;
  }
  if (s.getUTCMonth() !== e.getUTCMonth()) {
    return `${fmt(start, { day: "numeric", month: "long" })} - ${fmt(end, { day: "numeric", month: "long", year: "numeric" })}`;
  }
  return `${s.getUTCDate()}-${e.getUTCDate()} ${fmt(start, { month: "long", year: "numeric" })}`;
}

/** "12-21 Jul 2025" for a trip with both dates in one month, otherwise "Jul 2025". */
export function tripRange(start: string | null, end: string | null): string {
  if (!start) return "";
  if (end && start.slice(0, 7) === end.slice(0, 7)) {
    return `${parse(start).getUTCDate()}-${parse(end).getUTCDate()} ${monthYear(start)}`;
  }
  return monthYear(start);
}

/** "ARRIVED 12.07.25" style stamp dates. */
export const stampDay = (iso: string) => `${iso.slice(8, 10)}.${iso.slice(5, 7)}.${iso.slice(2, 4)}`;
export const stampMonth = (iso: string) => `${iso.slice(5, 7)}.${iso.slice(0, 4)}`;
