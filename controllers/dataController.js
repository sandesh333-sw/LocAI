const Data = require('../models/Data');

// @desc    Upload business data
// @route   POST /api/data
// @access  Private
exports.uploadData = async (req, res) => {
  try {
    const { salesData, customerInteractions, footTraffic } = req.body;
    
    // Validate inputs
    if (!salesData && !customerInteractions && !footTraffic) {
      return res.status(400).json({
        success: false,
        message: 'At least one data type must be provided'
      });
    }
    
    // Create data entry
    const data = await Data.create({
      user: req.user._id,
      salesData: salesData || [],
      customerInteractions: customerInteractions || [],
      footTraffic: footTraffic || []
    });

    console.log(`Data uploaded successfully for user ${req.user._id}`);
    
    res.status(201).json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Data upload error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'An error occurred while uploading data'
    });
  }
};

// @desc    Get all business data for a user
// @route   GET /api/data
// @access  Private
exports.getData = async (req, res) => {
  try {
    const data = await Data.find({ user: req.user._id });

    res.json({
      success: true,
      count: data.length,
      data
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get business data by ID
// @route   GET /api/data/:id
// @access  Private
exports.getDataById = async (req, res) => {
  try {
    const data = await Data.findById(req.params.id);

    // Check if data exists
    if (!data) {
      return res.status(404).json({
        success: false,
        message: 'Data not found'
      });
    }

    // Check if user owns the data
    if (data.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this data'
      });
    }

    res.json({
      success: true,
      data
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get market trends based on data
// @route   GET /api/data/trends
// @access  Private
exports.getMarketTrends = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    // Parse dates or use defaults
    const start = startDate ? new Date(startDate) : new Date(new Date().setMonth(new Date().getMonth() - 1));
    const end = endDate ? new Date(endDate) : new Date();

    // Get all data for user within date range
    const data = await Data.find({
      user: req.user._id,
      'salesData.date': {
        $gte: start,
        $lte: end
      }
    });

    // Process data to extract trends
    // This is a simplified version - in a real app, you'd have more complex logic
    let salesByDay = {};
    let totalSales = 0;
    let totalItems = 0;
    
    data.forEach(entry => {
      entry.salesData.forEach(sale => {
        if (sale.date >= start && sale.date <= end) {
          const dateStr = sale.date.toISOString().split('T')[0];
          
          if (!salesByDay[dateStr]) {
            salesByDay[dateStr] = {
              amount: 0,
              items: 0
            };
          }
          
          salesByDay[dateStr].amount += sale.amount;
          salesByDay[dateStr].items += sale.itemsSold;
          
          totalSales += sale.amount;
          totalItems += sale.itemsSold;
        }
      });
    });

    // Convert to array for easier processing on client
    const dailySales = Object.keys(salesByDay).map(date => ({
      date,
      amount: salesByDay[date].amount,
      items: salesByDay[date].items
    }));

    // Sort by date
    dailySales.sort((a, b) => new Date(a.date) - new Date(b.date));

    res.json({
      success: true,
      trends: {
        totalSales,
        totalItems,
        averageTicket: totalItems > 0 ? (totalSales / totalItems).toFixed(2) : 0,
        dailySales
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
}; 