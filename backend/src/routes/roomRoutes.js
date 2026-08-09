const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const Room = require('../models/Room');
const StudentSession = require('../models/StudentSession');
const AuditLog = require('../models/AuditLog');
const { verifyAdminToken } = require('../middleware/authMiddleware');

const secretKey = process.env.JWT_SECRET || 'super_secret_jwt_key_leet_eval_2026_change_in_prod';

function generateRoomCode() {
  return crypto.randomBytes(3).toString('hex').toUpperCase(); // 6 character code e.g. 5A9F1B
}

// Auto-check and transition expired rooms from 'live' to 'ended'
async function updateExpiredRooms() {
  try {
    const liveRooms = await Room.find({ status: 'live' }).populate('paperId');
    const now = new Date();

    for (const room of liveRooms) {
      if (room.admittedAt) {
        const durationMin = room.timeLimitMinutesOverride || room.paperId?.timeLimitMinutes || 60;
        const elapsedMin = (now - new Date(room.admittedAt)) / (1000 * 60);

        if (elapsedMin >= durationMin) {
          room.status = 'ended';
          await room.save();

          await StudentSession.updateMany(
            { roomId: room._id, status: { $in: ['waiting', 'admitted', 'active'] } },
            { status: 'auto-submitted', submittedAt: now }
          );
        }
      }
    }
  } catch (err) {
    console.error('[Room Expiration Check Error]:', err.message);
  }
}

router.use(verifyAdminToken);

