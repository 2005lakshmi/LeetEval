const { Queue, Worker } = require('bullmq');
const Redis = require('ioredis');
const { executeCode } = require('./judge0Service');
const Submission = require('../models/Submission');

const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
const concurrency = parseInt(process.env.WORKER_CONCURRENCY || '2', 10);

let submissionQueue = null;
let redisClient = null;
let ioInstance = null;
let activeCountInDirectMode = 0;

function initQueue(io) {
  ioInstance = io;

  try {
    redisClient = new Redis(redisUrl, {
      maxRetriesPerRequest: null,
      enableOfflineQueue: false,
      retryStrategy: () => null // Don't crash if Redis is unavailable
    });

    redisClient.on('error', (err) => {
      console.log(`[Redis Connection Warning]: ${err.message}. Using direct processing mode.`);
    });

    submissionQueue = new Queue('submissions', { connection: redisClient });

    const worker = new Worker('submissions', async (job) => {
      console.log(`[BullMQ Processing Job]: ${job.id} (Submission ${job.data.submissionId})`);
      return await processSubmissionJob(job.data);
    }, { connection: redisClient, concurrency });

    worker.on('completed', (job, result) => {
      console.log(`[BullMQ Job Completed]: ${job.id} - Verdict: ${result.verdict}`);
    });

    worker.on('failed', (job, err) => {
      console.error(`[BullMQ Job Failed]: ${job.id} - Error: ${err.message}`);
    });

    console.log(`[BullMQ Queue Initialized]: Worker concurrency set to ${concurrency}`);
  } catch (err) {
    console.log(`[Queue Fallback]: Redis unavailable (${err.message}). Direct sync execution active.`);
  }
}

async function processSubmissionJob(data) {
  activeCountInDirectMode++;
  const { submissionId, language, code, customTemplate, testcases, timeLimitMs, memoryLimitMb, socketId, sessionId } = data;

  if (ioInstance && activeCountInDirectMode > 1) {
    const queueMsg = `Please wait, you are in queue: ${activeCountInDirectMode - 1} programs to be executed...`;
    const payload = { activeCount: activeCountInDirectMode, queuePosition: activeCountInDirectMode - 1, message: queueMsg };
    if (socketId) ioInstance.to(socketId).emit('queue_position_update', payload);
    if (sessionId) ioInstance.to(`session_${sessionId}`).emit('queue_position_update', payload);
  }

  try {
    const result = await executeCode({
      language,
      code,
      customTemplate,
      testcases,
      timeLimitMs,
      memoryLimitMb
    });

    // Update submission in DB
    let updatedSubmission = null;
    if (submissionId) {
      updatedSubmission = await Submission.findByIdAndUpdate(
        submissionId,
        {
          verdict: result.verdict,
          rawOutput: result.rawOutput || '',
          testResults: result.testResults,
          totalRuntimeMs: result.totalRuntimeMs,
          maxMemoryKb: result.maxMemoryKb || 0
        },
        { new: true }
      );
    }

    // Emit socket event to student and live admin room
    if (ioInstance) {
      const payload = {
        submissionId,
        sessionId,
        verdict: result.verdict,
        rawOutput: result.rawOutput || '',
        testResults: result.testResults,
        totalRuntimeMs: result.totalRuntimeMs
      };

      if (socketId) {
        ioInstance.to(socketId).emit('submission_result', payload);
      }
      if (sessionId) {
        ioInstance.to(`session_${sessionId}`).emit('submission_result', payload);
      }
      if (data.roomId) {
        ioInstance.to(`room_admin_${data.roomId}`).emit('live_submission_update', payload);
        ioInstance.to(`room_${data.roomId}`).emit('live_submission_update', payload);
      }
    }

    return result;
  } finally {
    activeCountInDirectMode = Math.max(0, activeCountInDirectMode - 1);
  }
}

async function addSubmissionToQueue(submissionData) {
  if (submissionQueue && redisClient && redisClient.status === 'ready') {
    const job = await submissionQueue.add('eval_code', submissionData, {
      attempts: 2,
      removeOnComplete: 100
    });
    return { queued: true, jobId: job.id };
  } else {
    // Synchronously execute and return full result when in direct processing mode
    const result = await processSubmissionJob(submissionData);
    return { queued: false, jobId: 'sync_direct', result };
  }
}

async function getQueueMetrics() {
  if (submissionQueue && redisClient && redisClient.status === 'ready') {
    const waiting = await submissionQueue.getWaitingCount();
    const active = await submissionQueue.getActiveCount();
    const completed = await submissionQueue.getCompletedCount();
    const failed = await submissionQueue.getFailedCount();
    return { waiting, active, completed, failed, mode: 'BullMQ Queue Engine' };
  }
  return {
    waiting: 0,
    active: activeCountInDirectMode,
    completed: 0,
    failed: 0,
    mode: 'Direct Worker Engine'
  };
}

async function clearSubmissionQueue() {
  if (submissionQueue && redisClient && redisClient.status === 'ready') {
    await submissionQueue.drain();
    await submissionQueue.clean(0, 1000, 'wait');
    await submissionQueue.clean(0, 1000, 'active');
  }
  activeCountInDirectMode = 0;
  if (ioInstance) {
    ioInstance.emit('queue_cleared', { timestamp: new Date(), message: 'All execution processes were terminated. Run again.' });
  }
  return { success: true, timestamp: new Date() };
}

module.exports = { initQueue, addSubmissionToQueue, getQueueMetrics, clearSubmissionQueue, processSubmissionJob };
