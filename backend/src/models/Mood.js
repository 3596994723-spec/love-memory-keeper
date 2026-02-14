const mongoose = require('mongoose');

const MoodSchema = new mongoose.Schema({
  mood: {
    type: String,
    required: true,
  },
  note: {
    type: String,
  },
  date: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Mood', MoodSchema);
