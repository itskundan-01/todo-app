"use strict";
process.env.TZ = 'Asia/Kolkata'; // Force Node to use IST across the board

const cron = require('node-cron');
const axios = require('axios');
const mongoose = require('mongoose');
require('dotenv').config();
const { noTaskQuotes, withTaskQuotes } = require('./quotes');
const Task = require('./models/Task');
const User = require('./models/User');

// Helper function to get a random item from an array
const getRandomQuote = (quotesArray) => {
  return quotesArray[Math.floor(Math.random() * quotesArray.length)];
};

// Helper function to parse date and time (assumes time is in "HH:MM AM/PM" format)
const parseTaskDateTime = (dateStr, timeStr) => {
  const [timePart, meridiem] = timeStr.split(' ');
  let [hours, minutes] = timePart.split(':').map(Number);
  if (meridiem.toUpperCase() === 'PM' && hours !== 12) {
    hours += 12;
  }
  if (meridiem.toUpperCase() === 'AM' && hours === 12) {
    hours = 0;
  }
  const hoursStr = hours.toString().padStart(2, '0');
  const minutesStr = minutes.toString().padStart(2, '0');
  // Create an ISO date string with IST offset (+05:30)
  // If a user selects 2025-02-17 and 11:40 PM, the resulting string will be:
  // "2025-02-17T23:40:00+05:30", which properly represents IST.
  const dateTimeStr = `${dateStr}T${hoursStr}:${minutesStr}:00+05:30`;
  return new Date(dateTimeStr);
};

