const mongoose = require('mongoose');
const { POSITIONS } = require('./Staff');

// One management member leads assembly for one whole school week (Mon–Fri).
const mgtAssignmentSchema = new mongoose.Schema(
  {
    weekStart: { type: String, required: true, unique: true }, // Monday, YYYY-MM-DD
    weekEnd: { type: String, required: true }, // Friday, YYYY-MM-DD
    staff: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff', required: true },
    position: { type: String, enum: POSITIONS, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('MgtAssignment', mgtAssignmentSchema);
