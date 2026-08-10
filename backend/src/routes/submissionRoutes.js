const express = require('express');
const router = express.Router();
const Submission = require('../models/Submission');
const StudentSession = require('../models/StudentSession');
const { verifyAdminToken } = require('../middleware/authMiddleware');

// Get Testcases Analytics Distribution for a Question in a Room
router.get('/analytics/question/:questionId/room/:roomId', verifyAdminToken, async (req, res) => {
  try {
    const { questionId, roomId } = req.params;

    // Find all sessions in room
    const sessions = await StudentSession.find({ roomId }).select('_id name usn');
    const sessionIds = sessions.map(s => s._id);

    const sessionMap = new Map();
    sessions.forEach(s => sessionMap.set(String(s._id), { name: s.name, usn: s.usn }));

    // Fetch submissions for this question
    const submissions = await Submission.find({
      questionId,
      sessionId: { $in: sessionIds },
      type: 'submit'
    }).sort({ submittedAt: -1 });

    const chartData = submissions.map(sub => {
      const student = sessionMap.get(String(sub.sessionId)) || { name: 'Unknown', usn: '' };
      const testResults = Array.isArray(sub.testResults) ? sub.testResults : [];
      const passedCount = testResults.filter(t => t && t.passed).length;
      const totalCount = testResults.length;

      return {
        submissionId: sub._id,
        sessionId: sub.sessionId,
        studentName: student.name,
        usn: student.usn,
        passedCount,
        totalCount,
        verdict: sub.verdict,
        runtimeMs: sub.totalRuntimeMs || 0,
        language: sub.language,
        submittedAt: sub.submittedAt
      };
    });

    res.json({
      questionId,
      totalSubmissions: chartData.length,
      chartData
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get Submissions for a Room (Admin view)
router.get('/room/:roomId', verifyAdminToken, async (req, res) => {
  try {
    const sessions = await StudentSession.find({ roomId: req.params.roomId }).select('_id name usn');
    const sessionIds = sessions.map(s => s._id);

    const submissions = await Submission.find({ sessionId: { $in: sessionIds } })
      .populate('questionId', 'title difficulty sampleTestcases hiddenTestcases')
      .sort({ submittedAt: -1 });

    const sessionMap = new Map();
    sessions.forEach(s => sessionMap.set(String(s._id), { name: s.name, usn: s.usn }));

    const formatted = submissions.map(sub => {
      const student = sessionMap.get(String(sub.sessionId)) || { name: 'Unknown', usn: '' };
      const testResults = Array.isArray(sub.testResults) ? sub.testResults : [];
      const passedCount = testResults.filter(t => t && t.passed).length;

      const qSampleCount = sub.questionId?.sampleTestcases?.length || 0;
      const qHiddenCount = sub.questionId?.hiddenTestcases?.length || 0;
      const questionTotalTestcases = (qSampleCount + qHiddenCount) || 1;
      const totalCount = Math.max(questionTotalTestcases, testResults.length);

      let computedVerdict = sub.verdict;
      if (computedVerdict === 'Accepted' && passedCount < totalCount) {
        computedVerdict = 'Wrong Answer';
      }

      return {
        _id: sub._id,
        studentName: student.name,
        usn: student.usn,
        questionTitle: sub.questionId?.title || 'Unknown',
        language: sub.language,
        verdict: computedVerdict,
        totalRuntimeMs: sub.totalRuntimeMs,
        submittedAt: sub.submittedAt,
        code: sub.code,
        rawOutput: sub.rawOutput,
        testResults,
        passedCount,
        totalCount
      };
    });

    res.json({ submissions: formatted });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
