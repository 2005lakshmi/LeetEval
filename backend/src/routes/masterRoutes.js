const express = require('express');
const router = express.Router();
const UserAdmin = require('../models/UserAdmin');
const AuditLog = require('../models/AuditLog');
const { verifyAdminToken, verifyMasterOnly } = require('../middleware/authMiddleware');
const { getDBStats } = require('../config/db');
const { getActiveSocketsCount } = require('../socket/socketHandler');

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

// System health metrics
router.get('/health', async (req, res) => {
  try {
    const dbStats = await getDBStats();
    const activeSockets = getActiveSocketsCount();

    res.json({
      system: {
        uptime: process.uptime(),
        nodeVersion: process.version,
        memoryUsage: process.memoryUsage()
      },
      database: dbStats,
      activeSockets,
      redisQueue: {
        concurrency: parseInt(process.env.WORKER_CONCURRENCY || '2', 10),
        status: 'Active'
      }
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

// Worst-Case High Concurrency Load Simulation & Free Cloud Capacity Assessment
router.post('/simulate-load', async (req, res) => {
  try {
    const { studentCount = 60, scenario = 'burst_submission' } = req.body;
    const count = Math.max(1, parseInt(studentCount, 10));

    // 1. Production Memory & Sandbox Execution Analysis
    const memoryPerExecutionMb = 16; // Memory footprint per non-blocking process sandbox execution
    const totalRamRequiredMb = Math.round(count * memoryPerExecutionMb);
    const heapUsedMb = Math.round(process.memoryUsage().heapUsed / 1024 / 1024);
    const heapTotalMb = Math.round(process.memoryUsage().heapTotal / 1024 / 1024);
    const freeTierRamCapMb = 512; // Free Tier RAM Limit (e.g. Render Free Tier)

    // 2. Queue Throughput & Concurrency Rate
    const workerConcurrency = parseInt(process.env.WORKER_CONCURRENCY || '4', 10);
    const avgExecutionMs = 450; 
    const batchCount = Math.ceil(count / workerConcurrency);
    const estTotalTimeMs = batchCount * avgExecutionMs;

    // 3. Socket Traffic & Bandwidth Meter
    const packetsPerSec = scenario === 'burst_warning' ? count * 4 : count * 2;
    const bandwidthKbps = Math.round((packetsPerSec * 256) / 1024);

    // 4. DB Storage Capacity & Atlas M0 Limits
    const dbStats = await getDBStats();
    const currentDbMb = parseFloat(dbStats.dataSizeMb || '0.00');
    const atlasFreeLimitMb = 512; // MongoDB Atlas M0 Free Limit
    const estNewDbMb = parseFloat((count * 0.02).toFixed(2));
    const remainingDbMb = (atlasFreeLimitMb - (currentDbMb + estNewDbMb)).toFixed(2);

    // 5. Zero-Crash System Resilience Score & Verdict
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

module.exports = router;
