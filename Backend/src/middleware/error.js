const { validationResult } = require('express-validator');

class HttpError extends Error {
  constructor(status, message, extra = {}) {
    super(message);
    this.status = status;
    this.extra = extra;
  }
}

// Use after express-validator chains
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) return next();
  const list = errors.array();
  return res.status(400).json({ message: list[0].msg, errors: list.map((e) => ({ field: e.path, message: e.msg })) });
};

const notFound = (req, res) => res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  if (err instanceof HttpError) return res.status(err.status).json({ message: err.message, ...err.extra });
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors)[0]?.message || 'Validation failed';
    return res.status(400).json({ message });
  }
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] || 'field';
    return res.status(409).json({ message: `A record with that ${field} already exists` });
  }
  if (err.name === 'CastError') return res.status(400).json({ message: `Invalid ${err.path}` });
  console.error(err);
  return res.status(500).json({ message: 'Something went wrong on the server' });
};

module.exports = { HttpError, validate, notFound, errorHandler };
