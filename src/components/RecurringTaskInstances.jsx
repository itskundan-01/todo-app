import React, { useRef, useEffect, useState } from 'react';
import TaskList from '../TaskList';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import './RecurringTaskInstances.css';

function RecurringTaskInstances({ recurringTasks, deleteTask, shouldScrollToToday }) {
  const todayRef = useRef(null);
  const [taskInstances, setTaskInstances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Track when the component receives navigation signal
  const [scrollTriggered, setScrollTriggered] = useState(false);
  
  // Update scroll state when parent signals to scroll
  useEffect(() => {
    if (shouldScrollToToday) {
      setScrollTriggered(true);
    }
  }, [shouldScrollToToday]);
  
  // Fetch recurring task instances when component mounts or recurringTasks changes
  useEffect(() => {
    const fetchTaskInstances = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const user = JSON.parse(localStorage.getItem('user'));
        if (!user) {
          throw new Error('User not authenticated');
        }
        
        // Fetch all tasks
        const response = await axios.get(`${API_BASE_URL}/api/tasks/${user._id}`);
        const allTasks = response.data;
        
        // Filter ONLY for tasks that are recurring instances (Smart Scheduler tasks)
        // This ensures we only show recurring tasks in the Smart Scheduler section
        const instances = allTasks.filter(task => task.isRecurringInstance);
        setTaskInstances(instances);
      } catch (err) {
        console.error('Error fetching recurring task instances:', err);
        setError('Failed to load recurring tasks. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchTaskInstances();
  }, [recurringTasks]);
  
  // Scroll to today's tasks when component loads data, or when navigation occurs
  useEffect(() => {
    if (!loading && todayRef.current && (scrollTriggered || taskInstances.length > 0)) {
      // Small delay to ensure the DOM has updated
      setTimeout(() => {
        todayRef.current.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
        setScrollTriggered(false);
      }, 100);
    }
  }, [loading, taskInstances, scrollTriggered]);
  
  // Group tasks by date relative to today
  const groupTasksByDate = (tasks) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const pastTasks = {};
    const todayTasks = [];
    const futureTasks = {};
    
    tasks.forEach(task => {
      const taskDate = new Date(task.date);
      taskDate.setHours(0, 0, 0, 0);
      
      if (taskDate.getTime() === today.getTime()) {
        todayTasks.push(task);
      } else if (taskDate < today) {
        if (!pastTasks[task.date]) pastTasks[task.date] = [];
        pastTasks[task.date].push(task);
      } else {
        if (!futureTasks[task.date]) futureTasks[task.date] = [];
        futureTasks[task.date].push(task);
      }
    });
    
    return { pastTasks, todayTasks, futureTasks };
  };
  
  // Handle deletion of a recurring task instance
  const handleDeleteTask = (taskId) => {
    const task = taskInstances.find(t => t._id === taskId);
    
    if (task && task.recurringTaskId) {
      // If it's part of a recurring pattern, confirm if user wants to delete all occurrences
      if (window.confirm('Do you want to delete all occurrences of this recurring task? Click OK to delete all, or Cancel to delete just this instance.')) {
        deleteTask(task.recurringTaskId);
      } else {
        // Delete just this instance
        axios.delete(`${API_BASE_URL}/api/tasks/${taskId}`)
          .then(() => {
            setTaskInstances(taskInstances.filter(t => t._id !== taskId));
          })
          .catch(err => {
            console.error('Error deleting task instance:', err);
            alert('Failed to delete this task instance.');
          });
      }
    } else {
      // Regular deletion for non-recurring tasks
      axios.delete(`${API_BASE_URL}/api/tasks/${taskId}`)
        .then(() => {
          setTaskInstances(taskInstances.filter(t => t._id !== taskId));
        })
        .catch(err => {
          console.error('Error deleting task:', err);
          alert('Failed to delete this task.');
        });
    }
  };
  
  // Toggle task completion
  const toggleTaskComplete = async (taskId) => {
    try {
      const task = taskInstances.find(t => t._id === taskId);
      if (task) {
        const updatedTask = { ...task, completed: !task.completed };
        const { data } = await axios.put(`${API_BASE_URL}/api/tasks/${taskId}`, updatedTask);
        
        // Update the task in our local state
        setTaskInstances(taskInstances.map(t => t._id === taskId ? data : t));
      }
    } catch (err) {
      console.error('Error toggling task completion:', err);
      alert('Failed to update task completion status.');
    }
  };
  
  // Handle task editing
  const handleEditTask = async (taskId, updatedTask) => {
    try {
      const { data } = await axios.put(`${API_BASE_URL}/api/tasks/${taskId}`, updatedTask);
      setTaskInstances(taskInstances.map(t => t._id === taskId ? data : t));
    } catch (err) {
      console.error('Error editing task:', err);
    }
  };
  
  if (loading) {
    return <div className="loading">Loading recurring tasks...</div>;
  }
  
  if (error) {
    return <div className="error">{error}</div>;
  }
  
  if (taskInstances.length === 0) {
    return (
      <div className="task-group">
        <div className="empty-state">
          <h3>No recurring tasks yet!</h3>
          <p>Create recurring tasks to streamline your schedule.</p>
          <p>Click the + button to get started.</p>
        </div>
      </div>
    );
  }
  
  const { pastTasks, todayTasks, futureTasks } = groupTasksByDate(taskInstances);
  const today = new Date();
  
  return (
    <div className="tasks-container recurring-task-instances">
      {/* Past tasks */}
      {Object.keys(pastTasks).length > 0 && Object.keys(pastTasks)
        .sort((a, b) => new Date(a) - new Date(b))
        .map(date => (
          <div key={`past-${date}`} className="task-group">
            <h2 className="task-group-date">
              {new Date(date).toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric'
              })}
            </h2>
            <TaskList
              tasks={pastTasks[date]}
              deleteTask={handleDeleteTask}
              toggleComplete={toggleTaskComplete}
              editTask={handleEditTask}
            />
          </div>
        ))}
      
      {/* Today's tasks */}
      <div className="task-group today" ref={todayRef}>
        <h2 className="task-group-date">
          Today - {today.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric'
          })}
        </h2>
        {todayTasks.length > 0 ? (
          <TaskList
            tasks={todayTasks}
            deleteTask={handleDeleteTask}
            toggleComplete={toggleTaskComplete}
            editTask={handleEditTask}
          />
        ) : (
          <div className="empty-state">
            <h3>No recurring tasks for today!</h3>
            <p>Your schedule is clear for today.</p>
          </div>
        )}
      </div>
      
      {/* Future tasks */}
      {Object.keys(futureTasks).length > 0 && Object.keys(futureTasks)
        .sort((a, b) => new Date(a) - new Date(b))
        .map(date => (
          <div key={`future-${date}`} className="task-group">
            <h2 className="task-group-date">
              {new Date(date).toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric'
              })}
            </h2>
            <TaskList
              tasks={futureTasks[date]}
              deleteTask={handleDeleteTask}
              toggleComplete={toggleTaskComplete}
              editTask={handleEditTask}
            />
          </div>
        ))}
    </div>
  );
}

export default RecurringTaskInstances;
