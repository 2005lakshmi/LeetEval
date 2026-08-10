const mongoose = require('mongoose');

const paperSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'UserAdmin', required: true },
  questionIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Question', required: true }],
  orderingMode: { type: String, enum: ['fixed', 'random', 'odd-even'], default: 'fixed' },
  timeLimitMinutes: { type: Number, required: true, default: 60 },
  allowedLanguages: { 
    type: [String], 
    default: ['python', 'cpp', 'c', 'java', 'javascript'] 
  },
  sequentialLock: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Paper', paperSchema);
