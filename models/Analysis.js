const mongoose = require('mongoose');

const AnalysisSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  analysisType: {
    type: String,
    enum: ['sales', 'customer', 'market', 'trend', 'recommendation'],
    required: true
  },
  timeRange: {
    start: {
      type: Date,
      required: true
    },
    end: {
      type: Date,
      required: true
    }
  },
  insights: [{
    title: {
      type: String,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    confidenceScore: {
      type: Number,
      min: 0,
      max: 1,
      default: 0.75
    }
  }],
  recommendations: [{
    title: {
      type: String,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    actionItems: {
      type: [String],
      default: []
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium'
    }
  }],
  charts: [{
    type: {
      type: String,
      enum: ['line', 'bar', 'pie', 'scatter', 'heatmap'],
      required: true
    },
    title: {
      type: String,
      required: true
    },
    data: {
      type: Object,
      required: true
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Analysis', AnalysisSchema); 