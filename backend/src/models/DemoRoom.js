const mongoose = require('mongoose');

const demoRoomSchema = new mongoose.Schema({
  slug: { type: String, required: true, unique: true, trim: true, lowercase: true },
  paperId: { type: mongoose.Schema.Types.ObjectId, ref: 'Paper', required: true },
  roomId: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
  expirationType: { type: String, enum: ['none', 'hours', 'days'], default: 'none' },
  expirationValue: { type: Number, default: 0 },
  expireAt: { type: Date, default: null },
  serialCounter: { type: Number, default: 0 },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'UserAdmin', required: true },
  createdAt: { type: Date, default: Date.now }
});

// Helper method to check if demo room is expired
demoRoomSchema.methods.isExpired = function() {
  if (this.expirationType === 'none' || !this.expireAt) return false;
  return new Date() > new Date(this.expireAt);
};

module.exports = mongoose.model('DemoRoom', demoRoomSchema);
