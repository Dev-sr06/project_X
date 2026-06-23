const router = require('express').Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');

const sign = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });

// Register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password)
      return res.status(400).json({ message: 'All fields required' });

    if (await User.findOne({ email }))
      return res.status(400).json({ message: 'Email already registered' });

    const user = await new User({ name, email, password }).save();
    res.status(201).json({ token: sign(user._id), user: { id: user._id, name: user.name, email: user.email } });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user || !(await user.comparePassword(password)))
      return res.status(400).json({ message: 'Invalid credentials' });

    res.json({ token: sign(user._id), user: { id: user._id, name: user.name, email: user.email } });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get profile
router.get('/me', auth, async (req, res) => {
  res.json(req.user);
});

// Update profile
router.put('/me', auth, async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const user = await User.findById(req.user._id);

    if (name) user.name = name;
    if (email) user.email = email;
    if (password) user.password = password;

    await user.save();
    res.json({ id: user._id, name: user.name, email: user.email });
    
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
