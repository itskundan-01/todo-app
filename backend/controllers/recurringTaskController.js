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
      title, priority, recurrenceType, startDate, endDate, time, 
      hourlyInterval, startTime, endTime, 
      dailyDays, weeklyDays, monthlyType, monthlyDate, monthlyWeek, monthlyDay,
      userId, recurrenceDetails
    } = req.body;

    // Always set priority to 'low' regardless of what was sent
    const taskData = {
      title, 
      priority: 'low', // Force priority to low
      recurrenceType, 
      startDate, 
      endDate, 
      time,
      hourlyInterval, 
      startTime, 
      endTime,
      monthlyType, 
      monthlyDate, 
      monthlyWeek, 
      monthlyDay,
      userId
    };

    console.log('Creating recurring task with data:', JSON.stringify({
      title, recurrenceType, 
      weeklyDays: weeklyDays || (recurrenceDetails?.days),
      recurrenceDetails
    }));

    // Ensure default arrays for different recurrence types if they're missing
    // Handle recurrence details passed from AI or standardize format
    if (recurrenceDetails) {
      // Extract recurrence details from AI response
      if (recurrenceType === 'daily' && recurrenceDetails.days) {
        taskData.dailyDays = Array.isArray(recurrenceDetails.days) ? recurrenceDetails.days : [recurrenceDetails.days];
      } else if (recurrenceType === 'weekly' && recurrenceDetails.days) {
        taskData.weeklyDays = Array.isArray(recurrenceDetails.days) ? recurrenceDetails.days : [recurrenceDetails.days];
      }
    } else {
      // Use the directly provided arrays if any
      if (dailyDays) taskData.dailyDays = Array.isArray(dailyDays) ? dailyDays : [dailyDays];
      if (weeklyDays) taskData.weeklyDays = Array.isArray(weeklyDays) ? weeklyDays : [weeklyDays];
    }
    
    // Set defaults if still missing
    if (recurrenceType === 'daily' && (!taskData.dailyDays || !Array.isArray(taskData.dailyDays) || taskData.dailyDays.length === 0)) {
      taskData.dailyDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    }
    
    if (recurrenceType === 'weekly' && (!taskData.weeklyDays || !Array.isArray(taskData.weeklyDays) || taskData.weeklyDays.length === 0)) {
      // Extract days from title or description if possible
      const daysInWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      const titleLower = title.toLowerCase();
      
      const extractDaysFromText = (text) => {
        return daysInWeek.filter(day => 
          text.includes(day.toLowerCase()) ||
          text.includes(day.toLowerCase().substring(0, 3)) // Check for abbreviations like "mon", "tue"
        );
      };
      
      taskData.weeklyDays = extractDaysFromText(titleLower);
      
      // Also check description if available
      if (req.body.description && taskData.weeklyDays.length === 0) {
        taskData.weeklyDays = extractDaysFromText(req.body.description.toLowerCase());
      }
      
      // If still no days found, default to today
      if (!taskData.weeklyDays.length) {
        const today = new Date();
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        taskData.weeklyDays = [dayNames[today.getDay()]];
      }
    }
    
    console.log('Final weeklyDays:', taskData.weeklyDays);

    const recurringTask = new RecurringTask(taskData);
    const createdRecurringTask = await recurringTask.save();
    
    // Generate individual task instances
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : getDefaultEndDate(start);
    
    // Log date range for debugging
    console.log(`Generating task instances from ${start.toISOString()} to ${end.toISOString()}`);
    console.log(`Days specified for ${recurrenceType}: ${recurrenceType === 'weekly' ? taskData.weeklyDays : (taskData.dailyDays || 'none')}`);
    
    let dates = [];
    
    switch (recurrenceType) {
      case 'hourly':
        dates = generateHourlyDates(start, end, startTime, endTime, hourlyInterval);
        break;
      case 'daily':
        dates = generateDailyDates(start, end, taskData.dailyDays);
        break;
      case 'weekly':
        dates = generateWeeklyDates(start, end, taskData.weeklyDays);
        break;
      case 'monthly':
        dates = generateMonthlyDates(start, end, monthlyType, monthlyDate, monthlyDay, monthlyWeek);
        break;
    }
    
    console.log(`Generated ${dates.length} date instances for the recurring task`);
    
    // Create individual task instances
    const taskPromises = dates.map(date => {
      const task = new Task({
        userId,
        text: title,
        priority,
        date: formatDate(date),
        time: time || startTime || '10:00 PM',
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
