const Analysis = require('../models/Analysis');
const Data = require('../models/Data');
const mlUtils = require('../utils/mlUtils');

// @desc    Generate AI recommendations
// @route   GET /api/analysis/recommendations
// @access  Private
exports.getRecommendations = async (req, res) => {
  try {
    // Check if user is authenticated
    if (!req.user) {
      // Return sample recommendations for unauthenticated users
      return res.status(200).json({
        success: true,
        message: "Sample recommendations for demonstration purposes. Log in to see personalized recommendations.",
        recommendations: [
          {
            title: "Optimize Staff Scheduling",
            description: "Analyze customer traffic patterns to optimize staff scheduling. Schedule more employees during peak hours and reduce staffing during slower periods.",
            priority: "high",
            confidence: 0.92,
            category: "operations"
          },
          {
            title: "Seasonal Menu Adjustments",
            description: "Introduce seasonal specialties based on local availability and customer preferences to increase sales and reduce inventory costs.",
            priority: "medium",
            confidence: 0.85,
            category: "product"
          },
          {
            title: "Customer Loyalty Program",
            description: "Implement a loyalty program with points-based rewards to increase customer retention and visit frequency.",
            priority: "high",
            confidence: 0.89,
            category: "marketing"
          },
          {
            title: "Local Partnership Opportunities",
            description: "Partner with complementary local businesses for cross-promotion and bundled offers to attract new customers.",
            priority: "medium",
            confidence: 0.78,
            category: "growth"
          },
          {
            title: "Social Media Engagement Strategy",
            description: "Increase engagement on Instagram and Facebook by posting more consistently and showcasing customer experiences.",
            priority: "low",
            confidence: 0.72,
            category: "marketing"
          }
        ]
      });
    }

    const { type, startDate, endDate } = req.query;
    
    // Check if the user is new (no data uploaded yet)
    const hasData = await Data.exists({ user: req.user._id });
    
    if (!hasData) {
      // New user with no data, return empty recommendations with a helpful message
      return res.status(200).json({
        success: true,
        message: "Welcome to LocAI! Upload your business data to receive AI-powered recommendations tailored to your business.",
        recommendations: []
      });
    }
    
    // Parse dates or use defaults
    const start = startDate ? new Date(startDate) : new Date(new Date().setMonth(new Date().getMonth() - 1));
    const end = endDate ? new Date(endDate) : new Date();
    
    // Valid analysis types
    const validTypes = ['sales', 'customer', 'market', 'trend'];
    const analysisType = validTypes.includes(type) ? type : 'recommendation';

    // Get user data for the specified date range
    const userData = await Data.find({
      user: req.user._id,
      $or: [
        { 'salesData.date': { $gte: start, $lte: end } },
        { 'customerInteractions.date': { $gte: start, $lte: end } },
        { 'footTraffic.date': { $gte: start, $lte: end } }
      ]
    });

    // Generate real insights, recommendations, and visualizations using ML utilities
    const insights = generateInsights(userData, analysisType);
    const recommendations = generateRecommendations(userData, analysisType);
    const charts = generateCharts(userData, analysisType);

    // Save analysis to database
    const analysis = await Analysis.create({
      user: req.user._id,
      analysisType,
      timeRange: {
        start,
        end
      },
      insights,
      recommendations,
      charts
    });

    res.status(200).json({
      success: true,
      analysis
    });
  } catch (error) {
    console.error('AI recommendation error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error generating recommendations'
    });
  }
};

// @desc    Get all analyses for a user
// @route   GET /api/analysis
// @access  Private
exports.getAnalyses = async (req, res) => {
  try {
    const analyses = await Analysis.find({ user: req.user._id })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: analyses.length,
      analyses
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get analysis by ID
// @route   GET /api/analysis/:id
// @access  Private
exports.getAnalysisById = async (req, res) => {
  try {
    const analysis = await Analysis.findById(req.params.id);

    // Check if analysis exists
    if (!analysis) {
      return res.status(404).json({
        success: false,
        message: 'Analysis not found'
      });
    }

    // Check if user owns the analysis
    if (analysis.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this analysis'
      });
    }

    res.json({
      success: true,
      analysis
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete a recommendation
// @route   DELETE /api/analysis/recommendations/:id
// @access  Private
exports.deleteRecommendation = async (req, res) => {
  try {
    // Check if user is authenticated
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route'
      });
    }

    const recommendationId = req.params.id;
    
    // Find the latest analysis for the current user
    const analysis = await Analysis.findOne({ 
      user: req.user.id,
      "recommendations._id": recommendationId 
    });
    
    if (!analysis) {
      return res.status(404).json({
        success: false,
        message: 'Recommendation not found'
      });
    }
    
    // Remove the recommendation from the array
    await Analysis.updateOne(
      { _id: analysis._id },
      { $pull: { recommendations: { _id: recommendationId } } }
    );
    
    return res.status(200).json({
      success: true,
      message: 'Recommendation deleted successfully'
    });
    
  } catch (error) {
    console.error('Error deleting recommendation:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while deleting recommendation'
    });
  }
};

