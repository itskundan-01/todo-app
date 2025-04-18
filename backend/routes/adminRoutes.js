const express = require('express');
const { 
  getAllUsers, 
  getUserById, 
  updateUser, 
  deleteUser, 
  getStatistics,
  sendAiAnnouncementToAllUsers
} = require('../controllers/adminController');
const adminMiddleware = require('../middleware/adminMiddleware');

const router = express.Router();

// Apply admin middleware to all routes
router.use(adminMiddleware);

// User management routes
router.get('/users', getAllUsers);
router.get('/users/:id', getUserById);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);

// Statistics route
router.get('/statistics', getStatistics);

// Mass email routes
router.post('/send-ai-announcement', sendAiAnnouncementToAllUsers);

module.exports = router;
