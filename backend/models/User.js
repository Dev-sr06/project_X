const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const stockWatchSchema = new mongoose.Schema({
  symbol: { type: String, required: true, uppercase: true },
  thresholdHigh: { type: Number, default: null },
  thresholdLow: { type: Number, default: null },
  addedAt: { type: Date, default: Date.now }
});

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 6 },
  watchlist: [stockWatchSchema],
  createdAt: { type: Date, default: Date.now }
});

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = async function (plain) {
  return bcrypt.compare(plain, this.password);
};

module.exports = mongoose.model('User', userSchema);
