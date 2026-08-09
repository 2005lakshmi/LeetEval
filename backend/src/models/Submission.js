const mongoose = require('mongoose');

const testResultSchema = new mongoose.Schema({
  testIndex: { type: Number, required: true },
  passed: { type: Boolean, required: true },
  output: { type: String, default: '' },
  expected: { type: String, default: '' },
  error: { type: String, default: '' },
  runtimeMs: { type: Number, default: 0 },
  memoryKb: { type: Number, default: 0 }
}, { _id: false });

const submissionSchema = new mongoose.Schema({
  sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'StudentSession', required: true },
  questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Question', required: true },
  language: { type: String, required: true, enum: ['python', 'java', 'c', 'cpp', 'javascript'] },
  code: { type: String, required: true },
  submittedAt: { type: Date, default: Date.now },
  type: { type: String, enum: ['run', 'submit'], required: true },
  verdict: { 
    type: String, 
    enum: ['Accepted', 'Wrong Answer', 'Time Limit Exceeded', 'Runtime Error', 'Compilation Error', 'Pending', 'Error'],
    default: 'Pending'
  },
  rawOutput: { type: String, default: '' },
  testResults: [testResultSchema],
  totalRuntimeMs: { type: Number, default: 0 },
  maxMemoryKb: { type: Number, default: 0 }
});

module.exports = mongoose.model('Submission', submissionSchema);
