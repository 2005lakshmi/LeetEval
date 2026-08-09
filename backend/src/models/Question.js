const mongoose = require('mongoose');

const testcaseSchema = new mongoose.Schema({
  input: { type: String, default: '' },
  expectedOutput: { type: String, default: '' }
}, { _id: false });

const questionSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  descriptionHtml: { type: String, required: true },
  difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'], default: 'Easy' },
  hints: [{ type: String }],
  boilerplate: {
    python: { type: String, default: 'def solution(input_val):\n    # Write your solution here\n    pass\n' },
    java: { type: String, default: 'public class Solution {\n    public Object solution(Object input) {\n        // Write your solution here\n        return null;\n    }\n}\n' },
    c: { type: String, default: '#include <stdio.h>\n\nint solution(int input) {\n    // Write your solution here\n    return 0;\n}\n' },
    cpp: { type: String, default: '#include <iostream>\nusing namespace std;\n\nint solution(int input) {\n    // Write your solution here\n    return 0;\n}\n' },
    javascript: { type: String, default: 'function solution(input) {\n    // Write your solution here\n    return null;\n}\nmodule.exports = { solution };\n' }
  },
  harnessCode: {
    python: { type: String, default: '' },
    javascript: { type: String, default: '' },
    java: { type: String, default: '' },
    c: { type: String, default: '' },
    cpp: { type: String, default: '' }
  },
  sampleTestcases: [testcaseSchema],
  hiddenTestcases: [testcaseSchema],
  referenceSolutionVerified: { type: Boolean, default: false },
  timeLimitMs: { type: Number, default: 2000 },
  memoryLimitMb: { type: Number, default: 256 },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'UserAdmin', required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Question', questionSchema);
