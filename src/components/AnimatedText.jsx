import React, { useState, useEffect } from 'react';
import './AnimatedText.css';

function AnimatedText({ messages, interval = 3000 }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex(prevIndex => (prevIndex + 1) % messages.length);
    }, interval);
    
    return () => clearInterval(timer);
  }, [messages, interval]);

  return (
    <span className="animated-text">
      {messages[currentIndex]}
    </span>
  );
}

export default AnimatedText;
