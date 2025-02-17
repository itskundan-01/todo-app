"use strict";
process.env.TZ = 'Asia/Kolkata'; // Force Node to use IST across the board

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
    console.log('OneSignal API response:', response.data);
  } catch (error) {
    console.error('Error sending notification:', error.response?.data || error.message);
  }
};

// TASK-BASED NOTIFICATIONS (runs every minute)
// Only consider tasks that are not completed and are due today (local date).
cron.schedule('* * * * *', async () => {
  const now = new Date();
  const todayStr = now.toLocaleDateString('en-CA');
  console.log(`Cron Job Running at ${now.toLocaleString()}, todayStr: ${todayStr}`);
  
  const tasks = await Task.find({ completed: false, date: todayStr });
  console.log(`Found ${tasks.length} tasks for today.`);
  
  // Define thresholds with their reminder intervals in milliseconds.
  const thresholds = [
    { value: 8 * 60 * 60 * 1000, label: "8 hours" },
    { value: 2 * 60 * 60 * 1000, label: "2 hours" },
    { value: 30 * 60 * 1000, label: "30 minutes" }
  ];

  // Process each task.
  for (const task of tasks) {
    const deadline = parseTaskDateTime(task.date, task.time);
    console.log(`Task [${task._id}] deadline: ${deadline.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })}`);
    
    // Log current time in IST
    console.log(`Current time: ${now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })}`);
    
    // Skip tasks that are overdue.
    if (now > deadline) {
      console.log(`Task [${task._id}] is overdue. Skipping notifications.`);
      continue;
    }
    
    for (const thr of thresholds) {
      const targetTime = new Date(deadline.getTime() - thr.value);
      const gracePeriod = 2 * 60 * 1000; // 2 minutes by default
      const diffFromTarget = now - targetTime;
      const diffMinutes = (diffFromTarget / 60000).toFixed(2);
      
      console.log(
        `Task [${task._id}]: Threshold "${thr.label}" targetTime: ${targetTime.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })}; ` +
        `Now-targetTime diff: ${diffMinutes} minutes`
      );
      
      if (now >= targetTime && diffFromTarget < gracePeriod) {
        // Ensure notificationsSent is defined
        if (!task.notificationsSent) task.notificationsSent = [];
        if (!task.notificationsSent.includes(thr.label)) {
          const user = await User.findById(task.userId);
          if (user) {
            const title = "Task Reminder";
            const message = `Your task "${task.text}" is due in ${thr.label}.`;
            console.log(`Sending notification for Task [${task._id}] to user ${user._id}: ${message}`);
            await sendNotification(title, message, [user._id.toString()]);
            task.notificationsSent.push(thr.label);
            await task.save();
          } else {
            console.error(`User not found for task ${task._id}`);
          }
        } else {
          console.log(`Task [${task._id}]: Notification for threshold "${thr.label}" already sent.`);
        }
      } else {
        console.log(
          `Task [${task._id}]: Not within target window for threshold "${thr.label}" (diff: ${diffMinutes} minutes, grace: ${(gracePeriod/60000).toFixed(2)} minutes).`
        );
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
  const now = new Date();
  const todayStr = now.toLocaleDateString('en-CA');
  console.log(`9 AM Daily Notification at ${now.toLocaleString()}, todayStr: ${todayStr}`);
  
  const users = await User.find();
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