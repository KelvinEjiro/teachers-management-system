const mongoose = require('mongoose');

const dutyAssignmentSchema = new mongoose.Schema(
  {
    date: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ }, // YYYY-MM-DD
    shift: { type: String, enum: ['morning', 'evening'], required: true },
    staff: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff', required: true },
  },
  { timestamps: true }
);

dutyAssignmentSchema.index({ date: 1, shift: 1, staff: 1 }, { unique: true });
dutyAssignmentSchema.index({ staff: 1, date: 1 });

module.exports = mongoose.model('DutyAssignment', dutyAssignmentSchema);
