const mongoose = require('mongoose');

const DataSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  salesData: [{
    date: {
      type: Date,
      required: true
    },
    amount: {
      type: Number,
      required: true
    },
    itemsSold: {
      type: Number,
      required: true
    },
    categories: {
      type: [String],
      default: []
    }
  }],
  customerInteractions: [{
    date: {
      type: Date,
      required: true
    },
    count: {
      type: Number,
      required: true
    },
    type: {
      type: String,
      enum: ['walk-in', 'online', 'phone', 'other'],
      default: 'walk-in'
    }
  }],
  footTraffic: [{
    date: {
      type: Date,
      required: true
    },
    count: {
      type: Number,
      required: true
    },
    peakHours: {
      type: [String],
      default: []
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Data', DataSchema); 