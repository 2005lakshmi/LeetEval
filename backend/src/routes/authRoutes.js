const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const UserAdmin = require('../models/UserAdmin');
const AuditLog = require('../models/AuditLog');
const { verifyAdminToken } = require('../middleware/authMiddleware');

const secretKey = process.env.JWT_SECRET || 'super_secret_jwt_key_leet_eval_2026_change_in_prod';

// Login (Faculty & Master)
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await UserAdmin.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    if (user.status === 'pending') {
      return res.status(403).json({ message: 'Account registration is pending approval by Master Admin.' });
    }
    if (user.status === 'suspended') {
      return res.status(403).json({ message: 'Account is suspended.' });
    }
    if (user.status === 'rejected') {
      return res.status(403).json({ message: 'Account registration was rejected.' });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role, email: user.email },
      secretKey,
      { expiresIn: '24h' }
    );

    await AuditLog.create({
      actorId: user._id,
      actorType: user.role,
      action: 'USER_LOGIN',
      targetId: String(user._id)
    });

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Register Faculty (Status defaults to pending)
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    const existing = await UserAdmin.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(400).json({ message: 'Email is already registered' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = await UserAdmin.create({
      name,
      email: email.toLowerCase(),
      passwordHash,
      role: 'faculty',
      status: 'pending'
    });

    await AuditLog.create({
      actorId: newUser._id,
      actorType: 'faculty',
      action: 'FACULTY_REGISTER_PENDING',
      targetId: String(newUser._id)
    });

    res.status(201).json({
      message: 'Registration successful! Your account is pending approval by Master Admin.',
      user: { id: newUser._id, name: newUser.name, email: newUser.email, status: newUser.status }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get Current Profile
router.get('/me', verifyAdminToken, (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
