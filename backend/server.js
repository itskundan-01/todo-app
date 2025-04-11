const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const userRoutes = require('./routes/userRoutes');
const taskRoutes = require('./routes/taskRoutes');
const recurringTaskRoutes = require('./routes/recurringTaskRoutes');
const adminRoutes = require('./routes/adminRoutes');
const aiRoutes = require('./routes/aiRoutes');

// Debugging: Verify if environment variables are loaded
console.log('MONGO_URI:', process.env.MONGO_URI ? 'Found' : 'Not Found');
console.log('PUBLIC_URL:', process.env.PUBLIC_URL);
console.log('EMAIL_HOST:', process.env.EMAIL_HOST ? 'Found' : 'Not Found');
console.log('EMAIL_USER:', process.env.EMAIL_USER ? 'Found' : 'Not Found');
console.log('EMAIL_PASSWORD:', process.env.EMAIL_PASSWORD ? 'Found' : 'Not Found');
console.log('GEMINI_API_KEY:', process.env.GEMINI_API_KEY ? 'Found' : 'Not Found');

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
app.use('/api/admin', adminRoutes);
app.use('/api/ai', aiRoutes);

// Debugging route to list all registered routes
app.get('/api/routes', (req, res) => {
  const routes = [];
  
  // Helper function to print routes
  const print = (path, layer) => {
    if (layer.route) {
      layer.route.stack.forEach(print.bind(null, path + layer.route.path));
    } else if (layer.name === 'router' && layer.handle.stack) {
      layer.handle.stack.forEach(print.bind(null, path + (layer.regexp ? layer.regexp.source.replace(/\\\//g, '/').replace(/\^\|\\\//, '/').replace(/\\\/.+$/, '') : '')));
    } else if (layer.method) {
      routes.push({ 
        method: layer.method.toUpperCase(), 
        path: path
      });
    }
  };

  app._router.stack.forEach(print.bind(null, ''));
  
  res.json({ routes });
});

// Testing route specifically for forgot password
app.get('/test-forgot-password', (req, res) => {
  res.json({ 
    message: "This is a test endpoint for forgot password",
    configuredRoutes: {
      forgotPasswordExists: typeof userRoutes?.stack?.find(r => 
        r.route?.path === '/forgot-password' && 
        r.route?.methods?.post) !== 'undefined'
    }
  });
});

// Debugging route to check if forgot-password endpoint is registered
app.get('/api/routes-debug', (req, res) => {
  // This will help you check if routes are correctly registered
  const routes = [];
  app._router.stack.forEach(middleware => {
    if (middleware.route) { 
      // routes registered directly on the app
      routes.push(`${Object.keys(middleware.route.methods)} ${middleware.route.path}`);
    } else if (middleware.name === 'router') { 
      // router middleware
      middleware.handle.stack.forEach(handler => {
        const route = handler.route;
        if (route) {
          route.path = route.path === '/' ? '' : route.path;
          routes.push(`${Object.keys(route.methods)} ${middleware.regexp} ${route.path}`);
        }
      });
    }
  });
  res.json(routes);
});

// Debugging route to check if forgot-password endpoint is registered
app.get('/api/check-routes', (req, res) => {
  // This will help you check if routes are correctly registered
  const routes = [];
  
  // Helper function to print routes
  const print = (path, layer) => {
    if (layer.route) {
      layer.route.stack.forEach(print.bind(null, path + layer.route.path));
    } else if (layer.name === 'router' && layer.handle.stack) {
      layer.handle.stack.forEach(print.bind(null, path + (layer.regexp ? layer.regexp.source.replace(/\\\//g, '/').replace(/\^\|\\\//, '/').replace(/\\\/.+$/, '') : '')));
    } else if (layer.method) {
      routes.push({ 
        method: layer.method.toUpperCase(), 
        path: path
      });
    }
  };

  app._router.stack.forEach(print.bind(null, ''));
  
  res.json({
    routesCount: routes.length,
    routes: routes,
    forgotPasswordEnabled: routes.some(r => 
      r.path.includes('/api/users/forgot-password') && r.method === 'POST'
    ),
    userRoutes: routes.filter(r => r.path.includes('/api/users'))
  });
});

// API status endpoint
app.get('/api/email-test', (req, res) => {
  res.json({ 
    status: 'Email configuration loaded',
    emailConfig: {
      host: process.env.EMAIL_HOST || 'Not set',
      port: process.env.EMAIL_PORT || 'Not set',
      user: process.env.EMAIL_USER ? 'Configured' : 'Not set',
      password: process.env.EMAIL_PASSWORD ? 'Configured' : 'Not set'
    }
  });
});

// API status endpoint
app.get('/api/status', (req, res) => {
  res.json({ 
    status: 'API is running',
    emailConfigured: !!process.env.EMAIL_PASSWORD
  });
});

// API status endpoint for environment variables
app.get('/api/env-test', (req, res) => {
  res.json({ 
    status: 'Environment variables check',
    envVars: {
      mongoUri: !!process.env.MONGO_URI,
      publicUrl: process.env.PUBLIC_URL,
      emailHost: !!process.env.EMAIL_HOST,
      emailUser: !!process.env.EMAIL_USER,
      emailPass: !!process.env.EMAIL_PASSWORD,
      geminiApiKey: !!process.env.GEMINI_API_KEY
    }
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