const mongoose = require('mongoose');

const WishSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true,
  },
  content: {
    type: String,
  },
  completed: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Wish', WishSchema);
