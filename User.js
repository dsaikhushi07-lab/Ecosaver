const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String },                   // New field
  address: { type: String },                 // New field
  profilePic: { type: String },              // URL to profile picture
  rating: { type: Number, default: 0 },      // Rating from 0 to 5
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);
