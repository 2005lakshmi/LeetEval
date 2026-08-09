const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  roomCode: { type: String, required: true, unique: true, uppercase: true, trim: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'UserAdmin', required: true },
  paperId: { type: mongoose.Schema.Types.ObjectId, ref: 'Paper', required: true },
  status: { type: String, enum: ['lobby', 'live', 'ended'], default: 'lobby' },
  warningLimit: { type: Number, default: 3 },
  tabSwitchLimit: { type: Number, default: 3 },
  timeLimitMinutesOverride: { type: Number, default: null },
  sequentialLock: { type: Boolean, default: false },
  admittedAt: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Room', roomSchema);
