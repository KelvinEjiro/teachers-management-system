const { isWeekend } = require('../utils/dates');

const SHIFTS = {
  morning: { label: 'Morning', start: '07:00', end: '15:00' },
  evening: { label: 'Evening', start: '17:00', end: '20:30' },
};

// The school's hard rules live here, in one place, and are used by both the
// generator and manual edits so they can never drift apart.
function checkEligibility(staff, date, shift) {
  if (!staff.isActive) return { ok: false, reason: 'Staff member is inactive' };
  if (staff.staffType !== 'teaching') {
    return { ok: false, reason: 'Management staff are scheduled on the management roster, not duty' };
  }
  if (shift === 'evening' && staff.gender !== 'female') {
    return { ok: false, reason: 'Male staff cannot take evening duty (all-girls school)' };
  }
  if (isWeekend(date) && !staff.staysOnCompound) {
    return { ok: false, reason: 'Weekend duty is only for staff who stay on the compound' };
  }
  return { ok: true };
}

module.exports = { SHIFTS, checkEligibility };
