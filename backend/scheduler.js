"use strict";

const cron = require('node-cron');
const axios = require('axios');
const mongoose = require('mongoose');
require('dotenv').config();
const { noTaskQuotes, withTaskQuotes } = require('./quotes');
const Task = require('./models/Task');
const User = require('./models/User');

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
  const dateTimeStr = `${dateStr}T${hoursStr}:${minutesStr}:00`;
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
    const response = await axios.post("https://onesignal.com/api/v1/notifications", payload, {
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Basic ${process.env.ONE_SIGNAL_REST_API_KEY_ENV}`
      }
    });
    console.log(`Notification sent: ${title}`);
    console.log('OneSignal API response:', response.data);
  } catch (error) {
    console.error('Error sending notification:', error.response?.data || error.message);
  }
};

// Utility function to pick a random quote from an array (if needed)
const getRandomQuote = (quotesArray) => {
  return quotesArray[Math.floor(Math.random() * quotesArray.length)];
};

// Task-Based Notification (runs every minute)
cron.schedule('* * * * *', async () => {
  const now = new Date();
  const tasks = await Task.find({ completed: false });

  for (const task of tasks) {
    const taskDateTime = parseTaskDateTime(task.date, task.time);
    const diff = taskDateTime - now;

    if (diff > 0) {
      const hoursLeft = diff / (1000 * 60 * 60);
      const minutesLeft = diff / (1000 * 60);
      let threshold = "";

      if (hoursLeft <= 8 && hoursLeft > 2) {
        threshold = "8 hours";
      } else if (hoursLeft <= 2 && minutesLeft > 30) {
        threshold = "2 hours";
      } else if (hoursLeft <= 2 && minutesLeft <= 30) {
        threshold = "30 minutes";
      }

      if (threshold) {
        // Ensure notificationsSent field exists (assume Task schema has notificationsSent: { type: [String], default: [] } )
        const notificationsSent = task.notificationsSent || [];

        // Only send if this threshold hasn't been notified before
        if (!notificationsSent.includes(threshold)) {
          const user = await User.findById(task.userId);
          if (user) {
            const title = "Task Reminder";
            const message = `Your task "${task.text}" is due in ${threshold}.`;
            console.log(`Sending notification to user ${user._id}: ${message}`);
            await sendNotification(title, message, [user._id.toString()]);
            
            // Mark threshold as sent and update task
            notificationsSent.push(threshold);
            task.notificationsSent = notificationsSent;
            await task.save();
          }
        }
      }
    }
  }
});

// Daily Notifications at 8 AM
cron.schedule('0 8 * * *', async () => {
  const users = await User.find();
  const todayStr = new Date().toISOString().split('T')[0];
  for (const user of users) {
    const tasksToday = await Task.find({ userId: user._id, date: todayStr });
    let title, message;
    if (tasksToday.length === 0) {
      title = `Hello, ${user.name || "User"}!`;
      message = `Your task list is empty today—seize the day!`;
    } else {
      title = `Hello, ${user.name || "User"}!`;
      message = `Keep up the great work with your tasks today.`;
    }
    await sendNotification(title, message, [user._id.toString()]);
  }
});

// Daily Notifications at 9 AM
cron.schedule('0 9 * * *', async () => {
  const users = await User.find();
  const todayStr = new Date().toISOString().split('T')[0];
  for (const user of users) {
    const tasksToday = await Task.find({ userId: user._id, date: todayStr });
    let title, message;
    if (tasksToday.length === 0) {
      title = `Hello, ${user.name || "User"}!`;
      message = `Your task list is empty today—seize the day!`;
    } else {
      title = `Hello, ${user.name || "User"}!`;
      message = `Keep up the great work with your tasks today.`;
    }
    await sendNotification(title, message, [user._id.toString()]);
  }
});

console.log('Notification scheduler started.');