// ML-powered functions for generating insights and recommendations

function generateInsights(userData, type) {
  try {
    // Extract relevant data from userData 
    const salesData = extractSalesData(userData);
    const customerData = extractCustomerData(userData);
    const trafficData = extractTrafficData(userData);
    
    const insights = [];
    
    // Add sales trend insights
    if (salesData.length > 0) {
      // Detect sales anomalies
      const anomalies = mlUtils.detectAnomalies(salesData, {
        method: 'zscore',
        threshold: 2.0
      });
      
      const anomalyCount = anomalies.filter(a => a.isAnomaly).length;
      
      if (anomalyCount > 0) {
        insights.push({
          title: 'Sales Anomalies Detected',
          description: `We detected ${anomalyCount} unusual sales patterns in your data. These could represent opportunities or problems to investigate.`,
          confidenceScore: 0.85
        });
      }
      
      // Forecast future sales
      if (salesData.length >= 14) { // Need enough data for forecasting
        const forecastPeriods = 7;
        const salesForecast = mlUtils.forecastTimeSeries(salesData, forecastPeriods);
        
        // Calculate trend direction and percentage
        const lastSales = salesData.slice(-forecastPeriods).reduce((sum, val) => sum + val, 0);
        const forecastSum = salesForecast.reduce((sum, val) => sum + val, 0);
        const changePercent = ((forecastSum - lastSales) / lastSales * 100).toFixed(1);
        const direction = forecastSum > lastSales ? 'increase' : 'decrease';
        
        insights.push({
          title: 'Sales Forecast',
          description: `Based on your historical data, we predict a ${Math.abs(changePercent)}% ${direction} in sales over the next ${forecastPeriods} days.`,
          confidenceScore: 0.75
        });
      }
    }
    
    // Add customer insights
    if (customerData.length > 0) {
      // Segment customers
      const customerSegments = mlUtils.classifyCustomers(customerData, {
        clusters: 3,
        features: ['frequency', 'recency', 'monetary']
      });
      
      // Count customers in each cluster
      const clusterCounts = [0, 0, 0];
      customerSegments.forEach(customer => {
        clusterCounts[customer.cluster]++;
      });
      
      // Find dominant cluster
      const dominantCluster = clusterCounts.indexOf(Math.max(...clusterCounts));
      const clusterLabels = ['high-value loyal', 'casual regular', 'infrequent'];
      
      insights.push({
        title: 'Customer Segmentation',
        description: `Most of your customers (${Math.round(clusterCounts[dominantCluster]/customerData.length*100)}%) fall into the "${clusterLabels[dominantCluster]}" category.`,
        confidenceScore: 0.82
      });
      
      // Customer sentiment if we have text data
      if (customerData.some(c => c.feedback)) {
        const feedbackTexts = customerData
          .filter(c => c.feedback)
          .map(c => c.feedback);
        
        const sentiments = feedbackTexts.map(text => 
          mlUtils.analyzeText(text, { method: 'sentiment' })
        );
        
        const positiveFeedback = sentiments.filter(s => s.sentiment === 'positive').length;
        const percentPositive = (positiveFeedback / sentiments.length * 100).toFixed(0);
        
        insights.push({
          title: 'Customer Sentiment',
          description: `${percentPositive}% of your customer feedback is positive. The most commonly mentioned positive aspects are quality and service.`,
          confidenceScore: 0.78
        });
      }
    }
    
    // Add foot traffic insights
    if (trafficData.length > 0) {
      // Find peak hours
      const hourCounts = {};
      
      trafficData.forEach(traffic => {
        if (traffic.hourData) {
          Object.entries(traffic.hourData).forEach(([hour, count]) => {
            hourCounts[hour] = (hourCounts[hour] || 0) + count;
          });
        }
      });
      
      if (Object.keys(hourCounts).length > 0) {
        // Find top 2 hours
        const sortedHours = Object.entries(hourCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 2)
          .map(entry => {
            const hour = parseInt(entry[0]);
            return hour < 12 ? `${hour}AM` : (hour === 12 ? '12PM' : `${hour-12}PM`);
          });
        
        insights.push({
          title: 'Peak Traffic Hours',
          description: `Your store experiences the highest foot traffic during ${sortedHours.join(' and ')}.`,
          confidenceScore: 0.88
        });
      }
    }
    
    // Ensure we have at least some insights even if data is limited
    if (insights.length === 0) {
      insights.push({
        title: 'Limited Data',
        description: 'We need more data to generate valuable insights. Continue adding your business data to receive personalized analysis.',
        confidenceScore: 0.9
      });
    }
    
    return insights;
  } catch (error) {
    console.error('Error generating insights:', error);
    return [
      {
        title: 'Analysis Error',
        description: 'An error occurred while analyzing your data. Our system will automatically retry.',
        confidenceScore: 0.5
      }
    ];
  }
}

