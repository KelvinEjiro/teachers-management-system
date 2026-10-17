const jwt = require('jsonwebtoken');
const Staff = require('../models/Staff');
const { HttpError } = require('../middleware/error');

const signToken = (user) =>
  jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

// Lets the frontend know whether to show "create first admin" or "log in"
exports.setupStatus = async (req, res) => {
  res.json({ needsSetup: (await Staff.countDocuments()) === 0 });
};

// Only works while the database has no staff at all: creates the first administrator.
exports.setup = async (req, res) => {
  if ((await Staff.countDocuments()) > 0) throw new HttpError(403, 'Setup has already been completed');
  const { name, email, password, gender } = req.body;
  const user = await Staff.create({ name, email, password, gender, role: 'admin', staffType: 'teaching' });
  res.status(201).json({ token: signToken(user), user });
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  const user = await Staff.findOne({ email: email.toLowerCase() }).select('+password');
  if (!user || !(await user.matchPassword(password))) throw new HttpError(401, 'Invalid email or password');
  if (!user.isActive) throw new HttpError(403, 'This account has been deactivated');
  res.json({ token: signToken(user), user });
};

exports.me = async (req, res) => res.json({ user: req.user });
