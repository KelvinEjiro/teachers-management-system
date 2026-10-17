const ratelimit = require('../config/upstash');

module.exports = async (req, res, next) => {
  if (!ratelimit) return next();
  try {
    const { success } = await ratelimit.limit(req.ip || 'anonymous');
    if (!success) return res.status(429).json({ message: 'Too many requests, please slow down.' });
  } catch (err) {
    // Fail open: an Upstash outage should not take the school's system down.
    console.warn('Rate limiter unavailable:', err.message);
  }
  next();
};