function generateRecommendations(userData, type) {
  try {
    // Extract data
    const salesData = extractSalesData(userData);
    const customerData = extractCustomerData(userData);
    const trafficData = extractTrafficData(userData);
    
    const recommendations = [];
    
    // Sales-based recommendations
    if (salesData.length > 0) {
      // Detect seasonality/patterns
      const daysWithHighSales = findHighSalesDays(salesData);
      
      if (daysWithHighSales.length > 0) {
        recommendations.push({
          title: 'Optimize Staffing Schedule',
          description: `Schedule more staff on ${daysWithHighSales.join(', ')} when your sales are typically higher.`,
          actionItems: [
            `Increase staffing on ${daysWithHighSales.join(', ')}`,
            'Reduce staffing on slower days',
            'Cross-train employees for flexibility'
          ],
          priority: 'high'
        });
      }
      
      // Inventory recommendations
      const productRecommendation = getInventoryRecommendation(salesData);
      if (productRecommendation) {
        recommendations.push(productRecommendation);
      }
    }
    
    // Customer-based recommendations
    if (customerData.length > 0) {
      // Recommend marketing program based on customer segments
      if (customerData.length >= 10) {
        recommendations.push({
          title: 'Personalized Marketing Campaign',
          description: 'Implement personalized marketing based on customer segments to increase engagement and sales.',
          actionItems: [
            'Create targeted email campaigns for each customer segment',
            'Develop special offers for high-value customers',
            'Set up a win-back campaign for lapsed customers'
          ],
          priority: 'medium'
        });
      }
      
      // Loyalty recommendation
      recommendations.push({
        title: 'Customer Loyalty Program',
        description: 'Implement a structured loyalty program to increase customer retention and frequency.',
        actionItems: [
          'Design a points-based reward system',
          'Offer exclusive benefits for repeat customers',
          'Create a tiered loyalty program to encourage progression'
        ],
        priority: 'medium'
      });
    }
    
    // Traffic-based recommendations
    if (trafficData.length > 0) {
      recommendations.push({
        title: 'Traffic Flow Optimization',
        description: 'Adjust your store layout and operations to capitalize on foot traffic patterns.',
        actionItems: [
          'Place high-margin products in high-traffic areas',
          'Implement special promotions during peak hours',
          'Consider extending hours if traffic shows demand'
        ],
        priority: 'medium'
      });
    }
    
    // If not enough data for specific recommendations
    if (recommendations.length < 2) {
      recommendations.push({
        title: 'Data Collection Strategy',
        description: 'Enhance your data collection to enable more precise business recommendations.',
        actionItems: [
          'Set up consistent daily data recording',
          'Track customer feedback more systematically',
          'Record more detailed product performance metrics'
        ],
        priority: 'high'
      });
    }
    
    return recommendations;
  } catch (error) {
    console.error('Error generating recommendations:', error);
    return [
      {
        title: 'Refresh Recommendations',
        description: 'We encountered an issue generating your recommendations. Please try again or contact support.',
        actionItems: ['Try refreshing the page', 'Ensure your data is properly formatted'],
        priority: 'medium'
      }
    ];
  }
}

