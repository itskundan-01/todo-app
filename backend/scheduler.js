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
    console.log('OneSignal API response:', response.data);
  } catch (error) {
    console.error('Error sending notification:', error.response?.data || error.message);
  }
};

// TASK-BASED NOTIFICATIONS (runs every minute)
// Only consider tasks that are not completed and are due today.
cron.schedule('* * * * *', async () => {
  const now = new Date();
  // Use local date string in ISO format (YYYY-MM-DD) by using the 'en-CA' locale
  const todayStr = now.toLocaleDateString('en-CA');
  const tasks = await Task.find({ completed: false, date: todayStr });

  // Define thresholds with their reminder intervals in milliseconds.
  // The "targetTime" for the reminder is computed as deadline - threshold.
  const thresholds = [
    { value: 8 * 60 * 60 * 1000, label: "8 hours" },
    { value: 2 * 60 * 60 * 1000, label: "2 hours" },
    { value: 30 * 60 * 1000, label: "30 minutes" }
  ];

  // Process each task.
  for (const task of tasks) {
    const deadline = parseTaskDateTime(task.date, task.time);

    // For each threshold, compute its target time and check if now is within a grace period.
    for (const thr of thresholds) {
      const targetTime = new Date(deadline.getTime() - thr.value);
      // Set a grace period of 2 minutes to avoid repetitive notifications.
      const gracePeriod = 2 * 60 * 1000;

      // Check if current time is within the target window.
      if (now >= targetTime && (now - targetTime) < gracePeriod) {
        // Ensure task.notificationsSent exists as an array.
        if (!task.notificationsSent) {
          task.notificationsSent = [];
        }
        // Only send if notification for this threshold wasn’t already sent.
        if (!task.notificationsSent.includes(thr.label)) {
          const user = await User.findById(task.userId);
          if (user) {
            const title = "Task Reminder";
            const message = `Your task "${task.text}" is due in ${thr.label}.`;
            console.log(`Sending notification to user ${user._id}: ${message}`);
            await sendNotification(title, message, [user._id.toString()]);
            // Mark this threshold as notified.
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
  const users = await User.find();
  // Use local date string.
  const todayStr = new Date().toLocaleDateString('en-CA');

  for (const user of users) {
    const tasksToday = await Task.find({ userId: user._id, date: todayStr, completed: false });
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

// DAILY NOTIFICATIONS AT 9 AM
cron.schedule('0 9 * * *', async () => {
  const users = await User.find();
  const todayStr = new Date().toLocaleDateString('en-CA');

  for (const user of users) {
    const tasksToday = await Task.find({ userId: user._id, date: todayStr, completed: false });
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