const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const router = express.Router();

// Show signup form
router.get('/signup', (req, res) => {
  res.render('signup');
});

// Handle signup
router.post('/signup', async (req, res) => {
  try {
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    const user = new User({
  username: req.body.username,
  email: req.body.email,
  address: req.body.address,
  password: hashedPassword,
});
    await user.save();
    res.redirect('/auth/login');
  } catch (err) {
    res.status(400).send('Error creating user.');
  }
});

// Show login form
router.get('/login', (req, res) => {
  res.render('login');
});

// Handle login
router.post('/login', async (req, res) => {
  try {
    const user = await User.findOne({ username: req.body.username });
    if (user && await bcrypt.compare(req.body.password, user.password)) {
      req.session.userId = user._id;
      res.redirect('/dashboard');
    } else {
      res.status(400).send('Invalid username or password');
    }
  } catch {
    res.status(500).send('Server error');
  }
});

// Handle logout
router.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/auth/login');
  });
});

module.exports = router;
