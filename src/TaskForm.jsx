import React, { useState, useEffect } from 'react';
import TimePicker from './components/TimePicker';
import GeminiAssistant from './components/GeminiAssistant';
import './TaskForm.css';
import deleteIcon from './close.png';
import GeminiIcon from './components/GeminiIcon';
import AnimatedText from './components/AnimatedText';

function TaskForm({ addTask, closeModal }) {
  const initialState = {
    id: '',
    text: '',
    priority: '',
    date: '',
    time: '',
    completed: false,
    isRecurringInstance: false // Explicitly mark as non-recurring
  };

  const [task, setTask] = useState(initialState);
  const [formError, setFormError] = useState('');
  const [showAiAssistant, setShowAiAssistant] = useState(false);

  // Add this useEffect to reset form when opened
  useEffect(() => {
    setTask(initialState);
    setFormError('');
  }, []);

  const handleChange = (e) => {
    setTask({ ...task, [e.target.name]: e.target.value });
  };

  const validateForm = () => {
    if (!task.text.trim()) {
      setFormError('Task description is required');
      return false;
    }
    if (!task.priority) {
      setFormError('Priority is required');
      return false;
    }
    if (!task.date) {
      setFormError('Date is required');
      return false;
    }
    if (!task.time) {
      setFormError('Time is required');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    
    if (!validateForm()) {
      return;
    }

    try {
      const newTask = { 
        ...task, 
        isRecurringInstance: false // Ensure it's not marked as recurring
      };
      await addTask(newTask);
      setTask(initialState);

      // Show notification for successful task addition
      showNotification('Task added successfully!', 'success');
    } catch (error) {
      setFormError(error.message || 'Failed to add task');
    }
  };

  // Update handleClose to reset form state
  const handleClose = (e) => {
    e.preventDefault();
    if (task.text || task.priority || task.date || task.time) {
      if (window.confirm('Are you sure you want to close? All entered data will be lost.')) {
        setTask(initialState);
        setFormError('');
        closeModal();
      }
    } else {
      setTask(initialState);
      setFormError('');
      closeModal();
    }
  };

  // Helper function to get minimum date (today) for the date picker in IST
  const getMinDate = () => {
    const today = new Date();
    // Use consistent date formatting in IST timezone
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleAiTaskGenerated = async (aiTaskData) => {
    // TIMEZONE FIX: Force correct timezone handling for India (IST)
    const today = new Date();

    // Adjust for IST timezone (UTC+5:30)
    const istOffset = 5.5 * 60 * 60 * 1000; // 5 hours 30 minutes in milliseconds
    const istNow = new Date(today.getTime() + istOffset);

    const tomorrow = new Date(istNow);
    tomorrow.setDate(istNow.getDate() + 1);

    // Format dates in YYYY-MM-DD format for consistency USING LOCAL TIMEZONE (IST)
    const todayFormatted = formatDateIST(istNow);
    const tomorrowFormatted = formatDateIST(tomorrow);

    console.log(`Current timezone: ${Intl.DateTimeFormat().resolvedOptions().timeZone}`);
    console.log(`Today (IST): ${todayFormatted}, Tomorrow (IST): ${tomorrowFormatted}`);

    // Helper function to format date as YYYY-MM-DD in Indian timezone (IST)
    function formatDateIST(date) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }

    // Helper function to convert 24-hour time to 12-hour format with AM/PM
    function convertTo12HourFormat(time24) {
      const [hours, minutes] = time24.split(':');
      const hoursInt = parseInt(hours, 10);
      const period = hoursInt >= 12 ? 'PM' : 'AM';
      const hours12 = hoursInt % 12 || 12; // Convert 0 to 12 for midnight
      return `${hours12}:${minutes} ${period}`;
    }

    // FORCE IST TIMEZONE: Debug local time vs UTC time to confirm correct date
    console.log(`Date check - Local time: ${new Date().toLocaleString('en-IN', {timeZone: 'Asia/Kolkata'})}`);
    console.log(`Date check - ISO string: ${new Date().toISOString()}`);

    // We need to force check the raw AI response first before any processing
    const containsTomorrow = aiTaskData.text && aiTaskData.text.toLowerCase().includes("tomorrow");
    if (containsTomorrow) {
      console.log(`DETECTED "tomorrow" in task text: "${aiTaskData.text}" - Will force tomorrow's date: ${tomorrowFormatted}`);
      // Force override the date in original data to ensure it's carried through
      aiTaskData.date = tomorrowFormatted;
    }

    try {
      if (Array.isArray(aiTaskData)) {
        for (const taskData of aiTaskData) {
          // CRITICAL CHECK: Force override any task with "tomorrow" in text
          if (taskData.text && taskData.text.toLowerCase().includes("tomorrow")) {
            console.log(`OVERRIDE: Task "${taskData.text}" contains "tomorrow" - setting date to ${tomorrowFormatted}`);
            taskData.date = tomorrowFormatted;
          } else if (!taskData.date || new Date(taskData.date) < today) {
            // For tasks without a date or with past dates, set to today
            taskData.date = todayFormatted;
          }

          // Convert time to 12-hour format if provided
          if (taskData.time) {
            taskData.time = convertTo12HourFormat(taskData.time);
          }

          // Log final date and time that will be used
          console.log(`Creating task "${taskData.text}" with FINAL DATE: ${taskData.date} and FINAL TIME: ${taskData.time}`);

          // Create the task with the final date and time
          await addTask({
            text: taskData.text || '',
            priority: taskData.priority || 'medium',
            date: taskData.date,
            time: taskData.time || '12:00 PM',
            completed: false,
            isRecurringInstance: false
          });
        }

        // Show notification for successful recurring task addition
        showNotification('Recurring tasks added successfully!', 'success');

        // Close modal on success
        closeModal();
        setShowAiAssistant(false);
      } else {
        // SINGLE TASK: Final force override for "tomorrow" mentions
        if (aiTaskData.text && aiTaskData.text.toLowerCase().includes("tomorrow")) {
          console.log(`FINAL OVERRIDE: "${aiTaskData.text}" mentions tomorrow - forcing date to ${tomorrowFormatted} (was ${aiTaskData.date})`);
          aiTaskData.date = tomorrowFormatted;
        } else if (!aiTaskData.date || new Date(aiTaskData.date) < today) {
          // For tasks without a date or with past dates, set to today
          aiTaskData.date = todayFormatted;
        }

        // Convert time to 12-hour format if provided
        if (aiTaskData.time) {
          aiTaskData.time = convertTo12HourFormat(aiTaskData.time);
        }

        console.log(`Creating single task "${aiTaskData.text}" with FINAL DATE: ${aiTaskData.date} and FINAL TIME: ${aiTaskData.time}`);

        // Create the task with the properly set date and time
        await addTask({
          text: aiTaskData.text || '',
          priority: aiTaskData.priority || 'medium',
          date: aiTaskData.date,
          time: aiTaskData.time || '12:00 PM',
          completed: false,
          isRecurringInstance: false
        });

        // Show notification for successful single task addition
        showNotification('Task added successfully!', 'success');

        // Reset form and close modal
        setTask(initialState);
        closeModal();
        setShowAiAssistant(false);
      }
    } catch (error) {
      setFormError(error.message || 'Failed to add task');
    }
  };

  // Add this array inside the component
  const aiPrompts = [
    "Try AI for quick task creation",
    "Let AI help with your tasks",
    "Create tasks with natural language",
    "Type description, get a task!",
    "AI can understand your schedule"
  ];

  return (
    <div className={showAiAssistant ? "task-form-container ai-mode" : "task-form-container"}>
      <h2 className="add-task-title">Add New Task</h2>
      <button 
        className="close-button" 
        id='close-btn' 
        onClick={handleClose}
        type="button"
      >
        <img src={deleteIcon} alt="Close" />
      </button>

      <button 
        type="button"
        className="ai-assistant-toggle form-align-right"
        onClick={() => setShowAiAssistant(!showAiAssistant)}
      >
        {showAiAssistant ? (
          <>
            <span className="gemini-icon-container">
              <img src="/gemini_icon.png" alt="Gemini" className="gemini-icon-image" />
            </span>
            <span>Switch to Form</span>
          </>
        ) : (
          <>
            <span className="gemini-icon-container">
              <img src="/gemini_icon.png" alt="Gemini" className="gemini-icon-image" />
            </span>
            <AnimatedText messages={aiPrompts} />
          </>
        )}
      </button>

      {showAiAssistant ? (
        <GeminiAssistant
          taskType="regular" 
          onTaskGenerated={handleAiTaskGenerated} 
        />
      ) : (
        <form className="task-form" onSubmit={handleSubmit}>
          <div className="task-form-header">Add New Task</div>
          
          {formError && (
            <div className="form-error" style={{
              color: 'red',
              marginBottom: '10px',
              textAlign: 'center'
            }}>
              {formError}
            </div>
          )}
          
          <div>
            <input
              type="text"
              name="text"
              value={task.text}
              onChange={handleChange}
              placeholder="Add task..."
              maxLength={100}
              required
            />
          </div>
          <div>
            <select name="priority" value={task.priority} onChange={handleChange} required>
              <option value="" disabled>Priority</option>
              <option className='red' value="compulsory">Compulsory</option>
              <option className='orange' value="high">High</option>
              <option className='yellow' value="medium">Medium</option>
              <option className='green' value="low">Low</option>
            </select>
          </div>
          <div className="date-picker-container">
            <input
              type="date"
              name="date"
              value={task.date}
              onChange={handleChange}
              min={getMinDate()}
              onFocus={(e) => e.target.showPicker()}
              required
            />
          </div>
          <div>
            <TimePicker time={task.time} setTime={(time) => setTask({ ...task, time })} />
          </div>
          <button type="submit">Add Task</button>
        </form>
      )}
    </div>
  );
}

export default TaskForm;