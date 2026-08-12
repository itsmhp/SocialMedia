const pad = (n: number) => String(n).padStart(2, "0");

/** HH:MM:SS */
export function fmtTime(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

/** HH:MM */
export function fmtShort(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  return `${pad(h)}:${pad(m)}`;
}

export function fmtElapsed(sec: number): string {
  const totalMinutes = Math.floor(Math.max(0, sec) / 60);
  if (totalMinutes < 1) return "<1m";

  const days = Math.floor(totalMinutes / (24 * 60));
  const hours = Math.floor((totalMinutes % (24 * 60)) / 60);
  const minutes = totalMinutes % 60;
  if (days) return hours ? `${days}d ${hours}h` : `${days}d`;
  if (hours) return minutes ? `${hours}h ${minutes}m` : `${hours}h`;
  return `${minutes}m`;
}
