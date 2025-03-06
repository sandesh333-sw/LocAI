/**
 * Test script for ML Utilities
 * Run with: node utils/testML.js
 */

const mlUtils = require('./mlUtils');

// Test function to simulate data that would come from the database
function generateTestData() {
  // Generate 30 days of sample sales data
  const salesData = [];
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 30);

  for (let i = 0; i < 30; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    
    // Create a pattern with weekly seasonality and a slight upward trend
    // Weekends (days 5 and 6) have higher sales
    const dayOfWeek = date.getDay();
    const isWeekend = dayOfWeek === 5 || dayOfWeek === 6;
    const trend = i * 0.5; // Slight upward trend
    const weekendBoost = isWeekend ? 30 : 0;
    
    // Base sales between 50-100 with some randomness
    const base = 50 + Math.random() * 50;
    const sales = base + weekendBoost + trend;
    
    // Add a few anomalies
    const isAnomaly = i === 10 || i === 20;
    const anomalyValue = isAnomaly ? sales * 2 : 0;
    
    salesData.push({
      date,
      value: sales + anomalyValue,
      items: Math.round(sales / 10),
      categories: ['clothing', 'accessories']
    });
  }

  // Generate customer data
  const customerData = [];
  for (let i = 0; i < 20; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + Math.floor(i * 1.5));
    
    // Different customer types
    const types = ['walk-in', 'online', 'phone'];
    const type = types[i % types.length];
    
    // Recency, frequency, monetary values
    const recency = 30 - Math.floor(i * 1.5);
    const frequency = 1 + Math.floor(i / 5);
    const monetary = 50 + (i * 5);
    
    // Some customers have feedback
    let feedback = null;
    if (i % 5 === 0) {
      const feedbacks = [
        "Great service, very satisfied with my purchase!",
        "The staff was very helpful, but prices are a bit high.",
        "I had to wait too long for service, disappointed.",
        "Perfect products, will definitely come back!",
        "Average experience, nothing special."
      ];
      feedback = feedbacks[i % feedbacks.length];
    }
    
    customerData.push({
      date,
      count: 1 + Math.floor(Math.random() * 3),
      type,
      recency,
      frequency,
      monetary,
      feedback
    });
  }

  // Generate foot traffic data
  const trafficData = [];
  for (let i = 0; i < 10; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i * 3);
    
    // Create hourly distribution with morning and afternoon peaks
    const hourData = {};
    for (let hour = 9; hour <= 20; hour++) {
      // Morning peak around 11AM, afternoon peak around 5PM
      const morningPeak = Math.max(0, 10 - Math.abs(hour - 11) * 2);
      const afternoonPeak = Math.max(0, 15 - Math.abs(hour - 17) * 3);
      hourData[hour] = Math.round(5 + morningPeak + afternoonPeak + Math.random() * 5);
    }
    
    // Format peak hours string for the UI
    const peakHours = ['9-11AM', '3-6PM'];
    
    trafficData.push({
      date,
      count: Object.values(hourData).reduce((sum, val) => sum + val, 0),
      hourData,
      peakHours
    });
  }

  return {
    salesData,
    customerData,
    trafficData
  };
}

// Test forecasting
function testForecasting() {
  console.log("\n----- TESTING TIME SERIES FORECASTING -----");
  
  const { salesData } = generateTestData();
  const salesValues = salesData.map(s => s.value);
  
  // Forecast next 7 days
  const forecast = mlUtils.forecastTimeSeries(salesValues, 7);
  
  console.log(`Historical data (last 5 days): ${salesValues.slice(-5).map(v => v.toFixed(2)).join(', ')}`);
  console.log(`Forecast (next 7 days): ${forecast.map(v => v.toFixed(2)).join(', ')}`);
  
  // Calculate average change
  const lastWeekAvg = salesValues.slice(-7).reduce((sum, val) => sum + val, 0) / 7;
  const forecastAvg = forecast.reduce((sum, val) => sum + val, 0) / forecast.length;
  const change = ((forecastAvg - lastWeekAvg) / lastWeekAvg * 100).toFixed(2);
  
  console.log(`Forecast indicates a ${change}% change in average daily sales.`);
}

// Test anomaly detection
function testAnomalyDetection() {
  console.log("\n----- TESTING ANOMALY DETECTION -----");
  
  const { salesData } = generateTestData();
  const salesValues = salesData.map(s => s.value);
  
  // Detect anomalies using Z-score
  const anomalies = mlUtils.detectAnomalies(salesValues, {
    method: 'zscore',
    threshold: 2.0
  });
  
  const anomalyCount = anomalies.filter(a => a.isAnomaly).length;
  console.log(`Detected ${anomalyCount} anomalies out of ${salesValues.length} data points.`);
  
  // Show anomalies
  anomalies.forEach((item, index) => {
    if (item.isAnomaly) {
      console.log(`Anomaly at day ${index + 1}: value ${item.value.toFixed(2)}, z-score: ${item.zScore.toFixed(2)}`);
    }
  });
  
  // Test IQR method
  const iqrAnomalies = mlUtils.detectAnomalies(salesValues, {
    method: 'iqr',
    threshold: 1.5
  });
  
  const iqrAnomalyCount = iqrAnomalies.filter(a => a.isAnomaly).length;
  console.log(`IQR method detected ${iqrAnomalyCount} anomalies.`);
}

