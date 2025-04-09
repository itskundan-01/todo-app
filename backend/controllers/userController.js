const User = require('../models/User');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { sendWelcomeEmail, sendPasswordResetEmail, validateEmailDomain } = require('../utils/emailService');

// Generate token function
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// Register user
const registerUser = async (req, res) => {
  const { name, email, password, adminKey } = req.body;

  // Validate email with domain restrictions
  const emailValidation = validateEmailDomain(email);
  if (!emailValidation.isValid) {
    return res.status(400).json({ message: emailValidation.message });
  }

  try {
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Check if this is an admin registration with the correct key
    const isAdmin = adminKey === process.env.ADMIN_KEY;

    const user = await User.create({ 
      name, 
      email, 
      password,
      isAdmin,
      lastLogin: new Date()
    });

    if (user) {
      // Send welcome email (don't wait for it to complete to respond to user)
      sendWelcomeEmail(name, email).catch(err => 
        console.error('Error sending welcome email:', err)
      );
      
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin,
        token: generateToken(user._id),
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration', error: error.message });
  }
};

// Login user
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
      // Update last login time
      user.lastLogin = new Date();
      await user.save();
      
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login', error: error.message });
  }
};

// Forgot Password functionality
const forgotPassword = async (req, res) => {
  const { email } = req.body;
  
  console.log("Received forgot password request for:", email);

  // Validate email format
  const emailValidation = validateEmailDomain(email);
  if (!emailValidation.isValid) {
    return res.status(400).json({ message: emailValidation.message });
  }

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Generate random token
    const resetToken = crypto.randomBytes(20).toString('hex');
    
    // Set token and expiration on user account
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await user.save();

    // Send password reset email
    console.log("Sending password reset email to:", user.email);
    const emailResult = await sendPasswordResetEmail(user.name, user.email, resetToken);
    
    if (emailResult.success) {
      console.log("Password reset email sent successfully");
      res.status(200).json({ message: 'Password reset email sent' });
    } else {
      console.error("Failed to send password reset email:", emailResult.error);
      res.status(500).json({ message: 'Failed to send password reset email', error: emailResult.error });
    }
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Server error during password reset request', error: error.message });
  }
};

// Reset Password functionality
const resetPassword = async (req, res) => {
  const { token, password } = req.body;
  
  try {
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Password reset token is invalid or has expired' });
    }

    // Set new password
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    
    await user.save();
    
    res.status(200).json({ message: 'Password has been reset' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Server error during password reset' });
  }
};

module.exports = { registerUser, loginUser, forgotPassword, resetPassword };