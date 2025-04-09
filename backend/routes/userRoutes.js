const express = require('express');
const { registerUser, loginUser, forgotPassword, resetPassword } = require('../controllers/userController');
const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// Add a test endpoint to verify the route is registered
router.get('/forgot-password-test', (req, res) => {
  res.status(200).json({ message: "This endpoint exists. Please use POST for password reset requests." });
});

module.exports = router;