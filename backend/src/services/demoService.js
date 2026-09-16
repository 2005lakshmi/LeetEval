const Paper = require('../models/Paper');
const Question = require('../models/Question');

// Default Built-in Demo Paper fallback
const DEFAULT_DEMO_PAPER = {
  title: 'LeetEval Interactive Demo Assessment',
  timeLimitMinutes: 30,
  allowedLanguages: ['python', 'javascript', 'cpp', 'c', 'java'],
  sequentialLock: false,
  questions: [
    {
      _id: 'demo_q1_reverse_integer',
      title: '1. Reverse Integer',
      difficulty: 'Medium',
      description: 'Given a signed 32-bit integer `x`, return `x` with its digits reversed. If reversing `x` causes the value to go outside the signed 32-bit integer range `[-2^31, 2^31 - 1]`, then return `0`.\n\nAssume the environment does not allow you to store 64-bit integers (signed or unsigned).',
      inputFormat: 'A single integer `x`.',
      outputFormat: 'Return the reversed integer `x`.',
      constraints: '-2^31 <= x <= 2^31 - 1',
      sampleTestcases: [
        { input: '123', expectedOutput: '321' },
        { input: '-123', expectedOutput: '-321' },
        { input: '120', expectedOutput: '21' }
      ],
      hiddenTestcases: [
        { input: '0', expectedOutput: '0' },
        { input: '1534236469', expectedOutput: '0' }
      ],
      boilerplate: {
        python: 'def solution(x):\n    # Write your solution here\n    sign = -1 if x < 0 else 1\n    res = int(str(abs(x))[::-1]) * sign\n    return res if -2**31 <= res <= 2**31 - 1 else 0\n',
        javascript: 'function solution(x) {\n    const sign = x < 0 ? -1 : 1;\n    const res = parseInt(Math.abs(x).toString().split("").reverse().join("")) * sign;\n    return (res >= -2147483648 && res <= 2147483647) ? res : 0;\n}\n',
        cpp: '#include <iostream>\n#include <string>\n#include <algorithm>\n\nclass Solution {\npublic:\n    int solution(int x) {\n        long long res = 0;\n        while (x != 0) {\n            res = res * 10 + x % 10;\n            x /= 10;\n        }\n        return (res < -2147483648 || res > 2147483647) ? 0 : res;\n    }\n};\n',
        c: '#include <stdio.h>\n#include <limits.h>\n\nint solution(int x) {\n    long long res = 0;\n    while (x != 0) {\n        res = res * 10 + x % 10;\n        x /= 10;\n    }\n    if (res < INT_MIN || res > INT_MAX) return 0;\n    return (int)res;\n}\n',
        java: 'public class Solution {\n    public int solution(int x) {\n        long res = 0;\n        while (x != 0) {\n            res = res * 10 + x % 10;\n            x /= 10;\n        }\n        if (res < Integer.MIN_VALUE || res > Integer.MAX_VALUE) return 0;\n        return (int) res;\n    }\n}\n'
      }
    },
    {
      _id: 'demo_q2_print_rectangle',
      title: '2. Print Rectangle Using Asterisks',
      difficulty: 'Easy',
      description: 'Given two integers `length` and `breadth`, print a rectangle of asterisks (`*`) having `length` rows and `breadth` columns.',
      inputFormat: 'A JSON object `{"length": L, "breadth": B}`.',
      outputFormat: 'Print `L` lines each containing `B` asterisks (`*`).',
      constraints: '1 <= length <= 20, 1 <= breadth <= 20',
      sampleTestcases: [
        { input: '{"length": 2, "breadth": 4}', expectedOutput: '****\n****' },
        { input: '{"length": 3, "breadth": 3}', expectedOutput: '***\n***\n***' }
      ],
      hiddenTestcases: [
        { input: '{"length": 1, "breadth": 1}', expectedOutput: '*' }
      ],
      boilerplate: {
        python: 'def solution(length, breadth):\n    # Write your solution here\n    for i in range(length):\n        print("*" * breadth)\n',
        javascript: 'function solution(length, breadth) {\n    for (let i = 0; i < length; i++) {\n        console.log("*".repeat(breadth));\n    }\n}\n',
        cpp: '#include <iostream>\n#include <string>\n\nclass Solution {\npublic:\n    void solution(int length, int breadth) {\n        for (int i = 0; i < length; i++) {\n            std::cout << std::string(breadth, \'*\') << std::endl;\n        }\n    }\n};\n',
        c: '#include <stdio.h>\n\nvoid solution(int length, int breadth) {\n    for (int i = 0; i < length; i++) {\n        for (int j = 0; j < breadth; j++) {\n            printf("*");\n        }\n        printf("\\n");\n    }\n}\n',
        java: 'public class Solution {\n    public void solution(int length, int breadth) {\n        for (int i = 0; i < length; i++) {\n            for (int j = 0; j < breadth; j++) {\n                System.out.print("*");\n            }\n            System.out.println();\n        }\n    }\n}\n'
      }
    }
  ]
};

let activeDemoPaperId = null;

function setActiveDemoPaperId(paperId) {
  activeDemoPaperId = paperId || null;
}

function getActiveDemoPaperId() {
  return activeDemoPaperId;
}

async function getDemoPaperData() {
  if (activeDemoPaperId) {
    try {
      const paper = await Paper.findById(activeDemoPaperId).populate('questionIds');
      if (paper && paper.questionIds && paper.questionIds.length > 0) {
        const formattedQuestions = paper.questionIds.map((q, idx) => ({
          _id: String(q._id),
          title: q.title || `Question ${idx + 1}`,
          difficulty: q.difficulty || 'Medium',
          description: q.description || '',
          inputFormat: q.inputFormat || '',
          outputFormat: q.outputFormat || '',
          constraints: q.constraints || '',
          sampleTestcases: q.sampleTestcases || [],
          hiddenTestcases: q.hiddenTestcases || [],
          boilerplate: q.boilerplate || {}
        }));

        return {
          title: paper.title,
          timeLimitMinutes: paper.timeLimitMinutes || 30,
          allowedLanguages: paper.allowedLanguages || ['python', 'javascript', 'cpp', 'c', 'java'],
          sequentialLock: Boolean(paper.sequentialLock),
          questions: formattedQuestions
        };
      }
    } catch (e) {
      console.error('[DemoService Error]:', e.message);
    }
  }

  return DEFAULT_DEMO_PAPER;
}

module.exports = {
  setActiveDemoPaperId,
  getActiveDemoPaperId,
  getDemoPaperData,
  DEFAULT_DEMO_PAPER
};
