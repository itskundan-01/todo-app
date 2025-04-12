# README.md

# To-Do List Application

A comprehensive task management application designed to help students and professionals organize their tasks, deadlines, and schedules efficiently. This full-stack application includes both regular task management and smart scheduling features for recurring tasks.

![To-Do List App Screenshot](https://todo-app.kundanprojects.space/screenshot.png)

## Features

### Task Management
- Add new tasks with text, priority, due date, and time
- Edit existing tasks with real-time updates
- Delete tasks with confirmation
- Toggle task completion status with visual indicators
- Search functionality to filter tasks by text, date, or day
- Visual countdown timers for upcoming deadlines
- Color-coded priority system (Compulsory, High, Medium, Low)

### Smart Scheduler
- Create recurring tasks with multiple recurrence patterns:
  - Hourly: Tasks that repeat at specified hourly intervals
  - Daily: Tasks that occur on selected days of the week
  - Weekly: Weekly recurring tasks on specific days
  - Monthly: Tasks that repeat monthly (by date or pattern)
- Preview generated task occurrences before creation
- Automatic task generation based on recurrence patterns
- Flexible date range selection for recurring tasks

### AI Task Assistant
- Natural language processing for task creation
- AI-powered suggestions for task scheduling and organization
- Intelligent date and time extraction from user input
- Conversational interface for task creation
- Support for both regular and recurring task generation

### User Experience
- Responsive design for desktop and mobile devices
- Intuitive navigation between task views
- Visual grouping of tasks by date (Past, Today, Future)
- Push notification support for task reminders
- Auto-scrolling to today's tasks
- Custom time picker with 12-hour format
- User authentication system
- Profile management

## Technologies Used

### Frontend
- React (with Hooks)
- CSS for styling (custom components)
- Vite for build tooling and development
- Axios for API requests
- OneSignal for push notifications

### Backend
- Node.js with Express
- MongoDB with Mongoose ODM
- JWT for authentication
- BCrypt for password hashing
- Node-cron for scheduling notifications

## Getting Started

### Prerequisites
- Node.js (v14 or later)
- MongoDB (local or Atlas)
- npm or yarn

### Installation

1. Clone the repository:
   ```
   git clone <repository-url>
   ```

2. Navigate to the project directory:
   ```
   cd todo-app
   ```

3. Install the dependencies:
   ```
   npm install
   ```

4. Configure environment variables:
   - Create a `.env` file in the root directory.
   - Add the following variables:
     ```
     MONGO_URI=<your-mongodb-uri>
     JWT_SECRET=<your-jwt-secret>
     ONESIGNAL_APP_ID=<your-onesignal-app-id>
     ```

5. Start the development server:
   ```
   npm run dev
   ```

6. Open your browser and go to `http://localhost:5000` to see the application in action.

## Usage

### Task Management
- Use the input field to add a new task.
- Select the priority, due date, and time for the task.
- Click "Add Task" to save the task.
- Use the search bar to filter tasks by text, date, or day.
- Click on the task to edit or delete it.
- View countdown timers for upcoming deadlines.

### Smart Scheduler
- Create recurring tasks with hourly, daily, weekly, or monthly patterns.
- Preview generated task occurrences before saving.
- Select a date range for recurring tasks.

## License

This project is open-source and available under the [MIT License](LICENSE).