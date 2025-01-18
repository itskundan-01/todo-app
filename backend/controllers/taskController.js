const Task = require('../models/Task');
const mongoose = require('mongoose');

const getTasks = async (req, res) => {
  const tasks = await Task.find({ userId: req.params.userId });
  res.json(tasks);
};

const addTask = async (req, res) => {
  const { userId, text, priority, date, time } = req.body;

  const task = new Task({ userId, text, priority, date, time });

  const createdTask = await task.save();
  res.status(201).json(createdTask);
};

const deleteTask = async (req, res) => {
  try {
    const taskId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(taskId)) {
      return res.status(400).json({ message: 'Invalid task ID' });
    }

    const task = await Task.findById(taskId);

    if (task) {
      await Task.deleteOne({ _id: taskId });
      res.json({ message: 'Task removed' });
    } else {
      res.status(404).json({ message: 'Task not found' });
    }
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(400).json({ message: 'Invalid task ID' });
  }
};

const updateTask = async (req, res) => {
  try {
    const { text, priority, date, time, completed } = req.body;

    const task = await Task.findById(req.params.id);

    if (task) {
      task.text = text;
      task.priority = priority;
      task.date = date;
      task.time = time;
      task.completed = completed;

      const updatedTask = await task.save();
      res.json(updatedTask);
    } else {
      res.status(404).json({ message: 'Task not found' });
    }
  } catch (error) {
    res.status(400).json({ message: 'Invalid task ID' });
  }
};

module.exports = { getTasks, addTask, deleteTask, updateTask };