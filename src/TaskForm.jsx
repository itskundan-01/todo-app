import React, { useState, useEffect } from 'react';
import TimePicker from './components/TimePicker';
import './TaskForm.css';
import deleteIcon from './close.png';

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

  const getMinDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    const day = today.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  return (
    <form className="task-form" onSubmit={handleSubmit}>
      <button 
        className="close-button" 
        id='close-btn' 
        onClick={handleClose}
        type="button"
      >
        <img src={deleteIcon} alt="Close" />
      </button>
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
  );
}

export default TaskForm;