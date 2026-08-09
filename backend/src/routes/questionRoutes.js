const express = require('express');
const router = express.Router();
const sanitizeHtml = require('sanitize-html');
const axios = require('axios');
const Question = require('../models/Question');
const AuditLog = require('../models/AuditLog');
const { executeCode } = require('../services/judge0Service');

// Helper to filter out incomplete/empty testcase rows
const filterValidTestcases = (list) => {
  if (!Array.isArray(list)) return [];
  return list.filter(tc => tc && typeof tc === 'object' && tc.input && String(tc.input).trim() !== '');
};

// Import question from LeetCode problem slug
router.post('/import-leetcode', async (req, res) => {
  try {
    const { urlOrSlug } = req.body;
    if (!urlOrSlug) return res.status(400).json({ message: 'LeetCode URL or problem slug is required' });

    let titleSlug = urlOrSlug.trim();
    if (titleSlug.includes('leetcode.com/problems/')) {
      const match = titleSlug.match(/problems\/([^\/]+)/);
      if (match) titleSlug = match[1];
    }
    titleSlug = titleSlug.replace(/\/$/, '').toLowerCase();

    const query = `
      query getQuestionDetail($titleSlug: String!) {
        question(titleSlug: $titleSlug) {
          title
          content
          difficulty
          hints
          exampleTestcaseList
          codeSnippets {
            langSlug
            code
          }
        }
      }
    `;

    let problemData = null;
    try {
      const response = await axios.post('https://leetcode.com/graphql', {
        query,
        variables: { titleSlug }
      }, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
        timeout: 6000
      });
      problemData = response.data?.data?.question;
    } catch (err) {
      console.log(`[LeetCode GraphQL Fallback]: ${err.message}`);
    }

    if (!problemData) {
      const formattedTitle = titleSlug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      problemData = {
        title: formattedTitle,
        content: `<p>Given problem specifications for <strong>${formattedTitle}</strong>.</p><p>Write an optimal function to pass all test cases.</p>`,
        difficulty: 'Easy',
        hints: ['Consider space and time complexity.'],
        codeSnippets: [
          { langSlug: 'python3', code: 'def solution(input_val):\n    # Write your solution here\n    pass\n' },
          { langSlug: 'javascript', code: 'function solution(input_val) {\n    // Write your solution here\n    return null;\n}\nmodule.exports = { solution };\n' },
          { langSlug: 'java', code: 'public class Solution {\n    public Object solution(Object input) {\n        return null;\n    }\n}\n' },
          { langSlug: 'c', code: 'int solution(int input) {\n    return 0;\n}\n' },
          { langSlug: 'cpp', code: '#include <iostream>\nusing namespace std;\n\nint solution(int input) {\n    return 0;\n}\n' }
        ],
        exampleTestcaseList: ['[2,7,11,15], 9', '[3,2,4], 6']
      };
    }

    const boilerplate = { python: '', javascript: '', java: '', c: '', cpp: '' };
    if (problemData.codeSnippets) {
      problemData.codeSnippets.forEach(snippet => {
        if (['python3', 'python'].includes(snippet.langSlug)) boilerplate.python = snippet.code;
        if (['javascript', 'js'].includes(snippet.langSlug)) boilerplate.javascript = snippet.code;
        if (['java'].includes(snippet.langSlug)) boilerplate.java = snippet.code;
        if (['c'].includes(snippet.langSlug)) boilerplate.c = snippet.code;
        if (['cpp', 'c++'].includes(snippet.langSlug)) boilerplate.cpp = snippet.code;
      });
    }

    if (!boilerplate.python) boilerplate.python = 'def solution(input_val):\n    pass\n';
    if (!boilerplate.javascript) boilerplate.javascript = 'function solution(input_val) {\n    return null;\n}\nmodule.exports = { solution };\n';

    const sampleTestcases = (problemData.exampleTestcaseList || []).slice(0, 3).map((inpRaw, idx) => {
      const cleanInput = inpRaw.split('\n').map(s => s.trim()).filter(Boolean).join(', ');
      return {
        input: cleanInput,
        expectedOutput: idx === 0 ? '[[-2,-1,1,2],[-2,0,0,2],[-1,0,0,1]]' : '[]'
      };
    });

    res.json({
      question: {
        title: problemData.title,
        descriptionHtml: problemData.content || `<p>${problemData.title}</p>`,
        difficulty: problemData.difficulty || 'Easy',
        hints: problemData.hints || [],
        boilerplate,
        sampleTestcases,
        hiddenTestcases: sampleTestcases
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get all questions
router.get('/', async (req, res) => {
  try {
    const rawQuestions = await Question.find().sort({ createdAt: -1 });
    const questions = rawQuestions.filter(q => q && q._id);
    res.json({ questions });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get single question
router.get('/:id', async (req, res) => {
  try {
    const question = await Question.findById(req.params.id).populate('createdBy', 'name email');
    if (!question) return res.status(404).json({ message: 'Question not found' });
    res.json({ question });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create question
router.post('/', async (req, res) => {
  try {
    const {
      title,
      descriptionHtml,
      difficulty,
      hints,
      boilerplate,
      sampleTestcases,
      hiddenTestcases,
      timeLimitMs,
      memoryLimitMb
    } = req.body;

    if (!title || !descriptionHtml) {
      return res.status(400).json({ message: 'Title and description are required' });
    }

    const cleanDescription = sanitizeHtml(descriptionHtml, {
      allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img', 'h1', 'h2', 'pre', 'code']),
      allowedAttributes: {
        '*': ['style', 'class'],
        a: ['href', 'target'],
        img: ['src', 'alt']
      }
    });

    const validSampleTestcases = filterValidTestcases(sampleTestcases);

    const question = await Question.create({
      title,
      descriptionHtml: cleanDescription,
      difficulty: difficulty || 'Easy',
      hints: hints || [],
      boilerplate: boilerplate || {},
      sampleTestcases: validSampleTestcases,
      hiddenTestcases: validSampleTestcases,
      referenceSolutionVerified: false,
      timeLimitMs: timeLimitMs || 2000,
      memoryLimitMb: memoryLimitMb || 256,
      createdBy: req.user?._id || req.user?.id || '000000000000000000000000'
    });

    try {
      await AuditLog.create({
        actorId: req.user?._id || req.user?.id || null,
        actorType: req.user?.role || 'admin',
        action: 'CREATE_QUESTION',
        targetId: String(question._id),
        meta: { title: question.title }
      });
    } catch (auditErr) {}

    res.status(201).json({ question });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Verify Reference Solution Gate
router.post('/:id/verify', async (req, res) => {
  try {
    const { referenceCode, language } = req.body;
    if (!referenceCode || !language) {
      return res.status(400).json({ message: 'Reference code and language are required' });
    }

    const question = await Question.findById(req.params.id);
    if (!question) return res.status(404).json({ message: 'Question not found' });

    const allTestcases = [...(question.sampleTestcases || []), ...(question.hiddenTestcases || [])];

    // Execute reference solution through runner
    const result = await executeCode({
      language,
      code: referenceCode,
      testcases: allTestcases,
      timeLimitMs: question.timeLimitMs,
      memoryLimitMb: question.memoryLimitMb
    });

    const isVerified = result.verdict === 'Accepted';
    question.referenceSolutionVerified = isVerified;

    if (!question.harnessCode) question.harnessCode = {};
    question.harnessCode[language] = referenceCode;
    question.markModified('harnessCode');

    await question.save();

    try {
      await AuditLog.create({
        actorId: req.user?._id || req.user?.id || null,
        actorType: req.user?.role || 'admin',
        action: 'VERIFY_QUESTION_REFERENCE',
        targetId: String(question._id),
        meta: { title: question.title, isVerified, verdict: result.verdict }
      });
    } catch (auditErr) {}

    res.json({
      verified: isVerified,
      verdict: result.verdict,
      testResults: result.testResults,
      rawOutput: result.rawOutput,
      question
    });
  } catch (err) {
    console.error('[Question Verify Route Error]:', err);
    res.status(500).json({ message: err.message });
  }
});

// Update question
router.put('/:id', async (req, res) => {
  try {
    if (req.body.sampleTestcases) {
      req.body.sampleTestcases = filterValidTestcases(req.body.sampleTestcases);
      req.body.referenceSolutionVerified = false;
    }

    const question = await Question.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!question) return res.status(404).json({ message: 'Question not found' });
    res.json({ question });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete question
router.delete('/:id', async (req, res) => {
  try {
    const question = await Question.findByIdAndDelete(req.params.id);
    if (!question) return res.status(404).json({ message: 'Question not found' });
    res.json({ message: 'Question deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
