/**
 * Main JavaScript file for LocAI application
 * Handles authentication, UI interactions, and common functionality
 */

// Authentication utilities
const auth = {
  // Check if user is logged in
  isLoggedIn: function() {
    return localStorage.getItem('token') ? true : false;
  },
  
  // Get current user token
  getToken: function() {
    return localStorage.getItem('token');
  },
  
  // Set token after login
  setToken: function(token) {
    localStorage.setItem('token', token);
  },
  
  // Remove token on logout
  logout: function() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  },
  
  // Get current user info
  getUser: function() {
    const userData = localStorage.getItem('user');
    return userData ? JSON.parse(userData) : null;
  },
  
  // Set user info after login
  setUser: function(user) {
    localStorage.setItem('user', JSON.stringify(user));
  },
  
  // Update navigation based on auth status
  updateNavigation: function() {
    const isLoggedIn = this.isLoggedIn();
    const loginLinks = document.querySelectorAll('.nav-login');
    const logoutLinks = document.querySelectorAll('.nav-logout');
    const authRequiredLinks = document.querySelectorAll('.auth-required');
    
    loginLinks.forEach(link => {
      link.style.display = isLoggedIn ? 'none' : 'block';
    });
    
    logoutLinks.forEach(link => {
      link.style.display = isLoggedIn ? 'block' : 'none';
    });
    
    authRequiredLinks.forEach(link => {
      link.style.display = isLoggedIn ? 'block' : 'none';
    });
  }
};

// Helper for making authenticated API requests
async function fetchWithAuth(url, options = {}) {
  const token = auth.getToken();
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json'
    }
  };
  
  if (token) {
    defaultOptions.headers['Authorization'] = `Bearer ${token}`;
  }
  
  const mergedOptions = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers
    }
  };
  
  return fetch(url, mergedOptions);
}

// Handle API responses consistently
async function handleApiResponse(response) {
  if (!response.ok) {
    const errorData = await response.json();
    if (response.status === 401) {
      // Unauthorized - clear auth and redirect to login
      auth.logout();
      window.location.href = '/login';
    }
    throw new Error(errorData.message || 'API request failed');
  }
  return await response.json();
}

// Format currency values
function formatCurrency(value) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
}

// Format dates in a user-friendly way
function formatDate(dateString) {
  const options = { year: 'numeric', month: 'short', day: 'numeric' };
  return new Date(dateString).toLocaleDateString(undefined, options);
}

// Check if user is authenticated
function isAuthenticated() {
  return document.cookie.includes('isAuthenticated=true');
}

// Toggle elements based on authentication status
function updateUIForAuthStatus() {
  const authenticatedElements = document.querySelectorAll('.auth-only');
  const unauthenticatedElements = document.querySelectorAll('.unauth-only');
  
  if (isAuthenticated()) {
    authenticatedElements.forEach(el => el.style.display = 'block');
    unauthenticatedElements.forEach(el => el.style.display = 'none');
  } else {
    authenticatedElements.forEach(el => el.style.display = 'none');
    unauthenticatedElements.forEach(el => el.style.display = 'block');
  }
}

// UI Enhancement - Tooltip initialization
function initTooltips() {
  const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
  tooltipTriggerList.map(function (tooltipTriggerEl) {
    return new bootstrap.Tooltip(tooltipTriggerEl);
  });
}

// UI Enhancement - Popover initialization
function initPopovers() {
  const popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'));
  popoverTriggerList.map(function (popoverTriggerEl) {
    return new bootstrap.Popover(popoverTriggerEl);
  });
}

// UI Enhancement - Prevent empty form submissions
function preventEmptyFormSubmissions() {
  document.querySelectorAll('form').forEach(form => {
    form.addEventListener('submit', function(e) {
      const requiredFields = form.querySelectorAll('[required]');
      let isValid = true;
      
      requiredFields.forEach(field => {
        if (!field.value.trim()) {
          isValid = false;
          field.classList.add('is-invalid');
          
          // Create or update feedback message
          let feedback = field.nextElementSibling;
          if (!feedback || !feedback.classList.contains('invalid-feedback')) {
            feedback = document.createElement('div');
            feedback.classList.add('invalid-feedback');
            field.parentNode.insertBefore(feedback, field.nextSibling);
          }
          feedback.textContent = 'This field is required';
        } else {
          field.classList.remove('is-invalid');
        }
      });
      
      if (!isValid) {
        e.preventDefault();
      }
    });
  });
}

// UI Enhancement - Smooth scrolling for anchor links
function initSmoothScrolling() {
  document.querySelectorAll('a[href^="#"]:not([href="#"])').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      e.preventDefault();
      const targetId = this.getAttribute('href');
      const targetElement = document.querySelector(targetId);
      
      if (targetElement) {
        targetElement.scrollIntoView({
          behavior: 'smooth'
        });
      }
    });
  });
}

// UI Enhancement - Animate elements on scroll
function initScrollAnimations() {
  const animatedElements = document.querySelectorAll('.animate-on-scroll');
  
  function checkIfInView() {
    animatedElements.forEach(el => {
      const rect = el.getBoundingClientRect();
      const windowHeight = window.innerHeight || document.documentElement.clientHeight;
      
      if (rect.top <= windowHeight * 0.8 && rect.bottom >= 0) {
        el.classList.add('animated');
      }
    });
  }
  
  // Initial check
  checkIfInView();
  
  // Check on scroll
  window.addEventListener('scroll', checkIfInView);
}

// Dark mode toggle
function initDarkModeToggle() {
  const darkModeToggle = document.getElementById('dark-mode-toggle');
  if (darkModeToggle) {
    // Check for saved preference
    const prefersDarkMode = localStorage.getItem('darkMode') === 'true';
    if (prefersDarkMode) {
      document.body.classList.add('dark-mode');
      darkModeToggle.checked = true;
    }
    
    // Toggle dark mode
    darkModeToggle.addEventListener('change', function() {
      if (this.checked) {
        document.body.classList.add('dark-mode');
        localStorage.setItem('darkMode', 'true');
      } else {
        document.body.classList.remove('dark-mode');
        localStorage.setItem('darkMode', 'false');
      }
    });
  }
}

// Initialize all functions when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  updateUIForAuthStatus();
  initTooltips();
  initPopovers();
  preventEmptyFormSubmissions();
  initSmoothScrolling();
  initScrollAnimations();
  initDarkModeToggle();
  
  // Add fade-in animation to main content
  const mainContent = document.querySelector('.content-wrapper');
  if (mainContent) {
    mainContent.classList.add('fade-in');
  }
  
  // Update navigation based on auth status
  auth.updateNavigation();
  
  // Setup logout functionality
  const logoutBtn = document.querySelector('#logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', function(e) {
      e.preventDefault();
      auth.logout();
    });
  }
  
  // Check if login prompt should be shown
  const loginPrompt = document.getElementById('loginPrompt');
  if (loginPrompt && !auth.isLoggedIn()) {
    loginPrompt.classList.remove('d-none');
  }
}); 