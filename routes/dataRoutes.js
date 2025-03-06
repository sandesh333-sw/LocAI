const express = require('express');
const router = express.Router();
const { 
  uploadData, 
  getData, 
  getDataById,
  getMarketTrends 
} = require('../controllers/dataController');
const { protect } = require('../middleware/auth');

// All routes are protected
router.use(protect);

router.route('/')
  .get(getData)
  .post(uploadData);

router.get('/trends', getMarketTrends);
router.get('/:id', getDataById);

module.exports = router; 