const User = require('../models/User');
const Task = require('../models/Task');
const RecurringTask = require('../models/RecurringTask');
const mongoose = require('mongoose');
const { sendAiFeatureAnnouncementEmail } = require('../utils/emailService');

// Get all users
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// Get user by ID
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// Update user
const updateUser = async (req, res) => {
  try {
    const { name, email, isAdmin } = req.body;
    
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    user.name = name || user.name;
    user.email = email || user.email;
    
    // Only allow admin status change if explicitly provided
    if (isAdmin !== undefined) {
      user.isAdmin = isAdmin;
    }
    
    const updatedUser = await user.save();
    
    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      isAdmin: updatedUser.isAdmin,
      createdAt: updatedUser.createdAt,
      lastLogin: updatedUser.lastLogin
    });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// Delete user
const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Admin cannot delete themselves
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'Admin cannot delete their own account' });
    }
    
    // Delete user's tasks
    await Task.deleteMany({ userId: user._id });
    await RecurringTask.deleteMany({ userId: user._id });
    
    await user.deleteOne();
    
    res.json({ message: 'User removed' });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// Get system statistics
const getStatistics = async (req, res) => {
  try {
    // Get counts
    const userCount = await User.countDocuments();
    const taskCount = await Task.countDocuments();
    const recurringTaskCount = await RecurringTask.countDocuments();
    const completedTaskCount = await Task.countDocuments({ completed: true });
    
    // Get tasks created per day (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const tasksByDay = await Task.aggregate([
      {
        $match: {
          createdAt: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);
    
    // Get top 5 users with most tasks
    const topUsers = await Task.aggregate([
      {
        $group: {
          _id: '$userId',
          taskCount: { $sum: 1 }
        }
      },
      {
        $sort: { taskCount: -1 }
      },
      {
        $limit: 5
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $unwind: '$user'
      },
      {
        $project: {
          _id: 0,
          userId: '$_id',
          name: '$user.name',
          email: '$user.email',
          taskCount: 1
        }
      }
    ]);
    
    res.json({
      userCount,
      taskCount,
      recurringTaskCount,
      completedTaskCount,
      completionRate: taskCount > 0 ? (completedTaskCount / taskCount * 100).toFixed(2) : 0,
      tasksByDay,
      topUsers
    });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

/**
 * Send AI feature announcement email to all users
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const sendAiAnnouncementToAllUsers = async (req, res) => {
  try {
    // Find all users with valid email addresses
    const users = await User.find({ email: { $exists: true, $ne: "" } });
    
    if (!users || users.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'No users found to send emails to' 
      });
    }

    console.log(`Found ${users.length} users to send AI feature announcement emails to`);
    
    // Send emails to each user
    const results = [];
    let successCount = 0;
    let failCount = 0;
    
    for (const user of users) {
      try {
        // Wait a short time between sending emails to avoid rate limits
        if (results.length > 0) {
          await new Promise(resolve => setTimeout(resolve, 300));
        }
        
        const result = await sendAiFeatureAnnouncementEmail(user.name || 'Valued User', user.email);
        
        if (result.success) {
          successCount++;
        } else {
          failCount++;
          console.error(`Failed to send email to ${user.email}: ${result.error}`);
        }
        
        results.push({
          userId: user._id,
          email: user.email,
          success: result.success,
          error: result.error
        });
      } catch (emailError) {
        console.error(`Error sending to ${user.email}:`, emailError);
        failCount++;
        results.push({
          userId: user._id,
          email: user.email,
          success: false,
          error: emailError.message
        });
      }
    }
    
    return res.status(200).json({
      success: true,
      message: `AI feature announcement sent to users. Success: ${successCount}, Failed: ${failCount}`,
      results: results
    });
    
  } catch (error) {
    console.error('Error sending mass emails:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Error sending mass emails', 
      error: error.message 
    });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  getStatistics,
  sendAiAnnouncementToAllUsers
};
