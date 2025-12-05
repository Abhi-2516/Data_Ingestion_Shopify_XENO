const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const JWT_SECRET = process.env.JWT_SECRET || 'devsecret';
exports.register = async (req, res) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'email and password required' });
    const existing = await User.findOne({ where: { email } });
    if (existing) return res.status(400).json({ error: 'email already exists' });
    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({ email, passwordHash: hash, name: name || null });
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, email: user.email, name: user.name }});
  } catch (err) {
    console.error('auth register error', err);
    res.status(500).json({ error: 'server error' });
  }
};
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'email and password required' });
    const user = await User.findOne({ where: { email }});
    if (!user) return res.status(401).json({ error: 'invalid credentials' });
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: 'invalid credentials' });
    const token = require('jsonwebtoken').sign({ id: user.id, email: user.email }, process.env.JWT_SECRET || 'devsecret', { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, email: user.email, name: user.name }});
  } catch (err) {
    console.error('auth login error', err);
    res.status(500).json({ error: 'server error' });
  }
};
