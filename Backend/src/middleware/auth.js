const jwt = require('jsonwebtoken');
const Staff = require('../models/Staff');
const { HttpError } = require('./error');

const protect = async (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) throw new HttpError(401, 'Not authenticated');

  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    throw new HttpError(401, 'Session expired, please log in again');
  }
  const user = await Staff.findById(payload.id);
  if (!user || !user.isActive) throw new HttpError(401, 'Account not found or deactivated');
  req.user = user;
  next();
};

const adminOnly = (req, res, next) => {
  if (req.user?.role !== 'admin') throw new HttpError(403, 'Only administrators can do this');
  next();
};

module.exports = { protect, adminOnly };
