/**
 * Machine Learning Utilities for LocAI
 * Provides advanced ML capabilities for market analysis and predictions
 */

// Time Series Forecasting
const forecastTimeSeries = (historicalData, periods = 7, options = {}) => {
  try {
    // Default configuration
    const config = {
      method: options.method || 'exponential-smoothing',
      alpha: options.alpha || 0.2,
      beta: options.beta || 0.1,
      gamma: options.gamma || 0.1,
      seasonalPeriods: options.seasonalPeriods || 7,
      ...options
    };

    // Validate input data
    if (!Array.isArray(historicalData) || historicalData.length < config.seasonalPeriods * 2) {
      throw new Error(`Insufficient data for forecasting. Need at least ${config.seasonalPeriods * 2} data points.`);
    }

    // Data preprocessing
    const cleanedData = historicalData.map(point => {
      return typeof point === 'object' ? 
        (point.value !== undefined ? point.value : point.y) : 
        parseFloat(point);
    });

    // Implementation of forecasting methods
    switch (config.method) {
      case 'moving-average':
        return movingAverageForecast(cleanedData, periods, config);
      
      case 'exponential-smoothing':
      default:
        return exponentialSmoothingForecast(cleanedData, periods, config);
    }
  } catch (error) {
    console.error('Forecasting error:', error);
    throw error;
  }
};

// Moving Average Forecast implementation
const movingAverageForecast = (data, periods, config) => {
  const windowSize = config.windowSize || Math.min(7, Math.ceil(data.length / 3));
  const forecast = [];
  
  // Generate forecast for requested periods
  for (let i = 0; i < periods; i++) {
    const dataToUse = i === 0 ? data : [...data, ...forecast];
    const startIdx = dataToUse.length - windowSize;
    
    // Calculate average of window
    const sum = dataToUse.slice(startIdx).reduce((acc, val) => acc + val, 0);
    const avg = sum / windowSize;
    
    forecast.push(avg);
  }
  
  return forecast;
};

// Exponential Smoothing Forecast with trend and seasonality (Holt-Winters method)
const exponentialSmoothingForecast = (data, periods, config) => {
  const { alpha, beta, gamma, seasonalPeriods } = config;
  const result = [];
  
  // Initialize components
  let level = data[0];
  let trend = data[1] - data[0];
  
  // Initialize seasonal components
  const seasonals = Array(seasonalPeriods).fill(0);
  for (let i = 0; i < seasonalPeriods; i++) {
    if (i < data.length) {
      seasonals[i] = data[i] / level;
    } else {
      // For insufficient data, use average
      seasonals[i] = 1.0;
    }
  }
  
  // Generate forecast
  for (let i = 0; i < periods; i++) {
    const dataIndex = data.length + i;
    const seasonIndex = dataIndex % seasonalPeriods;
    
    const forecast = (level + trend) * seasonals[seasonIndex];
    result.push(forecast);
    
    // Update components if we have actual data to compare against
    if (dataIndex < data.length) {
      const actual = data[dataIndex];
      const lastLevel = level;
      
      // Update level, trend and seasonal components
      level = alpha * (actual / seasonals[seasonIndex]) + (1 - alpha) * (level + trend);
      trend = beta * (level - lastLevel) + (1 - beta) * trend;
      seasonals[seasonIndex] = gamma * (actual / level) + (1 - gamma) * seasonals[seasonIndex];
    }
  }
  
  return result;
};

// Classification for customer segmentation
const classifyCustomers = (customerData, options = {}) => {
  try {
    const config = {
      method: options.method || 'kmeans',
      clusters: options.clusters || 3,
      features: options.features || ['frequency', 'recency', 'monetary'],
      ...options
    };
    
    // Validate input
    if (!Array.isArray(customerData) || customerData.length === 0) {
      throw new Error('Invalid customer data provided for classification');
    }
    
    // Extract and normalize features
    const featureValues = extractFeatures(customerData, config.features);
    const normalizedFeatures = normalizeFeatures(featureValues);
    
    // Perform clustering based on method
    switch (config.method) {
      case 'kmeans':
      default:
        return kMeansClustering(normalizedFeatures, config.clusters);
    }
  } catch (error) {
    console.error('Classification error:', error);
    throw error;
  }
};

// Feature extraction
const extractFeatures = (data, featureNames) => {
  return data.map(item => {
    const features = {};
    featureNames.forEach(feature => {
      features[feature] = item[feature] !== undefined ? item[feature] : 0;
    });
    return features;
  });
};