// Create Room
router.post('/', async (req, res) => {
  try {
    const { paperId, warningLimit, tabSwitchLimit, timeLimitMinutesOverride, sequentialLock } = req.body;
    if (!paperId) {
      return res.status(400).json({ message: 'Paper ID is required' });
    }

    let roomCode = generateRoomCode();
    let existing = await Room.findOne({ roomCode });
    while (existing) {
      roomCode = generateRoomCode();
      existing = await Room.findOne({ roomCode });
    }

    const room = await Room.create({
      roomCode,
      paperId,
      warningLimit: warningLimit !== undefined ? Number(warningLimit) : 3,
      tabSwitchLimit: tabSwitchLimit !== undefined ? Number(tabSwitchLimit) : 3,
      timeLimitMinutesOverride: timeLimitMinutesOverride || null,
      sequentialLock: Boolean(sequentialLock),
      createdBy: req.user._id,
      status: 'lobby'
    });

    await AuditLog.create({
      actorId: req.user._id,
      actorType: req.user.role,
      action: 'CREATE_ROOM',
      targetId: String(room._id),
      meta: { roomCode }
    });

    res.status(201).json({ room });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// List rooms (with auto-expire check)
router.get('/', async (req, res) => {
  try {
    await updateExpiredRooms();

    const rooms = await Room.find()
      .populate('paperId', 'title timeLimitMinutes questionIds sequentialLock')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });
    res.json({ rooms });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get single room live details and student list (with auto-expire check)
router.get('/:id', async (req, res) => {
  try {
    await updateExpiredRooms();

    const room = await Room.findById(req.params.id)
      .populate({
        path: 'paperId',
        populate: { path: 'questionIds', select: 'title difficulty' }
      });
    if (!room) return res.status(404).json({ message: 'Room not found' });

    const students = await StudentSession.find({ roomId: room._id }).sort({ joinedAt: -1 });
    res.json({ room, students });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update room status (lobby -> live -> ended)
router.put('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    if (!['lobby', 'live', 'ended'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ message: 'Room not found' });

    room.status = status;
    if (status === 'live' && !room.admittedAt) {
      room.admittedAt = new Date();
    }
    await room.save();

    if (status === 'ended') {
      await StudentSession.updateMany(
        { roomId: room._id, status: { $in: ['waiting', 'admitted', 'active'] } },
        { status: 'auto-submitted', submittedAt: new Date() }
      );
    }

    req.app.get('io')?.to(`room_${room._id}`).emit('room_status_changed', { status: room.status });

    res.json({ message: `Room status updated to ${status}`, room });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// End Session for ALL students in this room
router.post('/:id/end-all', async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ message: 'Room not found' });

    room.status = 'ended';
    await room.save();

    await StudentSession.updateMany(
      { roomId: room._id, status: { $in: ['waiting', 'admitted', 'active'] } },
      { status: 'auto-submitted', submittedAt: new Date() }
    );

    const io = req.app.get('io');
    if (io) {
      io.to(`room_${room._id}`).emit('room_status_changed', { status: 'ended' });
      io.to(`room_${room._id}`).emit('session_ended_all', { message: 'Faculty has ended the exam session for all students.' });
    }

    res.json({ message: 'Exam session ended for all students' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// End Session for a Single Active Student
router.post('/:id/end-student/:sessionId', async (req, res) => {
  try {
    const session = await StudentSession.findById(req.params.sessionId);
    if (!session) return res.status(404).json({ message: 'Student session not found' });

    session.status = 'auto-submitted';
    session.submittedAt = new Date();
    await session.save();

    const io = req.app.get('io');
    if (io) {
      if (session.socketId) {
        io.to(session.socketId).emit('session_ended_individual', {
          message: 'Faculty has ended your exam session.'
        });
      }
      io.to(`room_${req.params.id}`).emit('student_session_updated', {
        sessionId: session._id,
        status: 'auto-submitted'
      });
    }

    res.json({ message: `Exam session ended for student ${session.usn}` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Admit students (bulk or single)
router.post('/:id/admit', async (req, res) => {
  try {
    const { sessionIds } = req.body;
    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ message: 'Room not found' });

    const filter = { roomId: room._id, status: 'waiting' };
    if (sessionIds && Array.isArray(sessionIds) && sessionIds.length > 0) {
      filter._id = { $in: sessionIds };
    }

    const waitingStudents = await StudentSession.find(filter);

    for (const student of waitingStudents) {
      student.status = 'admitted';
      const resumeToken = jwt.sign(
        { sessionId: student._id, roomId: room._id, usn: student.usn },
        secretKey,
        { expiresIn: '12h' }
      );
      student.resumeToken = resumeToken;
      await student.save();

      const io = req.app.get('io');
      if (io) {
        // Emit to room channel AND student socket ID
        io.to(`room_${room._id}`).emit('student_admitted', {
          sessionId: student._id,
          usn: student.usn,
          resumeToken
        });

        if (student.socketId) {
          io.to(student.socketId).emit('student_admitted', {
            sessionId: student._id,
            resumeToken
          });
        }
      }
    }

    // Auto start room if still in lobby
    if (room.status === 'lobby') {
      room.status = 'live';
      room.admittedAt = new Date();
      await room.save();
    }

    res.json({ message: `Admitted ${waitingStudents.length} student(s)` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Force exit (Kick) student
router.post('/:id/kick/:sessionId', async (req, res) => {
  try {
    const session = await StudentSession.findById(req.params.sessionId);
    if (!session) return res.status(404).json({ message: 'Student session not found' });

    session.status = 'kicked';
    session.forceExitedBy = req.user._id;
    await session.save();

    if (session.socketId) {
      req.app.get('io')?.to(session.socketId).emit('kicked_by_admin', {
        message: 'You have been force-exited by the exam administrator.'
      });
    }

    await AuditLog.create({
      actorId: req.user._id,
      actorType: req.user.role,
      action: 'FORCE_EXIT_STUDENT',
      targetId: String(session._id),
      meta: { usn: session.usn, name: session.name }
    });

    res.json({ message: `Student ${session.usn} force-exited` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Reopen / Manual Override student session
router.post('/:id/reopen/:sessionId', async (req, res) => {
  try {
    const { reason, timeAddedMinutes } = req.body;
    if (!reason || !reason.trim()) {
      return res.status(400).json({ message: 'Reason for reopening session is mandatory for audit logging' });
    }

    const session = await StudentSession.findById(req.params.sessionId);
    if (!session) return res.status(404).json({ message: 'Student session not found' });

    const oldStatus = session.status;
    session.status = 'active';
    session.reopenLog.push({
      actorId: req.user._id,
      reason: reason.trim(),
      timeAddedMinutes: timeAddedMinutes || 0,
      timestamp: new Date()
    });

    await session.save();

    if (session.socketId) {
      req.app.get('io')?.to(session.socketId).emit('session_reopened', {
        message: 'Your exam session has been reopened by faculty.',
        timeAddedMinutes: timeAddedMinutes || 0
      });
    }

    await AuditLog.create({
      actorId: req.user._id,
      actorType: req.user.role,
      action: 'REOPEN_STUDENT_SESSION',
      targetId: String(session._id),
      meta: { usn: session.usn, name: session.name, oldStatus, reason, timeAddedMinutes }
    });

    res.json({ message: `Session for ${session.usn} reopened`, session });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete Room & cleanup related student sessions
router.delete('/:id', async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ message: 'Exam room not found' });

    await StudentSession.deleteMany({ roomId: room._id });
    await Room.findByIdAndDelete(req.params.id);

    await AuditLog.create({
      actorId: req.user._id,
      actorType: req.user.role,
      action: 'DELETE_EXAM_ROOM',
      targetId: String(room._id),
      meta: { roomCode: room.roomCode }
    });

    res.json({ message: 'Exam room and related sessions deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
