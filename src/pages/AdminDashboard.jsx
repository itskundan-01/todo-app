import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config';
import axios from 'axios';
import './AdminDashboard.css';

function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sendingEmails, setSendingEmails] = useState(false);
  const [emailStatus, setEmailStatus] = useState(null);
  const [individualEmail, setIndividualEmail] = useState({
    name: '',
    email: ''
  });
  
  const user = JSON.parse(localStorage.getItem('user'));
  
  useEffect(() => {
    const fetchStatistics = async () => {
      try {
        setLoading(true);
        const { data } = await axios.get(`${API_BASE_URL}/api/admin/statistics`, {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        setStats(data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching statistics:', error);
        setError(error.response?.data?.message || 'Failed to fetch statistics');
        setLoading(false);
      }
    };
    
    fetchStatistics();
  }, []);

  const handleSendAiAnnouncement = async () => {
    if (!window.confirm('Are you sure you want to send the AI feature announcement to ALL users? This action cannot be undone.')) {
      return;
    }

    try {
      setSendingEmails(true);
      setEmailStatus(null);
      
      const response = await axios.post(
        `${API_BASE_URL}/api/admin/send-ai-announcement`,
        {},
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      
      setEmailStatus({
        type: 'success',
        message: response.data.message || 'Announcement emails sent successfully',
        details: `${response.data.results?.filter(r => r.success).length || 0} succeeded, ${response.data.results?.filter(r => !r.success).length || 0} failed`
      });
    } catch (error) {
      console.error('Error sending announcement emails:', error);
      setEmailStatus({
        type: 'error',
        message: error.response?.data?.message || 'Failed to send announcement emails',
        details: error.response?.data?.details || error.message
      });
    } finally {
      setSendingEmails(false);
    }
  };

  const handleSendIndividualEmail = async (e) => {
    e.preventDefault();
    if (!individualEmail.name.trim() || !individualEmail.email.trim()) {
      setEmailStatus({
        type: 'error',
        message: 'Please enter both name and email',
        details: 'Both fields are required'
      });
      return;
    }

    try {
      setSendingEmails(true);
      setEmailStatus(null);
      
      const response = await axios.post(
        `${API_BASE_URL}/api/ai/send-ai-feature-email`,
        individualEmail,
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      
      setEmailStatus({
        type: 'success',
        message: 'Announcement email sent successfully',
        details: `Email sent to ${individualEmail.email}`
      });
      
      // Reset the form
      setIndividualEmail({
        name: '',
        email: ''
      });
    } catch (error) {
      console.error('Error sending individual announcement email:', error);
      setEmailStatus({
        type: 'error',
        message: error.response?.data?.message || 'Failed to send announcement email',
        details: error.response?.data?.details || error.message
      });
    } finally {
      setSendingEmails(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setIndividualEmail(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (loading) {
    return <div className="admin-loading">Loading dashboard data...</div>;
  }

  if (error) {
    return <div className="admin-error">Error: {error}</div>;
  }

  // Create data for chart
  const chartData = stats?.tasksByDay || [];
  
  // Fill in missing days
  const filledChartData = (() => {
    if (!chartData.length) return [];
    
    const data = {};
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    
    // Initialize all dates with zero count
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      data[dateStr] = 0;
    }
    
    // Fill in actual data
    chartData.forEach(item => {
      data[item._id] = item.count;
    });
    
    // Convert to array format
    return Object.entries(data).map(([date, count]) => ({ date, count }));
  })();

  return (
    <div className="admin-dashboard">
      <h1>Admin Dashboard</h1>
      
      <div className="admin-actions">
        <div className="action-card">
          <h3>AI Feature Announcement</h3>
          <p>Send an email to all users announcing the new AI Task Assistant feature.</p>
          <button 
            className="send-announcement-btn"
            onClick={handleSendAiAnnouncement}
            disabled={sendingEmails}
          >
            {sendingEmails ? 'Sending...' : 'Send Announcement to All Users'}
          </button>
          
          <div className="individual-email-section">
            <h4>Send to Individual User</h4>
            <form onSubmit={handleSendIndividualEmail}>
              <div className="form-group">
                <input
                  type="text"
                  name="name"
                  placeholder="User's Name"
                  value={individualEmail.name}
                  onChange={handleInputChange}
                  disabled={sendingEmails}
                  required
                />
              </div>
              <div className="form-group">
                <input
                  type="email"
                  name="email"
                  placeholder="User's Email"
                  value={individualEmail.email}
                  onChange={handleInputChange}
                  disabled={sendingEmails}
                  required
                />
              </div>
              <button 
                type="submit" 
                className="send-individual-btn"
                disabled={sendingEmails}
              >
                {sendingEmails ? 'Sending...' : 'Send to This User'}
              </button>
            </form>
          </div>
          
          {emailStatus && (
            <div className={`email-status ${emailStatus.type}`}>
              <p>{emailStatus.message}</p>
              <p className="email-status-details">{emailStatus.details}</p>
            </div>
          )}
        </div>
      </div>
      
      <div className="stat-cards">
        <div className="stat-card">
          <h3>Users</h3>
          <div className="stat-value">{stats?.userCount || 0}</div>
        </div>
        
        <div className="stat-card">
          <h3>Tasks</h3>
          <div className="stat-value">{stats?.taskCount || 0}</div>
        </div>
        
        <div className="stat-card">
          <h3>Recurring Tasks</h3>
          <div className="stat-value">{stats?.recurringTaskCount || 0}</div>
        </div>
        
        <div className="stat-card">
          <h3>Completion Rate</h3>
          <div className="stat-value">{stats?.completionRate || 0}%</div>
        </div>
      </div>
      
      <div className="chart-section">
        <h2>Tasks Created (Last 30 Days)</h2>
        <div className="chart-container">
          {filledChartData.map((day, index) => (
            <div 
              key={index} 
              className="chart-bar"
              style={{
                height: `${(day.count / Math.max(...filledChartData.map(d => d.count), 1)) * 100}%`
              }}
              title={`${day.date}: ${day.count} tasks`}
            >
              <span className="bar-tooltip">{day.count}</span>
            </div>
          ))}
        </div>
        <div className="chart-labels">
          {filledChartData.filter((_, i) => i % 5 === 0).map((day, index) => (
            <span key={index}>{day.date.slice(5)}</span>
          ))}
        </div>
      </div>
      
      <div className="top-users-section">
        <h2>Top Users by Task Count</h2>
        <table className="top-users-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Email</th>
              <th>Task Count</th>
            </tr>
          </thead>
          <tbody>
            {stats?.topUsers?.length ? (
              stats.topUsers.map((user) => (
                <tr key={user.userId}>
                  <td>{user.name}</td>
                  <td>{user.email}</td>
                  <td>{user.taskCount}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="3">No user data available</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AdminDashboard;
