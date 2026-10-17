const Staff = require('../models/Staff');
const DutyAssignment = require('../models/DutyAssignment');
const { HttpError } = require('../middleware/error');
const { generateDuty } = require('../services/dutyGenerator');
const { checkEligibility, SHIFTS } = require('../services/dutyRules');
const { isValidDate, addDays, daysBetween } = require('../utils/dates');

const MAX_DAYS = 92;
const STAFF_FIELDS = 'name gender staffType staysOnCompound isActive';

// Prior 30 days of duty, so a new roster continues fairly where the last one stopped.
async function buildHistory(startDate) {
  const prior = await DutyAssignment.find({ date: { $gte: addDays(startDate, -30), $lt: startDate } }).lean();
  const history = {};
  for (const a of prior) {
    const h = (history[a.staff] ||= { total: 0, morning: 0, evening: 0, weekend: 0, last: '' });
    h.total += 1;
    h[a.shift] += 1;
    if (a.date > h.last) h.last = a.date;
  }
  return history;
}

exports.shifts = (req, res) => res.json(SHIFTS);

exports.list = async (req, res) => {
  const { from, to } = req.query;
  if (!isValidDate(from) || !isValidDate(to)) throw new HttpError(400, 'from and to must be YYYY-MM-DD');
  const items = await DutyAssignment.find({ date: { $gte: from, $lte: to } })
    .populate('staff', STAFF_FIELDS)
    .sort({ date: 1, shift: 1 });
  res.json(items.filter((i) => i.staff)); // drop orphans if a staff doc vanished
};

exports.generate = async (req, res) => {
  const { startDate, endDate } = req.body;
  const morning = Number(req.body.morningSlots ?? 2);
  const evening = Number(req.body.eveningSlots ?? 2);

  if (!isValidDate(startDate) || !isValidDate(endDate)) throw new HttpError(400, 'Dates must be YYYY-MM-DD');
  if (endDate < startDate) throw new HttpError(400, 'End date must be on or after the start date');
  if (daysBetween(startDate, endDate) + 1 > MAX_DAYS) throw new HttpError(400, `Maximum range is ${MAX_DAYS} days`);

  const staff = await Staff.find({ isActive: true, staffType: 'teaching' }).sort({ name: 1 }).lean();
  if (!staff.length) throw new HttpError(400, 'Add at least one active teaching staff member first');

  const { assignments, warnings } = generateDuty({
    startDate,
    endDate,
    staff,
    slots: { morning, evening },
    history: await buildHistory(startDate),
  });

  await DutyAssignment.deleteMany({ date: { $gte: startDate, $lte: endDate } });
  await DutyAssignment.insertMany(assignments);
  res.status(201).json({ created: assignments.length, warnings });
};

// Manual swap. Applies the same school rules as the generator.
exports.reassign = async (req, res) => {
  const assignment = await DutyAssignment.findById(req.params.id);
  if (!assignment) throw new HttpError(404, 'Duty slot not found');
  const staff = await Staff.findById(req.body.staffId);
  if (!staff) throw new HttpError(404, 'Staff member not found');

  const check = checkEligibility(staff, assignment.date, assignment.shift);
  if (!check.ok) throw new HttpError(400, check.reason);

  const sameDay = await DutyAssignment.findOne({
    date: assignment.date,
    staff: staff._id,
    _id: { $ne: assignment._id },
  });
  if (sameDay) throw new HttpError(409, `${staff.name} is already on ${sameDay.shift} duty that day`);

  assignment.staff = staff._id;
  await assignment.save();
  res.json(await assignment.populate('staff', STAFF_FIELDS));
};

exports.remove = async (req, res) => {
  const found = await DutyAssignment.findByIdAndDelete(req.params.id);
  if (!found) throw new HttpError(404, 'Duty slot not found');
  res.json({ message: 'Duty slot removed' });
};

exports.clearRange = async (req, res) => {
  const { from, to } = req.query;
  if (!isValidDate(from) || !isValidDate(to)) throw new HttpError(400, 'from and to must be YYYY-MM-DD');
  const { deletedCount } = await DutyAssignment.deleteMany({ date: { $gte: from, $lte: to } });
  res.json({ deleted: deletedCount });
};
