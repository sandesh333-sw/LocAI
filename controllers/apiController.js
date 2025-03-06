// Get recommendations
exports.getRecommendations = async (req, res) => {
  try {
    // Check if user is authenticated
    if (!req.user) {
      // For non-authenticated users, return empty array with appropriate message
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route'
      });
    }
    
    // Find the latest analysis for the current user
    const analysis = await Analysis.findOne({ user: req.user.id }).sort({ lastUpdated: -1 });
    
    // If no analysis exists yet, handle new user scenario
    if (!analysis) {
      return res.status(404).json({ 
        success: false, 
        message: 'No analysis data found. Please upload data to generate recommendations.' 
      });
    }
    
    // If recommendations exist in the analysis, return them
    if (analysis.recommendations && analysis.recommendations.length > 0) {
      // Convert to format expected by the frontend
      const formattedRecommendations = analysis.recommendations.map(rec => ({
        title: rec.title,
        description: rec.description,
        priority: rec.priority || 'medium',
        confidence: rec.confidence || 0.75,
        category: rec.category || 'general'
      }));
      
      return res.status(200).json({
        success: true,
        recommendations: formattedRecommendations
      });
    }
    
    // If no recommendations in analysis but user exists, return empty array
    return res.status(200).json({
      success: true,
      recommendations: [],
      message: 'No recommendations available yet. Please upload more data for better insights.'
    });
    
  } catch (error) {
    console.error('Error fetching recommendations:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching recommendations'
    });
  }
}; 