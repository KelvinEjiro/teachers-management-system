// All dates in the system are plain 'YYYY-MM-DD' strings so timezones never shift a duty day.
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const toDate = (s) => new Date(`${s}T00:00:00Z`);
const fmt = (d) => d.toISOString().slice(0, 10);

const isValidDate = (s) =>
  typeof s === 'string' && DATE_RE.test(s) && !Number.isNaN(toDate(s).getTime()) && fmt(toDate(s)) === s;

const addDays = (s, n) => {
  const d = toDate(s);
  d.setUTCDate(d.getUTCDate() + n);
  return fmt(d);
};

const dayOfWeek = (s) => toDate(s).getUTCDay(); // 0 = Sunday
const isWeekend = (s) => [0, 6].includes(dayOfWeek(s));

const mondayOf = (s) => {
  const dow = dayOfWeek(s);
  return addDays(s, dow === 0 ? -6 : 1 - dow);
};

const eachDate = (start, end) => {
  const out = [];
  for (let d = start; d <= end; d = addDays(d, 1)) out.push(d);
  return out;
};

const daysBetween = (start, end) => Math.round((toDate(end) - toDate(start)) / 86400000);

// "Today" in the school's timezone (default Africa/Lagos)
const todayInSchool = () =>
  new Date().toLocaleDateString('en-CA', { timeZone: process.env.SCHOOL_TZ || 'Africa/Lagos' });

module.exports = { isValidDate, addDays, dayOfWeek, isWeekend, mondayOf, eachDate, daysBetween, todayInSchool };
