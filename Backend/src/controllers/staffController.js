const Staff = require('../models/Staff');
const DutyAssignment = require('../models/DutyAssignment');
const MgtAssignment = require('../models/MgtAssignment');
const { HttpError } = require('../middleware/error');

const EDITABLE = ['name', 'email', 'gender', 'staffType', 'position', 'staysOnCompound', 'phone', 'isActive', 'role'];

async function assertPositionFree(position, excludeId) {
  if (!position) return;
  const clash = await Staff.findOne({ position, isActive: true, _id: { $ne: excludeId } });
  if (clash) throw new HttpError(409, `${clash.name} already holds the ${position.replace('_', ' ')} position`);
}

exports.list = async (req, res) => {
  const filter = {};
  if (req.query.staffType) filter.staffType = req.query.staffType;
  if (req.query.active !== undefined) filter.isActive = req.query.active === 'true';
  res.json(await Staff.find(filter).sort({ name: 1 }));
};

exports.create = async (req, res) => {
  const { password, ...rest } = req.body;
  const data = {};
  EDITABLE.forEach((k) => rest[k] !== undefined && (data[k] = rest[k]));
  if (data.staffType === 'management') await assertPositionFree(data.position);
  const staff = await Staff.create({ ...data, password });
  res.status(201).json(staff);
};

exports.update = async (req, res) => {
  const staff = await Staff.findById(req.params.id).select('+password');
  if (!staff) throw new HttpError(404, 'Staff member not found');

  EDITABLE.forEach((k) => req.body[k] !== undefined && (staff[k] = req.body[k]));
  if (req.body.password) staff.password = req.body.password;

  if (staff.staffType === 'management' && staff.isActive) await assertPositionFree(staff.position, staff._id);
  if (staff.id === req.user.id && (staff.role !== 'admin' || !staff.isActive)) {
    throw new HttpError(400, 'You cannot remove your own admin access or deactivate yourself');
  }
  await staff.save();
  res.json(staff);
};

exports.remove = async (req, res) => {
  if (req.params.id === req.user.id) throw new HttpError(400, 'You cannot delete your own account');
  const staff = await Staff.findById(req.params.id);
  if (!staff) throw new HttpError(404, 'Staff member not found');
  await Promise.all([
    DutyAssignment.deleteMany({ staff: staff._id }),
    MgtAssignment.deleteMany({ staff: staff._id }),
  ]);
  await staff.deleteOne();
  res.json({ message: 'Staff member deleted' });
};
