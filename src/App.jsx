import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import TaskList from './TaskList';
import TaskForm from './TaskForm';
import HomePage from './pages/HomePage';
import RecurringTasksPage from './pages/RecurringTasksPage';
import SchedulerOptions from './components/SchedulerOptions';
import axios from 'axios';
import Notification from './components/Notification';
import avatar from './account.png';
import { API_BASE_URL, OneSignalAppId } from './config';
import OneSignal from 'react-onesignal';

function App() {
  const [tasks, setTasks] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showTaskOptions, setShowTaskOptions] = useState(false); // New state for options modal
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')) || null);
  const [showAuth, setShowAuth] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [notification, setNotification] = useState(null);
  const [showProfile, setShowProfile] = useState(false);
  const [currentView, setCurrentView] = useState('tasks'); // 'home', 'tasks', or 'recurring'
  const todayRef = useRef(null);
  const viewChanged = useRef(false);
  const [hideNavbar, setHideNavbar] = useState(false);
  const lastScrollPosition = useRef(0);
  const scrollTimer = useRef(null);

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
    if (user) {
      window.OneSignalDeferred = window.OneSignalDeferred || [];
      window.OneSignalDeferred.push(async function (OneSignal) {
        await OneSignal.init({
          appId: OneSignalAppId,
          notifyButton: { enable: true },
        });
        await OneSignal.login(user._id.toString());
        console.log("External user ID set successfully:", user._id.toString());
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

  useEffect(() => {
    if (viewChanged.current && currentView === 'tasks' && todayRef.current) {
      // Small delay to ensure the DOM has updated
      setTimeout(() => {
        todayRef.current.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
      }, 100);
      viewChanged.current = false;
    }
  }, [currentView]);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollPos = window.pageYOffset;
      const scrollingUp = currentScrollPos < lastScrollPosition.current;
      const atTop = currentScrollPos < 50;
      
      // Always show navbar at the top of the page or when scrolling up
      if (atTop || scrollingUp) {
        setHideNavbar(false);
      } else {
        // Only hide when scrolling down and not at the top
        setHideNavbar(true);
      }
      
      lastScrollPosition.current = currentScrollPos;
      
      // Clear any existing timer
      if (scrollTimer.current) {
        clearTimeout(scrollTimer.current);
      }
      
      // Set timer to show navbar after 3 seconds of no scrolling
      scrollTimer.current = setTimeout(() => {
        setHideNavbar(false);
      }, 3000);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    
    // Show navbar on mouse move near the top of the screen
    const handleMouseMove = (e) => {
      if (e.clientY < 50) {
        setHideNavbar(false);
      }
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('mousemove', handleMouseMove);
      if (scrollTimer.current) {
        clearTimeout(scrollTimer.current);
      }
    };
  }, []);

  const showNotification = (message, type) => {
    setNotification({ message, type });
  };

  const addTask = async (newTask) => {
    try {
      const { data } = await axios.post(`${API_BASE_URL}/api/tasks`, { ...newTask, userId: user._id });
      setTasks(prevTasks => {
        const updatedTasks = [...prevTasks, data];
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

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value.toLowerCase());
  };

  const filteredTasks = tasks.filter((task) => {
    // Filter out recurring task instances from "My Tasks" section
    if (task.isRecurringInstance) {
      return false;
    }
    
    // Then apply search filtering
    const text = task.text.toLowerCase();
    const taskDate = new Date(task.date).toLocaleDateString();
    const taskDay = new Date(task.date).toLocaleString('en-US', { weekday: 'long' }).toLowerCase();
    const searchTerm = searchQuery.toLowerCase();

    return text.includes(searchTerm) ||
      taskDate.includes(searchTerm) ||
      taskDay.includes(searchTerm);
  }).sort((a, b) => new Date(a.date) - new Date(b.date));

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayTasks = filteredTasks.filter(task => {
    const taskDate = new Date(task.date);
    taskDate.setHours(0, 0, 0, 0);
    return taskDate.getTime() === today.getTime();
  });

  const { pastTasks, futureTasks } = filteredTasks.reduce((acc, task) => {
    const taskDate = new Date(task.date);
    taskDate.setHours(0, 0, 0, 0);

    if (taskDate.getTime() === today.getTime()) {
      return acc;
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

  const navigateToTasks = () => {
    setCurrentView('tasks');
    viewChanged.current = true;
  };

  const navigateToHome = () => {
    setCurrentView('home');
    // No need to scroll for home view
  };

  const navigateToRecurringTasks = () => {
    setCurrentView('recurring');
    viewChanged.current = true;
  };

  const handleShowAuth = () => {
    setShowAuth(true);
  };

  const handleAddButtonClick = () => {
    setShowTaskOptions(true);
  };

  const handleTaskOptionSelect = (option) => {
    setShowTaskOptions(false);
    
    if (option === 'regular') {
      setIsModalOpen(true); // Show the regular task form
    } else if (option === 'recurring') {
      navigateToRecurringTasks(); // Navigate to recurring tasks page
    }
  };

  const handleCloseTaskOptions = () => {
    setShowTaskOptions(false);
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
            showNotification('Logged out successfully!', 'success');
          }}>
            Logout
          </button>
        </div>
      )}
    </div>
  );

  const Footer = () => (
    <footer className="app-footer">
      <p>
        Developed by <a href="https://kundanprojects.space" target="_blank" rel="noopener noreferrer">Kundan Kumar</a> <br />
        <a href="https://www.linkedin.com/in/itskundankumar/" target="_blank" rel="noopener noreferrer"> LinkedIn</a> |
        <a href="https://forms.office.com/r/PnbtrSE827" target="_blank" rel="noopener noreferrer"> Feedback</a>
      </p>
    </footer>
  );

  return (
    <div className='background-img'>
      {/* Page title for SEO - changes based on current view */}
      <h1 className="seo-page-title">
        {currentView === 'home' ? 'To-Do List App | Task Management & Productivity Tool' :
         currentView === 'tasks' ? 'My Tasks | Organize and Prioritize Your To-Do List' :
         currentView === 'recurring' ? 'Smart Scheduler | Set Up Recurring Tasks and Routines' :
         'To-Do List Application'}
      </h1>
      
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
            <nav className={`navbar ${hideNavbar ? 'navbar-hidden' : ''} ${window.pageYOffset > 50 ? 'navbar-scrolled' : ''}`}>
              <div className="navbar-left" onClick={navigateToHome} style={{ cursor: 'pointer' }}>
                <img src='https://raw.githubusercontent.com/itskundan-01/todo-app/2f791d5f244d86bb19470013c4f54cd349000029/src/logoIcon.png' alt="Logo" className="navbar-logo" />
                <h1 className="navbar-title">To-Do List</h1>
              </div>
              <div className="navbar-links">
                <button
                  className={`nav-button ${currentView === 'home' ? 'active' : ''}`}
                  onClick={navigateToHome}
                >
                  Home
                </button>
                <button
                  className={`nav-button ${currentView === 'tasks' ? 'active' : ''}`}
                  onClick={navigateToTasks}
                >
                  My Tasks
                </button>
                <button
                  className={`nav-button ${currentView === 'recurring' ? 'active' : ''}`}
                  onClick={navigateToRecurringTasks}
                >
                  Smart Scheduler
                </button>
              </div>
              {currentView === 'tasks' && (
                <div className="navbar-search">
                  <input
                    type="text"
                    placeholder="Search tasks..."
                    value={searchQuery}
                    onChange={handleSearchChange}
                  />
                </div>
              )}
              <div className="navbar-controls">
                {user && <UserProfile />}
              </div>
            </nav>

            {/* Show a navbar trigger area when navbar is hidden */}
            {hideNavbar && (
              <div 
                className="navbar-trigger"
                onClick={() => setHideNavbar(false)}
                title="Show navbar"
              />
            )}

            {currentView === 'home' ? (
              <HomePage navigateToTasks={navigateToTasks} navigateToRecurringTasks={navigateToRecurringTasks} />
            ) : currentView === 'recurring' ? (
              <RecurringTasksPage />
            ) : (
              <>
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

                <button className="fab" onClick={handleAddButtonClick}>+</button>
                
                {/* Task Options Modal */}
                <div className={`modal ${showTaskOptions ? 'show' : ''}`}>
                  <div className="modal-content">
                    <SchedulerOptions
                      onSelect={handleTaskOptionSelect}
                      onClose={handleCloseTaskOptions}
                    />
                  </div>
                </div>

                {/* Regular Task Form Modal */}
                <div className={`modal ${isModalOpen ? 'show' : ''}`}>
                  <div className="modal-content task-form-modal">
                    <TaskForm addTask={addTask} closeModal={() => setIsModalOpen(false)} />
                  </div>
                </div>
              </>
            )}
          </>
        ) : (
          <>
            {!showAuth ? (
              <>
                <nav className={`navbar guest-navbar ${hideNavbar ? 'navbar-hidden' : ''} ${window.pageYOffset > 50 ? 'navbar-scrolled' : ''}`}>
                  <div className="navbar-left" style={{ cursor: 'pointer' }}>
                    <img src='https://raw.githubusercontent.com/itskundan-01/todo-app/2f791d5f244d86bb19470013c4f54cd349000029/src/logoIcon.png' alt="Logo" className="navbar-logo" />
                    <h1 className="navbar-title">To-Do List</h1>
                  </div>
                  <button className="auth-button" onClick={handleShowAuth}>Sign In</button>
                </nav>
                <HomePage 
                  isGuest={true}
                  onGetStarted={handleShowAuth}
                />
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
          </>
        )}
      </div>
      <Footer />
    </div>
  );
}

export default App;