// Feature normalization (min-max scaling)
const normalizeFeatures = (featureValues) => {
  const normalized = [];
  const mins = {};
  const maxs = {};
  
  // Find min and max for each feature
  Object.keys(featureValues[0]).forEach(feature => {
    mins[feature] = Math.min(...featureValues.map(item => item[feature]));
    maxs[feature] = Math.max(...featureValues.map(item => item[feature]));
  });
  
  // Normalize each feature to [0,1] range
  featureValues.forEach(item => {
    const normalizedItem = { ...item };
    Object.keys(item).forEach(feature => {
      const range = maxs[feature] - mins[feature];
      normalizedItem[feature] = range === 0 ? 0 : (item[feature] - mins[feature]) / range;
    });
    normalized.push(normalizedItem);
  });
  
  return normalized;
};

// Simple k-means clustering implementation
const kMeansClustering = (data, k) => {
  // This is a simplified implementation - in production would use a library
  
  // Initialize centroids randomly
  const features = Object.keys(data[0]);
  let centroids = [];
  for (let i = 0; i < k; i++) {
    const centroid = {};
    features.forEach(feature => {
      centroid[feature] = Math.random();
    });
    centroids.push(centroid);
  }
  
  const maxIterations = 100;
  let iterations = 0;
  let clusters;
  let prevClusters;
  
  // Iterate until convergence or max iterations
  do {
    prevClusters = clusters;
    
    // Assign data points to clusters
    clusters = data.map(point => {
      const distances = centroids.map((centroid, idx) => {
        const distance = features.reduce((sum, feature) => {
          return sum + Math.pow(point[feature] - centroid[feature], 2);
        }, 0);
        return { distance: Math.sqrt(distance), cluster: idx };
      });
      
      // Find closest centroid
      const closest = distances.reduce((min, curr) => 
        curr.distance < min.distance ? curr : min, distances[0]);
      
      return { 
        ...point, 
        cluster: closest.cluster
      };
    });
    
    // Update centroids
    for (let i = 0; i < k; i++) {
      const clusterPoints = clusters.filter(point => point.cluster === i);
      
      if (clusterPoints.length > 0) {
        const newCentroid = {};
        features.forEach(feature => {
          newCentroid[feature] = clusterPoints.reduce((sum, point) => 
            sum + point[feature], 0) / clusterPoints.length;
        });
        centroids[i] = newCentroid;
      }
    }
    
    iterations++;
  } while (iterations < maxIterations); // In production: check for convergence
  
  return clusters;
};

// Anomaly detection for unusual patterns
const detectAnomalies = (data, options = {}) => {
  try {
    const config = {
      method: options.method || 'zscore',
      threshold: options.threshold || 2.0,
      ...options
    };
    
    // Validate input
    if (!Array.isArray(data) || data.length === 0) {
      throw new Error('Invalid data provided for anomaly detection');
    }
    
    // Choose detection method
    switch (config.method) {
      case 'iqr':
        return detectAnomaliesByIQR(data, config.threshold);
      case 'zscore':
      default:
        return detectAnomaliesByZScore(data, config.threshold);
    }
  } catch (error) {
    console.error('Anomaly detection error:', error);
    throw error;
  }
};

// Anomaly detection using Z-Score method
const detectAnomaliesByZScore = (data, threshold) => {
  // Calculate mean and standard deviation
  const values = data.map(item => typeof item === 'object' ? item.value : item);
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  
  const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
  const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
  const stdDev = Math.sqrt(variance);
  
  // Detect anomalies
  return data.map((item, idx) => {
    const value = typeof item === 'object' ? item.value : item;
    const zScore = Math.abs((value - mean) / stdDev);
    const isAnomaly = zScore > threshold;
    
    return {
      ...item,
      value,
      zScore,
      isAnomaly
    };
  });
};

