const express = require('express');
const { body, query } = require('express-validator');
const { protect, adminOnly } = require('../middleware/auth');
const { validate } = require('../middleware/error');
const { POSITIONS } = require('../models/Staff');

const auth = require('../controllers/authController');
const staff = require('../controllers/staffController');
const duty = require('../controllers/dutyController');
const mgt = require('../controllers/mgtController');
const dashboard = require('../controllers/dashboardController');

const router = express.Router();

// ---- Auth ----
router.get('/auth/setup-status', auth.setupStatus);
router.post(
  '/auth/setup',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('A valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('gender').isIn(['male', 'female']).withMessage('Gender must be male or female'),
  ],
  validate,
  auth.setup
);
router.post(
  '/auth/login',
  [body('email').isEmail().withMessage('A valid email is required'), body('password').notEmpty().withMessage('Password is required')],
  validate,
  auth.login
);
router.get('/auth/me', protect, auth.me);

// Everything below requires a logged-in user
router.use(protect);

router.get('/dashboard', dashboard.summary);

// ---- Staff ----
// On create every core field is required; on update they're only checked when sent.
const staffRules = (creating) => [
  body('name').if(() => creating).trim().notEmpty().withMessage('Name is required'),
  body('email').if(() => creating).isEmail().withMessage('A valid email is required'),
  body('password').if(() => creating).isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('gender').if(() => creating).isIn(['male', 'female']).withMessage('Gender must be male or female'),
  body('email').if(() => !creating).optional().isEmail().withMessage('A valid email is required'),
  body('password').if(() => !creating).optional({ values: 'falsy' }).isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('gender').if(() => !creating).optional().isIn(['male', 'female']).withMessage('Gender must be male or female'),
  body('staffType').optional().isIn(['teaching', 'management']).withMessage('Invalid staff type'),
  body('position').optional({ values: 'falsy' }).isIn(POSITIONS).withMessage('Invalid position'),
  body('role').optional().isIn(['admin', 'staff']).withMessage('Invalid role'),
];
router.get('/staff', staff.list);
router.post('/staff', adminOnly, staffRules(true), validate, staff.create);
router.put('/staff/:id', adminOnly, staffRules(false), validate, staff.update);
router.delete('/staff/:id', adminOnly, staff.remove);

// ---- Duty roster ----
const dateRange = [
  query('from').matches(/^\d{4}-\d{2}-\d{2}$/).withMessage('from must be YYYY-MM-DD'),
  query('to').matches(/^\d{4}-\d{2}-\d{2}$/).withMessage('to must be YYYY-MM-DD'),
];
router.get('/duty/shifts', duty.shifts);
router.get('/duty', dateRange, validate, duty.list);
router.post('/duty/generate', adminOnly, duty.generate);
router.patch('/duty/:id', adminOnly, body('staffId').notEmpty().withMessage('staffId is required'), validate, duty.reassign);
router.delete('/duty', adminOnly, dateRange, validate, duty.clearRange);
router.delete('/duty/:id', adminOnly, duty.remove);

// ---- Management (assembly) roster ----
router.get('/mgt/current', mgt.current);
router.get('/mgt', dateRange, validate, mgt.list);
router.post('/mgt/generate', adminOnly, mgt.generate);
router.patch('/mgt/:id', adminOnly, body('staffId').notEmpty().withMessage('staffId is required'), validate, mgt.reassign);
router.delete('/mgt/:id', adminOnly, mgt.remove);

module.exports = router;
