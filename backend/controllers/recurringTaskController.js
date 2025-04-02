const RecurringTask = require('../models/RecurringTask');
const Task = require('../models/Task');
const mongoose = require('mongoose');
const { 
  generateHourlyDates, 
  generateDailyDates, 
  generateWeeklyDates, 
  generateMonthlyDates,
  formatDate,
  getPatternDescription
} = require('../utils/recurringTaskUtils');

const getRecurringTasks = async (req, res) => {
  try {
    const tasks = await RecurringTask.find({ userId: req.params.userId });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

const addRecurringTask = async (req, res) => {
  try {
    const {
      userId,
      title,
      priority,
      recurrenceType,
      startDate,
      endDate,
      startTime,
      endTime,
      hourlyInterval,
      dailyDays,
      weeklyDays,
      monthlyType,
      monthlyDate,
      monthlyDay,
      monthlyWeek
    } = req.body;

    // Create the recurring task pattern record
    const recurringTask = new RecurringTask({
      userId,
      title,
      priority,
      recurrenceType,
      startDate,
      endDate,
      startTime,
      endTime,
      hourlyInterval,
      dailyDays,
      weeklyDays,
      monthlyType,
      monthlyDate,
      monthlyDay,
      monthlyWeek
    });

    const createdRecurringTask = await recurringTask.save();
    
    // Generate individual task instances
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : getDefaultEndDate(start);
    
    let dates = [];
    
    switch (recurrenceType) {
      case 'hourly':
        dates = generateHourlyDates(start, end, startTime, endTime, hourlyInterval);
        break;
      case 'daily':
        dates = generateDailyDates(start, end, dailyDays);
        break;
      case 'weekly':
        dates = generateWeeklyDates(start, end, weeklyDays);
        break;
      case 'monthly':
        dates = generateMonthlyDates(start, end, monthlyType, monthlyDate, monthlyDay, monthlyWeek);
        break;
    }
    
    // Create individual task instances
    const taskPromises = dates.map(date => {
      const task = new Task({
        userId,
        text: title,
        priority,
        date: formatDate(date),
        time: startTime || '12:00 PM',
        completed: false,
        recurringTaskId: createdRecurringTask._id, // Link to the recurring pattern
        isRecurringInstance: true,
        recurrencePattern: getPatternDescription(req.body)
      });
      
      return task.save();
    });
    
    await Promise.all(taskPromises);
    
    res.status(201).json(createdRecurringTask);
  } catch (error) {
    console.error('Error creating recurring task:', error);
    res.status(400).json({ message: 'Failed to create recurring task', error: error.message });
  }
};

const deleteRecurringTask = async (req, res) => {
  try {
    const taskId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(taskId)) {
      return res.status(400).json({ message: 'Invalid task ID' });
    }

    // Find and delete the recurring task pattern
    const task = await RecurringTask.findById(taskId);

    if (task) {
      await RecurringTask.deleteOne({ _id: taskId });
      
      // Delete all task instances associated with this recurring pattern
      await Task.deleteMany({ recurringTaskId: taskId });
      
      res.json({ message: 'Recurring task and all its instances removed' });
    } else {
      res.status(404).json({ message: 'Recurring task not found' });
    }
  } catch (error) {
    res.status(400).json({ message: 'Invalid task ID', error: error.message });
  }
};

const updateRecurringTask = async (req, res) => {
  try {
    const task = await RecurringTask.findById(req.params.id);

    if (task) {
      // Update all fields
      Object.keys(req.body).forEach(key => {
        task[key] = req.body[key];
      });

      const updatedTask = await task.save();
      
      // For simplicity, delete all existing instances and recreate them
      // In production, you might want to be more careful about preserving existing completions
      await Task.deleteMany({ recurringTaskId: task._id });
      
      // Recreate all instances with updated pattern
      // (This is a simplified version - for production, you might want to handle this differently)
      const start = new Date(task.startDate);
      const end = task.endDate ? new Date(task.endDate) : getDefaultEndDate(start);
      
      let dates = [];
      switch (task.recurrenceType) {
        case 'hourly':
          dates = generateHourlyDates(start, end, task.startTime, task.endTime, task.hourlyInterval);
          break;
        case 'daily':
          dates = generateDailyDates(start, end, task.dailyDays);
          break;
        case 'weekly':
          dates = generateWeeklyDates(start, end, task.weeklyDays);
          break;
        case 'monthly':
          dates = generateMonthlyDates(start, end, task.monthlyType, task.monthlyDate, task.monthlyDay, task.monthlyWeek);
          break;
      }
      
      const taskPromises = dates.map(date => {
        const newTask = new Task({
          userId: task.userId,
          text: task.title,
          priority: task.priority,
          date: formatDate(date),
          time: task.startTime || '12:00 PM',
          completed: false,
          recurringTaskId: task._id,
          isRecurringInstance: true,
          recurrencePattern: getPatternDescription(task)
        });
        
        return newTask.save();
      });
      
      await Promise.all(taskPromises);
      
      res.json(updatedTask);
    } else {
      res.status(404).json({ message: 'Recurring task not found' });
    }
  } catch (error) {
    res.status(400).json({ message: 'Invalid task ID', error: error.message });
  }
};

// Helper to get a default end date (3 months from start)
const getDefaultEndDate = (startDate) => {
  const endDate = new Date(startDate);
  endDate.setMonth(endDate.getMonth() + 3);
  return endDate;
};

module.exports = { 
  getRecurringTasks, 
  addRecurringTask, 
  deleteRecurringTask, 
  updateRecurringTask 
};