// Anomaly detection using IQR method
const detectAnomaliesByIQR = (data, multiplier) => {
  // Extract values and sort
  const values = data.map(item => typeof item === 'object' ? item.value : item);
  const sortedValues = [...values].sort((a, b) => a - b);
  
  // Find Q1 and Q3
  const q1Index = Math.floor(sortedValues.length * 0.25);
  const q3Index = Math.floor(sortedValues.length * 0.75);
  
  const q1 = sortedValues[q1Index];
  const q3 = sortedValues[q3Index];
  const iqr = q3 - q1;
  
  // Calculate bounds
  const lowerBound = q1 - (multiplier * iqr);
  const upperBound = q3 + (multiplier * iqr);
  
  // Detect anomalies
  return data.map((item, idx) => {
    const value = typeof item === 'object' ? item.value : item;
    const isAnomaly = value < lowerBound || value > upperBound;
    
    return {
      ...item,
      value,
      isAnomaly,
      lowerBound,
      upperBound
    };
  });
};

// Recommendation engine
const generateRecommendations = (userData, itemData, options = {}) => {
  try {
    const config = {
      method: options.method || 'collaborative',
      similarityThreshold: options.similarityThreshold || 0.5,
      maxRecommendations: options.maxRecommendations || 5,
      ...options
    };
    
    // Choose recommendation method
    switch (config.method) {
      case 'content-based':
        return contentBasedRecommendations(userData, itemData, config);
      case 'collaborative':
      default:
        return collaborativeFilteringRecommendations(userData, itemData, config);
    }
  } catch (error) {
    console.error('Recommendation error:', error);
    throw error;
  }
};

// Collaborative filtering implementation
const collaborativeFilteringRecommendations = (userData, itemData, config) => {
  // This is a simplified version of collaborative filtering
  // In production, you would use a more robust implementation or a library
  
  // Calculate user similarity matrix
  const users = Object.keys(userData);
  const items = Object.keys(itemData);
  
  // Find similar users based on item ratings/interactions
  const userSimilarities = {};
  
  users.forEach(user1 => {
    userSimilarities[user1] = {};
    
    users.forEach(user2 => {
      if (user1 === user2) {
        userSimilarities[user1][user2] = 1.0; // Perfect similarity with self
        return;
      }
      
      // Find items rated by both users
      const user1Items = new Set(userData[user1].interactions.map(i => i.itemId));
      const user2Items = new Set(userData[user2].interactions.map(i => i.itemId));
      
      const commonItems = [...user1Items].filter(item => user2Items.has(item));
      
      // Calculate similarity (cosine similarity)
      if (commonItems.length === 0) {
        userSimilarities[user1][user2] = 0;
      } else {
        // Get ratings for common items
        const ratings1 = {};
        const ratings2 = {};
        
        userData[user1].interactions.forEach(int => {
          if (commonItems.includes(int.itemId)) {
            ratings1[int.itemId] = int.rating || 1; // Default to 1 if only interaction is recorded
          }
        });
        
        userData[user2].interactions.forEach(int => {
          if (commonItems.includes(int.itemId)) {
            ratings2[int.itemId] = int.rating || 1;
          }
        });
        
        // Calculate cosine similarity
        let dotProduct = 0;
        let magnitude1 = 0;
        let magnitude2 = 0;
        
        commonItems.forEach(item => {
          dotProduct += ratings1[item] * ratings2[item];
          magnitude1 += Math.pow(ratings1[item], 2);
          magnitude2 += Math.pow(ratings2[item], 2);
        });
        
        const similarity = dotProduct / (Math.sqrt(magnitude1) * Math.sqrt(magnitude2));
        userSimilarities[user1][user2] = similarity;
      }
    });
  });
  
  // Generate recommendations for each user
  const recommendations = {};
  
  users.forEach(user => {
    const userRatedItems = new Set(userData[user].interactions.map(i => i.itemId));
    const candidateItems = items.filter(item => !userRatedItems.has(item));
    
    // Calculate predicted ratings for candidate items
    const predictedRatings = candidateItems.map(item => {
      let weightedSum = 0;
      let similaritySum = 0;
      
      users.forEach(otherUser => {
        if (user === otherUser) return;
        
        const similarity = userSimilarities[user][otherUser];
        
        // Only consider users with similarity above threshold
        if (similarity < config.similarityThreshold) return;
        
        // Check if the other user has rated this item
        const otherUserRating = userData[otherUser].interactions.find(i => i.itemId === item)?.rating || 0;
        
        if (otherUserRating > 0) {
          weightedSum += similarity * otherUserRating;
          similaritySum += similarity;
        }
      });
      
      const predictedRating = similaritySum > 0 ? weightedSum / similaritySum : 0;
      
      return {
        itemId: item,
        predictedRating
      };
    });
    
    // Sort by predicted rating and take top N
    recommendations[user] = predictedRatings
      .filter(r => r.predictedRating > 0)
      .sort((a, b) => b.predictedRating - a.predictedRating)
      .slice(0, config.maxRecommendations)
      .map(r => ({
        ...itemData[r.itemId],
        itemId: r.itemId,
        score: r.predictedRating
      }));
  });
  
  return recommendations;
};

