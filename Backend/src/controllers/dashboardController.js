const Staff = require('../models/Staff');
const DutyAssignment = require('../models/DutyAssignment');
const MgtAssignment = require('../models/MgtAssignment');
const { todayInSchool, mondayOf } = require('../utils/dates');

exports.summary = async (req, res) => {
  const today = todayInSchool();
  const [staffCounts, dutyToday, assemblyLead] = await Promise.all([
    Staff.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: { type: '$staffType', gender: '$gender' }, n: { $sum: 1 } } },
    ]),
    DutyAssignment.find({ date: today }).populate('staff', 'name gender').sort({ shift: 1 }),
    MgtAssignment.findOne({ weekStart: mondayOf(today) }).populate('staff', 'name position'),
  ]);

  const count = (pred) => staffCounts.filter((c) => pred(c._id)).reduce((s, c) => s + c.n, 0);
  res.json({
    today,
    staff: {
      total: count(() => true),
      teaching: count((k) => k.type === 'teaching'),
      management: count((k) => k.type === 'management'),
      female: count((k) => k.gender === 'female'),
      male: count((k) => k.gender === 'male'),
    },
    dutyToday: dutyToday.filter((d) => d.staff),
    assemblyLead,
  });
};
