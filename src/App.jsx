import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import TaskList from './TaskList';
import TaskForm from './TaskForm';
import axios from 'axios';
import Notification from './components/Notification';
import avatar from './account.png';
import { API_BASE_URL } from './config';

function App() {
  const [tasks, setTasks] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')) || null);
  const [showAuth, setShowAuth] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [notification, setNotification] = useState(null);
  const [showProfile, setShowProfile] = useState(false);
  const todayRef = useRef(null);

  useEffect(() => {
    const fetchTasks = async () => {
      if (user) {
        const { data } = await axios.get(`${API_BASE_URL}/api/tasks/${user._id}`);
        setTasks(data);
      }
    };
    fetchTasks();
  }, [user]);
  
  useEffect(() => {
    if (user && window.OneSignal) {
      window.OneSignal.push(function () {
        window.OneSignal.setExternalUserId(user._id)
          .then(() => console.log("External user ID set successfully"))
          .catch((error) =>
            console.error("Error setting external user ID:", error)
          );
      });
    }
  }, [user]);

  useEffect(() => {
    if (user && todayRef.current) {
      todayRef.current.scrollIntoView({ 
        behavior: 'smooth',
        block: 'center'
      });
    }
  }, [user, tasks]);

  const showNotification = (message, type) => {
    setNotification({ message, type });
  };

  const addTask = async (newTask) => {
    try {
      const { data } = await axios.post(`${API_BASE_URL}/api/tasks`, { ...newTask, userId: user._id });
      setTasks(prevTasks => {
        const updatedTasks = [...prevTasks, data];
        // Re-sort tasks after adding
        return updatedTasks.sort((a, b) => new Date(a.date) - new Date(b.date));
      });
      setIsModalOpen(false);
      showNotification('Task added successfully!', 'success');
    } catch (error) {
      showNotification('Failed to add task!', 'error');
    }
  };

  const deleteTask = async (id) => {
    try {
      await axios.delete(`${API_BASE_URL}/api/tasks/${id}`);
      setTasks(tasks.filter((task) => task._id !== id));
      showNotification('Task deleted successfully!', 'success');
    } catch (error) {
      showNotification('Failed to delete task!', 'error');
    }
  };

  const toggleComplete = async (id) => {
    try {
      const task = tasks.find((task) => task._id === id);
      const updatedTask = { ...task, completed: !task.completed };
      const { data } = await axios.put(`${API_BASE_URL}/api/tasks/${id}`, updatedTask);
      setTasks(tasks.map((task) => (task._id === id ? data : task)));
      
      if (data.completed) {
        showNotification('🎉 Congratulations! Task completed! 🎊', 'success');
      }
    } catch (error) {
      showNotification('Failed to update task!', 'error');
    }
  };

  const editTask = async (id, updatedTask) => {
    try {
      const { data } = await axios.put(`${API_BASE_URL}/api/tasks/${id}`, updatedTask);
      setTasks(tasks.map((task) => (task._id === id ? data : task)));
    } catch (error) {
      console.error('Error editing task:', error);
    }
  };

  // Update the search functionality
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value.toLowerCase());
  };

  const filteredTasks = tasks.filter((task) => {
    const text = task.text.toLowerCase();
    const taskDate = new Date(task.date).toLocaleDateString();
    const taskDay = new Date(task.date).toLocaleString('en-US', { weekday: 'long' }).toLowerCase();
    const searchTerm = searchQuery.toLowerCase();
    
    return text.includes(searchTerm) || 
           taskDate.includes(searchTerm) || 
           taskDay.includes(searchTerm);
  }).sort((a, b) => new Date(a.date) - new Date(b.date));

  // Update the task grouping and filtering logic
const today = new Date();
today.setHours(0, 0, 0, 0);
const todayStr = today.toISOString().split('T')[0];

// Separate tasks into past, present, and future with better filtering
const todayTasks = filteredTasks.filter(task => {
  const taskDate = new Date(task.date);
  taskDate.setHours(0, 0, 0, 0);
  return taskDate.getTime() === today.getTime();
});

