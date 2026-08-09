const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  actorId: { type: mongoose.Schema.Types.ObjectId, ref: 'UserAdmin', default: null },
  actorType: { type: String, enum: ['master', 'faculty', 'student', 'system'], required: true },
  action: { type: String, required: true },
  targetId: { type: String, default: null },
  meta: { type: mongoose.Schema.Types.Mixed, default: {} },
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('AuditLog', auditLogSchema);
