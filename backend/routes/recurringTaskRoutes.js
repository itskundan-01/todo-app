const express = require('express');
const { 
  getRecurringTasks, 
  addRecurringTask, 
  deleteRecurringTask, 
  updateRecurringTask 
} = require('../controllers/recurringTaskController');

const router = express.Router();

router.get('/:userId', getRecurringTasks);
router.post('/', addRecurringTask);
router.delete('/:id', deleteRecurringTask);
router.put('/:id', updateRecurringTask);

module.exports = router;
