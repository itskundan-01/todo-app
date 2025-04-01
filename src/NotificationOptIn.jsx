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
    <button onClick={handleEnableNotifications}>
      Enable Notifications
    </button>
  );
}

export default NotificationOptIn;