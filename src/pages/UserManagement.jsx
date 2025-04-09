import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config';
import axios from 'axios';
import './UserManagement.css';

function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [editFormData, setEditFormData] = useState({
    name: '',
    email: '',
    isAdmin: false
  });
  const [confirmDelete, setConfirmDelete] = useState(null);
  
  const currentUser = JSON.parse(localStorage.getItem('user'));
  
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(`${API_BASE_URL}/api/admin/users`, {
        headers: { Authorization: `Bearer ${currentUser.token}` }
      });
      setUsers(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching users:', error);
      setError(error.response?.data?.message || 'Failed to fetch users');
      setLoading(false);
    }
  };

  const handleEditClick = (user) => {
    setEditingUser(user._id);
    setEditFormData({
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin
    });
  };

  const handleEditChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditFormData({
      ...editFormData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    try {
      await axios.put(
        `${API_BASE_URL}/api/admin/users/${editingUser}`,
        editFormData,
        { headers: { Authorization: `Bearer ${currentUser.token}` } }
      );
      
      setUsers(users.map(user => 
        user._id === editingUser 
          ? { ...user, ...editFormData }
          : user
      ));
      
      setEditingUser(null);
    } catch (error) {
      console.error('Error updating user:', error);
      alert(error.response?.data?.message || 'Failed to update user');
    }
  };

  const handleDeleteClick = (userId) => {
    setConfirmDelete(userId);
  };

  const handleConfirmDelete = async () => {
    try {
      await axios.delete(
        `${API_BASE_URL}/api/admin/users/${confirmDelete}`,
        { headers: { Authorization: `Bearer ${currentUser.token}` } }
      );
      
      setUsers(users.filter(user => user._id !== confirmDelete));
      setConfirmDelete(null);
    } catch (error) {
      console.error('Error deleting user:', error);
      alert(error.response?.data?.message || 'Failed to delete user');
      setConfirmDelete(null);
    }
  };

  const handleCancelEdit = () => {
    setEditingUser(null);
  };

  if (loading) {
    return <div className="admin-loading">Loading users...</div>;
  }

  if (error) {
    return <div className="admin-error">Error: {error}</div>;
  }

  return (
    <div className="user-management">
      <h1>User Management</h1>
      
      <div className="users-table-container">
        <table className="users-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Admin</th>
              <th>Created</th>
              <th>Last Login</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user._id} className={user._id === currentUser._id ? 'current-user' : ''}>
                <td>
                  {editingUser === user._id ? (
                    <input
                      type="text"
                      name="name"
                      value={editFormData.name}
                      onChange={handleEditChange}
                    />
                  ) : (
                    <>{user.name} {user._id === currentUser._id && '(You)'}</>
                  )}
                </td>
                <td>
                  {editingUser === user._id ? (
                    <input
                      type="email"
                      name="email"
                      value={editFormData.email}
                      onChange={handleEditChange}
                    />
                  ) : (
                    user.email
                  )}
                </td>
                <td>
                  {editingUser === user._id ? (
                    <input
                      type="checkbox"
                      name="isAdmin"
                      checked={editFormData.isAdmin}
                      onChange={handleEditChange}
                    />
                  ) : (
                    user.isAdmin ? 'Yes' : 'No'
                  )}
                </td>
                <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                <td>
                  {user.lastLogin 
                    ? new Date(user.lastLogin).toLocaleString() 
                    : 'Never'
                  }
                </td>
                <td>
                  {editingUser === user._id ? (
                    <div className="edit-actions">
                      <button className="save-btn" onClick={handleUpdateUser}>
                        Save
                      </button>
                      <button className="cancel-btn" onClick={handleCancelEdit}>
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="row-actions">
                      <button 
                        className="edit-btn"
                        onClick={() => handleEditClick(user)}
                      >
                        Edit
                      </button>
                      {user._id !== currentUser._id && (
                        <button 
                          className="delete-btn"
                          onClick={() => handleDeleteClick(user._id)}
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center' }}>
                  No users found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {confirmDelete && (
        <div className="delete-modal">
          <div className="delete-modal-content">
            <h3>Confirm Delete</h3>
            <p>Are you sure you want to delete this user? This will also remove all their tasks.</p>
            <p>This action cannot be undone.</p>
            <div className="delete-modal-actions">
              <button 
                className="delete-confirm-btn"
                onClick={handleConfirmDelete}
              >
                Yes, Delete User
              </button>
              <button 
                className="delete-cancel-btn"
                onClick={() => setConfirmDelete(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserManagement;
