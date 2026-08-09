const jwt = require('jsonwebtoken');
const UserAdmin = require('../models/UserAdmin');

const secretKey = process.env.JWT_SECRET || 'super_secret_jwt_key_leet_eval_2026_change_in_prod';

const verifyAdminToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authorization token required' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, secretKey);
    const user = await UserAdmin.findById(decoded.id).select('-passwordHash');
    if (!user) {
      return res.status(401).json({ message: 'User account no longer exists' });
    }
    if (user.status === 'suspended') {
      return res.status(403).json({ message: 'Your account is suspended. Contact Master Admin.' });
    }
    if (user.status === 'pending') {
      return res.status(403).json({ message: 'Account approval pending by Master Admin.' });
    }
    if (user.status === 'rejected') {
      return res.status(403).json({ message: 'Account registration was rejected.' });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

const verifyMasterOnly = (req, res, next) => {
  if (req.user && req.user.role === 'master') {
    return next();
  }
  return res.status(403).json({ message: 'Superuser / Master Admin access required' });
};

module.exports = { verifyAdminToken, verifyMasterOnly };
