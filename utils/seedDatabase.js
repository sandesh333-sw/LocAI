const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Data = require('../models/Data');
const Analysis = require('../models/Analysis');
const mlUtils = require('./mlUtils');

// Load environment variables
dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected for seeding'))
  .catch(err => console.error('MongoDB connection error:', err));

// Generate random date within a range
const getRandomDate = (start, end) => {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
};

// Generate random number within a range
const getRandomNumber = (min, max) => {
  return Math.floor(Math.random() * (max - min + 1) + min);
};

// Generate sales data with some patterns
const generateSalesData = (days = 30) => {
  const salesData = [];
  const today = new Date();
  const categories = ['Clothing', 'Electronics', 'Home Goods', 'Food', 'Beauty'];
  
  for (let i = 0; i < days; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    // Create some weekly patterns (weekends have higher sales)
    let multiplier = 1;
    if (date.getDay() === 0 || date.getDay() === 6) {
      multiplier = 1.5;
    }
    
    // Random categories for this day's sales
    const selectedCategories = [];
    const numCategories = getRandomNumber(1, categories.length);
    for (let j = 0; j < numCategories; j++) {
      const category = categories[getRandomNumber(0, categories.length - 1)];
      if (!selectedCategories.includes(category)) {
        selectedCategories.push(category);
      }
    }
    
    const totalAmount = getRandomNumber(100, 500) * multiplier;
    
    salesData.push({
      date: date,
      amount: totalAmount,
      itemsSold: getRandomNumber(10, 50) * multiplier,
      categories: selectedCategories
    });
  }
  
  return salesData;
};

// Generate customer interaction data
const generateCustomerData = (days = 30) => {
  const customerData = [];
  const today = new Date();
  // Valid enum values for the type field
  const interactionTypes = ['walk-in', 'online', 'phone', 'other'];
  
  for (let i = 0; i < days; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    // Create some patterns (weekends have more interactions)
    let multiplier = 1;
    if (date.getDay() === 0 || date.getDay() === 6) {
      multiplier = 1.3;
    }
    
    customerData.push({
      date: date,
      count: getRandomNumber(10, 40) * multiplier,
      type: interactionTypes[getRandomNumber(0, interactionTypes.length - 1)]
    });
  }
  
  return customerData;
};

// Generate foot traffic data
const generateFootTrafficData = (days = 30) => {
  const footTrafficData = [];
  const today = new Date();
  
  for (let i = 0; i < days; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    // Create some patterns (weekends have more traffic)
    let multiplier = 1;
    if (date.getDay() === 0 || date.getDay() === 6) {
      multiplier = 1.4;
    }
    
    // Generate random peak hours
    const morningPeak = getRandomNumber(9, 11);
    const afternoonPeak = getRandomNumber(15, 18);
    
    footTrafficData.push({
      date: date,
      count: getRandomNumber(50, 200) * multiplier,
      peakHours: [`${morningPeak}:00-${morningPeak + 1}:00`, `${afternoonPeak}:00-${afternoonPeak + 1}:00`]
    });
  }
  
  return footTrafficData;
};

// Generate analysis results using our ML utils
const generateAnalysisResults = () => {
  try {
    // We'll create simple mock analysis results
    // In a real implementation, you would use the ML utils here
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    return {
      analysisType: 'recommendation',
      timeRange: {
        start: thirtyDaysAgo,
        end: today
      },
      insights: [
        {
          title: 'Peak Sales Hours',
          description: 'Your business experiences highest sales between 2PM and 5PM on weekdays.',
          confidenceScore: 0.85
        },
        {
          title: 'Customer Retention',
          description: 'Your customer retention rate is 68%, above industry average.',
          confidenceScore: 0.92
        },
        {
          title: 'Seasonal Trends',
          description: 'Sales increase by 32% during holidays and drop by 18% in summer.',
          confidenceScore: 0.78
        }
      ],
      recommendations: [
        {
          title: 'Increase Weekend Staff',
          description: 'Sales data shows 40% higher transactions on weekends with longer customer wait times.',
          priority: 'high',
          actionItems: ['Schedule 2 additional staff on Saturdays', 'Adjust shift hours to cover peak times']
        },
        {
          title: 'Launch Loyalty Program',
          description: 'Customer segments show 25% of shoppers return regularly and would benefit from rewards.',
          priority: 'medium',
          actionItems: ['Research loyalty program software', 'Define reward tiers', 'Create marketing materials']
        },
        {
          title: 'Adjust Inventory for Summer',
          description: 'Seasonal analysis indicates a 30% increase in certain product categories next month.',
          priority: 'medium',
          actionItems: ['Increase stock of seasonal items', 'Reduce winter inventory']
        }
      ],
      charts: [
        {
          type: 'line',
          title: 'Monthly Sales Trend',
          data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
            datasets: [
              {
                label: 'Sales',
                data: [12000, 13500, 14200, 15800, 16200, 17500]
              }
            ]
          }
        },
        {
          type: 'pie',
          title: 'Sales by Category',
          data: {
            labels: ['Clothing', 'Electronics', 'Home Goods', 'Food', 'Beauty'],
            datasets: [
              {
                data: [35, 25, 20, 15, 5]
              }
            ]
          }
        }
      ]
    };
  } catch (error) {
    console.error('Error generating analysis results:', error);
    return {};
  }
};

// Main function to seed the database
const seedDatabase = async () => {
  try {
    // Clear existing data
    console.log('Clearing existing data...');
    await User.deleteMany({});
    await Data.deleteMany({});
    await Analysis.deleteMany({});
    
    // Create test user
    console.log('Creating test user...');
    const hashedPassword = await bcrypt.hash('password123', 10);
    const user = await User.create({
      businessName: 'Test Business',
      email: 'test@example.com',
      password: hashedPassword,
      businessType: 'retail',
      location: '123 Main St, Anytown USA'
    });
    
    // Generate and save test data
    console.log('Generating test data...');
    const salesData = generateSalesData();
    const customerData = generateCustomerData();
    const footTrafficData = generateFootTrafficData();
    
    const data = await Data.create({
      user: user._id,
      salesData: salesData,
      customerInteractions: customerData,
      footTraffic: footTrafficData
    });
    
    // Generate and save analysis results
    console.log('Generating analysis results...');
    const analysisResults = generateAnalysisResults();
    
    const analysis = await Analysis.create({
      user: user._id,
      analysisType: analysisResults.analysisType,
      timeRange: analysisResults.timeRange,
      insights: analysisResults.insights,
      recommendations: analysisResults.recommendations,
      charts: analysisResults.charts,
      createdAt: new Date()
    });
    
    console.log('Database seeded successfully!');
    console.log(`Created user: ${user.email}`);
    console.log(`Created ${salesData.length} sales records`);
    console.log(`Created ${customerData.length} customer interaction records`);
    console.log(`Created ${footTrafficData.length} foot traffic records`);
    console.log(`Created analysis results`);
    
    // Disconnect from the database
    mongoose.disconnect();
    
  } catch (error) {
    console.error('Error seeding database:', error);
    mongoose.disconnect();
    process.exit(1);
  }
};

// Run the seeding function
seedDatabase(); 