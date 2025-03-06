# LocAI - AI-Powered Local Business Intelligence Platform


## Project Overview
LocAI is an AI-powered business intelligence platform designed specifically for small and local businesses. It analyzes consumer behavior using localized data such as foot traffic, seasonal trends, and purchasing habits to provide actionable insights that help optimize inventory, marketing strategies, and sales performance.

## Key Features
- **Smart Business Dashboard**: Customizable UI displaying real-time sales trends, customer behavior insights, and predictive analytics.
- **AI Recommendations Engine**: Generates personalized business recommendations using machine learning algorithms.
- **Business Data Analysis**: Processes and visualizes sales data, customer interactions, and foot traffic to identify patterns.
- **User Management System**: Secure registration and authentication with role-based access control.
- **Recommendation Management**: View, implement, and delete AI-generated recommendations as needed.
- **Responsive Design**: Fully responsive web application that works on desktops, tablets, and mobile devices.
- **Dark Mode Support**: Toggle between light and dark themes based on user preference.

## Tech Stack
### **Frontend**
- **Embedded JavaScript (EJS)**: Server-side rendering with dynamic templates
- **Bootstrap 5**: Responsive UI framework with custom theming
- **Custom CSS**: Enhanced styling with animations and modern UI elements
- **JavaScript**: Client-side interactivity and API integration

### **Backend**
- **Node.js & Express.js**: Server-side application framework
- **MongoDB**: NoSQL database for flexible data storage
- **Mongoose**: ODM for MongoDB schema management
- **JWT Authentication**: Secure user authentication and authorization
- **RESTful API**: Clean API design for data operations

## Installation & Setup
### **Prerequisites**
- Node.js (v14 or higher)
- MongoDB (local or Atlas)
- Git

### **Development Setup**
1. Clone the repository:
   ```sh
   git clone https://github.com/yourusername/locai.git
   cd locai
   ```

2. Install dependencies:
   ```sh
   npm install
   ```

3. Create a `.env` file in the root directory:
   ```env
   NODE_ENV=development
   PORT=5001
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret_key
   JWT_EXPIRE=30d
   ```

4. Start the development server:
   ```sh
   npm run dev
   ```

5. Access the application at `http://localhost:5001`

### **Production Deployment with Render**
LocAI is optimized for deployment on Render's cloud platform:

1. Create a new Web Service on Render
2. Connect your GitHub repository
3. Configure the service:
   - Build Command: `npm install`
   - Start Command: `npm run prod`
   - Environment Variables: Set the same variables as in your `.env` file
   - Plan: Select an appropriate plan (at least 1GB RAM recommended)

4. Click "Create Web Service"
5. Your application will be deployed and available at your Render URL

## Project Structure
```
├── controllers        # Business logic handlers
│   ├── aiController.js    # AI recommendation logic
│   ├── dataController.js  # Data management
│   ├── userController.js  # User authentication
│
├── models             # Database schemas
│   ├── Analysis.js        # ML analysis results
│   ├── Data.js            # Business data
│   ├── User.js            # User information
│
├── routes             # API endpoints
│   ├── aiRoutes.js        # AI-related routes
│   ├── dataRoutes.js      # Data management routes
│   ├── userRoutes.js      # Authentication routes
│
├── middleware         # Custom middleware
│   ├── auth.js            # Authentication middleware
│   ├── error.js           # Error handling
│
├── views              # EJS templates
│   ├── partials           # Reusable components
│   ├── dashboard.ejs      # Main dashboard
│   ├── recommendations.ejs # Recommendations page
│   ├── insights.ejs       # Business insights
│   ├── login.ejs          # User login
│   ├── register.ejs       # User registration
│
├── public             # Static assets
│   ├── css                # Stylesheets
│   ├── js                 # Client-side scripts
│   ├── img                # Images and icons
│
├── utils              # Utility functions
│   ├── mlUtils.js         # Machine learning utilities
│
├── config             # Configuration
│   ├── db.js              # Database connection
│
├── server.js          # Application entry point
├── package.json       # Dependencies and scripts
├── .env               # Environment variables
```

## API Endpoints

### **Authentication**
- `POST /api/auth/signup` – Register a new business
- `POST /api/auth/login` – User login
- `GET /api/auth/logout` – User logout
- `GET /api/auth/me` – Get current user profile

### **Data Management**
- `POST /api/data` – Upload business data
- `GET /api/data` – Retrieve uploaded data
- `DELETE /api/data/:id` – Delete a specific data entry

### **AI Analysis**
- `GET /api/analysis/recommendations` – Get AI recommendations
- `DELETE /api/analysis/recommendations/:id` – Delete a specific recommendation
- `GET /api/analysis` – Get all analyses for current user
- `GET /api/analysis/:id` – Get analysis by ID

## User Flows
### **New User Onboarding**
1. User registers a business account
2. User is presented with sample recommendations to demonstrate the platform's capabilities
3. User uploads business data (sales, customer, traffic data)
4. System analyzes the data and generates personalized recommendations
5. User can view, implement, or delete recommendations

### **Recommendation Management**
1. User views recommendations on the recommendations page
2. Recommendations are sorted by priority (high, medium, low)
3. User can filter recommendations by priority level
4. User can mark recommendations as implemented
5. User can delete recommendations they don't find useful
6. System refreshes recommendations based on new data uploads

## Security Implementation
- JWT-based authentication with secure HTTP-only cookies
- Password hashing using bcrypt
- Protected routes with middleware authentication
- Input validation and sanitization
- Rate limiting on authentication endpoints
- CSRF protection
- Secure HTTP headers with Helmet

## License
This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments
- Bootstrap  for the UI framework
- MongoDB  for the database
- Express.js  for the web framework
- The open-source community for various dependencies
