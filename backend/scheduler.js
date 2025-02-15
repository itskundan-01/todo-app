const cron = require('node-cron');
const axios = require('axios');
const mongoose = require('mongoose');
require('dotenv').config();
const { noTaskQuotes, withTaskQuotes } = require('./quotes');

// Require your Task and User models as needed:
const Task = require('./models/Task');
const User = require('./models/User');

// OneSignal configuration
const ONE_SIGNAL_APP_ID = process.env.ONE_SIGNAL_APP_ID_ENV; // replace with your app ID
const ONE_SIGNAL_REST_API_KEY = process.env.ONE_SIGNAL_REST_API_KEY_ENV; // replace with your key

// Helper to send notification via OneSignal REST API
const sendNotification = async (title, message, userIds = []) => {
  try {
    const payload = {
      app_id: ONE_SIGNAL_APP_ID,
      include_external_user_ids: userIds, // expect users’ external ids to be set in OneSignal
      contents: { en: message },
      headings: { en: title }
    };
    await axios.post("https://onesignal.com/api/v1/notifications", payload, {
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Basic ${ONE_SIGNAL_REST_API_KEY}`
      }
    });
    console.log(`Notification sent: ${title}`);
  } catch (error) {
    console.error('Error sending notification:', error.response?.data || error.message);
  }
};

// Utility to pick a random quote from an array
const getRandomQuote = (quotesArray) => {
  return quotesArray[Math.floor(Math.random() * quotesArray.length)];
};

// ------------------------------
// Task-Based Notification (runs every minute)
cron.schedule('* * * * *', async () => {
  const now = new Date();

  // Find tasks that are not completed and are upcoming
  const tasks = await Task.find({ completed: false });
  for (const task of tasks) {
    const taskDateTime = new Date(`${task.date} ${task.time}`);
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
        // Get user info
        const user = await User.findById(task.userId);
        if (user) {
          const title = "Task Reminder";
          const message = `Your task "${task.text}" is due in ${threshold}.`;
          // Assuming you’ve set OneSignal external user ID as user._id.toString()
          await sendNotification(title, message, [user._id.toString()]);
        }
      }
    }
  }
});

// ------------------------------
// Daily Notifications at 8 AM and 9 AM

// 8 AM Notification
cron.schedule('0 8 * * *', async () => {
  const todayStr = new Date().toISOString().split('T')[0];
  // For each user, check if they have tasks today
  const users = await User.find();
  for (const user of users) {
    const tasksToday = await Task.find({ userId: user._id, date: todayStr });
    let title, message;
    if (tasksToday.length === 0) {
      title = `Good Morning, ${user.name || "User"}!`;
      message = `Rise and shine! It's a brand new day. ${getRandomQuote(noTaskQuotes)}`;
    } else {
      title = `Good Morning, ${user.name || "User"}!`;
      message = `You have tasks scheduled today. Get energized! ${getRandomQuote(withTaskQuotes)}`;
    }
    await sendNotification(title, message, [user._id.toString()]);
  }
});

// 9 AM Notification
cron.schedule('0 9 * * *', async () => {
  const todayStr = new Date().toISOString().split('T')[0];
  const users = await User.find();
  for (const user of users) {
    const tasksToday = await Task.find({ userId: user._id, date: todayStr });
    let title, message;
    if (tasksToday.length === 0) {
      title = `Hello, ${user.name || "User"}!`;
      message = `Your task list is empty today—seize the day! ${getRandomQuote(noTaskQuotes)}`;
    } else {
      title = `Hello, ${user.name || "User"}!`;
      message = `Keep up the great work with your tasks today. ${getRandomQuote(withTaskQuotes)}`;
    }
    await sendNotification(title, message, [user._id.toString()]);
  }
});

console.log('Notification scheduler started.');