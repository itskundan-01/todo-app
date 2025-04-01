const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const userRoutes = require('./routes/userRoutes');
const taskRoutes = require('./routes/taskRoutes');
const recurringTaskRoutes = require('./routes/recurringTaskRoutes');

// Debugging: Verify if MONGO_URI is loaded
console.log('MONGO_URI:', process.env.MONGO_URI ? 'Found' : 'Not Found');
console.log('PUBLIC_URL:', process.env.PUBLIC_URL);

const app = express();
const PORT = process.env.PORT || 5000;

// Configure CORS to allow requests from the frontend
const corsOptions = {
  origin: process.env.PUBLIC_URL || 'http://localhost:5173',
  optionsSuccessStatus: 200,
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());

// Simplified request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB connected');
    // Import/init scheduler only once DB connected
    require('./scheduler');
  })
  .catch(err => console.log('MongoDB connection error:', err));

app.get('/', (req, res) => {
  res.send('Welcome to the To-Do List API');
});

// API routes
app.use('/api/users', userRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/recurring-tasks', recurringTaskRoutes);

// API status endpoint
app.get('/api/status', (req, res) => {
  res.json({ 
    status: 'API is running'
  });
});

// Error handler middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ message: 'Server error', error: err.message });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port: ${PORT}`);
});