import React from 'react';
import TaskItem from './TaskItem';

function TaskList({ tasks, deleteTask, toggleComplete, editTask }) {
  // Only check for empty tasks array
  if (!tasks || tasks.length === 0) {
    return (
      <div className="empty-state">
        <h3>No Tasks Available!</h3>
        <p>Add some tasks to get started.</p>
        <p>Click the + button to add tasks.</p>
      </div>
    );
  }

  return (
    <ul className="task-list">
      {tasks.map((task) => (
        <TaskItem
          key={task._id}
          task={task}
          deleteTask={deleteTask}
          toggleComplete={toggleComplete}
          editTask={editTask}
        />
      ))}
    </ul>
  );
}

export default TaskList;