// Test customer classification
function testCustomerClassification() {
  console.log("\n----- TESTING CUSTOMER CLASSIFICATION -----");
  
  const { customerData } = generateTestData();
  
  // Segment customers
  const customerSegments = mlUtils.classifyCustomers(customerData, {
    clusters: 3,
    features: ['recency', 'frequency', 'monetary']
  });
  
  // Count customers in each segment
  const clusters = [0, 0, 0];
  customerSegments.forEach(customer => {
    clusters[customer.cluster]++;
  });
  
  console.log(`Customer segmentation results:`);
  console.log(`Cluster 0 (high-value): ${clusters[0]} customers`);
  console.log(`Cluster 1 (medium-value): ${clusters[1]} customers`);
  console.log(`Cluster 2 (low-value): ${clusters[2]} customers`);
  
  // Print a few examples
  console.log("\nSample customers from each cluster:");
  
  for (let i = 0; i < 3; i++) {
    const sample = customerSegments.find(c => c.cluster === i);
    if (sample) {
      console.log(`Cluster ${i}: Recency ${sample.recency} days, Frequency ${sample.frequency}, Monetary $${sample.monetary}`);
    }
  }
}

// Test recommendation engine
function testRecommendations() {
  console.log("\n----- TESTING RECOMMENDATION ENGINE -----");
  
  // Sample user data with interactions
  const userData = {
    'user1': {
      interactions: [
        { itemId: 'item1', rating: 5 },
        { itemId: 'item2', rating: 4 },
        { itemId: 'item5', rating: 2 }
      ]
    },
    'user2': {
      interactions: [
        { itemId: 'item1', rating: 4 },
        { itemId: 'item3', rating: 5 },
        { itemId: 'item4', rating: 4 }
      ]
    },
    'user3': {
      interactions: [
        { itemId: 'item2', rating: 5 },
        { itemId: 'item3', rating: 3 },
        { itemId: 'item6', rating: 4 }
      ]
    }
  };
  
  // Sample item data
  const itemData = {
    'item1': { name: 'T-shirt', price: 19.99, categories: ['clothing', 'casual'] },
    'item2': { name: 'Jeans', price: 49.99, categories: ['clothing', 'casual'] },
    'item3': { name: 'Dress Shirt', price: 39.99, categories: ['clothing', 'formal'] },
    'item4': { name: 'Watch', price: 99.99, categories: ['accessories', 'formal'] },
    'item5': { name: 'Sunglasses', price: 29.99, categories: ['accessories', 'casual'] },
    'item6': { name: 'Shoes', price: 79.99, categories: ['footwear', 'casual'] },
    'item7': { name: 'Belt', price: 24.99, categories: ['accessories', 'formal'] }
  };
  
  // Generate recommendations
  const collaborativeRecs = mlUtils.generateRecommendations(userData, itemData, {
    method: 'collaborative',
    similarityThreshold: 0.1
  });
  
  console.log("Collaborative filtering recommendations:");
  Object.keys(collaborativeRecs).forEach(userId => {
    console.log(`\nFor ${userId}:`);
    collaborativeRecs[userId].forEach(rec => {
      console.log(`- ${rec.name} (${rec.categories.join(', ')}): Score ${rec.score.toFixed(2)}`);
    });
  });
  
  // Test content-based recommendations
  const contentRecs = mlUtils.generateRecommendations(userData, itemData, {
    method: 'content-based'
  });
  
  console.log("\nContent-based recommendations:");
  Object.keys(contentRecs).forEach(userId => {
    console.log(`\nFor ${userId}:`);
    contentRecs[userId].forEach(rec => {
      console.log(`- ${rec.name} (${rec.categories.join(', ')}): Score ${rec.score.toFixed(2)}`);
    });
  });
}

// Test text analysis
function testTextAnalysis() {
  console.log("\n----- TESTING TEXT ANALYSIS -----");
  
  const feedbacks = [
    "I absolutely love the products in this store. Great quality and excellent service!",
    "The prices are a bit high, but the quality seems good. Service was okay.",
    "Terrible experience. Waited for 30 minutes and staff was not helpful at all.",
    "Pretty good overall. The staff was friendly and helpful. Would shop here again."
  ];
  
  console.log("Sentiment Analysis:");
  feedbacks.forEach((text, i) => {
    const analysis = mlUtils.analyzeText(text, { method: 'sentiment' });
    console.log(`\nText ${i + 1}: "${text.substring(0, 50)}..."`);
    console.log(`Sentiment: ${analysis.sentiment} (score: ${analysis.score.toFixed(2)})`);
    console.log(`Words analyzed: ${analysis.wordCount}, Positive: ${analysis.positiveCount}, Negative: ${analysis.negativeCount}`);
  });
  
  // Test keyword extraction
  console.log("\nKeyword Extraction:");
  const combinedText = feedbacks.join(" ");
  const keywords = mlUtils.analyzeText(combinedText, { 
    method: 'keywords',
    limit: 5
  });
  
  console.log("Top keywords:");
  keywords.keywords.forEach(k => {
    console.log(`- "${k.word}" (count: ${k.count})`);
  });
}

// Run all tests
function runAllTests() {
  console.log("===== TESTING ML UTILITIES =====\n");
  
  testForecasting();
  testAnomalyDetection();
  testCustomerClassification();
  testRecommendations();
  testTextAnalysis();
  
  console.log("\n===== ALL TESTS COMPLETED =====");
}

// Run tests
runAllTests(); 