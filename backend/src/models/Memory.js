const mongoose = require('mongoose');

const MemorySchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: ['date', 'milestone', 'story', 'travel'],
  },
  content: {
    type: String,
    required: true,
  },
  location: {
    type: Object,
  },
  locations: [{
    name: String,
    address: String,
    lat: Number,
    lng: Number,
  }],
  date: {
    type: String,
    required: true,
  },
  dateRange: {
    type: Object,
  },
  startDate: {
    type: String,
  },
  endDate: {
    type: String,
  },
  photos: [{
    type: String,
  }],
  tags: [String],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Memory', MemorySchema);