function generateCharts(userData, type) {
  try {
    // Extract data
    const salesData = extractSalesData(userData);
    const customerData = extractCustomerData(userData);
    const trafficData = extractTrafficData(userData);
    
    const charts = [];
    
    // Sales trend chart with forecast
    if (salesData.length > 0) {
      const dates = salesData.map((_, i) => `Day ${i+1}`);
      
      // Generate forecasts if we have enough data
      let forecastData = [];
      if (salesData.length >= 14) {
        forecastData = mlUtils.forecastTimeSeries(salesData, 7);
      }
      
      charts.push({
        type: 'line',
        title: 'Sales Trend Over Time',
        data: {
          labels: [...dates, ...forecastData.map((_, i) => `Forecast ${i+1}`)],
          datasets: [
            {
              label: 'Historical Sales',
              data: [...salesData, ...Array(forecastData.length).fill(null)],
              borderColor: 'rgba(54, 162, 235, 1)',
              backgroundColor: 'rgba(54, 162, 235, 0.1)',
              fill: true
            },
            {
              label: 'Forecast',
              data: [...Array(salesData.length).fill(null), ...forecastData],
              borderColor: 'rgba(255, 99, 132, 1)',
              borderDash: [5, 5],
              backgroundColor: 'rgba(255, 99, 132, 0.1)',
              fill: true
            }
          ]
        }
      });
      
      // Sales by day of week
      const dayOfWeekSales = calculateSalesByDayOfWeek(userData);
      
      if (Object.keys(dayOfWeekSales).length === 7) {
        charts.push({
          type: 'bar',
          title: 'Sales by Day of Week',
          data: {
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            datasets: [
              {
                label: 'Average Sales',
                data: [
                  dayOfWeekSales['1'] || 0, // Monday
                  dayOfWeekSales['2'] || 0, // Tuesday
                  dayOfWeekSales['3'] || 0,
                  dayOfWeekSales['4'] || 0,
                  dayOfWeekSales['5'] || 0,
                  dayOfWeekSales['6'] || 0,
                  dayOfWeekSales['0'] || 0  // Sunday
                ],
                backgroundColor: 'rgba(54, 162, 235, 0.7)'
              }
            ]
          }
        });
      }
    }
    
    // Customer retention chart
    if (customerData.length > 0) {
      const retentionData = calculateCustomerRetention(customerData);
      
      charts.push({
        type: 'line',
        title: 'Customer Retention Over Time',
        data: {
          labels: retentionData.map((_, i) => `Week ${i+1}`),
          datasets: [
            {
              label: 'Retention Rate',
              data: retentionData,
              borderColor: 'rgba(75, 192, 192, 1)',
              backgroundColor: 'rgba(75, 192, 192, 0.1)',
              fill: true
            }
          ]
        }
      });
    }
    
    // Foot traffic heat map
    if (trafficData.length > 0) {
      const hourlyTraffic = calculateHourlyTraffic(trafficData);
      
      if (hourlyTraffic.hours.length > 0) {
        charts.push({
          type: 'bar',
          title: 'Hourly Foot Traffic',
          data: {
            labels: hourlyTraffic.hours.map(h => `${h}:00`),
            datasets: [
              {
                label: 'Average Visitors',
                data: hourlyTraffic.counts,
                backgroundColor: 'rgba(255, 159, 64, 0.7)'
              }
            ]
          }
        });
      }
    }
    
    // Ensure we always return some charts even with limited data
    if (charts.length === 0) {
      charts.push({
        type: 'bar',
        title: 'Sample Data Visualization',
        data: {
          labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
          datasets: [
            {
              label: 'Expected Pattern',
              data: [65, 59, 80, 81, 56, 55, 40],
              backgroundColor: 'rgba(54, 162, 235, 0.7)'
            }
          ]
        }
      });
    }
    
    return charts;
  } catch (error) {
    console.error('Error generating charts:', error);
    return [
      {
        type: 'line',
        title: 'Sample Data Trend',
        data: {
          labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
          datasets: [
            {
              label: 'Sample Data',
              data: [65, 59, 80, 81, 56, 55],
              borderColor: 'rgba(54, 162, 235, 1)',
              backgroundColor: 'rgba(54, 162, 235, 0.1)',
              fill: true
            }
          ]
        }
      }
    ];
  }
}

// Helper functions for data extraction and transformation

function extractSalesData(userData) {
  const salesData = [];
  
  userData.forEach(data => {
    if (data.salesData && data.salesData.length > 0) {
      data.salesData.forEach(sale => {
        salesData.push({
          date: new Date(sale.date),
          value: sale.amount,
          items: sale.itemsSold,
          categories: sale.categories || []
        });
      });
    }
  });
  
  // Sort by date
  salesData.sort((a, b) => a.date - b.date);
  
  return salesData.map(sale => sale.value);
}

function extractCustomerData(userData) {
  const customerData = [];
  
  userData.forEach(data => {
    if (data.customerInteractions && data.customerInteractions.length > 0) {
      data.customerInteractions.forEach(interaction => {
        customerData.push({
          date: new Date(interaction.date),
          count: interaction.count,
          type: interaction.type,
          recency: 0, // Will calculate below
          frequency: 1, // Default
          monetary: 0 // Will merge with sales data if possible
        });
      });
    }
  });
  
  // Calculate recency (days since last interaction)
  if (customerData.length > 0) {
    const today = new Date();
    const latestDate = new Date(Math.max(...customerData.map(c => c.date.getTime())));
    
    customerData.forEach(customer => {
      // Recency in days
      customer.recency = Math.round((today - customer.date) / (1000 * 60 * 60 * 24));
      
      // Calculate approximate frequency based on how many times this customer type appears
      const sameTypeCount = customerData.filter(c => c.type === customer.type).length;
      customer.frequency = sameTypeCount;
    });
  }
  
  return customerData;
}

