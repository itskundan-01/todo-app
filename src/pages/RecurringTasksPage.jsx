import React, { useState, useEffect, useRef } from 'react';
import './RecurringTasksPage.css';
import TimePicker from '../components/TimePicker';
import RecurringTaskInstances from '../components/RecurringTaskInstances'; 
import SchedulerOptions from '../components/SchedulerOptions';
import TaskForm from '../TaskForm'; 
import axios from 'axios';
import { API_BASE_URL } from '../config';
import addIcon from '/add.png'; 
import AiTaskInput from '../components/AiTaskInput';
import GeminiAssistant from '../components/GeminiAssistant';
import GeminiIcon from '../components/GeminiIcon';
import AnimatedText from '../components/AnimatedText';

function RecurringTasksPage() {
  const [taskData, setTaskData] = useState({
    title: '',
    priority: 'low', // Set default priority to low
    recurrenceType: 'daily', 
    startDate: '',
    endDate: '',
    startTime: '',
    endTime: '',
    hourlyInterval: 1,
    dailyDays: [],
    weeklyDays: [],
    monthlyType: 'dayOfMonth', 
    monthlyDate: 1,
    monthlyDay: 'Monday',
    monthlyWeek: 'first',
  });

  const [showPreview, setShowPreview] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [recurringTasks, setRecurringTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showOptionsModal, setShowOptionsModal] = useState(false);
  const [showRecurringForm, setShowRecurringForm] = useState(false);
  const [showRegularForm, setShowRegularForm] = useState(false);
  const [showAiAssistant, setShowAiAssistant] = useState(false);

  const [shouldScrollToToday, setShouldScrollToToday] = useState(true);

  const modalContentRef = useRef(null);

  const aiPrompts = [
    "Let AI set up recurring tasks",
    "Schedule patterns with AI help",
    "Create smart routines easily",
    "AI understands your schedule",
    "Quick recurring setups with AI"
  ];

  useEffect(() => {
    fetchRecurringTasks();
  }, []);

  const fetchRecurringTasks = async () => {
    try {
      setIsLoading(true);
      setLoadError('');
      
      const user = JSON.parse(localStorage.getItem('user'));
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      const response = await axios.get(`${API_BASE_URL}/api/recurring-tasks/${user._id}`);
      setRecurringTasks(response.data);
    } catch (error) {
      console.error('Error fetching recurring tasks:', error);
      setLoadError('Failed to load your recurring tasks. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setShouldScrollToToday(true);
    
    const timer = setTimeout(() => {
      setShouldScrollToToday(false);
    }, 200);
    
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    function handleClickOutside(event) {
      if (isModalOpen && modalContentRef.current && 
          !modalContentRef.current.contains(event.target)) {
        if (event.target.classList.contains('scheduler-modal')) {
          closeModal();
        }
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isModalOpen]);

  useEffect(() => {
    const shouldOpenForm = localStorage.getItem('openRecurringForm');
    if (shouldOpenForm === 'true') {
      setIsModalOpen(true);
      setShowOptionsModal(false);
      setShowRecurringForm(true);
      localStorage.removeItem('openRecurringForm');
    }
  }, []);

  useEffect(() => {
    const handleKeyPress = (event) => {
      if (event.key === '+' || event.key === '=') {
        openModal();
      }
    };

    window.addEventListener('keydown', handleKeyPress);

    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, []);

  const deleteRecurringTask = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this recurring task?')) {
      return;
    }
    
    try {
      await axios.delete(`${API_BASE_URL}/api/recurring-tasks/${taskId}`);
      setRecurringTasks(recurringTasks.filter(task => task._id !== taskId));
    } catch (error) {
      console.error('Error deleting recurring task:', error);
      alert('Failed to delete recurring task. Please try again.');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setTaskData({
      ...taskData,
      [name]: value
    });
  };

  const handleTimeChange = (field, time) => {
    setTaskData({
      ...taskData,
      [field]: time
    });
  };

  const handleDayToggle = (type, day) => {
    const field = type === 'daily' ? 'dailyDays' : 'weeklyDays';
    const currentDays = [...taskData[field]];

    if (currentDays.includes(day)) {
      const updatedDays = currentDays.filter(d => d !== day);
      setTaskData({
        ...taskData,
        [field]: updatedDays
      });
    } else {
      setTaskData({
        ...taskData,
        [field]: [...currentDays, day]
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!taskData.title || !taskData.startDate) {
      setFormError('Please fill all required fields');
      return;
    }

    if (taskData.recurrenceType === 'hourly' && (!taskData.startTime || !taskData.endTime)) {
      setFormError('Please specify start time and end time for hourly recurrence');
      return;
    }

    if (taskData.recurrenceType === 'daily' && taskData.dailyDays.length === 0) {
      setFormError('Please select at least one day for daily recurrence');
      return;
    }
    
    if (taskData.recurrenceType === 'weekly' && taskData.weeklyDays.length === 0) {
      setFormError('Please select at least one day for weekly recurrence');
      return;
    }

    try {
      setIsSubmitting(true);
      setFormError('');

      const user = JSON.parse(localStorage.getItem('user'));
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      // Override the priority to always be 'low'
      const response = await axios.post(
        `${API_BASE_URL}/api/recurring-tasks`,
        { ...taskData, userId: user._id, priority: 'low' },
        { headers: { 'Content-Type': 'application/json' } }
      );

      console.log('Recurring task created:', response.data);
      
      setRecurringTasks([...recurringTasks, response.data]);
      
      resetForm();
      closeModal();
    } catch (error) {
      console.error('Error creating recurring task:', error);
      let errorMessage = 'Failed to create recurring task';
      
      if (error.response) {
        errorMessage = error.response.data.message || errorMessage;
      } else if (error.request) {
        errorMessage = 'No response from server. Please check your internet connection.';
      } else {
        errorMessage = error.message;
      }
      
      setFormError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setTaskData({
      title: '',
      priority: 'low', // Set default priority to low
      recurrenceType: 'daily',
      startDate: '',
      endDate: '',
      startTime: '',
      endTime: '',
      hourlyInterval: 1,
      dailyDays: [],
      weeklyDays: [],
      monthlyType: 'dayOfMonth',
      monthlyDate: 1,
      monthlyDay: 'Monday',
      monthlyWeek: 'first',
    });
    setFormError('');
    setShowPreview(false);
  };

  const openModal = () => {
    setIsModalOpen(true);
    setShowOptionsModal(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setShowOptionsModal(false);
    setShowRecurringForm(false);
    setShowRegularForm(false);
    resetForm();
  };

  const handleOptionSelect = (option) => {
    setShowOptionsModal(false);
    
    if (option === 'recurring') {
      setShowRecurringForm(true);
    } else if (option === 'regular') {
      setShowRegularForm(true);
    }
  };

  const handleAiTaskGenerated = (aiTaskData) => {
    console.log('Received AI task data:', aiTaskData);
    
    // Ensure we have a valid task object
    if (!aiTaskData || (Array.isArray(aiTaskData) && aiTaskData.length === 0)) {
      console.error('No valid task data received from AI');
      return;
    }
    
    // Handle array of tasks or single task
    const tasksToProcess = Array.isArray(aiTaskData) ? aiTaskData : [aiTaskData];
    
    tasksToProcess.forEach(taskItem => {
      try {
        // Ensure all required fields have values
        const processedTask = {
          title: taskItem.title || 'New recurring task',
          priority: 'low', // ALWAYS set priority to low regardless of AI response
          recurrenceType: taskItem.recurrenceType || 'daily',
          startDate: taskItem.startDate || new Date().toISOString().split('T')[0],
          endDate: taskItem.endDate || null,
          startTime: taskItem.startTime || '12:00 PM',
          endTime: taskItem.endTime || '',
        };
        
        // Add recurrence-specific properties
        if (processedTask.recurrenceType === 'daily') {
          processedTask.dailyDays = taskItem.dailyDays?.length > 0 
            ? taskItem.dailyDays 
            : ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
        } else if (processedTask.recurrenceType === 'weekly') {
          // Fix: Check both weeklyDays and dailyDays for weekly recurrence
          // This handles cases where the AI puts weekly days in dailyDays
          processedTask.weeklyDays = taskItem.weeklyDays?.length > 0
            ? taskItem.weeklyDays
            : (taskItem.dailyDays?.length > 0 
                ? taskItem.dailyDays  // Use dailyDays as fallback for weekly recurrence
                : [(new Date()).toLocaleDateString('en-US', { weekday: 'long' })]);
        } else if (processedTask.recurrenceType === 'monthly') {
          processedTask.monthlyType = taskItem.monthlyType || 'dayOfMonth';
          processedTask.monthlyDate = taskItem.monthlyDate || 1;
          processedTask.monthlyDay = taskItem.monthlyDay || 'Monday';
          processedTask.monthlyWeek = taskItem.monthlyWeek || 'first';
        }
        
        console.log('Setting processed task data:', processedTask);
        
        // Update form state with processed data
        setTaskData(prevData => ({
          ...prevData,
          ...processedTask
        }));
        
        // Close the AI assistant
        setShowAiAssistant(false);
        
        // Direct submission to backend instead of relying on form submission
        submitTaskDirectly(processedTask);
        
      } catch (error) {
        console.error('Error processing AI task data:', error);
      }
    });
  };

  // Helper function to directly submit the task to the backend
  const submitTaskDirectly = async (taskData) => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      // Set priority to low for direct submission
      const submissionData = {
        ...taskData,
        userId: user._id,
        priority: 'low' // Force priority to low
      };
      
      console.log('Directly submitting task data:', submissionData);
      
      const response = await axios.post(
        `${API_BASE_URL}/api/recurring-tasks`,
        submissionData,
        { headers: { 'Content-Type': 'application/json' } }
      );
      
      console.log('Recurring task created:', response.data);
      setRecurringTasks(prev => [...prev, response.data]);
      resetForm();
      closeModal();
    } catch (error) {
      console.error('Failed to create recurring task:', error);
      setFormError(error.response?.data?.message || 'Failed to create task');
    }
  };

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const weeksOfMonth = ['first', 'second', 'third', 'fourth', 'last'];

  const getPreviewText = () => {
    if (!taskData.title || !taskData.startDate) return 'Please fill in the required fields to see a preview';

    let recurrenceText = '';
    switch (taskData.recurrenceType) {
      case 'hourly':
        recurrenceText = `Every ${taskData.hourlyInterval} hour(s) from ${taskData.startTime} to ${taskData.endTime}`;
        break;
      case 'daily':
        if (taskData.dailyDays.length === 7) {
          recurrenceText = 'Every day';
        } else if (taskData.dailyDays.length > 0) {
          recurrenceText = `Every ${taskData.dailyDays.join(', ')}`;
        } else {
          recurrenceText = 'Select at least one day';
        }
        break;
      case 'weekly':
        if (taskData.weeklyDays.length > 0) {
          recurrenceText = `Every week on ${taskData.weeklyDays.join(', ')}`;
        } else {
          recurrenceText = 'Select at least one day of the week';
        }
        break;
      case 'monthly':
        if (taskData.monthlyType === 'dayOfMonth') {
          recurrenceText = `Monthly on day ${taskData.monthlyDate}`;
        } else {
          recurrenceText = `Monthly on the ${taskData.monthlyWeek} ${taskData.monthlyDay}`;
        }
        break;
      default:
        recurrenceText = 'Invalid recurrence pattern';
    }

    return `"${taskData.title}" will occur ${recurrenceText} starting from ${taskData.startDate}${taskData.endDate ? ` until ${taskData.endDate}` : ''}`;
  };

  const handleCloseError = () => {
    setLoadError('');
  };

  // New method to open modal with pre-configured task data
  const openModalWithTemplate = (template) => {
    setIsModalOpen(true);
    setShowOptionsModal(false);
    setShowRecurringForm(true);
    
    // Set pre-configured task data based on template
    switch(template) {
      case 'study':
        setTaskData({
          ...taskData,
          title: 'Study Session',
          recurrenceType: 'hourly',
          hourlyInterval: 2,
          startTime: '09:00 AM',
          endTime: '05:00 PM'
        });
        break;
      case 'class':
        setTaskData({
          ...taskData,
          title: 'Class Schedule',
          recurrenceType: 'weekly',
          weeklyDays: ['Monday', 'Wednesday', 'Friday'],
          startTime: '09:00 AM'
        });
        break;
      case 'habit':
        setTaskData({
          ...taskData,
          title: 'Daily Habit',
          recurrenceType: 'daily',
          dailyDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
          startTime: '07:00 AM'
        });
        break;
      case 'review':
        setTaskData({
          ...taskData,
          title: 'Monthly Review',
          recurrenceType: 'monthly',
          monthlyType: 'dayOfMonth',
          monthlyDate: 1,
          startTime: '10:00 AM'
        });
        break;
      default:
        // Keep default values
        break;
    }
  };

  return (
    <div className="recurring-tasks-page">
      <header>
        <h1>Smart Scheduler</h1>
        <p>Create powerful routines and recurring patterns for your academic and work life</p>
      </header>

      {isLoading ? (
        <div className="loading-indicator">Loading your recurring tasks...</div>
      ) : loadError ? (
        <div className="error-message">
          {loadError}
          <button 
            className="close-error-btn" 
            onClick={handleCloseError}
            aria-label="Close error message"
          >
            ×
          </button>
        </div>
      ) : (
        <RecurringTaskInstances 
          recurringTasks={recurringTasks} 
          deleteTask={deleteRecurringTask} 
          shouldScrollToToday={shouldScrollToToday}
        />
      )}

      <button className="scheduler-fab" onClick={openModal}>
        <img src={addIcon} alt="Add task" />
      </button>

      {/* Show the info cards regardless of task count */}
      <div className="recurring-tasks-info">
        <h2>Create Your Routines</h2>
        <div className="info-cards">
          <div className="info-card" onClick={() => openModalWithTemplate('study')}>
            <div className="info-card-icon">📚</div>
            <h3>Study Sessions</h3>
            <p>Create hourly blocks for focused study time throughout your week.</p>
            <div className="info-card-btn">Create Now</div>
          </div>
          
          <div className="info-card" onClick={() => openModalWithTemplate('class')}>
            <div className="info-card-icon">📅</div>
            <h3>Class Schedules</h3>
            <p>Set up your semester timetable with weekly recurring classes.</p>
            <div className="info-card-btn">Create Now</div>
          </div>
          
          <div className="info-card" onClick={() => openModalWithTemplate('habit')}>
            <div className="info-card-icon">🏋️</div>
            <h3>Daily Habits</h3>
            <p>Build consistency with daily recurring tasks like exercise or reading.</p>
            <div className="info-card-btn">Create Now</div>
          </div>
          
          <div className="info-card" onClick={() => openModalWithTemplate('review')}>
            <div className="info-card-icon">📊</div>
            <h3>Monthly Reviews</h3>
            <p>Schedule regular progress reviews at the beginning or end of each month.</p>
            <div className="info-card-btn">Create Now</div>
          </div>
        </div>
      </div>

      {/* Modal section - keep this as is */}
      <div className={`scheduler-modal ${isModalOpen ? 'show' : ''}`}>
        <div 
          className={`scheduler-modal-content ${showRegularForm ? 'show-regular-form' : ''} ${showAiAssistant ? 'show-ai-assistant' : ''}`} 
          ref={modalContentRef}
        >
          {showOptionsModal && (
            <SchedulerOptions onSelect={handleOptionSelect} onClose={closeModal} />
          )}
          
          {showRecurringForm && (
            <div className="recurring-task-form-container">
              <button className="close-modal-btn" onClick={closeModal}>×</button>
              <h2 className="form-title">Create Recurring Task</h2>
              
              <button 
                type="button"
                className="ai-assistant-toggle"
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
                  taskType="recurring" 
                  onTaskGenerated={handleAiTaskGenerated} 
                />
              ) : (
                <form className="recurring-task-form" onSubmit={handleSubmit}>
                  {formError && (
                    <div className="form-error">{formError}</div>
                  )}

                  <div className="form-section">
                    <h2>Task Details</h2>
                    <div className="form-group">
                      <label htmlFor="title">Task Title*</label>
                      <input
                        type="text"
                        id="title"
                        name="title"
                        value={taskData.title}
                        onChange={handleChange}
                        required
                        placeholder="E.g., Math Study Session"
                        className="task-title-input"
                      />
                    </div>
                    {/* Priority selection removed */}
                  </div>

                  <div className="form-section">
                    <h2>Recurrence Pattern</h2>
                    <div className="recurrence-types">
                      <button
                        type="button"
                        className={`recurrence-type-btn ${taskData.recurrenceType === 'hourly' ? 'active' : ''}`}
                        onClick={() => setTaskData({ ...taskData, recurrenceType: 'hourly' })}
                      >
                        Hourly
                      </button>
                      <button
                        type="button"
                        className={`recurrence-type-btn ${taskData.recurrenceType === 'daily' ? 'active' : ''}`}
                        onClick={() => setTaskData({ ...taskData, recurrenceType: 'daily' })}
                      >
                        Daily
                      </button>
                      <button
                        type="button"
                        className={`recurrence-type-btn ${taskData.recurrenceType === 'weekly' ? 'active' : ''}`}
                        onClick={() => setTaskData({ ...taskData, recurrenceType: 'weekly' })}
                      >
                        Weekly
                      </button>
                      <button
                        type="button"
                        className={`recurrence-type-btn ${taskData.recurrenceType === 'monthly' ? 'active' : ''}`}
                        onClick={() => setTaskData({ ...taskData, recurrenceType: 'monthly' })}
                      >
                        Monthly
                      </button>
                    </div>

                    {taskData.recurrenceType === 'hourly' && (
                      <div className="pattern-config hourly-config">
                        <div className="form-group">
                          <label htmlFor="hourlyInterval">Repeat every</label>
                          <div className="input-with-label">
                            <input
                              type="number"
                              id="hourlyInterval"
                              name="hourlyInterval"
                              value={taskData.hourlyInterval}
                              onChange={handleChange}
                              min="1"
                              max="12"
                            />
                            <span>hour(s)</span>
                          </div>
                        </div>
                        <div className="time-range">
                          <div className="form-group">
                            <label>Start Time</label>
                            <TimePicker time={taskData.startTime} setTime={(time) => handleTimeChange('startTime', time)} />
                          </div>
                          <div className="form-group">
                            <label>End Time</label>
                            <TimePicker time={taskData.endTime} setTime={(time) => handleTimeChange('endTime', time)} />
                          </div>
                        </div>
                      </div>
                    )}

                    {taskData.recurrenceType === 'daily' && (
                      <div className="pattern-config daily-config">
                        <label>Repeat on</label>
                        <div className="day-selector">
                          {daysOfWeek.map(day => (
                            <button
                              key={day}
                              type="button"
                              className={`day-btn ${taskData.dailyDays.includes(day) ? 'selected' : ''}`}
                              onClick={() => handleDayToggle('daily', day)}
                            >
                              {day.substring(0, 3)}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {taskData.recurrenceType === 'weekly' && (
                      <div className="pattern-config weekly-config">
                        <label>Repeat on</label>
                        <div className="day-selector">
                          {daysOfWeek.map(day => (
                            <button
                              key={day}
                              type="button"
                              className={`day-btn ${taskData.weeklyDays.includes(day) ? 'selected' : ''}`}
                              onClick={() => handleDayToggle('weekly', day)}
                            >
                              {day.substring(0, 3)}
                            </button>
                          ))}
                        </div>
                        <div className="form-group">
                          <label>Task Time</label>
                          <TimePicker time={taskData.startTime} setTime={(time) => handleTimeChange('startTime', time)} />
                        </div>
                      </div>
                    )}

                    {taskData.recurrenceType === 'monthly' && (
                      <div className="pattern-config monthly-config">
                        <div className="form-group">
                          <div className="radio-group">
                            <label>
                              <input
                                type="radio"
                                name="monthlyType"
                                value="dayOfMonth"
                                checked={taskData.monthlyType === 'dayOfMonth'}
                                onChange={handleChange}
                              />
                              Day of month
                            </label>
                            <label>
                              <input
                                type="radio"
                                name="monthlyType"
                                value="dayOfWeek"
                                checked={taskData.monthlyType === 'dayOfWeek'}
                                onChange={handleChange}
                              />
                              Day of week
                            </label>
                          </div>
                        </div>

                        {taskData.monthlyType === 'dayOfMonth' ? (
                          <div className="form-group">
                            <label htmlFor="monthlyDate">Day of the month</label>
                            <select
                              id="monthlyDate"
                              name="monthlyDate"
                              value={taskData.monthlyDate}
                              onChange={handleChange}
                            >
                              {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                                <option key={day} value={day}>{day}</option>
                              ))}
                            </select>
                          </div>
                        ) : (
                          <div className="day-of-week-selector">
                            <div className="form-group">
                              <label htmlFor="monthlyWeek">Week</label>
                              <select
                                id="monthlyWeek"
                                name="monthlyWeek"
                                value={taskData.monthlyWeek}
                                onChange={handleChange}
                              >
                                {weeksOfMonth.map(week => (
                                  <option key={week} value={week}>{week}</option>
                                ))}
                              </select>
                            </div>
                            <div className="form-group">
                              <label htmlFor="monthlyDay">Day</label>
                              <select
                                id="monthlyDay"
                                name="monthlyDay"
                                value={taskData.monthlyDay}
                                onChange={handleChange}
                              >
                                {daysOfWeek.map(day => (
                                  <option key={day} value={day}>{day}</option>
                                ))}
                              </select>
                            </div>
                          </div>
                        )}
                        <div className="form-group">
                          <label>Task Time</label>
                          <TimePicker time={taskData.startTime} setTime={(time) => handleTimeChange('startTime', time)} />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="form-section">
                    <h2>Date Range</h2>
                    <div className="date-range-container">
                      <div className="form-group">
                        <label htmlFor="startDate">Start Date*</label>
                        <input
                          type="date"
                          id="startDate"
                          name="startDate"
                          value={taskData.startDate}
                          onChange={handleChange}
                          required
                          className="date-input"
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor="endDate">End Date (optional)</label>
                        <input
                          type="date"
                          id="endDate"
                          name="endDate"
                          value={taskData.endDate}
                          onChange={handleChange}
                          min={taskData.startDate}
                          className="date-input"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="preview-section">
                    <button
                      type="button"
                      className="preview-btn"
                      onClick={() => setShowPreview(!showPreview)}
                    >
                      {showPreview ? 'Hide Preview' : 'Show Preview'}
                    </button>

                    {showPreview && (
                      <div className="task-preview">
                        <h3>Task Preview</h3>
                        <p>{getPreviewText()}</p>
                      </div>
                    )}
                  </div>

                  <div className="form-actions">
                    <button
                      type="submit"
                      className="create-task-btn"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'Creating...' : 'Create Recurring Task'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
          
          {showRegularForm && (
            <div className="regular-task-form-container">
              <TaskForm 
                addTask={async (task) => {
                  try {
                    const user = JSON.parse(localStorage.getItem('user'));
                    if (!user) {
                      throw new Error('User not authenticated');
                    }
                    
                    const taskWithUser = { ...task, userId: user._id };
                    
                    await axios.post(`${API_BASE_URL}/api/tasks`, taskWithUser);
                    
                    closeModal();
                  } catch (error) {
                    console.error('Error creating task:', error);
                    alert('Failed to create task. Please try again.');
                  }
                }}
                closeModal={closeModal}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default RecurringTasksPage;
