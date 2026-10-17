const test = require('node:test');
const assert = require('node:assert/strict');
const { generateDuty } = require('../src/services/dutyGenerator');
const { isWeekend } = require('../src/utils/dates');

const mk = (i, gender, staysOnCompound) => ({
  _id: `s${i}`,
  name: `Staff ${String(i).padStart(2, '0')}`,
  gender,
  staffType: 'teaching',
  staysOnCompound,
  isActive: true,
});

const staff = [
  ...[1, 2, 3, 4, 5, 6].map((i) => mk(i, 'female', i <= 3)),
  ...[7, 8, 9, 10, 11, 12].map((i) => mk(i, 'male', i <= 8)),
];
const byId = Object.fromEntries(staff.map((s) => [s._id, s]));

const run = () => generateDuty({ startDate: '2026-11-02', endDate: '2026-11-29', staff });

test('male staff never take evening duty', () => {
  const { assignments } = run();
  const bad = assignments.filter((a) => a.shift === 'evening' && byId[a.staff].gender === 'male');
  assert.equal(bad.length, 0);
});

test('weekend duty only goes to staff who stay on compound', () => {
  const { assignments } = run();
  const weekend = assignments.filter((a) => isWeekend(a.date));
  assert.ok(weekend.length > 0);
  assert.ok(weekend.every((a) => byId[a.staff].staysOnCompound));
});

test('nobody is double-booked on a day and every slot is filled', () => {
  const { assignments, warnings } = run();
  assert.equal(warnings.length, 0);
  assert.equal(assignments.length, 28 * 4);
  const seen = new Set();
  for (const a of assignments) {
    const k = `${a.date}:${a.staff}`;
    assert.ok(!seen.has(k), `double booking ${k}`);
    seen.add(k);
  }
});

test('workload is spread fairly within each group', () => {
  const { assignments } = run();
  const total = {};
  assignments.forEach((a) => (total[a.staff] = (total[a.staff] || 0) + 1));
  const group = (pred) => staff.filter(pred).map((s) => total[s._id] || 0);
  const spread = (arr) => Math.max(...arr) - Math.min(...arr);
  assert.ok(spread(group((s) => s.gender === 'female' && s.staysOnCompound)) <= 3);
  assert.ok(spread(group((s) => s.gender === 'female' && !s.staysOnCompound)) <= 3);
  assert.ok(spread(group((s) => s.gender === 'male' && !s.staysOnCompound)) <= 2);
});

test('reports unfilled slots instead of breaking rules', () => {
  const onlyMen = staff.filter((s) => s.gender === 'male');
  const { assignments, warnings } = generateDuty({
    startDate: '2026-11-02',
    endDate: '2026-11-03',
    staff: onlyMen,
  });
  assert.ok(assignments.every((a) => a.shift === 'morning'));
  assert.equal(warnings.filter((w) => w.shift === 'evening').length, 2);
});
