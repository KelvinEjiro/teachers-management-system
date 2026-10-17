const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Rotation order for the management assembly roster
const POSITIONS = ['principal', 'vp_admin', 'vp_academics', 'senior_dean', 'junior_dean'];

const staffSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Name is required'], trim: true },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: true, minlength: [6, 'Password must be at least 6 characters'], select: false },
    role: { type: String, enum: ['admin', 'staff'], default: 'staff' },
    gender: { type: String, enum: ['male', 'female'], required: [true, 'Gender is required'] },
    staffType: { type: String, enum: ['teaching', 'management'], default: 'teaching' },
    position: { type: String, enum: POSITIONS },
    staysOnCompound: { type: Boolean, default: false },
    phone: { type: String, trim: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

staffSchema.pre('validate', function () {
  if (this.staffType === 'management' && !this.position) {
    this.invalidate('position', 'Position is required for management staff');
  }
  if (this.staffType === 'teaching') this.position = undefined;
});

staffSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 10);
});

staffSchema.methods.matchPassword = function (plain) {
  return bcrypt.compare(plain, this.password);
};

staffSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.password;
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('Staff', staffSchema);
module.exports.POSITIONS = POSITIONS;
