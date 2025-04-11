import React, { useState } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import './AiTaskInput.css';

function AiTaskInput({ taskType, onTaskGenerated }) {
  const [userInput, setUserInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [showGuidance, setShowGuidance] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!userInput.trim()) {
      setError('Please enter a task description');
      return;
    }

    setIsProcessing(true);
    setError('');
    
    try {
      // Add a timeout to abort the request if it takes too long
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      
      const { data } = await axios.post(`${API_BASE_URL}/api/ai/process-task`, 
        { userInput, taskType },
        { signal: controller.signal }
      );
      
      clearTimeout(timeoutId);
      
      if (data.success && data.taskData) {
        console.log('AI task data received:', data.taskData);
        
        // Process the task data and pass it to the parent component
        onTaskGenerated(data.taskData);
        setUserInput('');
      } else {
        setError('Failed to process your description. Please try again with more details.');
        console.error('Invalid response format:', data);
      }
    } catch (error) {
      console.error('AI processing error:', error);
      
      let errorMsg = error.response?.data?.message || 'Error processing your request';
      if (error.name === 'AbortError') {
        errorMsg = 'Request timed out. Please try again or use simpler language.';
      }
      
      setError(errorMsg);
      
      // Try direct client-side parsing as a fallback
      const directParsed = parseInputDirectly(userInput, taskType);
      if (directParsed) {
        console.log('Using direct client-side parsing as fallback:', directParsed);
        onTaskGenerated(directParsed);
        setUserInput('');
        setError(''); // Clear the error if we found a fallback
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // Direct parsing function for simple recurring task inputs
  const parseInputDirectly = (input, type) => {
    if (type !== 'recurring') return null;
    
    // Match patterns like "Study X daily/weekly from TIME starting DATE until DATE"
    const recurringPattern = /study\s+(\w+)(?:\s+daily|\s+every\s+day)(?:\s+from\s+(\d{1,2}(?::\d{2})?\s*(?:am|pm)))?(?:\s+starting\s+(?:(\w+)\s+(\d{1,2})|\s*(\d{1,2})\s+(\w+)),?\s+(\d{4}))?(?:\s+until\s+(?:(\w+)\s+(\d{1,2})|\s*(\d{1,2})\s+(\w+)),?\s+(\d{4}))?/i;
    
    const match = input.match(recurringPattern);
    if (match) {
      // Extract subject
      const subject = match[1];
      
      // Extract time
      let time = "10:00 PM"; // Default
      if (match[2]) {
        const timeStr = match[2].trim();
        time = timeStr.toUpperCase();
        if (!time.includes(':')) {
          const hour = parseInt(time);
          time = `${hour}:00 ${time.includes('PM') ? 'PM' : 'AM'}`;
        }
      }
      
      // Set default dates (today to a week from today)
      const today = new Date();
      const nextWeek = new Date();
      nextWeek.setDate(today.getDate() + 7);
      
      // Default start and end dates
      let startDate = today.toISOString().split('T')[0];
      let endDate = nextWeek.toISOString().split('T')[0];
      
      // Process date information if available
      const months = {
        'january': 0, 'february': 1, 'march': 2, 'april': 3, 'may': 4, 'june': 5,
        'july': 6, 'august': 7, 'september': 8, 'october': 9, 'november': 10, 'december': 11,
        'jan': 0, 'feb': 1, 'mar': 2, 'apr': 3, /* remove duplicate 'may' */ 'jun': 5,
        'jul': 6, 'aug': 7, 'sep': 8, 'oct': 9, 'nov': 10, 'dec': 11
      };
      
      // Try to extract start date
      let startYear = today.getFullYear();
      if (match[7]) startYear = parseInt(match[7]);
      
      if ((match[3] && match[4]) || (match[5] && match[6])) {
        let startMonth, startDay;
        
        if (match[3] && match[4]) {
          startMonth = months[match[3].toLowerCase()];
          startDay = parseInt(match[4]);
        } else {
          startMonth = months[match[6].toLowerCase()];
          startDay = parseInt(match[5]);
        }
        
        if (startMonth !== undefined && !isNaN(startDay)) {
          const startDateObj = new Date(startYear, startMonth, startDay);
          startDate = startDateObj.toISOString().split('T')[0];
        }
      }
      
      // Try to extract end date
      let endYear = startYear;
      if (match[12]) endYear = parseInt(match[12]);
      
      if ((match[8] && match[9]) || (match[10] && match[11])) {
        let endMonth, endDay;
        
        if (match[8] && match[9]) {
          endMonth = months[match[8].toLowerCase()];
          endDay = parseInt(match[9]);
        } else {
          endMonth = months[match[11].toLowerCase()];
          endDay = parseInt(match[10]);
        }
        
        if (endMonth !== undefined && !isNaN(endDay)) {
          const endDateObj = new Date(endYear, endMonth, endDay);
          endDate = endDateObj.toISOString().split('T')[0];
        }
      }
      
      return {
        title: `Study ${subject}`,
        priority: "medium",
        recurrenceType: "daily",
        startDate: startDate,
        endDate: endDate,
        dailyDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
        startTime: time
      };
    }
    
    // If no match, try a more general pattern for other recurring tasks
    const generalPattern = /(.*?)(?:every|daily|weekly|monthly)(?:.*?)(?:at\s+(\d{1,2}(?::\d{2})?\s*(?:am|pm)))?/i;
    const generalMatch = input.match(generalPattern);
    
    if (generalMatch) {
      const title = generalMatch[1].trim() || "New recurring task";
      let time = "10:00 PM";
      
      if (generalMatch[2]) {
        time = generalMatch[2].trim().toUpperCase();
        if (!time.includes(':')) {
          const hour = parseInt(time);
          time = `${hour}:00 ${time.includes('PM') ? 'PM' : 'AM'}`;
        }
      }
      
      return {
        title: title,
        priority: "medium",
        recurrenceType: "daily",
        startDate: today.toISOString().split('T')[0],
        endDate: nextWeek.toISOString().split('T')[0],
        dailyDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
        startTime: time
      };
    }
    
    return null;
  };

  return (
    <div className="ai-task-input">
      <div className="ai-header">
        <span className="ai-icon">🧠</span>
        <h3>AI Task Assistant</h3>
        <button 
          type="button" 
          className="guidance-toggle"
          onClick={() => setShowGuidance(!showGuidance)}
        >
          {showGuidance ? 'Hide Tips' : 'Show Tips'}
        </button>
      </div>
      
      {showGuidance && (
        <div className="ai-guidance">
          <h4>How to create tasks:</h4>
          <ul>
            <li><strong>Simple tasks:</strong> "Visit bank today at 3 PM"</li>
            <li><strong>Day-specific tasks:</strong> "Submit homework on Monday"</li>
            <li><strong>Recurring tasks:</strong> "Study DSA daily from 10 PM starting April 11 until April 15"</li>
          </ul>
        </div>
      )}
      
      {error && <div className="ai-error">{error}</div>}
      
      <form onSubmit={handleSubmit}>
        <textarea
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          placeholder={taskType === 'regular' 
            ? "Describe your task (e.g., 'Visit bank tomorrow at 3 PM')" 
            : "Describe your recurring task (e.g., 'Study DSA daily from 10 PM starting April 11 until April 15')"}
          disabled={isProcessing}
          rows={3}
        />
        
        <button 
          type="submit" 
          className="ai-process-btn"
          disabled={isProcessing}
        >
          {isProcessing ? 'Processing...' : 'Generate Task'}
        </button>
      </form>
    </div>
  );
}

export default AiTaskInput;
