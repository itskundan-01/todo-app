import React, { useState, useEffect } from "react";
import "./AdminLayout.css";

function AdminLayout({ children }) {
  const [activeTab, setActiveTab] = useState('');
  const user = JSON.parse(localStorage.getItem('user'));
  
  useEffect(() => {
    // Set active tab based on current path
    const path = window.location.pathname;
    if (path.includes('/admin/users')) {
      setActiveTab('users');
    } else if (path.includes('/admin/settings')) {
      setActiveTab('settings');
    } else if (path.includes('/admin/register')) {
      setActiveTab('register');
    } else {
      setActiveTab('dashboard');
    }
    
    // Check if user is admin
    if (!user || !user.isAdmin) {
      // Instead of direct navigation, set localStorage to trigger App component redirection
      localStorage.setItem('requestedView', 'tasks');
      window.location.href = '/';
    }
  }, [user]);

  const handleTabClick = (tab) => {
    setActiveTab(tab);
    if (tab === 'exit') {
      // Return to tasks view via localStorage flag
      localStorage.setItem('requestedView', 'tasks');
      window.location.href = '/';
      return;
    }
    
    // Set both the URL for deep linking and localStorage for view state
    localStorage.setItem('adminSection', tab);
    
    // Use history.pushState to update the URL without page reload
    const newPath = tab === 'dashboard' ? '/admin' : `/admin/${tab}`;
    window.history.pushState({}, '', newPath);
    
    // Force a re-render rather than a full page reload
    window.dispatchEvent(new CustomEvent('adminNavigate', { detail: { section: tab } }));
  };

  if (!user || !user.isAdmin) {
    return null; // Will be redirected by useEffect
  }

  return (
    <div className="admin-layout">
      <div className="admin-sidebar">
        <div className="admin-sidebar-header">
          <h2>Admin Panel</h2>
        </div>
        
        <nav className="admin-nav">
          <button 
            className={`admin-nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => handleTabClick('dashboard')}
          >
            <span className="admin-nav-icon">📊</span>
            Dashboard
          </button>
          
          <button 
            className={`admin-nav-item ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => handleTabClick('users')}
          >
            <span className="admin-nav-icon">👥</span>
            User Management
          </button>
          
          <button 
            className={`admin-nav-item ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => handleTabClick('settings')}
          >
            <span className="admin-nav-icon">⚙️</span>
            Settings
          </button>
          
          <button 
            className={`admin-nav-item ${activeTab === 'register' ? 'active' : ''}`}
            onClick={() => handleTabClick('register')}
          >
            <span className="admin-nav-icon">➕</span>
            Add Admin
          </button>
          
          <button 
            className="admin-nav-item exit"
            onClick={() => handleTabClick('exit')}
          >
            <span className="admin-nav-icon">🚪</span>
            Exit Admin
          </button>
        </nav>
      </div>
      
      <div className="admin-content">
        {children}
      </div>
    </div>
  );
}

export default AdminLayout;
