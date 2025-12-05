const jwt = require('jsonwebtoken');
const { User } = require('../models');
const JWT_SECRET = process.env.JWT_SECRET || 'devsecret';
module.exports = async (req, res, next) => {
  try {
    const auth = req.headers['authorization'];
    if (!auth) return res.status(401).json({ error: 'missing auth token' });
    const parts = auth.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') return res.status(401).json({ error: 'invalid auth format' });
    const token = parts[1];
    const payload = jwt.verify(token, JWT_SECRET);
    const user = await User.findByPk(payload.id);
    if (!user) return res.status(401).json({ error: 'invalid token user' });
    req.user = { id: user.id, email: user.email };
    next();
  } catch (err) {
    console.error('auth middleware error', err);
    res.status(401).json({ error: 'unauthorized' });
  }
};
