import React, { useEffect } from 'react';
import './Notification.css';

function Notification({ message, type, onClose }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 5000);

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`notification ${type}`}>
      {type === 'success' && message.includes('Completed') && (
        <div className="celebration">
          🎉✨🎊
        </div>
      )}
      <p>{message}</p>
    </div>
  );
}

export default Notification;