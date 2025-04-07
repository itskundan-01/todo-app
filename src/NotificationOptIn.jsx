import React, { useState, useEffect, useRef } from 'react';

function NotificationOptIn() {
  const [isOptedIn, setIsOptedIn] = useState(null);
  const notificationBtnRef = useRef(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    if (window.OneSignal) {
      window.OneSignal.push(() => {
        window.OneSignal.isPushNotificationsEnabled((enabled) => {
          setIsOptedIn(enabled);
        });
      });
    }
  }, []);

  useEffect(() => {
    function handleClickOutside(event) {
      if (showPrompt && notificationBtnRef.current && 
          !notificationBtnRef.current.contains(event.target)) {
        setShowPrompt(false);
      }
    }
    
    // Add event listener
    document.addEventListener('mousedown', handleClickOutside);
    
    // Cleanup
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showPrompt]);

  const handleEnableNotifications = () => {
    setShowPrompt(true);
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
      ref={notificationBtnRef}
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