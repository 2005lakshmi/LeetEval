const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Room = require('../models/Room');
const StudentSession = require('../models/StudentSession');
const Question = require('../models/Question');
const Submission = require('../models/Submission');
const AuditLog = require('../models/AuditLog');
const { addSubmissionToQueue } = require('../services/queueService');

const secretKey = process.env.JWT_SECRET || 'super_secret_jwt_key_leet_eval_2026_change_in_prod';

// Join or Reconnect to exam room
router.post('/join', async (req, res) => {
  try {
    const { roomCode, name, usn, resumeToken } = req.body;
    if (!roomCode || !name || !usn) {
      return res.status(400).json({ message: 'Room code, Name, and USN are required' });
    }

    const cleanRoomCode = roomCode.trim().toUpperCase();
    const cleanUsn = usn.trim().toUpperCase();

    const room = await Room.findOne({ roomCode: cleanRoomCode }).populate('paperId');
    if (!room) {
      return res.status(404).json({ message: 'Invalid room code' });
    }

    if (room.status === 'ended') {
      return res.status(400).json({ message: 'This exam session has ended' });
    }

    let session = await StudentSession.findOne({ roomId: room._id, usn: cleanUsn });

    if (session) {
      if (resumeToken && session.resumeToken === resumeToken) {
        session.lastSeenAt = new Date();
        await session.save();

        return res.json({
          reconnected: true,
          sessionId: session._id,
          status: session.status,
          resumeToken: session.resumeToken,
          message: 'Reconnected to exam session'
        });
      }

      if (['admitted', 'active'].includes(session.status)) {
        session.lastSeenAt = new Date();
        if (!session.resumeToken) {
          session.resumeToken = jwt.sign(
            { sessionId: session._id, roomId: room._id, usn: session.usn },
            secretKey,
            { expiresIn: '12h' }
          );
        }
        await session.save();

        return res.json({
          reconnected: true,
          sessionId: session._id,
          status: session.status,
          resumeToken: session.resumeToken,
          message: 'Restored existing student session'
        });
      }

      if (session.status === 'waiting') {
        return res.json({
          reconnected: false,
          sessionId: session._id,
          status: 'waiting',
          message: 'Sitting in waiting room for admin approval'
        });
      }

      if (['submitted', 'auto-submitted'].includes(session.status)) {
        return res.json({
          reconnected: true,
          sessionId: session._id,
          status: session.status,
          resumeToken: session.resumeToken,
          message: 'Exam paper already submitted'
        });
      }

      return res.status(403).json({
        message: `Your exam session status is ${session.status}. Please contact exam coordinator.`
      });
    }

    session = await StudentSession.create({
      roomId: room._id,
      name: name.trim(),
      usn: cleanUsn,
      status: 'waiting'
    });

    await AuditLog.create({
      actorId: null,
      actorType: 'student',
      action: 'STUDENT_JOIN_WAITING_ROOM',
      targetId: String(session._id),
      meta: { roomCode: cleanRoomCode, usn: cleanUsn, name: session.name }
    });

    res.status(201).json({
      reconnected: false,
      sessionId: session._id,
      status: 'waiting',
      message: 'Joined waiting room. Waiting for admin approval.'
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Quick Session Status Check (for Waiting Room Polling)
router.get('/session-status/:sessionId', async (req, res) => {
  try {
    const session = await StudentSession.findById(req.params.sessionId);
    if (!session) return res.status(404).json({ message: 'Session not found' });
    res.json({
      sessionId: session._id,
      status: session.status,
      resumeToken: session.resumeToken
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Fetch Student Exam Environment Data
router.get('/session/:sessionId', async (req, res) => {
  try {
    const session = await StudentSession.findById(req.params.sessionId).populate({
      path: 'roomId',
      populate: {
        path: 'paperId',
        populate: {
          path: 'questionIds',
          select: 'title descriptionHtml difficulty hints boilerplate sampleTestcases timeLimitMs memoryLimitMb'
        }
      }
    });

    if (!session) return res.status(404).json({ message: 'Session not found' });

    const room = session.roomId || {};
    const paper = room.paperId || {};
    const questions = Array.isArray(paper.questionIds) ? paper.questionIds : [];

    const totalMinutes = room.timeLimitMinutesOverride || paper.timeLimitMinutes || 60;
    const totalMs = totalMinutes * 60 * 1000;
    
    let timeRemainingSeconds = totalMinutes * 60;
    if (room.admittedAt) {
      const elapsedMs = Date.now() - new Date(room.admittedAt).getTime();
      timeRemainingSeconds = Math.max(0, Math.floor((totalMs - elapsedMs) / 1000));
    }

    const extraMinutes = Array.isArray(session.reopenLog) ? session.reopenLog.reduce((acc, log) => acc + (log.timeAddedMinutes || 0), 0) : 0;
    timeRemainingSeconds += extraMinutes * 60;

    // If time expired or room status is ended, mark session auto-submitted in DB!
    if ((timeRemainingSeconds <= 0 || room.status === 'ended') && ['waiting', 'admitted', 'active'].includes(session.status)) {
      session.status = 'auto-submitted';
      session.submittedAt = new Date();
      await session.save();
    }

    const submissions = await Submission.find({ sessionId: session._id, type: 'submit' });
    const submittedQuestionIds = submissions.map(s => String(s.questionId));

    res.json({
      sessionId: session._id,
      name: session.name,
      usn: session.usn,
      status: session.status,
      roomStatus: room.status || 'active',
      warningCount: session.warningCount || 0,
      warningLimit: room.warningLimit || 3,
      tabSwitchCount: session.tabSwitchCount || 0,
      tabSwitchLimit: room.tabSwitchLimit || 3,
      sequentialLock: Boolean(room.sequentialLock || paper.sequentialLock),
      timeRemainingSeconds: ['auto-submitted', 'submitted'].includes(session.status) ? 0 : timeRemainingSeconds,
      roomCode: room.roomCode || 'ROOM',
      paperTitle: paper.title || 'Coding Assessment',
      questions,
      submittedQuestionIds,
      currentCode: Object.fromEntries(session.currentCode || new Map())
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Explicit Auto-Submit endpoint when client timer expires
router.post('/auto-submit', async (req, res) => {
  try {
    const { sessionId } = req.body;
    if (!sessionId) return res.status(400).json({ message: 'Session ID is required' });

    const session = await StudentSession.findById(sessionId);
    if (!session) return res.status(404).json({ message: 'Session not found' });

    session.status = 'auto-submitted';
    session.submittedAt = new Date();
    await session.save();

    res.json({ message: 'Exam session auto-submitted', status: 'auto-submitted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Report Anti-Cheat Warning (REST API Backup for Guaranteed Delivery)
router.post('/warning', async (req, res) => {
  try {
    const { sessionId, eventType } = req.body;
    if (!sessionId || !eventType) {
      return res.status(400).json({ message: 'Session ID and Event Type are required' });
    }

    const session = await StudentSession.findById(sessionId).populate('roomId');
    if (!session) return res.status(404).json({ message: 'Session not found' });
    if (['submitted', 'auto-submitted', 'kicked'].includes(session.status)) {
      return res.json({ status: session.status, isKicked: session.status === 'kicked' });
    }

    if (session.status !== 'active') {
      session.status = 'active';
    }

    const room = session.roomId;
    const warningLimit = room?.warningLimit || 3;
    const tabSwitchLimit = room?.tabSwitchLimit || 3;

    let isKicked = false;
    const isTabOrFocus = eventType.includes('Tab Switch') || eventType.includes('Focus') || eventType.includes('Visibility');

    if (isTabOrFocus) {
      session.tabSwitchCount = (session.tabSwitchCount || 0) + 1;
    } else {
      session.warningCount = (session.warningCount || 0) + 1;
    }

    if (session.warningCount > warningLimit || session.tabSwitchCount > tabSwitchLimit) {
      session.status = 'kicked';
      isKicked = true;
    }

    await session.save();

    console.log(`[REST ANTI-CHEAT WARNING]: USN: ${session.usn}, Event: "${eventType}", Warnings: ${session.warningCount}/${warningLimit}, TabSwitches: ${session.tabSwitchCount}/${tabSwitchLimit}, Kicked: ${isKicked}`);

    // Broadcast live to Admin Monitor
    if (room && room._id) {
      const io = req.app.get('io');
      if (io) {
        io.to(`room_admin_${room._id}`).emit('student_warning_alert', {
          sessionId: session._id,
          usn: session.usn,
          name: session.name,
          warningCount: session.warningCount,
          tabSwitchCount: session.tabSwitchCount,
          status: session.status,
          eventType,
          isKicked
        });
      }
    }

    // Audit Log
    try {
      await AuditLog.create({
        actorId: null,
        actorType: 'student',
        action: 'ANTI_CHEAT_WARNING',
        targetId: String(session._id),
        meta: { eventType, warningCount: session.warningCount, tabSwitchCount: session.tabSwitchCount, isKicked }
      });
    } catch (aErr) {}

    res.json({
      warningCount: session.warningCount,
      tabSwitchCount: session.tabSwitchCount,
      warningLimit,
      tabSwitchLimit,
      status: session.status,
      isKicked
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Autosave student code progress
router.post('/autosave', async (req, res) => {
  try {
    const { sessionId, questionId, code } = req.body;
    if (!sessionId || !questionId) {
      return res.status(400).json({ message: 'Session ID and Question ID are required' });
    }

    const session = await StudentSession.findById(sessionId).populate('roomId');
    if (!session) return res.status(404).json({ message: 'Session not found' });

    if (['auto-submitted', 'submitted', 'kicked'].includes(session.status) || session.roomId?.status === 'ended') {
      return res.status(403).json({ message: 'Exam session has been submitted. Code modifications are locked.' });
    }

    session.currentCode.set(String(questionId), code);
    session.lastSeenAt = new Date();
    await session.save();

    res.json({ saved: true, timestamp: new Date() });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Run Code (sample testcases)
router.post('/run', async (req, res) => {
  try {
    const { sessionId, questionId, language, code, socketId } = req.body;
    const question = await Question.findById(questionId);
    if (!question) return res.status(404).json({ message: 'Question not found' });

    const session = await StudentSession.findById(sessionId).populate('roomId');
    if (!session) return res.status(404).json({ message: 'Session not found' });

    if (['auto-submitted', 'submitted', 'kicked'].includes(session.status) || session.roomId?.status === 'ended') {
      return res.status(403).json({ message: 'Exam session has been submitted. Code execution is locked.' });
    }

    const customTemplate = question.harnessCode?.[language] || null;

    const jobInfo = await addSubmissionToQueue({
      submissionId: null,
      sessionId: session._id,
      roomId: session.roomId._id,
      language,
      code,
      customTemplate,
      testcases: question.sampleTestcases,
      timeLimitMs: question.timeLimitMs,
      memoryLimitMb: question.memoryLimitMb,
      socketId
    });

    const executionResult = jobInfo.result || {};

    res.json({
      message: 'Execution finished',
      queued: jobInfo.queued,
      jobId: jobInfo.jobId,
      verdict: executionResult.verdict || 'Accepted',
      rawOutput: executionResult.rawOutput || '',
      testResults: executionResult.testResults || [],
      totalRuntimeMs: executionResult.totalRuntimeMs || 0
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Submit Code (hidden testcases)
router.post('/submit', async (req, res) => {
  try {
    const { sessionId, questionId, language, code, socketId } = req.body;
    const question = await Question.findById(questionId);
    if (!question) return res.status(404).json({ message: 'Question not found' });

    const session = await StudentSession.findById(sessionId).populate('roomId');
    if (!session) return res.status(404).json({ message: 'Session not found' });

    if (['auto-submitted', 'submitted', 'kicked'].includes(session.status) || session.roomId?.status === 'ended') {
      return res.status(403).json({ message: 'Exam session has been submitted. Code submissions are locked.' });
    }

    // Save current code state
    session.currentCode.set(String(questionId), code);
    await session.save();

    const customTemplate = question.harnessCode?.[language] || null;

    // Create formal Submission record
    const submission = await Submission.create({
      sessionId: session._id,
      questionId: question._id,
      language,
      code,
      type: 'submit',
      verdict: 'Pending'
    });

    const allTestcases = [
      ...(question.sampleTestcases || []),
      ...(question.hiddenTestcases || [])
    ];
    const testcasesToEvaluate = allTestcases.length > 0 ? allTestcases : question.sampleTestcases;

    const jobInfo = await addSubmissionToQueue({
      submissionId: submission._id,
      sessionId: session._id,
      roomId: session.roomId._id,
      language,
      code,
      customTemplate,
      testcases: testcasesToEvaluate,
      timeLimitMs: question.timeLimitMs,
      memoryLimitMb: question.memoryLimitMb,
      socketId
    });

    const executionResult = jobInfo.result || {};

    res.json({
      message: 'Submitted for evaluation',
      submissionId: submission._id,
      queued: jobInfo.queued,
      jobId: jobInfo.jobId,
      verdict: executionResult.verdict || 'Accepted',
      rawOutput: executionResult.rawOutput || '',
      testResults: executionResult.testResults || [],
      totalRuntimeMs: executionResult.totalRuntimeMs || 0
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