// Content-based recommendations
const contentBasedRecommendations = (userData, itemData, config) => {
  // Extract features from items
  const itemFeatures = {};
  Object.keys(itemData).forEach(itemId => {
    itemFeatures[itemId] = {};
    
    // Extract numeric features
    Object.keys(itemData[itemId]).forEach(feature => {
      if (typeof itemData[itemId][feature] === 'number') {
        itemFeatures[itemId][feature] = itemData[itemId][feature];
      }
    });
    
    // Process categorical features and tags
    if (itemData[itemId].categories) {
      const categories = Array.isArray(itemData[itemId].categories) ? 
        itemData[itemId].categories : [itemData[itemId].categories];
      
      categories.forEach(category => {
        itemFeatures[itemId][`category_${category}`] = 1;
      });
    }
    
    if (itemData[itemId].tags) {
      const tags = Array.isArray(itemData[itemId].tags) ? 
        itemData[itemId].tags : [itemData[itemId].tags];
      
      tags.forEach(tag => {
        itemFeatures[itemId][`tag_${tag}`] = 1;
      });
    }
  });
  
  // Build user profiles based on their interactions
  const userProfiles = {};
  
  Object.keys(userData).forEach(userId => {
    userProfiles[userId] = {};
    const interactions = userData[userId].interactions || [];
    
    if (interactions.length === 0) return;
    
    // Create weighted average of features from interacted items
    interactions.forEach(interaction => {
      const itemId = interaction.itemId;
      const weight = interaction.rating || 1;
      
      if (!itemFeatures[itemId]) return;
      
      Object.keys(itemFeatures[itemId]).forEach(feature => {
        userProfiles[userId][feature] = (userProfiles[userId][feature] || 0) + 
          (itemFeatures[itemId][feature] * weight);
      });
    });
    
    // Normalize user profile
    const interactionSum = interactions.reduce((sum, i) => sum + (i.rating || 1), 0);
    
    Object.keys(userProfiles[userId]).forEach(feature => {
      userProfiles[userId][feature] /= interactionSum;
    });
  });
  
  // Calculate recommendations for each user
  const recommendations = {};
  
  Object.keys(userProfiles).forEach(userId => {
    const userProfile = userProfiles[userId];
    const userInteractedItems = new Set((userData[userId].interactions || []).map(i => i.itemId));
    
    // Calculate similarity score for each uninteracted item
    const scores = [];
    
    Object.keys(itemFeatures).forEach(itemId => {
      if (userInteractedItems.has(itemId)) return;
      
      const itemFeature = itemFeatures[itemId];
      let similarity = 0;
      let userSum = 0;
      let itemSum = 0;
      
      // Calculate cosine similarity between user profile and item
      const allFeatures = new Set([
        ...Object.keys(userProfile),
        ...Object.keys(itemFeature)
      ]);
      
      allFeatures.forEach(feature => {
        const userValue = userProfile[feature] || 0;
        const itemValue = itemFeature[feature] || 0;
        
        similarity += userValue * itemValue;
        userSum += Math.pow(userValue, 2);
        itemSum += Math.pow(itemValue, 2);
      });
      
      const cosineSimilarity = similarity / (Math.sqrt(userSum) * Math.sqrt(itemSum) || 1);
      
      scores.push({
        itemId,
        score: cosineSimilarity
      });
    });
    
    // Sort by similarity and get top recommendations
    recommendations[userId] = scores
      .sort((a, b) => b.score - a.score)
      .slice(0, config.maxRecommendations)
      .map(r => ({
        ...itemData[r.itemId],
        itemId: r.itemId,
        score: r.score
      }));
  });
  
  return recommendations;
};

// Natural Language Processing utilities for text analysis
const analyzeText = (text, options = {}) => {
  try {
    const config = {
      method: options.method || 'sentiment',
      language: options.language || 'en',
      ...options
    };
    
    // Choose analysis method
    switch (config.method) {
      case 'entities':
        return extractEntities(text, config);
      case 'keywords':
        return extractKeywords(text, config);
      case 'sentiment':
      default:
        return analyzeSentiment(text, config);
    }
  } catch (error) {
    console.error('Text analysis error:', error);
    throw error;
  }
};

