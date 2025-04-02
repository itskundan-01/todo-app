// filepath: /backend/models/Task.js
const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String, required: true },
  priority: { type: String, required: true },
  date: { type: String, required: true },
  time: { type: String, required: true },
  completed: { type: Boolean, default: false },
  notificationsSent: { type: [String], default: [] },
  // New fields for recurring tasks
  isRecurringInstance: { type: Boolean, default: false },
  recurringTaskId: { type: mongoose.Schema.Types.ObjectId, ref: 'RecurringTask' },
  recurrencePattern: { type: String }
});

const Task = mongoose.model('Task', taskSchema);

module.exports = Task;