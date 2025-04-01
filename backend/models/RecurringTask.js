const mongoose = require('mongoose');

const recurringTaskSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  priority: { type: String, required: true },
  recurrenceType: { type: String, required: true },
  startDate: { type: String, required: true },
  endDate: { type: String },
  startTime: { type: String },
  endTime: { type: String },
  hourlyInterval: { type: Number },
  dailyDays: [String],
  weeklyDays: [String],
  monthlyType: { type: String },
  monthlyDate: { type: Number },
  monthlyDay: { type: String },
  monthlyWeek: { type: String },
  createdAt: { type: Date, default: Date.now },
});

const RecurringTask = mongoose.model('RecurringTask', recurringTaskSchema);

module.exports = RecurringTask;