// Helper function to send notifications via OneSignal REST API
const sendNotification = async (title, message, userIds = []) => {
  try {
    const payload = {
      app_id: process.env.ONE_SIGNAL_APP_ID_ENV,
      include_external_user_ids: userIds,
      contents: { en: message },
      headings: { en: title }
    };
    const response = await axios.post(
      "https://onesignal.com/api/v1/notifications",
      payload,
      {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Basic ${process.env.ONE_SIGNAL_REST_API_KEY_ENV}`
        }
      }
    );
    console.log(`Notification sent: ${title}`);
  } catch (error) {
    console.error('Error sending notification:', error.response?.data || error.message);
  }
};

// TASK-BASED NOTIFICATIONS (runs every minute)
// Only consider tasks that are not completed and are due today (local date).
cron.schedule('* * * * *', async () => {
  const now = new Date();
  const todayStr = now.toLocaleDateString('en-CA');
  console.log(`Cron Job Running at ${now.toLocaleString()}, checking tasks for: ${todayStr}`);
  
  // Separate regular tasks from recurring tasks
  const regularTasks = await Task.find({ completed: false, date: todayStr, isRecurringInstance: { $ne: true } });
  const recurringTasks = await Task.find({ completed: false, date: todayStr, isRecurringInstance: true });
  
  console.log(`Found ${regularTasks.length} regular tasks and ${recurringTasks.length} recurring tasks for today.`);
  
  // Define thresholds for regular tasks (deadlines)
  const regularThresholds = [
    { value: 8 * 60 * 60 * 1000, label: "8 hours" },
    { value: 2 * 60 * 60 * 1000, label: "2 hours" },
    { value: 30 * 60 * 1000, label: "30 minutes" }
  ];
  
  // Define thresholds for recurring tasks (start times)
  const recurringThresholds = [
    { value: 30 * 60 * 1000, label: "30 minutes" },
    { value: 5 * 60 * 1000, label: "5 minutes" }
  ];

  // Process regular tasks (deadlines)
  for (const task of regularTasks) {
    const deadline = parseTaskDateTime(task.date, task.time);
    
    // Skip tasks that are overdue
    if (now > deadline) {
      continue;
    }
    
    // Only log tasks that will receive notifications within 1 hour
    const timeUntilDeadline = deadline - now;
    const isWithinOneHour = timeUntilDeadline <= 60 * 60 * 1000; // 1 hour in milliseconds
    
    for (const thr of regularThresholds) {
      const targetTime = new Date(deadline.getTime() - thr.value);
      const gracePeriod = 2 * 60 * 1000; // 2 minutes by default
      const diffFromTarget = now - targetTime;
      
      if (now >= targetTime && diffFromTarget < gracePeriod) {
        // Ensure notificationsSent is defined
        if (!task.notificationsSent) task.notificationsSent = [];
        if (!task.notificationsSent.includes(thr.label)) {
          const user = await User.findById(task.userId);
          if (user) {
            // Enhanced notification for regular tasks
            const title = `⏰ Time to Focus!`;
            const message = `"${task.text}" is due in ${thr.label}. You can do this!`;
            
            if (isWithinOneHour) {
              console.log(`Sending notification for Task "${task.text}" due in ${thr.label}`);
            }
            
            await sendNotification(title, message, [user._id.toString()]);
            task.notificationsSent.push(thr.label);
            await task.save();
          }
        }
      }
    }
  }

  // Process recurring tasks (start times) - similar cleanup
  for (const task of recurringTasks) {
    const deadline = parseTaskDateTime(task.date, task.time);
    
    // Skip tasks that are overdue
    if (now > deadline) {
      continue;
    }
    
    // Only log tasks that will receive notifications within 1 hour
    const timeUntilDeadline = deadline - now;
    const isWithinOneHour = timeUntilDeadline <= 60 * 60 * 1000; // 1 hour in milliseconds
    
    for (const thr of recurringThresholds) {
      const targetTime = new Date(deadline.getTime() - thr.value);
      const gracePeriod = 2 * 60 * 1000; // 2 minutes by default
      const diffFromTarget = now - targetTime;
      
      if (now >= targetTime && diffFromTarget < gracePeriod) {
        // Ensure notificationsSent is defined
        if (!task.notificationsSent) task.notificationsSent = [];
        if (!task.notificationsSent.includes(thr.label)) {
          const user = await User.findById(task.userId);
          if (user) {
            // Enhanced notification for recurring tasks
            const title = `🔄 Recurring Activity`;
            const message = `"${task.text}" starts in ${thr.label}.`;
            
            if (isWithinOneHour) {
              console.log(`Sending notification for Recurring Task "${task.text}" starting in ${thr.label}`);
            }
            
            await sendNotification(title, message, [user._id.toString()]);
            task.notificationsSent.push(thr.label);
            await task.save();
          }
        }
      }
    }
  }
});

// DAILY NOTIFICATIONS AT 8 AM
cron.schedule('0 8 * * *', async () => {
  const now = new Date();
  const todayStr = now.toLocaleDateString('en-CA');
  console.log(`8 AM Daily Notification at ${now.toLocaleString()}, todayStr: ${todayStr}`);
  
  const users = await User.find();
  for (const user of users) {
    const tasksToday = await Task.find({ userId: user._id, date: todayStr, completed: false });
    let title, message;
    if (tasksToday.length === 0) {
      title = `🌞 Good Morning, ${user.name || "Friend"}!`;
      message = getRandomQuote(noTaskQuotes);
    } else {
      title = `📋 Your Day Ahead, ${user.name || "Friend"}!`;
      message = getRandomQuote(withTaskQuotes);
    }
    await sendNotification(title, message, [user._id.toString()]);
  }
});

// DAILY NOTIFICATIONS AT 9 AM
cron.schedule('0 9 * * *', async () => {
  const now = new Date();
  const todayStr = now.toLocaleDateString('en-CA');
  console.log(`9 AM Daily Notification at ${now.toLocaleString()}, todayStr: ${todayStr}`);
  
  const users = await User.find();
  for (const user of users) {
    const tasksToday = await Task.find({ userId: user._id, date: todayStr, completed: false });
    let title, message;
    if (tasksToday.length === 0) {
      title = `☕ Having a Good Day, ${user.name || "Friend"}?`;
      message = getRandomQuote(noTaskQuotes);
    } else {
      title = `💪 Keep the Momentum Going, ${user.name || "Friend"}!`;
      message = getRandomQuote(withTaskQuotes);
    }
    await sendNotification(title, message, [user._id.toString()]);
  }
});

console.log('Notification scheduler started.');