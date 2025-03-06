const User = require('../models/User');
const generateToken = require('../utils/generateToken');

// @desc    Register a new user
// @route   POST /api/auth/signup
// @access  Public
exports.registerUser = async (req, res) => {
  try {
    const { businessName, email, password, businessType, location } = req.body;
    
    console.log('Registration attempt:', { businessName, email, businessType, location });

    // Validate required fields
    if (!businessName || !email || !password || !businessType || !location) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    // Check if user already exists (case insensitive email check)
    const userExists = await User.findOne({ email: email.toLowerCase() });

    if (userExists) {
      console.log('Registration failed: User already exists with email:', email);
      return res.status(400).json({ 
        success: false, 
        message: 'User already exists with this email address' 
      });
    }

    // Create user
    const user = await User.create({
      businessName,
      email: email.toLowerCase(),
      password,
      businessType,
      location
    });

    if (user) {
      console.log('User registered successfully:', user._id);
      
      // Generate token
      const token = generateToken(user._id);
      
      // Return success response
      res.status(201).json({
        success: true,
        user: {
          _id: user._id,
          businessName: user.businessName,
          email: user.email,
          businessType: user.businessType,
          location: user.location,
          token: token
        }
      });
    } else {
      res.status(400).json({ 
        success: false, 
        message: 'Invalid user data' 
      });
    }
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during registration. Please try again.'
    });
  }
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    console.log('Login attempt:', { email });

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password'
      });
    }

    // Find user by email (case insensitive)
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

    // If no user found with this email
    if (!user) {
      console.log('Login failed: User not found with email:', email);
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);
    
    if (isMatch) {
      console.log('User logged in successfully:', user._id);
      
      // Generate token
      const token = generateToken(user._id);
      
      // Return success response
      res.json({
        success: true,
        user: {
          _id: user._id,
          businessName: user.businessName,
          email: user.email,
          businessType: user.businessType,
          location: user.location,
          token: token
        }
      });
    } else {
      console.log('Login failed: Invalid password for user:', email);
      res.status(401).json({ 
        success: false, 
        message: 'Invalid email or password' 
      });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login. Please try again.'
    });
  }
};

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      res.json({
        success: true,
        user: {
          _id: user._id,
          businessName: user.businessName,
          email: user.email,
          businessType: user.businessType,
          location: user.location
        }
      });
    } else {
      res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching profile'
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
exports.updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      user.businessName = req.body.businessName || user.businessName;
      user.email = req.body.email || user.email;
      user.businessType = req.body.businessType || user.businessType;
      user.location = req.body.location || user.location;
      
      if (req.body.password) {
        user.password = req.body.password;
      }

      const updatedUser = await user.save();

      res.json({
        success: true,
        user: {
          _id: updatedUser._id,
          businessName: updatedUser.businessName,
          email: updatedUser.email,
          businessType: updatedUser.businessType,
          location: updatedUser.location,
          token: generateToken(updatedUser._id)
        }
      });
    } else {
      res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
}; 