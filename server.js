const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Load environment variables
dotenv.config();

// Check OpenAI API key
if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your-openai-api-key-here') {
  console.warn('OPENAI_API_KEY not set. TTS functionality will not work.');
  console.warn('Please set OPENAI_API_KEY in your .env file');
} else {
  console.log('OpenAI API key loaded successfully');
}

const app = express();
const PORT = process.env.PORT || 5001;

// Increase timeout for large requests
app.use((req, res, next) => {
  req.setTimeout(300000); // 5 minutes
  res.setTimeout(300000); // 5 minutes
  next();
});

// Middleware
const defaultOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://127.0.0.1:3000'
];

const remoteOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean);

const allowedOrigins = [...new Set([...defaultOrigins, ...remoteOrigins])];

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));
// Body parser with increased limits for video uploads
app.use(express.json({ 
  limit: '500mb',
  parameterLimit: 50000,
  type: 'application/json'
}));
app.use(express.urlencoded({ 
  limit: '500mb', 
  extended: true,
  parameterLimit: 50000
}));

// MongoDB connection with fallback
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/scorm-generator', {
  serverSelectionTimeoutMS: 5000, // 5 second timeout
  bufferCommands: false // Disable mongoose buffering
})
.then(() => console.log('MongoDB connected successfully'))
.catch(err => {
  console.error('MongoDB connection error:', err);
  console.log('Server will continue without database connection');
  console.log('Note: SCORM generation will work but packages won\'t be saved to database');
});

// Models
const User = require('./models/User');
const SCORMPackage = require('./models/SCORMPackage');

// Auth middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/scorm', authenticateToken, require('./routes/scorm'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'SCORM Generator API is running' });
});

// Test endpoint for debugging
app.get('/api/test', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Backend is working',
    timestamp: new Date().toISOString(),
    port: PORT
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// Start server with error handling
// Initialize cleanup service for temporary directories
const cleanupService = require('./utils/cleanup');
// Start periodic cleanup (every 30 minutes)
cleanupService.startPeriodicCleanup(30);

const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});

// Handle port conflicts gracefully
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Please try one of the following:`);
    console.error(`1. Kill the process using port ${PORT}: lsof -ti:${PORT} | xargs kill -9`);
    console.error(`2. Use a different port: PORT=5002 npm start`);
    console.error(`3. Update the PORT in your .env file or config.js`);
    process.exit(1);
  } else {
    console.error('Server error:', err);
    process.exit(1);
  }
});

module.exports = app;
