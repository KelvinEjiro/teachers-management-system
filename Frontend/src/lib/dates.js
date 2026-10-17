// Dates are plain 'YYYY-MM-DD' strings end to end (matches the API).
const toDate = (s) => new Date(`${s}T00:00:00Z`);
const fmt = (d) => d.toISOString().slice(0, 10);

export const addDays = (s, n) => {
  const d = toDate(s);
  d.setUTCDate(d.getUTCDate() + n);
  return fmt(d);
};

export const dayOfWeek = (s) => toDate(s).getUTCDay();
export const isWeekend = (s) => [0, 6].includes(dayOfWeek(s));

export const mondayOf = (s) => {
  const dow = dayOfWeek(s);
  return addDays(s, dow === 0 ? -6 : 1 - dow);
};

export const eachDate = (start, end) => {
  const out = [];
  for (let d = start; d <= end; d = addDays(d, 1)) out.push(d);
  return out;
};

export const todayStr = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Africa/Lagos' });

export const prettyDate = (s, opts = { weekday: 'short', day: 'numeric', month: 'short' }) =>
  toDate(s).toLocaleDateString('en-GB', { ...opts, timeZone: 'UTC' });