// Simple sentiment analysis
const analyzeSentiment = (text, config) => {
  // This is a simplified implementation - in production use a NLP library or API
  const positiveWords = [
    'good', 'great', 'excellent', 'amazing', 'outstanding', 'fantastic',
    'wonderful', 'best', 'better', 'positive', 'happy', 'love', 'like',
    'satisfied', 'enjoy', 'perfect', 'recommend', 'recommended', 'easy',
    'awesome', 'helpful', 'impressive', 'impressed'
  ];
  
  const negativeWords = [
    'bad', 'poor', 'terrible', 'awful', 'horrible', 'worst', 'worse',
    'negative', 'disappointed', 'disappointing', 'difficult', 'hard',
    'not', 'never', 'hate', 'dislike', 'problem', 'issue', 'complaint',
    'unhappy', 'unsatisfied', 'unfortunately', 'expensive', 'overpriced'
  ];
  
  // Normalize and tokenize text
  const normalizedText = text.toLowerCase();
  const words = normalizedText.split(/\W+/).filter(word => word.length > 2);
  
  // Count positive and negative words
  let positiveCount = 0;
  let negativeCount = 0;
  
  words.forEach(word => {
    if (positiveWords.includes(word)) positiveCount++;
    if (negativeWords.includes(word)) negativeCount++;
  });
  
  // Calculate sentiment score (-1 to 1)
  const totalSentimentWords = positiveCount + negativeCount;
  let sentimentScore = 0;
  
  if (totalSentimentWords > 0) {
    sentimentScore = (positiveCount - negativeCount) / totalSentimentWords;
  }
  
  // Determine sentiment label
  let sentiment = 'neutral';
  if (sentimentScore > 0.2) sentiment = 'positive';
  if (sentimentScore < -0.2) sentiment = 'negative';
  
  return {
    text,
    sentiment,
    score: sentimentScore,
    positiveCount,
    negativeCount,
    wordCount: words.length
  };
};

// Extract entities (simplified)
const extractEntities = (text, config) => {
  // Simplified entity extraction - would use NER in production
  const entities = {
    locations: [],
    people: [],
    organizations: [],
    dates: [],
    numbers: []
  };
  
  // Very basic date pattern
  const datePattern = /\b(?:\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4}|\d{1,2} (?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]* \d{2,4})\b/gi;
  const dateMatches = text.match(datePattern) || [];
  entities.dates = dateMatches;
  
  // Basic number pattern
  const numberPattern = /\b\d+(?:\.\d+)?%?\b/g;
  const numberMatches = text.match(numberPattern) || [];
  entities.numbers = numberMatches;
  
  return {
    text,
    entities,
    stats: {
      entityCount: Object.values(entities).flat().length
    }
  };
};

// Extract keywords (simplified)
const extractKeywords = (text, config) => {
  // Simplified keyword extraction
  // In production, use TF-IDF or other NLP approaches
  
  // Stopwords to exclude
  const stopwords = ['a', 'an', 'the', 'and', 'or', 'but', 'is', 'are', 'was', 
    'were', 'be', 'have', 'has', 'had', 'do', 'does', 'did', 'of', 'for', 'in', 
    'on', 'at', 'to', 'from', 'with', 'by', 'about', 'as', 'into', 'like', 'through', 
    'after', 'before', 'between', 'without', 'because', 'during', 'this', 'that', 
    'these', 'those', 'it', 'they', 'them', 'their', 'he', 'she', 'his', 'her'];
  
  // Normalize and tokenize text
  const normalizedText = text.toLowerCase();
  const words = normalizedText.split(/\W+/).filter(word => 
    word.length > 2 && !stopwords.includes(word));
  
  // Count word frequency
  const wordCounts = {};
  words.forEach(word => {
    wordCounts[word] = (wordCounts[word] || 0) + 1;
  });
  
  // Convert to array and sort by frequency
  const keywords = Object.entries(wordCounts)
    .map(([word, count]) => ({ word, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, config.limit || 10);
  
  return {
    text,
    keywords,
    stats: {
      totalWords: words.length,
      uniqueWords: Object.keys(wordCounts).length
    }
  };
};

module.exports = {
  forecastTimeSeries,
  classifyCustomers,
  detectAnomalies,
  generateRecommendations,
  analyzeText
}; 