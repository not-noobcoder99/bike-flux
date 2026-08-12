const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const VirtualCard = require('../models/VirtualCard');

async function register(req, res, next) {
  try {
    const { full_name, email, password, phone, student_id } = req.body;
    if (!full_name || !email || !password) {
      return res.status(400).json({ error: 'full_name, email and password are required' });
    }
    const existing = await User.findByEmail(email);
    if (existing) return res.status(409).json({ error: 'Email already registered' });

    const password_hash = await bcrypt.hash(password, 10);
    const user_id = await User.create({ full_name, email, password_hash, phone, student_id });

    await VirtualCard.create({
      user_id,
      card_number: `VC-${user_id}-${Date.now()}`,
      provider_ref: null,
    });

    res.status(201).json({
      message: 'Registered successfully. Your account is pending admin approval before you can log in.',
      user_id,
    });
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const user = await User.findByEmail(email);
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return res.status(401).json({ error: 'Invalid credentials' });

    if (user.status === 'pending') {
      return res.status(403).json({ error: 'Your account is awaiting admin approval' });
    }
    if (user.status === 'suspended') {
      return res.status(403).json({ error: 'Your account has been suspended' });
    }

    const token = jwt.sign(
      { user_id: user.user_id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({
      token,
      user: { user_id: user.user_id, full_name: user.full_name, email: user.email, role: user.role },
    });
  } catch (err) {
    next(err);
  }
}

async function me(req, res, next) {
  try {
    const user = await User.findById(req.user.user_id);
    res.json(user);
  } catch (err) {
    next(err);
  }
}

async function updateProfile(req, res, next) {
  try {
    const { full_name, phone, student_id } = req.body;
    if (!full_name) return res.status(400).json({ error: 'full_name is required' });
    const user = await User.findById(req.user.user_id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    await User.update(req.user.user_id, {
      full_name,
      phone: phone || user.phone,
      student_id: student_id || user.student_id,
    });
    res.json(await User.findById(req.user.user_id));
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login, me, updateProfile };
