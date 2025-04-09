import React, { useState } from 'react';
import './AdminSettings.css';

// In a real app, these settings would be fetched from backend
// and saved when changed
function AdminSettings() {
  const [settings, setSettings] = useState({
    notificationsEnabled: true,
    dailyReportTime: '08:00',
    taskRetentionDays: 30,
    maxTasksPerUser: 100,
    allowNewRegistrations: true,
    maintenanceMode: false,
    maintenanceMessage: 'The system is currently undergoing scheduled maintenance. Please try again later.',
  });

  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings({
      ...settings,
      [name]: type === 'checkbox' ? checked : value
    });
    
    // Reset saved message whenever settings change
    if (savedSuccess) {
      setSavedSuccess(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // In a real app, this would save to the backend
    console.log('Settings to save:', settings);
    
    // Simulate API call
    setTimeout(() => {
      setSavedSuccess(true);
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSavedSuccess(false);
      }, 3000);
    }, 600);
  };

  return (
    <div className="admin-settings">
      <h1>System Settings</h1>
      
      {savedSuccess && (
        <div className="settings-saved-message">
          Settings saved successfully!
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="settings-form">
        <div className="settings-section">
          <h2>Notification Settings</h2>
          
          <div className="setting-group">
            <label className="switch-label">
              <span>Enable Notifications</span>
              <div className="toggle-switch">
                <input
                  type="checkbox"
                  name="notificationsEnabled"
                  checked={settings.notificationsEnabled}
                  onChange={handleChange}
                />
                <span className="switch"></span>
              </div>
            </label>
          </div>
          
          <div className="setting-group">
            <label>
              Daily Report Time:
              <input
                type="time"
                name="dailyReportTime"
                value={settings.dailyReportTime}
                onChange={handleChange}
                disabled={!settings.notificationsEnabled}
              />
            </label>
          </div>
        </div>

        <div className="settings-section">
          <h2>Task Settings</h2>
          
          <div className="setting-group">
            <label>
              Task Retention Period (days):
              <input
                type="number"
                name="taskRetentionDays"
                value={settings.taskRetentionDays}
                onChange={handleChange}
                min="1"
                max="365"
              />
            </label>
            <p className="setting-help">Completed tasks older than this will be automatically deleted</p>
          </div>
          
          <div className="setting-group">
            <label>
              Maximum Tasks Per User:
              <input
                type="number"
                name="maxTasksPerUser"
                value={settings.maxTasksPerUser}
                onChange={handleChange}
                min="10"
                max="1000"
              />
            </label>
            <p className="setting-help">Set to 0 for unlimited tasks</p>
          </div>
        </div>
        
        <div className="settings-section">
          <h2>System Settings</h2>
          
          <div className="setting-group">
            <label className="switch-label">
              <span>Allow New Registrations</span>
              <div className="toggle-switch">
                <input
                  type="checkbox"
                  name="allowNewRegistrations"
                  checked={settings.allowNewRegistrations}
                  onChange={handleChange}
                />
                <span className="switch"></span>
              </div>
            </label>
          </div>
          
          <div className="setting-group">
            <label className="switch-label">
              <span>Maintenance Mode</span>
              <div className="toggle-switch">
                <input
                  type="checkbox"
                  name="maintenanceMode"
                  checked={settings.maintenanceMode}
                  onChange={handleChange}
                />
                <span className="switch"></span>
              </div>
            </label>
            <p className="setting-help">When enabled, only administrators can access the system</p>
          </div>
          
          <div className="setting-group">
            <label>
              Maintenance Message:
              <textarea
                name="maintenanceMessage"
                value={settings.maintenanceMessage}
                onChange={handleChange}
                disabled={!settings.maintenanceMode}
              />
            </label>
          </div>
        </div>
        
        <div className="settings-actions">
          <button type="submit" className="save-settings-btn">
            Save Settings
          </button>
          <button 
            type="button" 
            className="reset-settings-btn"
            onClick={() => window.location.reload()}
          >
            Reset Changes
          </button>
        </div>
      </form>
    </div>
  );
}

export default AdminSettings;
