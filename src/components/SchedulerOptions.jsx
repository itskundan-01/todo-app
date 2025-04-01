import React from 'react';
import './SchedulerOptions.css';

function SchedulerOptions({ onSelect, onClose }) {
  return (
    <div className="scheduler-options">
      <button className="close-options-btn" onClick={onClose}>×</button>
      
      <h2>Add New Task</h2>
      <p>Choose the type of task you want to create:</p>
      
      <div className="options-grid">
        <div 
          className="option-card" 
          onClick={() => onSelect('regular')}
        >
          <div className="option-icon">📝</div>
          <h3>Regular Task</h3>
          <p>One-time task with a specific date and time</p>
          <div className="features">
            <span>Single occurrence</span>
            <span>Notification reminders</span>
            <span>Priority levels</span>
          </div>
          <button className="select-btn">Select</button>
        </div>
        
        <div 
          className="option-card" 
          onClick={() => onSelect('recurring')}
        >
          <div className="option-icon">🔄</div>
          <h3>Recurring Task</h3>
          <p>Repeating task with a customizable schedule</p>
          <div className="features">
            <span>Multiple patterns</span>
            <span>Daily/Weekly/Monthly</span>
            <span>Flexible scheduling</span>
          </div>
          <button className="select-btn">Select</button>
        </div>
      </div>
    </div>
  );
}

export default SchedulerOptions;