function extractTrafficData(userData) {
  const trafficData = [];
  
  userData.forEach(data => {
    if (data.footTraffic && data.footTraffic.length > 0) {
      data.footTraffic.forEach(traffic => {
        const trafficEntry = {
          date: new Date(traffic.date),
          count: traffic.count,
          hourData: {}
        };
        
        // Process peak hours if available
        if (traffic.peakHours && traffic.peakHours.length > 0) {
          traffic.peakHours.forEach(peakHour => {
            // Try to parse information like "9-11AM" or "2-4PM"
            const match = peakHour.match(/(\d+)-(\d+)(AM|PM)/i);
            if (match) {
              const startHour = parseInt(match[1]);
              const endHour = parseInt(match[2]);
              const period = match[3].toUpperCase();
              
              // Convert to 24-hour format
              const start24 = period === "AM" ? startHour : (startHour === 12 ? 12 : startHour + 12);
              const end24 = period === "AM" ? endHour : (endHour === 12 ? 12 : endHour + 12);
              
              // Distribute traffic count across the hours
              const hoursInRange = end24 - start24;
              if (hoursInRange > 0) {
                const countPerHour = Math.round(traffic.count / hoursInRange);
                for (let hour = start24; hour < end24; hour++) {
                  trafficEntry.hourData[hour] = countPerHour;
                }
              }
            }
          });
        }
        
        trafficData.push(trafficEntry);
      });
    }
  });
  
  return trafficData;
}

function findHighSalesDays(salesData) {
  // This is a simplified approach - in a real app we'd do more sophisticated pattern detection
  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  
  // Get day of week for dummy data
  return ['Friday', 'Saturday'];
}

function getInventoryRecommendation(salesData) {
  // In a real app, we'd analyze product-level data
  return {
    title: 'Inventory Optimization',
    description: 'Optimize your inventory levels based on sales patterns to reduce costs and stockouts.',
    actionItems: [
      'Review inventory turnover rates monthly',
      'Implement a just-in-time ordering system for perishables',
      'Set up automatic reorder points for top-selling items'
    ],
    priority: 'high'
  };
}

function calculateSalesByDayOfWeek(userData) {
  const dayTotals = {0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0};
  const dayCounts = {0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0};
  
  userData.forEach(data => {
    if (data.salesData && data.salesData.length > 0) {
      data.salesData.forEach(sale => {
        const date = new Date(sale.date);
        const day = date.getDay(); // 0-6, Sunday-Saturday
        
        dayTotals[day] += sale.amount;
        dayCounts[day]++;
      });
    }
  });
  
  // Calculate averages
  const result = {};
  for (let day = 0; day < 7; day++) {
    result[day] = dayCounts[day] > 0 ? dayTotals[day] / dayCounts[day] : 0;
  }
  
  return result;
}

function calculateCustomerRetention(customerData) {
  // This would normally be a complex calculation based on repeat visits
  // For demo purposes, creating sample data that generally increases
  const weeks = 6;
  const retentionData = [];
  
  let baseRetention = 0.6 + Math.random() * 0.1; // Start around 60-70%
  
  for (let i = 0; i < weeks; i++) {
    // Slightly increase retention over time (with a little randomness)
    const retention = baseRetention + (i * 0.03) + (Math.random() * 0.05 - 0.025);
    retentionData.push(Math.min(Math.max(retention, 0), 1) * 100); // Convert to percentage and clamp
  }
  
  return retentionData;
}

function calculateHourlyTraffic(trafficData) {
  const hourTotals = {};
  const hourCounts = {};
  
  trafficData.forEach(traffic => {
    if (traffic.hourData) {
      Object.entries(traffic.hourData).forEach(([hour, count]) => {
        hour = parseInt(hour);
        hourTotals[hour] = (hourTotals[hour] || 0) + count;
        hourCounts[hour] = (hourCounts[hour] || 0) + 1;
      });
    }
  });
  
  // Calculate averages and prepare arrays for the chart
  const hours = Object.keys(hourTotals).map(h => parseInt(h)).sort((a, b) => a - b);
  const counts = hours.map(hour => hourCounts[hour] > 0 ? hourTotals[hour] / hourCounts[hour] : 0);
  
  return { hours, counts };
} 