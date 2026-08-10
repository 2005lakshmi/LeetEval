const express = require('express');
const router = express.Router();
const Paper = require('../models/Paper');
const Question = require('../models/Question');
const AuditLog = require('../models/AuditLog');
const { verifyAdminToken } = require('../middleware/authMiddleware');

router.use(verifyAdminToken);

// List papers
router.get('/', async (req, res) => {
  try {
    const papers = await Paper.find()
      .populate('questionIds', 'title difficulty referenceSolutionVerified')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });
    res.json({ papers });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create paper (Requires verified questions)
router.post('/', async (req, res) => {
  try {
    const { title, questionIds, orderingMode, timeLimitMinutes, allowedLanguages } = req.body;
    if (!title || !questionIds || !Array.isArray(questionIds) || questionIds.length === 0) {
      return res.status(400).json({ message: 'Title and at least one question are required' });
    }

    // Verify all question IDs exist and are verified
    const questions = await Question.find({ _id: { $in: questionIds } });
    const unverified = questions.filter(q => !q.referenceSolutionVerified);

    if (unverified.length > 0) {
      return res.status(400).json({
        message: `The following questions have not passed reference solution verification: ${unverified.map(q => q.title).join(', ')}`,
        unverifiedIds: unverified.map(q => q._id)
      });
    }

    const validLangs = Array.isArray(allowedLanguages) && allowedLanguages.length > 0
      ? allowedLanguages
      : ['python', 'cpp', 'c', 'java', 'javascript'];

    const paper = await Paper.create({
      title,
      questionIds,
      orderingMode: orderingMode || 'fixed',
      timeLimitMinutes: timeLimitMinutes || 60,
      allowedLanguages: validLangs,
      createdBy: req.user._id
    });

    await AuditLog.create({
      actorId: req.user._id,
      actorType: req.user.role,
      action: 'CREATE_PAPER',
      targetId: String(paper._id),
      meta: { title: paper.title, questionCount: questionIds.length }
    });

    res.status(201).json({ paper });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update paper
router.put('/:id', async (req, res) => {
  try {
    const { title, questionIds, orderingMode, timeLimitMinutes, allowedLanguages } = req.body;
    const paper = await Paper.findById(req.params.id);
    if (!paper) return res.status(404).json({ message: 'Paper not found' });

    if (questionIds && Array.isArray(questionIds) && questionIds.length > 0) {
      const questions = await Question.find({ _id: { $in: questionIds } });
      const unverified = questions.filter(q => !q.referenceSolutionVerified);
      if (unverified.length > 0) {
        return res.status(400).json({
          message: `The following questions have not passed reference solution verification: ${unverified.map(q => q.title).join(', ')}`,
          unverifiedIds: unverified.map(q => q._id)
        });
      }
      paper.questionIds = questionIds;
    }

    if (title) paper.title = title;
    if (orderingMode) paper.orderingMode = orderingMode;
    if (timeLimitMinutes !== undefined) paper.timeLimitMinutes = timeLimitMinutes;
    if (Array.isArray(allowedLanguages) && allowedLanguages.length > 0) {
      paper.allowedLanguages = allowedLanguages;
    }

    await paper.save();

    await AuditLog.create({
      actorId: req.user._id,
      actorType: req.user.role,
      action: 'UPDATE_PAPER',
      targetId: String(paper._id),
      meta: { title: paper.title, questionCount: paper.questionIds.length }
    });

    res.json({ paper, message: 'Exam paper updated successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete paper
router.delete('/:id', async (req, res) => {
  try {
    const paper = await Paper.findByIdAndDelete(req.params.id);
    if (!paper) return res.status(404).json({ message: 'Paper not found' });
    res.json({ message: 'Paper deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
