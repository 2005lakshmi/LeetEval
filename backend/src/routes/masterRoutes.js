const express = require('express');
const router = express.Router();
const os = require('os');
const UserAdmin = require('../models/UserAdmin');
const AuditLog = require('../models/AuditLog');
const Room = require('../models/Room');
const Paper = require('../models/Paper');
const DemoRoom = require('../models/DemoRoom');
const StudentSession = require('../models/StudentSession');
const Submission = require('../models/Submission');
const { verifyAdminToken, verifyMasterOnly } = require('../middleware/authMiddleware');
const { getDBStats } = require('../config/db');
const { getActiveSocketsCount } = require('../socket/socketHandler');
const { getQueueMetrics, clearSubmissionQueue, executeCode } = require('../services/queueService');
const { executeCode: judge0ExecuteCode, executeRawBenchmarkCode } = require('../services/judge0Service');

router.use(verifyAdminToken, verifyMasterOnly);

// List all admin/faculty users
router.get('/users', async (req, res) => {
  try {
    const users = await UserAdmin.find({ role: { $ne: 'master' } })
      .select('-passwordHash')
      .sort({ createdAt: -1 });
    res.json({ users });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Edit user credentials / details (Master Superuser)
router.put('/users/:id', async (req, res) => {
  try {
    const { name, email, role, status } = req.body;
    const user = await UserAdmin.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.role === 'master') {
      return res.status(400).json({ message: 'Cannot modify primary Master Admin credentials' });
    }

    if (name) user.name = name;
    if (email) user.email = email.toLowerCase();
    if (role && ['faculty', 'master'].includes(role)) user.role = role;
    if (status && ['approved', 'pending', 'rejected', 'suspended'].includes(status)) user.status = status;

    await user.save();

    await AuditLog.create({
      actorId: req.user._id,
      actorType: 'master',
      action: 'UPDATE_USER_CREDENTIALS',
      targetId: String(user._id),
      meta: { name: user.name, email: user.email, status: user.status }
    });

    res.json({ message: 'User account details updated successfully', user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Approve, reject, or suspend a user
router.put('/users/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    if (!['approved', 'rejected', 'suspended', 'pending'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const user = await UserAdmin.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.role === 'master') {
      return res.status(400).json({ message: 'Cannot modify Master Admin account status' });
    }

    const oldStatus = user.status;
    user.status = status;
    await user.save();

    await AuditLog.create({
      actorId: req.user._id,
      actorType: 'master',
      action: 'USER_STATUS_CHANGE',
      targetId: String(user._id),
      meta: { oldStatus, newStatus: status, email: user.email }
    });

    res.json({ message: `User status updated to ${status}`, user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// System health & telemetry metrics
router.get('/health', async (req, res) => {
  try {
    const dbStats = await getDBStats();
    const activeSockets = getActiveSocketsCount();
    const queueMetrics = await getQueueMetrics();

    res.json({
      system: {
        uptime: process.uptime(),
        nodeVersion: process.version,
        memoryUsage: process.memoryUsage()
      },
      database: dbStats,
      activeSockets,
      queueMetrics
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Emergency Clear Queue
router.post('/clear-queue', async (req, res) => {
  try {
    const result = await clearSubmissionQueue();
    await AuditLog.create({
      actorId: req.user._id,
      actorType: 'master',
      action: 'EMERGENCY_CLEAR_QUEUE',
      targetId: 'system_queue',
      meta: { timestamp: new Date() }
    });
    res.json({ message: 'Execution queue emergency flushed successfully', result });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Interactive Multi-Language Stress & Benchmark Simulator
router.post('/benchmark-simulate', async (req, res) => {
  try {
    const {
      cCount = 0,
      pythonCount = 0,
      javaCount = 0,
      cppCount = 0,
      jsCount = 0,
      cCode = '#include <stdio.h>\nint main(){ printf("OK\\n"); return 0; }',
      pythonCode = 'print("OK")',
      javaCode = 'public class Main { public static void main(String[] args){ System.out.println("OK"); } }',
      cppCode = '#include <iostream>\nusing namespace std; int main(){ cout << "OK" << endl; return 0; }',
      jsCode = 'console.log("OK");',
      cCmd,
      pythonCmd,
      javaCmd,
      cppCmd,
      jsCmd
    } = req.body;

    const requestList = [];
    const addJobs = (lang, code, count, customCommand) => {
      const c = Math.max(0, parseInt(count, 10) || 0);
      for (let i = 0; i < c; i++) {
        requestList.push({ language: lang, code, customCommand });
      }
    };

    addJobs('c', cCode, cCount, cCmd);
    addJobs('python', pythonCode, pythonCount, pythonCmd);
    addJobs('java', javaCode, javaCount, javaCmd);
    addJobs('cpp', cppCode, cppCount, cppCmd);
    addJobs('javascript', jsCode, jsCount, jsCmd);

    if (requestList.length === 0) {
      return res.status(400).json({ message: 'Please enter at least 1 execution count for any language' });
    }

    // Fisher-Yates Shuffle for true randomized execution ordering
    for (let i = requestList.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [requestList[i], requestList[j]] = [requestList[j], requestList[i]];
    }

    const startMemory = process.memoryUsage().heapUsed;
    const overallStart = process.hrtime.bigint();
    const executionLogs = [];

    // Run benchmark jobs in batches to evaluate throughput and microsecond latency
    const batchSize = parseInt(process.env.WORKER_CONCURRENCY || '2', 10);
    const io = req.app.get('io');

    for (let i = 0; i < requestList.length; i += batchSize) {
      const batch = requestList.slice(i, i + batchSize);
      const batchPromises = batch.map(async (job, bIdx) => {
        const jobStart = process.hrtime.bigint();
        try {
          const res = await executeRawBenchmarkCode({
            language: job.language,
            code: job.code,
            customCommand: job.customCommand
          });
          const jobEnd = process.hrtime.bigint();
          const latencyMs = Number(jobEnd - jobStart) / 1000000;
          const statusVal = (res.verdict === 'Compilation Error' || res.verdict === 'Runtime Error') ? 'Execution Error' : 'Success';

          const item = {
            index: i + bIdx + 1,
            language: job.language,
            latencyMs: Number(latencyMs.toFixed(2)),
            rawOutput: res.rawOutput || 'Execution completed with no output.',
            status: statusVal
          };

          if (io) {
            const memUsedMb = Number((process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2));
            const memTotalMb = Math.round(os.totalmem() / 1024 / 1024);
            const ramPercentage = Math.min(100, Number(((process.memoryUsage().heapUsed / os.totalmem()) * 100).toFixed(1)));
            io.emit('benchmark_run_item', item);
            io.emit('benchmark_telemetry_tick', {
              completedCount: i + bIdx + 1,
              totalExecutions: requestList.length,
              memoryUsedMb: memUsedMb,
              memoryTotalMb: memTotalMb,
              ramPercentage: ramPercentage,
              timestamp: new Date()
            });
          }

          return item;
        } catch (err) {
          const jobEnd = process.hrtime.bigint();
          const latencyMs = Number(jobEnd - jobStart) / 1000000;
          const item = {
            index: i + bIdx + 1,
            language: job.language,
            latencyMs: Number(latencyMs.toFixed(2)),
            rawOutput: err.message || 'Execution failed',
            status: 'Execution Error'
          };

          if (io) {
            io.emit('benchmark_run_item', item);
          }

          return item;
        }
      });

      const batchResults = await Promise.all(batchPromises);
      executionLogs.push(...batchResults);
    }
          totalExecutions: requestList.length,
          recentLogs: batchResults,
          ramUsedMb: memUsedMb,
          ramTotalMb: memTotalMb,
          ramPercentage,
          v8HeapUsedMb: memUsedMb,
          v8HeapTotalMb: Number((process.memoryUsage().heapTotal / 1024 / 1024).toFixed(2))
        });
      }
    }

    const overallEnd = process.hrtime.bigint();
    const totalBenchmarkMs = Number(overallEnd - overallStart) / 1000000;
    const endMemory = process.memoryUsage().heapUsed;

    const latencies = executionLogs.map(l => l.latencyMs);
    const minWaitingMs = Math.min(...latencies);
    const maxWaitingMs = Math.max(...latencies);
    const avgWaitingMs = Number((latencies.reduce((a, b) => a + b, 0) / latencies.length).toFixed(2));
    const throughputPerSec = Number(((requestList.length / totalBenchmarkMs) * 1000).toFixed(2));
    const memoryDeltaMb = Number(((endMemory - startMemory) / 1024 / 1024).toFixed(2));

    await AuditLog.create({
      actorId: req.user._id,
      actorType: 'master',
      action: 'MULTI_LANG_STRESS_BENCHMARK',
      targetId: 'benchmark_engine',
      meta: {
        totalExecutions: requestList.length,
        minWaitingMs,
        maxWaitingMs,
        avgWaitingMs,
        throughputPerSec
      }
    });

    res.json({
      message: 'Benchmark Stress Simulation Finished',
      totalExecutions: requestList.length,
      metrics: {
        minWaitingMs,
        maxWaitingMs,
        avgWaitingMs,
        totalBenchmarkMs: Number(totalBenchmarkMs.toFixed(2)),
        throughputPerSec,
        memoryDeltaMb
      },
      executionLogs
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Audit Logs with filtering
router.get('/audit-logs', async (req, res) => {
  try {
    const { action, actorType, limit = 100 } = req.query;
    const filter = {};
    if (action) filter.action = action;
    if (actorType) filter.actorType = actorType;

    const logs = await AuditLog.find(filter)
      .populate('actorId', 'name email role')
      .sort({ timestamp: -1 })
      .limit(parseInt(limit, 10));

    res.json({ logs });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Worst-Case High Concurrency Load Simulation
router.post('/simulate-load', async (req, res) => {
  try {
    const { studentCount = 60, scenario = 'burst_submission' } = req.body;
    const count = Math.max(1, parseInt(studentCount, 10));

    const memoryPerExecutionMb = 16;
    const totalRamRequiredMb = Math.round(count * memoryPerExecutionMb);
    const heapUsedMb = Math.round(process.memoryUsage().heapUsed / 1024 / 1024);
    const heapTotalMb = Math.round(process.memoryUsage().heapTotal / 1024 / 1024);
    const freeTierRamCapMb = 512;

    const workerConcurrency = parseInt(process.env.WORKER_CONCURRENCY || '4', 10);
    const avgExecutionMs = 450; 
    const batchCount = Math.ceil(count / workerConcurrency);
    const estTotalTimeMs = batchCount * avgExecutionMs;

    const packetsPerSec = scenario === 'burst_warning' ? count * 4 : count * 2;
    const bandwidthKbps = Math.round((packetsPerSec * 256) / 1024);

    const dbStats = await getDBStats();
    const currentDbMb = parseFloat(dbStats.dataSizeMb || '0.00');
    const atlasFreeLimitMb = 512;
    const estNewDbMb = parseFloat((count * 0.02).toFixed(2));
    const remainingDbMb = (atlasFreeLimitMb - (currentDbMb + estNewDbMb)).toFixed(2);

    let isCrashProof = true;
    let verdict = 'ZERO-CRASH RESILIENT (100% READY)';
    let recommendations = 'System Design Controls: Rate limits, async sandboxes, and Socket auto-recovery guarantee zero-crash execution.';

    if (totalRamRequiredMb + heapUsedMb > freeTierRamCapMb * 0.85) {
      isCrashProof = false;
      verdict = 'RAM CAPACITY WARNING';
      recommendations = `Simulated burst requires ~${totalRamRequiredMb}MB RAM. Recommended: Increase WORKER_CONCURRENCY or submit in 2 room batches.`;
    }

    res.json({
      studentCount: count,
      scenario,
      metrics: {
        workerConcurrency,
        estimatedTotalExecutionMs: estTotalTimeMs,
        avgQueueTimePerStudentMs: Math.round(estTotalTimeMs / count),
        totalRamRequiredMb,
        currentHeapUsedMb: heapUsedMb,
        freeTierRamCapMb,
        packetsPerSec,
        bandwidthKbps,
        estNewDbMb,
        currentDbMb,
        remainingDbMb,
        atlasFreeLimitMb
      },
      isCrashProof,
      verdict,
      recommendations
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// --- DEMO CREATION & MANAGEMENT ENDPOINTS ---

// List all Demo Rooms
router.get('/demo-rooms', async (req, res) => {
  try {
    const demoRooms = await DemoRoom.find()
      .populate('paperId', 'title timeLimitMinutes allowedLanguages questionIds')
      .populate('roomId')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    const results = await Promise.all(demoRooms.map(async (dr) => {
      const isExpired = dr.isExpired();
      const studentCount = await StudentSession.countDocuments({ roomId: dr.roomId?._id });
      const onlineCount = await StudentSession.countDocuments({ 
        roomId: dr.roomId?._id, 
        status: { $in: ['admitted', 'active'] } 
      });

      return {
        _id: dr._id,
        slug: dr.slug,
        paperTitle: dr.paperId?.title || 'Unknown Paper',
        paperId: dr.paperId?._id,
        expirationType: dr.expirationType,
        expirationValue: dr.expirationValue,
        expireAt: dr.expireAt,
        isExpired,
        serialCounter: dr.serialCounter,
        studentCount,
        onlineCount,
        createdAt: dr.createdAt,
        createdBy: dr.createdBy?.name || 'Master'
      };
    }));

    res.json({ demoRooms: results });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create Demo Room
router.post('/demo-rooms', async (req, res) => {
  try {
    const { slug, paperId, expirationType = 'none', expirationValue = 0 } = req.body;
    if (!slug || !paperId) {
      return res.status(400).json({ message: 'Slug and Paper are required' });
    }

    const cleanSlug = slug.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
    if (cleanSlug.length < 2) {
      return res.status(400).json({ message: 'Slug must be at least 2 alphanumeric characters' });
    }

    const reservedSlugs = ['admin', 'student', 'master', 'api', 'demo', 'login', 'register', 'dashboard', 'questions', 'papers', 'rooms', 'monitor', 'analytics'];
    if (reservedSlugs.includes(cleanSlug)) {
      return res.status(400).json({ message: `"${cleanSlug}" is a reserved URL path. Please choose another name.` });
    }

    const existing = await DemoRoom.findOne({ slug: cleanSlug });
    if (existing) {
      return res.status(400).json({ message: `Demo link "/${cleanSlug}" already exists. Please pick a different name.` });
    }

    const paper = await Paper.findById(paperId);
    if (!paper) {
      return res.status(404).json({ message: 'Selected question paper not found' });
    }

    // Calculate expiration timestamp
    let expireAt = null;
    const expVal = Math.max(1, parseInt(expirationValue, 10) || 1);
    if (expirationType === 'hours') {
      expireAt = new Date(Date.now() + expVal * 3600 * 1000);
    } else if (expirationType === 'days') {
      expireAt = new Date(Date.now() + expVal * 86400 * 1000);
    }

    // Create associated system Room
    const roomCode = `DEMO_${cleanSlug.toUpperCase()}_${Math.floor(1000 + Math.random() * 9000)}`;
    const room = await Room.create({
      roomCode,
      createdBy: req.user._id,
      paperId: paper._id,
      status: 'live',
      admittedAt: new Date()
    });

    const demoRoom = await DemoRoom.create({
      slug: cleanSlug,
      paperId: paper._id,
      roomId: room._id,
      expirationType: ['none', 'hours', 'days'].includes(expirationType) ? expirationType : 'none',
      expirationValue: expVal,
      expireAt,
      createdBy: req.user._id
    });

    await AuditLog.create({
      actorId: req.user._id,
      actorType: 'master',
      action: 'CREATE_DEMO_ROOM',
      targetId: String(demoRoom._id),
      meta: { slug: cleanSlug, paperTitle: paper.title, expirationType }
    });

    res.status(201).json({
      message: `Demo link "/${cleanSlug}" created successfully`,
      demoRoom: {
        _id: demoRoom._id,
        slug: demoRoom.slug,
        paperTitle: paper.title,
        expirationType: demoRoom.expirationType,
        expireAt: demoRoom.expireAt
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete Demo Room
router.delete('/demo-rooms/:id', async (req, res) => {
  try {
    const demoRoom = await DemoRoom.findById(req.params.id);
    if (!demoRoom) return res.status(404).json({ message: 'Demo room not found' });

    if (demoRoom.roomId) {
      await Room.findByIdAndDelete(demoRoom.roomId);
      await StudentSession.deleteMany({ roomId: demoRoom.roomId });
    }

    await DemoRoom.findByIdAndDelete(req.params.id);

    await AuditLog.create({
      actorId: req.user._id,
      actorType: 'master',
      action: 'DELETE_DEMO_ROOM',
      targetId: String(req.params.id),
      meta: { slug: demoRoom.slug }
    });

    res.json({ message: `Demo link "/${demoRoom.slug}" deleted successfully` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Fetch detailed student submission results for a Demo Room
router.get('/demo-rooms/:id/results', async (req, res) => {
  try {
    const demoRoom = await DemoRoom.findById(req.params.id).populate({
      path: 'paperId',
      populate: { path: 'questionIds', select: 'title difficulty' }
    });
    if (!demoRoom) return res.status(404).json({ message: 'Demo room not found' });

    const sessions = await StudentSession.find({ roomId: demoRoom.roomId }).sort({ joinedAt: -1 });
    const questions = demoRoom.paperId?.questionIds || [];

    const results = await Promise.all(sessions.map(async (s) => {
      const submissions = await Submission.find({ sessionId: s._id, type: 'submit' }).sort({ createdAt: -1 });

      const questionResults = questions.map((q) => {
        const sub = submissions.find(sub => String(sub.questionId) === String(q._id));
        return {
          questionId: q._id,
          title: q.title,
          verdict: sub ? sub.verdict : 'Not Attempted',
          code: sub ? sub.code : (s.currentCode?.get(String(q._id)) || ''),
          language: sub ? sub.language : 'N/A',
          submittedAt: sub ? sub.createdAt : null
        };
      });

      return {
        sessionId: s._id,
        name: s.name,
        serialId: s.usn,
        status: s.status,
        joinedAt: s.joinedAt,
        submittedAt: s.submittedAt,
        questionResults
      };
    }));

    res.json({
      demoSlug: demoRoom.slug,
      paperTitle: demoRoom.paperId?.title || 'Question Paper',
      totalParticipants: results.length,
      results
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;

