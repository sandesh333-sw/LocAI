const Data = require('../models/Data');
const Recommendation = require('../models/Recommendation');

// @desc    Get personalized recommendations based on user data
// @route   GET /api/recommendations
// @access  Private
exports.getRecommendations = async (req, res) => {
  try {
    // Get non-dismissed recommendations for the current user
    const existingRecommendations = await Recommendation.find({ 
      user: req.user._id,
      dismissed: false
    }).sort({ priority: 1, createdAt: -1 });
    
    // If we already have recommendations, return them
    if (existingRecommendations.length > 0) {
      return res.json({
        success: true,
        recommendations: existingRecommendations
      });
    }
    
    // Otherwise, generate new recommendations
    // Get all data for the current user
    const data = await Data.find({ user: req.user._id });
    
    // If no data available, create and save generic recommendations
    if (!data || data.length === 0) {
      const genericRecommendations = [
        {
          user: req.user._id,
          title: "Start Uploading Your Data",
          description: "Begin by uploading your sales, customer, and traffic data to get personalized recommendations.",
          priority: "high",
          badge: "bg-primary",
          type: "onboarding"
        },
        {
          user: req.user._id,
          title: "Complete Your Business Profile",
          description: "Add more details about your business to help us provide better recommendations.",
          priority: "medium",
          badge: "bg-info",
          type: "profile"
        },
        {
          user: req.user._id,
          title: "Explore Dashboard Features",
          description: "Familiarize yourself with all the analytics tools available on your dashboard.",
          priority: "low",
          badge: "bg-secondary",
          type: "tutorial"
        }
      ];
      
      // Save generic recommendations to database
      await Recommendation.insertMany(genericRecommendations);
      
      return res.json({
        success: true,
        recommendations: genericRecommendations
      });
    }
    
    // Initialize data aggregates
    let totalSales = 0;
    let totalItems = 0;
    let customerCount = 0;
    let trafficCount = 0;
    let categories = {};
    let customerTypes = {};
    let peakHours = {};
    
    // Process data to derive insights
    data.forEach(entry => {
      // Process sales data
      if (entry.salesData && entry.salesData.length > 0) {
        entry.salesData.forEach(sale => {
          totalSales += sale.amount;
          totalItems += sale.itemsSold;
          
          // Track popular categories
          if (sale.categories && sale.categories.length > 0) {
            sale.categories.forEach(category => {
              categories[category] = (categories[category] || 0) + sale.amount;
            });
          }
        });
      }
      
      // Process customer data
      if (entry.customerInteractions && entry.customerInteractions.length > 0) {
        entry.customerInteractions.forEach(interaction => {
          customerCount += interaction.count;
          
          // Track customer types
          const type = interaction.type;
          customerTypes[type] = (customerTypes[type] || 0) + interaction.count;
        });
      }
      
      // Process foot traffic data
      if (entry.footTraffic && entry.footTraffic.length > 0) {
        entry.footTraffic.forEach(traffic => {
          trafficCount += traffic.count;
          
          // Track peak hours
          if (traffic.peakHours && traffic.peakHours.length > 0) {
            traffic.peakHours.forEach(hour => {
              peakHours[hour] = (peakHours[hour] || 0) + 1;
            });
          }
        });
      }
    });
    
    // Generate recommendations based on data analysis
    const recommendationsToCreate = [];
    
    // Sort categories by sales amount
    const topCategories = Object.entries(categories)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(entry => entry[0]);
      
    // Sort customer types by count
    const dominantCustomerType = Object.entries(customerTypes)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 1)
      .map(entry => entry[0])[0];
    
    // Add recommendations based on sales data
    if (totalSales > 0) {
      recommendationsToCreate.push({
        user: req.user._id,
        title: `Optimize ${topCategories[0] || 'Top Product'} Inventory`,
        description: `Your top-selling category could benefit from optimized inventory management to prevent stockouts.`,
        priority: "high",
        badge: "bg-danger",
        type: "inventory"
      });
    }
    
    // Add recommendations based on customer data
    if (Object.keys(customerTypes).length > 0) {
      recommendationsToCreate.push({
        user: req.user._id,
        title: `Enhance ${dominantCustomerType || 'Customer'} Experience`,
        description: `Most of your customers interact through ${dominantCustomerType || 'various'} channels. Focus on improving this experience.`,
        priority: "medium",
        badge: "bg-warning text-dark",
        type: "customer"
      });
    }
    
    // Add recommendations based on foot traffic
    if (Object.keys(peakHours).length > 0) {
      recommendationsToCreate.push({
        user: req.user._id,
        title: "Optimize Staffing Schedules",
        description: "Based on your foot traffic patterns, adjusting staff schedules could increase efficiency by 15%.",
        priority: "medium",
        badge: "bg-warning text-dark",
        type: "staffing"
      });
    }
    
    // Always add a recommendation about data
    recommendationsToCreate.push({
      user: req.user._id,
      title: "Collect More Detailed Data",
      description: "More granular data will lead to more precise recommendations and insights.",
      priority: "low",
      badge: "bg-info",
      type: "data"
    });
    
    // Ensure we have at least 3 recommendations
    if (recommendationsToCreate.length < 3) {
      recommendationsToCreate.push({
        user: req.user._id,
        title: "Implement Customer Loyalty Program",
        description: "A loyalty program could increase customer retention and repeat purchases.",
        priority: "medium",
        badge: "bg-warning text-dark",
        type: "loyalty"
      });
    }
    
    // Save the recommendations to the database
    const savedRecommendations = await Recommendation.insertMany(recommendationsToCreate);
    
    return res.json({
      success: true,
      recommendations: savedRecommendations
    });
    
  } catch (error) {
    console.error('Error generating recommendations:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while generating recommendations'
    });
  }
};

// @desc    Delete a recommendation (mark as dismissed)
// @route   DELETE /api/recommendations/:id
// @access  Private
exports.deleteRecommendation = async (req, res) => {
  try {
    const recommendationId = req.params.id;
    
    // Find the recommendation
    const recommendation = await Recommendation.findById(recommendationId);
    
    // Check if recommendation exists and belongs to the user
    if (!recommendation) {
      return res.status(404).json({
        success: false,
        message: 'Recommendation not found'
      });
    }
    
    if (recommendation.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to dismiss this recommendation'
      });
    }
    
    // Mark as dismissed instead of deleting
    recommendation.dismissed = true;
    await recommendation.save();
    
    res.json({
      success: true,
      message: 'Recommendation dismissed successfully'
    });
    
  } catch (error) {
    console.error('Error dismissing recommendation:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while dismissing recommendation'
    });
  }
};

// @desc    Reset dismissed recommendations
// @route   PUT /api/recommendations/reset
// @access  Private
exports.resetRecommendations = async (req, res) => {
  try {
    // Find all dismissed recommendations for this user
    await Recommendation.updateMany(
      { user: req.user._id, dismissed: true },
      { dismissed: false }
    );
    
    res.json({
      success: true,
      message: 'Recommendations reset successfully'
    });
  } catch (error) {
    console.error('Error resetting recommendations:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while resetting recommendations'
    });
  }
}; 