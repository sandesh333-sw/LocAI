const express = require('express');
const router = express.Router();
const { getRecommendations, deleteRecommendation, resetRecommendations } = require('../controllers/recommendationsController');
const { protect } = require('../middleware/auth');

// Protect all routes
router.use(protect);

// Get recommendations
router.get('/', getRecommendations);

// Delete a recommendation
router.delete('/:id', deleteRecommendation);

// Reset dismissed recommendations
router.put('/reset', resetRecommendations);

module.exports = router; 