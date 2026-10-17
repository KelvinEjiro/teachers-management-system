const Staff = require('../models/Staff');
const { POSITIONS } = require('../models/Staff');
const MgtAssignment = require('../models/MgtAssignment');
const { HttpError } = require('../middleware/error');
const { isValidDate, addDays, mondayOf, todayInSchool } = require('../utils/dates');

const STAFF_FIELDS = 'name gender position';

exports.list = async (req, res) => {
  const { from, to } = req.query;
  if (!isValidDate(from) || !isValidDate(to)) throw new HttpError(400, 'from and to must be YYYY-MM-DD');
  const items = await MgtAssignment.find({ weekStart: { $gte: mondayOf(from), $lte: to } })
    .populate('staff', STAFF_FIELDS)
    .sort({ weekStart: 1 });
  res.json(items.filter((i) => i.staff));
};

exports.current = async (req, res) => {
  const weekStart = mondayOf(todayInSchool());
  const item = await MgtAssignment.findOne({ weekStart }).populate('staff', STAFF_FIELDS);
  res.json(item || null);
};

/**
 * Rotates principal → VP admin → VP academics → senior dean → junior dean, one person per week.
 * With no startPosition it continues from whoever led assembly most recently before startDate.
 */
exports.generate = async (req, res) => {
  const { startDate, startPosition } = req.body;
  const weeks = Number(req.body.weeks);
  if (!isValidDate(startDate)) throw new HttpError(400, 'startDate must be YYYY-MM-DD');
  if (!Number.isInteger(weeks) || weeks < 1 || weeks > 52) throw new HttpError(400, 'weeks must be between 1 and 52');

  const pool = (await Staff.find({ staffType: 'management', isActive: true, position: { $in: POSITIONS } })).sort(
    (a, b) => POSITIONS.indexOf(a.position) - POSITIONS.indexOf(b.position)
  );
  if (!pool.length) throw new HttpError(400, 'Add active management staff (with positions) first');

  const firstMonday = mondayOf(startDate);
  let startIdx = 0;
  if (startPosition) {
    startIdx = pool.findIndex((p) => p.position === startPosition);
    if (startIdx < 0) throw new HttpError(400, 'No active staff member holds that position');
  } else {
    const last = await MgtAssignment.findOne({ weekStart: { $lt: firstMonday } }).sort({ weekStart: -1 });
    const lastIdx = last ? pool.findIndex((p) => p.position === last.position) : -1;
    startIdx = lastIdx >= 0 ? (lastIdx + 1) % pool.length : 0;
  }

  const docs = Array.from({ length: weeks }, (_, i) => {
    const person = pool[(startIdx + i) % pool.length];
    const weekStart = addDays(firstMonday, 7 * i);
    return { weekStart, weekEnd: addDays(weekStart, 4), staff: person._id, position: person.position };
  });

  await MgtAssignment.deleteMany({ weekStart: { $gte: firstMonday, $lte: docs[docs.length - 1].weekStart } });
  await MgtAssignment.insertMany(docs);

  const warnings = [];
  const missing = POSITIONS.filter((p) => !pool.some((s) => s.position === p));
  if (missing.length) warnings.push(`No active staff for: ${missing.map((m) => m.replace('_', ' ')).join(', ')}`);
  res.status(201).json({ created: docs.length, warnings });
};

exports.reassign = async (req, res) => {
  const item = await MgtAssignment.findById(req.params.id);
  if (!item) throw new HttpError(404, 'Assembly week not found');
  const staff = await Staff.findById(req.body.staffId);
  if (!staff || !staff.isActive || staff.staffType !== 'management') {
    throw new HttpError(400, 'Choose an active management staff member');
  }
  item.staff = staff._id;
  item.position = staff.position;
  await item.save();
  res.json(await item.populate('staff', STAFF_FIELDS));
};

exports.remove = async (req, res) => {
  const found = await MgtAssignment.findByIdAndDelete(req.params.id);
  if (!found) throw new HttpError(404, 'Assembly week not found');
  res.json({ message: 'Assembly week removed' });
};
