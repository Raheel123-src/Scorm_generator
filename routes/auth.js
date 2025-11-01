const express = require('express');
const authController = require('../controllers/authController');

const router = express.Router();

// Register
router.post('/signup', authController.signup);

// Login
router.post('/login', authController.login);

// Get current user
router.get('/me', authController.getCurrentUser);

module.exports = router;