const { pastTasks, futureTasks } = filteredTasks.reduce((acc, task) => {
  const taskDate = new Date(task.date);
  taskDate.setHours(0, 0, 0, 0);
  
  if (taskDate.getTime() === today.getTime()) {
    return acc; // Skip today's tasks
  }
  
  if (taskDate < today) {
    if (!acc.pastTasks[task.date]) acc.pastTasks[task.date] = [];
    acc.pastTasks[task.date].push(task);
  } else {
    if (!acc.futureTasks[task.date]) acc.futureTasks[task.date] = [];
    acc.futureTasks[task.date].push(task);
  }
  return acc;
}, { pastTasks: {}, futureTasks: {} });

  const handleLogin = async (email, password) => {
    try {
      const { data } = await axios.post(`${API_BASE_URL}/api/users/login`, { email, password });
      setUser(data);
      localStorage.setItem('user', JSON.stringify(data));
      showNotification('Successfully logged in!', 'success');
    } catch (error) {
      showNotification(error.response?.data?.message || 'Login failed!', 'error');
    }
  };

  const handleRegister = async (name, email, password) => {
    try {
      if (password.length < 6) {
        throw new Error('Password must be at least 6 characters long');
      }
      const { data } = await axios.post(`${API_BASE_URL}/api/users/register`, { name, email, password });
      setUser(data);
      localStorage.setItem('user', JSON.stringify(data));
      showNotification('Registration successful!', 'success');
    } catch (error) {
      showNotification(error.response?.data?.message || error.message, 'error');
    }
  };

  // Update getTodayTasks function to be more precise
  const getTodayTasks = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];
    return tasks.filter(task => task.date === todayStr).length > 0;
  };

  const UserProfile = () => (
    <div className="user-profile">
      <button className="profile-button" onClick={() => setShowProfile(!showProfile)}>
        <img src={avatar} alt="Profile" />
      </button>
      {showProfile && (
        <div className="profile-dropdown">
          <div className="profile-info">
            <h3>{user.name}</h3>
            <p>{user.email}</p>
          </div>
          <button className="logout-button" onClick={() => {
            localStorage.removeItem('user');
            setUser(null);
          }}>Logout</button>
        </div>
      )}
    </div>
  );

  const Footer = () => (
    <footer className="app-footer">
      <p>
        Developed by <a href="https://kundanprojects.space" target="_blank" rel="noopener noreferrer">Kundan Kumar</a> <br/> 
        <a href="https://www.linkedin.com/in/itskundankumar/" target="_blank" rel="noopener noreferrer"> LinkedIn</a> | 
        <a href="https://forms.office.com/r/PnbtrSE827" target="_blank" rel="noopener noreferrer"> Feedback</a>
      </p>
    </footer>
  );

  return (
    <div className='background-img'>
      <div className="App">
        {notification && (
          <Notification
            message={notification.message}
            type={notification.type}
            onClose={() => setNotification(null)}
          />
        )}
        {user ? (
          <>
            <nav className="navbar">
              <div className="navbar-left">
                <img src='https://raw.githubusercontent.com/itskundan-01/todo-app/2f791d5f244d86bb19470013c4f54cd349000029/src/logoIcon.png' alt="Logo" className="navbar-logo" />
                <h1 className="navbar-title">To-Do List</h1>
              </div>
              <div className="navbar-search">
                <input
                  type="text"
                  placeholder="Search tasks..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                />
              </div>
              {user && <UserProfile />}
            </nav>
            {filteredTasks.length === 0 ? (
              <div className="task-group">
                <div className="empty-state">
                  <h3>Your task list is empty!</h3>
                  <p>Time to plan your day and achieve more.</p>
                  <p>Click the + button to add your first task.</p>
                </div>
              </div>
            ) : (
              <>
                {/* Past Tasks */}
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
                        deleteTask={deleteTask}
                        toggleComplete={toggleComplete}
                        editTask={editTask}
                      />
                    </div>
                  ))}

                {/* Today's Tasks */}
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
                      deleteTask={deleteTask}
                      toggleComplete={toggleComplete}
                      editTask={editTask}
                    />
                  ) : (
                    <div className="empty-state">
                      <h3>No Tasks for Today!</h3>
                      <p>You have no tasks scheduled for today.</p>
                      <p>Plan ahead by adding new tasks!</p>
                    </div>
                  )}
                </div>

                {/* Future Tasks */}
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
                        deleteTask={deleteTask}
                        toggleComplete={toggleComplete}
                        editTask={editTask}
                      />
                    </div>
                  ))}
              </>
            )}

            <button className="fab" onClick={() => setIsModalOpen(true)}>+</button>
            <div className={`modal ${isModalOpen ? 'show' : ''}`}>
              <div className="modal-content">
                <TaskForm addTask={addTask} closeModal={() => setIsModalOpen(false)} />
              </div>
            </div>
          </>
        ) : (
          <div className="landing-page">
            {!showAuth ? (
              <>
                <div className="intro-text">
                  <h2>Welcome to the To-Do List App</h2>
                  <p>Manage your tasks efficiently with our simple and intuitive to-do list application.</p>
                  <button className="get-started" onClick={() => setShowAuth(true)}>Get Started</button>
                </div>
              </>
            ) : (
              <div className="auth-container">
                {isLogin ? (
                  <div className="auth-form">
                    <h2 className='auth-header'>Login</h2>
                    <form onSubmit={(e) => {
                      e.preventDefault();
                      const email = e.target.email.value;
                      const password = e.target.password.value;
                      handleLogin(email, password);
                    }}>
                      <input type="email" name="email" placeholder="Email" required />
                      <input type="password" name="password" placeholder="Password" required />
                      <button type="submit">Login</button>
                    </form>
                    <p>Don't have an account? <span className="toggle-auth" onClick={() => setIsLogin(false)}>Sign Up</span></p>
                  </div>
                ) : (
                  <div className="auth-form">
                    <h2 className='auth-header'>Register</h2>
                    <form onSubmit={(e) => {
                      e.preventDefault();
                      const name = e.target.name.value;
                      const email = e.target.email.value;
                      const password = e.target.password.value;
                      handleRegister(name, email, password);
                    }}>
                      <input type="text" name="name" placeholder="Full Name" required />
                      <input type="email" name="email" placeholder="Email" required />
                      <input type="password" name="password" placeholder="Password" required />
                      <button type="submit">Register</button>
                    </form>
                    <p>Already have an account? <span className="toggle-auth" onClick={() => setIsLogin(true)}>Sign In</span></p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}

export default App;