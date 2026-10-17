const { eachDate, addDays, isWeekend } = require('../utils/dates');
const { checkEligibility } = require('./dutyRules');

/**
 * Pure function: builds a fair duty roster for [startDate, endDate].
 *
 * staff:   plain objects { _id, name, gender, staffType, staysOnCompound, isActive }
 * slots:   how many staff per shift, e.g. { morning: 2, evening: 2 }
 * history: optional prior load per staff id { total, morning, evening, weekend, last }
 *          so a new roster continues fairly from the last one.
 *
 * Fairness: the person with the fewest duties so far goes next (then fewest of that
 * shift, fewest weekends, not on duty yesterday, longest since last duty).
 * The evening shift is filled first each day because it has the smallest pool (female only).
 */
function generateDuty({ startDate, endDate, staff, slots = { morning: 2, evening: 2 }, history = {} }) {
  const stats = new Map();
  for (const s of staff) {
    const h = history[String(s._id)] || {};
    stats.set(String(s._id), {
      total: h.total || 0,
      morning: h.morning || 0,
      evening: h.evening || 0,
      weekend: h.weekend || 0,
      last: h.last || '',
    });
  }

  const assignments = [];
  const warnings = [];

  for (const date of eachDate(startDate, endDate)) {
    const weekend = isWeekend(date);
    const yesterday = addDays(date, -1);
    const takenToday = new Set();

    for (const shift of ['evening', 'morning']) {
      const need = slots[shift] || 0;
      if (!need) continue;

      const pool = staff.filter(
        (s) => !takenToday.has(String(s._id)) && checkEligibility(s, date, shift).ok
      );

      pool.sort((a, b) => {
        const A = stats.get(String(a._id));
        const B = stats.get(String(b._id));
        return (
          A.total - B.total ||
          A[shift] - B[shift] ||
          (weekend ? A.weekend - B.weekend : 0) ||
          (A.last === yesterday) - (B.last === yesterday) ||
          A.last.localeCompare(B.last) ||
          a.name.localeCompare(b.name)
        );
      });

      const picked = pool.slice(0, need);
      for (const s of picked) {
        const st = stats.get(String(s._id));
        st.total += 1;
        st[shift] += 1;
        if (weekend) st.weekend += 1;
        st.last = date;
        takenToday.add(String(s._id));
        assignments.push({ date, shift, staff: s._id });
      }

      if (picked.length < need) {
        warnings.push({
          date,
          shift,
          needed: need,
          filled: picked.length,
          message: `${date} ${shift}: only ${picked.length} of ${need} slots could be filled (not enough eligible staff)`,
        });
      }
    }
  }

  return { assignments, warnings };
}

module.exports = { generateDuty };
