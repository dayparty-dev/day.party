/** Convert minute-of-day (0–1439) to `HH:mm` for `<input type="time" />`. */
export function minutesToTimeInput(total: number): string {
  const clamped = Math.max(0, Math.min(1439, Math.round(total)));
  const h = Math.floor(clamped / 60);
  const m = clamped % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/** Parse `HH:mm` from a time input to minutes 0–1439. */
export function timeInputToMinutes(value: string): number {
  const [hStr, mStr = '0'] = value.split(':');
  const h = Number(hStr);
  const m = Number(mStr);
  if (!Number.isFinite(h) || !Number.isFinite(m)) {
    return 0;
  }
  return Math.max(0, Math.min(1439, h * 60 + m));
}
