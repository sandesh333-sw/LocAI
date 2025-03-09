const express = require('express');
const dotenv = require('dotenv');
const path = require('path');
const connectDB = require('./config/db');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

// Load environment variables
dotenv.config();

// Connect to database
connectDB();

const app = express();

// Security middleware (only in production)
if (process.env.NODE_ENV === 'production') {
  // Set security HTTP headers
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", 'cdn.jsdelivr.net', 'cdnjs.cloudflare.com'],
        styleSrc: ["'self'", "'unsafe-inline'", 'cdn.jsdelivr.net', 'cdnjs.cloudflare.com', 'fonts.googleapis.com'],
        fontSrc: ["'self'", 'fonts.googleapis.com', 'fonts.gstatic.com', 'cdnjs.cloudflare.com'],
        imgSrc: ["'self'", 'data:'],
        connectSrc: ["'self'"]
      }
    }
  }));
  
  // Limit requests from same IP
  const limiter = rateLimit({
    max: 100, // limit each IP to 100 requests per 15 minutes
    windowMs: 15 * 60 * 1000,
    message: 'Too many requests from this IP, please try again later.'
  });
  app.use('/api', limiter);
  
  // HTTP request logger
  app.use(morgan('combined'));
} else {
  // Simple logging for development
  app.use(morgan('dev'));
}

// Standard middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors());

// Set static folder
app.use(express.static(path.join(__dirname, 'public')));

// Set view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// API Routes
app.use('/api/auth', require('./routes/userRoutes'));
app.use('/api/data', require('./routes/dataRoutes'));
app.use('/api/analysis', require('./routes/aiRoutes'));
app.use('/api/recommendations', require('./routes/recommendationsRoutes'));

// Page Routes
app.get('/', (req, res) => {
  res.render('dashboard');
});

app.get('/login', (req, res) => {
  res.render('login');
});

app.get('/register', (req, res) => {
  res.render('register');
});

app.get('/data', (req, res) => {
  res.render('data');
});

app.get('/profile', (req, res) => {
  res.render('profile');
});

app.get('/recommendations', (req, res) => {
  res.render('recommendations');
});

// Add routes for privacy and terms pages
app.get('/privacy', (req, res) => {
  res.render('privacy');
});

app.get('/terms', (req, res) => {
  res.render('terms');
});

// Fall back for 404 errors
app.use('*', (req, res) => {
  res.status(404).render('404');
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`)); 