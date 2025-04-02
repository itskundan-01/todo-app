import React, { useState, useEffect } from 'react';
import TimePicker from './components/TimePicker';
import { getTimerClass } from './utils/timerUtils';
import editIcon from './edit.png';
import deleteIcon from './delete.png';
import closeIcon from './close.png';
import tickIcon from './tick.png';

function TaskItem({ task, deleteTask, toggleComplete, editTask }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(task.text);
  const [editTime, setEditTime] = useState(task.time);
  const [remainingTime, setRemainingTime] = useState('');
  const [timerClass, setTimerClass] = useState('');

  useEffect(() => {
    const updateRemainingTime = () => {
      if (task.completed) {
        setRemainingTime('Completed!');
        setTimerClass('timer-done');
        return;
      }

      const now = new Date();
      const taskTime = new Date(`${task.date} ${task.time}`);
      const diff = taskTime - now;
      if (diff > 0) {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setRemainingTime(`${hours}h ${minutes}m ${seconds}s`);
        setTimerClass(getTimerClass(hours, minutes));
      } else {
        setRemainingTime('Time is up!');
        setTimerClass('timer-red');
      }
    };

    const interval = setInterval(updateRemainingTime, 1000); // Update every second
    updateRemainingTime();

    return () => clearInterval(interval);
  }, [task.date, task.time, task.completed]);

  const handleEditChange = (e) => {
    setEditText(e.target.value);
  };

  const handleSaveEdit = () => {
    const updatedTask = { ...task, text: editText, time: editTime };
    editTask(task._id, updatedTask);
    setIsEditing(false);
  };

  const handleEditClick = () => {
    setIsEditing(true);
  };

  const getCheckboxClass = (priority) => {
    return `task-checkbox task-checkbox-${priority.toLowerCase()}`;
  };

  const checkboxContent = () => {
    const now = new Date();
    const taskDateTime = new Date(`${task.date} ${task.time}`);
    
    if (task.completed) {
      return <span className="checkbox-mark">✓</span>;
    }
    if (taskDateTime < now) {
      return <span className="checkbox-mark">✗</span>;
    }
    return null;
  };

  const taskBackgroundColor = task.completed
    ? 'lightgreen'
    : remainingTime === 'Time is up!'
    ? 'lightcoral'
    : 'white';

  const itemClass = `task-item ${task.isRecurring ? 'recurring' : ''} ${task.completed ? 'completed' : ''} ${isEditing ? 'editing' : ''}`;

  return (
    <li 
      className={itemClass} 
      style={{ backgroundColor: taskBackgroundColor }}
    >
      <div className={`custom-checkbox ${task.priority.toLowerCase()}`}>
        <input
          type="checkbox"
          checked={task.completed}
          onChange={() => toggleComplete(task._id)}
        />
        <span className="custom-checkmark">
          {task.completed ? '✓' : remainingTime === 'Time is up!' ? '✗' : ''}
        </span>
      </div>
      {isEditing ? (
        <div className="task-edit-container">
          <div className="task-edit-inputs">
            <input
              type="text"
              value={editText}
              onChange={handleEditChange}
              maxLength={100}
              autoFocus
              className="task-edit-text"
            />
            <div className="task-edit-time">
              <TimePicker time={editTime} setTime={setEditTime} />
            </div>
          </div>
          <div className="edit-buttons">
            <button 
              className="icon-button save-btn"
              onClick={handleSaveEdit}
              title="Save"
            >
              <img src={tickIcon} alt="Save" />
            </button>
            <button 
              className="icon-button cancel-btn"
              onClick={() => setIsEditing(false)}
              title="Cancel"
            >
              <img src={closeIcon} alt="Cancel" />
            </button>
          </div>
        </div>
      ) : (
        <>
          <span className={task.completed ? 'completed' : ''}>
            {task.text}
          </span>
          <div className="task-right-section">
            <div className={`timer ${timerClass}`}>{remainingTime}</div>
            <div className="task-buttons">
              <button className="edit" onClick={handleEditClick}>
                <img src={editIcon} alt="Edit" />
              </button>
              <button onClick={() => deleteTask(task._id)}>
                <img src={deleteIcon} alt="Delete" />
              </button>
            </div>
          </div>
        </>
      )}
    </li>
  );
}

export default TaskItem;