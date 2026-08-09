const mongoose = require('mongoose');

const reopenLogSchema = new mongoose.Schema({
  actorId: { type: mongoose.Schema.Types.ObjectId, ref: 'UserAdmin' },
  reason: { type: String, required: true },
  timeAddedMinutes: { type: Number, default: 0 },
  timestamp: { type: Date, default: Date.now }
}, { _id: false });

const studentSessionSchema = new mongoose.Schema({
  roomId: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
  name: { type: String, required: true, trim: true },
  usn: { type: String, required: true, uppercase: true, trim: true },
  joinedAt: { type: Date, default: Date.now },
  status: { 
    type: String, 
    enum: ['waiting', 'admitted', 'active', 'submitted', 'auto-submitted', 'kicked'], 
    default: 'waiting' 
  },
  warningCount: { type: Number, default: 0 },
  tabSwitchCount: { type: Number, default: 0 },
  socketId: { type: String, default: null },
  resumeToken: { type: String, default: null },
  lastSeenAt: { type: Date, default: Date.now },
  forceExitedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'UserAdmin', default: null },
  reopenLog: [reopenLogSchema],
  currentCode: { type: Map, of: String, default: {} }, // questionId -> code
  submittedAt: { type: Date, default: null }
});

// Ensure uniqueness per room & USN
studentSessionSchema.index({ roomId: 1, usn: 1 }, { unique: true });

module.exports = mongoose.model('StudentSession', studentSessionSchema);
