const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Room = require('../models/Room');
const StudentSession = require('../models/StudentSession');
const Question = require('../models/Question');
const Submission = require('../models/Submission');
const Paper = require('../models/Paper');
const DemoRoom = require('../models/DemoRoom');
const AuditLog = require('../models/AuditLog');
const { addSubmissionToQueue } = require('../services/queueService');
const { getCachedRoom } = require('../services/roomCacheService');

// In-memory session status cache (5-second TTL) to reduce MongoDB polling load
const sessionStatusCache = new Map();

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

    // 15-Second Sliding Window RAM Cache lookup (Extends 15 seconds on each access!)
    const room = await getCachedRoom(cleanRoomCode);
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
    const sid = req.params.sessionId;
    const now = Date.now();
    
    // 5-second sliding window cache for session status polling
    const cached = sessionStatusCache.get(sid);
    if (cached && cached.expireAt > now) {
      cached.expireAt = now + 5000; // Sliding window refresh
      return res.json(cached.data);
    }
    
    const session = await StudentSession.findById(sid);
    if (!session) return res.status(404).json({ message: 'Session not found' });
    
    const responseData = {
      sessionId: session._id,
      status: session.status,
      resumeToken: session.resumeToken
    };
    
    // Cache for 5 seconds with sliding window
    sessionStatusCache.set(sid, { data: responseData, expireAt: now + 5000 });
    
    // Invalidate cache when status changes to admitted/active (so student gets instant approval)
    if (['admitted', 'active'].includes(session.status)) {
      sessionStatusCache.delete(sid);
    }
    
    res.json(responseData);
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
    
    // For demo rooms, each student gets their full exam paper duration starting from when they joined!
    const isDemoRoom = room.roomCode && room.roomCode.startsWith('DEMO_');
    const startTime = isDemoRoom ? (session.joinedAt || session.createdAt) : room.admittedAt;

    let timeRemainingSeconds = totalMinutes * 60;
    if (startTime) {
      const elapsedMs = Date.now() - new Date(startTime).getTime();
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
      allowedLanguages: Array.isArray(paper.allowedLanguages) && paper.allowedLanguages.length > 0
        ? paper.allowedLanguages
        : ['python', 'cpp', 'c', 'java', 'javascript'],
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

// --- PUBLIC STUDENT DEMO ENDPOINTS ---

// Helper to find demo room by slug or fallback to latest active demo room for root /demo
const findDemoRoomBySlugOrFallback = async (slug) => {
  const cleanSlug = (slug || '').trim().toLowerCase();
  let demoRoom = null;
  const now = new Date();

  if (cleanSlug && cleanSlug !== 'demo') {
    // 1. Exact lookup for custom slug: search for active non-expired room first!
    demoRoom = await DemoRoom.findOne({
      slug: cleanSlug,
      $or: [
        { expireAt: null },
        { expireAt: { $gt: now } }
      ]
    }).sort({ createdAt: -1 }).populate('paperId');

    // 2. If no active room exists for custom slug, fetch latest expired room (to report expired status)
    if (!demoRoom) {
      demoRoom = await DemoRoom.findOne({ slug: cleanSlug }).sort({ createdAt: -1 }).populate('paperId');
    }
  } else {
    // 3. For root /demo path: search for active non-expired room with slug 'demo' first!
    demoRoom = await DemoRoom.findOne({
      slug: 'demo',
      $or: [
        { expireAt: null },
        { expireAt: { $gt: now } }
      ]
    }).sort({ createdAt: -1 }).populate('paperId');

    // 4. Fallback for root /demo path: pick latest active non-expired demo room in system
    if (!demoRoom) {
      demoRoom = await DemoRoom.findOne({
        $or: [
          { expireAt: null },
          { expireAt: { $gt: now } }
        ]
      }).sort({ createdAt: -1 }).populate('paperId');
    }

    // 5. If still no active room, check if any expired 'demo' slug room exists
    if (!demoRoom) {
      demoRoom = await DemoRoom.findOne({ slug: 'demo' }).sort({ createdAt: -1 }).populate('paperId');
    }
  }

  // Ensure associated system Room is marked 'live' if demo room link is active
  if (demoRoom && demoRoom.roomId && !demoRoom.isExpired()) {
    const systemRoom = await Room.findById(demoRoom.roomId);
    if (systemRoom && systemRoom.status === 'ended') {
      systemRoom.status = 'live';
      await systemRoom.save();
    }
  }

  return demoRoom;
};

// Fetch Demo Room info by slug
router.get('/demo/:slug', async (req, res) => {
  try {
    const demoRoom = await findDemoRoomBySlugOrFallback(req.params.slug);

    if (!demoRoom) {
      return res.status(404).json({ message: 'Demo link not found or no longer active.' });
    }

    if (demoRoom.isExpired()) {
      return res.status(410).json({ message: 'This demo room link has expired', expired: true });
    }

    const onlineCount = await StudentSession.countDocuments({
      roomId: demoRoom.roomId,
      status: { $in: ['admitted', 'active'] }
    });

    const studentCount = await StudentSession.countDocuments({ roomId: demoRoom.roomId });

    const paper = demoRoom.paperId || {};
    const questionCount = Array.isArray(paper.questionIds) ? paper.questionIds.length : 0;

    res.json({
      slug: demoRoom.slug,
      paperTitle: paper.title || 'Demo Coding Assessment',
      timeLimitMinutes: paper.timeLimitMinutes || 60,
      questionCount,
      onlineCount,
      studentCount,
      expireAt: demoRoom.expireAt
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Join Demo Test (Auto-Admit without waiting room)
router.post('/demo/:slug/join', async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Full Name is required to enter the demo' });
    }

    const demoRoom = await findDemoRoomBySlugOrFallback(req.params.slug);

    if (!demoRoom) {
      return res.status(404).json({ message: 'Demo link not found or no longer active.' });
    }

    if (demoRoom.isExpired()) {
      return res.status(410).json({ message: 'This demo link has expired' });
    }

    // Increment serial counter atomically
    const updatedDemo = await DemoRoom.findByIdAndUpdate(
      demoRoom._id,
      { $inc: { serialCounter: 1 } },
      { new: true }
    );

    const serialId = `#${updatedDemo.serialCounter}`;

    // Create auto-admitted session
    const session = await StudentSession.create({
      roomId: demoRoom.roomId,
      name: name.trim(),
      usn: serialId,
      status: 'admitted'
    });

    // Generate token for reconnect safety
    const resumeToken = jwt.sign(
      { sessionId: session._id, roomId: demoRoom.roomId, usn: serialId },
      secretKey,
      { expiresIn: '12h' }
    );

    session.resumeToken = resumeToken;
    await session.save();

    await AuditLog.create({
      actorId: null,
      actorType: 'student',
      action: 'DEMO_STUDENT_AUTO_ADMIT',
      targetId: String(session._id),
      meta: { slug: demoRoom.slug, serialId, name: session.name }
    });

    res.status(201).json({
      message: 'Admitted to Demo Test',
      sessionId: session._id,
      serialId,
      resumeToken,
      status: 'admitted'
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Fetch Demo Student Result by Serial ID
router.get('/demo/:slug/result/:serialId', async (req, res) => {
  try {
    let rawSerial = req.params.serialId.trim().toUpperCase();
    const normalizedSerialId = rawSerial.startsWith('#') ? rawSerial : `#${rawSerial}`;

    const demoRoom = await findDemoRoomBySlugOrFallback(req.params.slug);

    if (!demoRoom) {
      return res.status(404).json({ message: 'No active demo room found' });
    }

    const session = await StudentSession.findOne({
      roomId: demoRoom.roomId,
      usn: normalizedSerialId
    });

    if (!session) {
      return res.status(404).json({ message: `No student record found for Serial ID "${normalizedSerialId}" in this demo.` });
    }

    const submissions = await Submission.find({ sessionId: session._id, type: 'submit' }).sort({ createdAt: -1 });
    const questions = demoRoom.paperId?.questionIds || [];

    const questionResults = questions.map((q) => {
      const sub = submissions.find(s => String(s.questionId) === String(q._id));
      const savedCode = session.currentCode?.get(String(q._id)) || '';

      return {
        questionId: q._id,
        title: q.title,
        difficulty: q.difficulty,
        verdict: sub ? sub.verdict : (savedCode ? 'Draft / Not Submitted' : 'Not Attempted'),
        code: sub ? sub.code : savedCode,
        language: sub ? sub.language : 'python',
        submittedAt: sub ? sub.createdAt : null,
        rawOutput: sub ? sub.rawOutput : null
      };
    });

    res.json({
      name: session.name,
      serialId: session.usn,
      status: session.status,
      paperTitle: demoRoom.paperId?.title || 'Demo Exam',
      joinedAt: session.joinedAt,
      submittedAt: session.submittedAt,
      questions: questionResults
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;

