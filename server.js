require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const bcrypt = require('bcrypt');
const app = express();

const User = require('./models/User');

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

// Multer setup for profile pic upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueName = req.session.userId + '-' + Date.now() + path.extname(file.originalname);
    cb(null, uniqueName);
  }
});
const upload = multer({ storage: storage });

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));

// Session middleware (must come before auth routes)
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ mongoUrl: process.env.MONGO_URI }),
}));

// Auth routes (login/signup)
app.use('/auth', require('./routes/auth'));

// Middleware to check if user is logged in
function requireLogin(req, res, next) {
  if (!req.session.userId) {
    return res.redirect('/auth/login');
  }
  next();
}

// Profile pic upload route
app.post('/dashboard/profile-pic', requireLogin, upload.single('profilePic'), async (req, res) => {
  if (req.file) {
    const user = await User.findById(req.session.userId);
    user.profilePic = '/uploads/' + req.file.filename;
    await user.save();
  }
  res.redirect('/dashboard');
});

// Dashboard route
app.get('/dashboard', requireLogin, async (req, res) => {
  const user = await User.findById(req.session.userId);
  res.render('dashboard', { user });
});

// Home route
app.get('/home', requireLogin, (req, res) => {
  const products = [
    { id: 1, title: 'Eco Bottle', desc: 'Reusable water bottle' },
    { id: 2, title: 'Bamboo Toothbrush', desc: 'Biodegradable toothbrush' },
    { id: 3, title: 'Solar Charger', desc: 'Portable charger' },
    { id: 4, title: 'Organic Bag', desc: 'Reusable shopping bag' },
    { id: 5, title: 'LED Bulb', desc: 'Energy-saving bulb' },
    { id: 6, title: 'Compost Bin', desc: 'Kitchen food waste collector' }
  ];
  res.render('home', { products });
});

// Settings routes
app.get('/settings', requireLogin, async (req, res) => {
  const user = await User.findById(req.session.userId);
  res.render('settings', { user, error: null, success: null });
});

app.post('/settings', requireLogin, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);
    user.username = req.body.username || user.username;
    user.email = req.body.email || user.email;
    user.address = req.body.address || user.address;
    if (req.body.password) {
      const hashedPassword = await bcrypt.hash(req.body.password, 10);
      user.password = hashedPassword;
    }
    if (req.body.profilePic) {
      user.profilePic = req.body.profilePic;
    }
    await user.save();
    res.render('settings', { user, success: 'Profile updated successfully!', error: null });
  } catch (err) {
    res.render('settings', { user: req.body, success: null, error: 'Failed to update profile.' });
  }
});

// Listings route
app.get('/listings', requireLogin, (req, res) => {
  const products = [
    { id: 1, title: 'Product 1', img: '', desc: 'Description 1' },
    { id: 2, title: 'Product 2', img: '', desc: 'Description 2' },
    { id: 3, title: 'Product 3', img: '', desc: 'Description 3' },
    { id: 4, title: 'Product 4', img: '', desc: 'Description 4' },
    { id: 5, title: 'Product 5', img: '', desc: 'Description 5' },
    { id: 6, title: 'Product 6', img: '', desc: 'Description 6' }
  ];
  res.render('listings', { products });
});

// Cart route
app.get('/cart', requireLogin, (req, res) => {
  const cartItems = [
    { img: '', name: 'Product 1' },
    { img: '', name: 'Product 2' },
    { img: '', name: 'Product 3' }
  ];
  res.render('cart', { cartItems });
});

// Product detail page
app.get('/product/:id', requireLogin, (req, res) => {
  const product = {
    id: req.params.id,
    image: '',
    name: `Product ${req.params.id}`,
    description: 'Sample product description',
    seller: {
      name: 'Seller Name',
      email: 'seller@example.com',
      phone: '9998887771',
      ratings: 4,
      pic: ''
    }
  };
  res.render('product', { product });
});

// Root route
app.get('/', (req, res) => {
  res.redirect('/home');
});

app.listen(3000, () => {
  console.log('Server is running on http://localhost:3000');
});

