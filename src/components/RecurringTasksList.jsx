import React from 'react';
import './RecurringTasksList.css';

function RecurringTasksList({ tasks, deleteTask }) {
  // Helper function to format recurrence pattern for display
  const formatRecurrencePattern = (task) => {
    switch(task.recurrenceType) {
      case 'hourly':
        return `Every ${task.hourlyInterval} hour(s) from ${task.startTime || 'start'} to ${task.endTime || 'end'}`;
      case 'daily':
        return task.dailyDays.length === 7 
          ? 'Every day' 
          : `Every ${task.dailyDays.join(', ')}`;
      case 'weekly':
        return `Weekly on ${task.weeklyDays.join(', ')}`;
      case 'monthly':
        return task.monthlyType === 'dayOfMonth'
          ? `Monthly on day ${task.monthlyDate}`
          : `Monthly on the ${task.monthlyWeek} ${task.monthlyDay}`;
      default:
        return 'Custom schedule';
    }
  };

  // Get style class based on priority
  const getPriorityClass = (priority) => {
    switch(priority.toLowerCase()) {
      case 'compulsory': return 'priority-compulsory';
      case 'high': return 'priority-high';
      case 'medium': return 'priority-medium';
      case 'low': return 'priority-low';
      default: return '';
    }
  };

  if (!tasks || tasks.length === 0) {
    return (
      <div className="empty-recurring-tasks">
        <h3>No recurring tasks yet</h3>
        <p>Create a recurring task using the form above to get started.</p>
      </div>
    );
  }

  return (
    <div className="recurring-tasks-list">
      <h2>Your Smart Scheduler Tasks</h2>
      <div className="recurring-tasks-table">
        <table>
          <thead>
            <tr>
              <th>Title</th>
              <th>Priority</th>
              <th>Schedule</th>
              <th>Date Range</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map(task => (
              <tr key={task._id} className={getPriorityClass(task.priority)}>
                <td className="task-title">{task.title}</td>
                <td className="task-priority">
                  <span className={`priority-badge ${getPriorityClass(task.priority)}`}>
                    {task.priority}
                  </span>
                </td>
                <td className="task-pattern">{formatRecurrencePattern(task)}</td>
                <td className="task-dates">
                  {task.startDate} {task.endDate ? `to ${task.endDate}` : ''}
                </td>
                <td className="task-actions">
                  <button 
                    className="delete-btn" 
                    onClick={() => deleteTask(task._id)}
                    aria-label="Delete task"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default RecurringTasksList;
