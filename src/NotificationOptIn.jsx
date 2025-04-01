import React, { useState, useEffect } from 'react';

function NotificationOptIn() {
  const [isOptedIn, setIsOptedIn] = useState(null);

  useEffect(() => {
    if (window.OneSignal) {
      window.OneSignal.push(() => {
        window.OneSignal.isPushNotificationsEnabled((enabled) => {
          setIsOptedIn(enabled);
        });
      });
    }
  }, []);

  const handleEnableNotifications = () => {
    if (window.OneSignal) {
      window.OneSignal.push(() => {
        window.OneSignal.showNativePrompt();
      });
    }
  };

  // Show the button only if notifications aren't enabled
  if (isOptedIn) return null;

  return (
    <button 
      onClick={handleEnableNotifications}
      style={{
        position: 'fixed',
        bottom: '80px',
        right: '20px',
        backgroundColor: '#6f19d2',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        padding: '10px 15px',
        boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        fontSize: '14px',
      }}
    >
      <span style={{ fontSize: '18px' }}>🔔</span>
      Enable Notifications
    </button>
  );
}

export default NotificationOptIn;