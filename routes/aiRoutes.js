const express = require('express');
const router = express.Router();
const { 
  getRecommendations, 
  getAnalyses, 
  getAnalysisById,
  deleteRecommendation
} = require('../controllers/aiController');
const { protect } = require('../middleware/auth');

// Define the recommendations route without protection
router.get('/recommendations', getRecommendations);

// All other routes are protected
router.use(protect);

// Delete a specific recommendation
router.delete('/recommendations/:id', deleteRecommendation);

router.route('/')
  .get(getAnalyses);

router.get('/:id', getAnalysisById);

module.exports = router; 