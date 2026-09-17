const StudentSession = require('../models/StudentSession');
const Room = require('../models/Room');
const AuditLog = require('../models/AuditLog');

const activeSockets = new Map(); // socketId -> { sessionId, roomId, usn, role }

function setupSocketHandlers(io) {
  io.on('connection', (socket) => {
    console.log(`[Socket Connected]: ${socket.id}`);

    // Student joins waiting room lobby
    socket.on('join_waiting_room', async ({ roomId, usn, name }) => {
      try {
        let session = await StudentSession.findOne({ roomId, usn });
        if (session) {
          session.socketId = socket.id;
          session.lastSeenAt = new Date();
          await session.save();
        }
        activeSockets.set(socket.id, { sessionId: session?._id, roomId, usn, role: 'student' });
        socket.join(`room_${roomId}`);
        socket.join(`waiting_${roomId}`);

        // Notify admin monitor
        io.to(`room_admin_${roomId}`).emit('student_waiting_update', {
          sessionId: session?._id,
          usn,
          name,
          status: session?.status || 'waiting'
        });
      } catch (err) {
        console.error(`[Socket Error join_waiting_room]: ${err.message}`);
      }
    });

    // Admin joins room monitor
    socket.on('admin_join_room', ({ roomId }) => {
      socket.join(`room_admin_${roomId}`);
      activeSockets.set(socket.id, { roomId, role: 'admin' });
      console.log(`[Admin Socket Joined]: Room admin_${roomId}`);
    });

    // Student re-connects or joins exam workspace
    socket.on('student_join_exam', async ({ sessionId, resumeToken }) => {
      try {
        const session = await StudentSession.findById(sessionId).populate('roomId');
        if (!session) {
          return socket.emit('exam_error', { message: 'Session not found' });
        }

        // Auto transition session status to 'active' if in waiting/admitted status
        if (['waiting', 'admitted'].includes(session.status)) {
          session.status = 'active';
        }
        session.socketId = socket.id;
        session.lastSeenAt = new Date();
        await session.save();

        const roomIdStr = String(session.roomId._id);
        activeSockets.set(socket.id, { sessionId, roomId: roomIdStr, usn: session.usn, role: 'student' });
        socket.join(`room_${roomIdStr}`);
        socket.join(`exam_${roomIdStr}`);

        // Emit current status to student
        socket.emit('exam_session_restored', {
          status: session.status,
          warningCount: session.warningCount || 0,
          tabSwitchCount: session.tabSwitchCount || 0,
          warningLimit: session.roomId?.warningLimit || 3,
          tabSwitchLimit: session.roomId?.tabSwitchLimit || 3,
          currentCode: Object.fromEntries(session.currentCode || new Map())
        });

        // Notify admin monitor
        io.to(`room_admin_${roomIdStr}`).emit('student_status_changed', {
          sessionId: session._id,
          status: session.status,
          tabSwitchCount: session.tabSwitchCount || 0,
          warningCount: session.warningCount || 0,
          socketStatus: 'online'
        });
      } catch (err) {
        console.error(`[Socket Error student_join_exam]: ${err.message}`);
      }
    });

    // Anti-cheat warning reported by client
    socket.on('anti_cheat_warning', async ({ sessionId, eventType, timestamp }) => {
      try {
        const session = await StudentSession.findById(sessionId).populate('roomId');
        if (!session) return;
        
        // Ignore if paper already finished, auto-submitted, or kicked
        if (['submitted', 'auto-submitted', 'kicked'].includes(session.status)) return;

        // Ensure session is marked active when taking exam
        if (session.status !== 'active') {
          session.status = 'active';
        }

        const room = session.roomId;
        const warningLimit = room?.warningLimit || 3;
        const tabSwitchLimit = room?.tabSwitchLimit || 3;

        let isKicked = false;
        const isTabOrFocus = (eventType || '').includes('Tab Switch') || (eventType || '').includes('Focus') || (eventType || '').includes('Visibility');

        if (isTabOrFocus) {
          session.tabSwitchCount = (session.tabSwitchCount || 0) + 1;
        } else {
          session.warningCount = (session.warningCount || 0) + 1;
        }

        // Strict Proctoring Threshold: If warningCount > warningLimit OR tabSwitchCount > tabSwitchLimit, IMMEDIATELY KICK
        if (session.warningCount > warningLimit || session.tabSwitchCount > tabSwitchLimit) {
          session.status = 'kicked';
          isKicked = true;
        }

        await session.save();

        console.log(`[STRICT PROCTORING ALERT]: USN: ${session.usn}, Event: "${eventType}", Warnings: ${session.warningCount}/${warningLimit}, TabSwitches: ${session.tabSwitchCount}/${tabSwitchLimit}, Kicked: ${isKicked}`);

        // Emit to student
        if (isKicked) {
          socket.emit('kicked_by_admin', {
            message: `Assessment Terminated: You have exceeded the permitted ${isTabOrFocus ? 'tab switch' : 'security warning'} limit!`
          });
        } else {
          socket.emit('warning_updated', {
            warningCount: session.warningCount,
            tabSwitchCount: session.tabSwitchCount,
            warningLimit,
            tabSwitchLimit,
            isKicked: false,
            eventType
          });
        }

        // Broadcast live to Admin Monitor
        if (room && room._id) {
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

        // Audit Log
        await AuditLog.create({
          actorId: null,
          actorType: 'student',
          action: 'ANTI_CHEAT_WARNING',
          targetId: String(session._id),
          meta: { eventType, warningCount: session.warningCount, tabSwitchCount: session.tabSwitchCount, isKicked }
        });
      } catch (err) {
        console.error(`[Socket Error anti_cheat_warning]: ${err.message}`);
      }
    });

    // Student heartbeat
    socket.on('student_heartbeat', async ({ sessionId }) => {
      if (sessionId) {
        await StudentSession.findByIdAndUpdate(sessionId, { lastSeenAt: new Date() });
      }
    });

    socket.on('disconnect', () => {
      const socketInfo = activeSockets.get(socket.id);
      if (socketInfo && socketInfo.role === 'student' && socketInfo.roomId) {
        io.to(`room_admin_${socketInfo.roomId}`).emit('student_status_changed', {
          sessionId: socketInfo.sessionId,
          socketStatus: 'offline'
        });
      }
      activeSockets.delete(socket.id);
    });
  });
}

function getActiveSocketsCount() {
  return activeSockets.size;
}

module.exports = { setupSocketHandlers, getActiveSocketsCount };
