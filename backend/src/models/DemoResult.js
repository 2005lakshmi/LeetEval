const mongoose = require('mongoose');

const demoResultSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  paperId: { type: mongoose.Schema.Types.ObjectId, ref: 'Paper' },
  paperTitle: { type: String, default: 'Demo Exam' },
  overallScore: { type: Number, default: 0 },
  passedQuestionsCount: { type: Number, default: 0 },
  totalQuestionsCount: { type: Number, default: 0 },
  totalTestcasesPassed: { type: Number, default: 0 },
  totalTestcasesCount: { type: Number, default: 0 },
  tabSwitchCount: { type: Number, default: 0 },
  timeTakenSeconds: { type: Number, default: 0 },
  questionSubmissions: [{
    questionId: { type: String },
    questionTitle: { type: String },
    code: { type: String },
    language: { type: String },
    verdict: { type: String, default: 'Not Submitted' },
    testResults: [{
      passed: Boolean,
      runtimeMs: Number,
      input: String,
      output: String,
      expected: String,
      error: String,
      stdout: String
    }]
  }],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('DemoResult', demoResultSchema);
