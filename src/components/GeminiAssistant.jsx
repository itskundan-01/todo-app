import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import './GeminiAssistant.css';

function TaskBot({ taskType, onTaskGenerated }) {
  const [userInput, setUserInput] = useState('');
  const [conversation, setConversation] = useState([
    { 
      sender: 'bot', 
      text: `Hi! I'm TaskBot. Tell me what you need to do${taskType === 'recurring' ? ' on a recurring basis' : ''}, and I'll help you set it up.`
    }
  ]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [pendingTask, setPendingTask] = useState(null);
  const [waitingForDate, setWaitingForDate] = useState(false);
  const [waitingForTime, setWaitingForTime] = useState(false);
  const messagesEndRef = useRef(null);

  // Scroll to bottom of chat whenever conversation updates
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [conversation]);

  // Format task details for display in the chat
  const formatTaskForDisplay = (task, type) => {
    if (type === 'regular') {
      return `"${task.text}" on ${task.date} at ${task.time} (${task.priority} priority)`;
    } else {
      // Format recurring task details
      return `"${task.title}" - ${task.recurrenceType} task`;
    }
  };

  // Function to validate if a task has all required fields
  const validateTask = (task, type) => {
    const missingFields = [];
    
    if (type === 'regular') {
      if (!task.text || task.text.trim() === '') missingFields.push('description');
      if (!task.date) missingFields.push('date');
      if (!task.time) missingFields.push('time');
    } else {
      if (!task.title || task.title.trim() === '') missingFields.push('title');
      if (!task.recurrenceType) missingFields.push('recurrence pattern');
      if (!task.startDate) missingFields.push('start date');
    }
    
    return {
      isValid: missingFields.length === 0,
      missingFields
    };
  };

  // Detect date information in user input
  const detectDateInfo = (input) => {
    input = input.toLowerCase();

    // Check for 'tomorrow'
    if (input.includes('tomorrow')) {
      const today = new Date();

      // Adjust for IST timezone (UTC+5:30)
      const istOffset = 5.5 * 60 * 60 * 1000; // 5 hours 30 minutes in milliseconds
      const istNow = new Date(today.getTime() + istOffset);

      const tomorrow = new Date(istNow);
      tomorrow.setDate(istNow.getDate() + 1);

      return {
        hasDate: true,
        date: tomorrow.toISOString().split('T')[0],
        isExplicit: true
      };
    }

    // Basic date detection logic
    return { hasDate: false };
  };

  // Extract time information from user input
  const extractTimeInfo = (input) => {
    input = input.toLowerCase();
    
    // Simple time pattern matching
    const timePattern = /\b(at|by|around|from)?\s*(\d{1,2})(:\d{2})?\s*(am|pm)\b/i;
    const match = input.match(timePattern);
    
    if (match) {
      let hour = parseInt(match[2]);
      const minutes = match[3] ? match[3].substring(1) : '00';
      const period = match[4].toLowerCase();
      
      if (period === 'pm' && hour < 12) hour += 12;
      if (period === 'am' && hour === 12) hour = 0;
      
      return {
        hasTime: true,
        time: `${hour}:${minutes} ${period.toUpperCase()}`,
        isExplicit: true
      };
    }
    
    return { hasTime: false };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!userInput.trim()) {
      return;
    }

    // Add user message to conversation
    setConversation(prevConversation => [
      ...prevConversation, 
      { sender: 'user', text: userInput }
    ]);
    
    // Check if we're in a follow-up question flow
    if (waitingForDate && pendingTask) {
      // User is providing a date in response to our question
      handleDateResponse(userInput);
      setUserInput('');
      return;
    }
    
    if (waitingForTime && pendingTask) {
      // User is providing a time in response to our question
      handleTimeResponse(userInput);
      setUserInput('');
      return;
    }
    
    setIsProcessing(true);
    setError('');
    
    try {
      // Add thinking indicator
      setConversation(prevConversation => [
        ...prevConversation,
        { sender: 'bot', text: '...', isThinking: true }
      ]);
      
      console.log('Sending AI request with input:', userInput);
      
      // Include explicit date instructions in the prompt
      const dateInstruction = "Be specific about date and time. If the task mentions 'tomorrow', use tomorrow's actual date.";
      
      const promptTemplate = taskType === 'recurring' 
        ? `Create a ${taskType} task from the following description. Do not include priority information. ${dateInstruction}: ${userInput}`
        : `Create a ${taskType} task from the following description. ${dateInstruction}: ${userInput}`;
      
      const { data } = await axios.post(`${API_BASE_URL}/api/ai/process-task`, {
        userInput: promptTemplate,
        taskType
      });
      
      // Remove thinking indicator
      setConversation(prevConversation => 
        prevConversation.filter(msg => !msg.isThinking)
      );
      
      if (data.success) {
        const tasks = data.taskData;
        
        // Check if valid task data was returned (array or single object)
        if ((Array.isArray(tasks) && tasks.length > 0) || 
            (tasks && typeof tasks === 'object' && (tasks.title || tasks.text))) {
          
          // Convert single task to array for uniform processing
          const taskArray = Array.isArray(tasks) ? tasks : [tasks];
          
          // Check for missing information in the first task
          const task = taskArray[0];
          
          // Enhance task with date/time from user input if AI missed it
          const dateInfo = detectDateInfo(userInput);
          const timeInfo = extractTimeInfo(userInput);
          
          // If user mentioned tomorrow but AI didn't set correct date, override it
          if (dateInfo.hasDate && dateInfo.isExplicit && taskType === 'regular') {
            console.log("User explicitly mentioned a date. Overriding AI date with:", dateInfo.date);
            task.date = dateInfo.date;
          }
          
          if (timeInfo.hasTime && timeInfo.isExplicit && taskType === 'regular') {
            console.log("User explicitly mentioned a time. Setting time to:", timeInfo.time);
            task.time = timeInfo.time;
          }
          
          // Validate if task has all required fields
          const validation = validateTask(task, taskType);
          
          if (!validation.isValid) {
            // Store the pending task and ask follow-up questions
            setPendingTask(task);
            
            if (validation.missingFields.includes('date')) {
              askForDate(task);
              return;
            } else if (validation.missingFields.includes('time')) {
              askForTime(task);
              return;
            }
          }
          
          // If we get here, task is valid
          completeTaskCreation(taskArray);
        } else {
          // Handle empty or invalid response
          setConversation(prevConversation => [
            ...prevConversation,
            { 
              sender: 'bot',
              text: "I couldn't create a valid task from that input. Please try again with more details about what you want to do, when it needs to be done, and any other relevant details."
            }
          ]);
          setError(data.message || 'Failed to process your request');
        }
      }
    } catch (error) {
      console.error('AI processing error:', error);
      
      // Create a more user-friendly error message based on the error type
      let errorMessage;
      if (error.code === 'ERR_NETWORK') {
        errorMessage = 'Unable to connect to the server. Please check your internet connection and try again.';
      } else if (error.response?.status === 400) {
        errorMessage = error.response?.data?.message || 'I had trouble understanding your request. Could you rephrase it?';
      } else if (error.response?.status === 500) {
        errorMessage = 'The server encountered an issue. Our team is looking into it. Please try again later.';
      } else {
        errorMessage = 'Sorry, I encountered a technical issue. Please try again.';
      }
      
      setError(errorMessage);
      
      // Add error message to conversation
      setConversation(prevConversation => [
        ...prevConversation,
        { 
          sender: 'bot', 
          text: errorMessage,
          isError: true
        }
      ]);
    } finally {
      setIsProcessing(false);
      setUserInput('');
    }
  };

  // Ask user for the date
  const askForDate = (task) => {
    setWaitingForDate(true);
    setConversation(prevConversation => [
      ...prevConversation,
      { 
        sender: 'bot', 
        text: `I need to know when this task "${task.text || task.title}" should be scheduled. Please enter a date (e.g., "tomorrow", "April 15", or "2025-04-20").`
      }
    ]);
    setIsProcessing(false);
  };

  // Ask user for the time
  const askForTime = (task) => {
    setWaitingForTime(true);
    setConversation(prevConversation => [
      ...prevConversation,
      { 
        sender: 'bot', 
        text: `What time should I schedule "${task.text || task.title}" for? Please enter a time (e.g., "10 AM", "3:30 PM").`
      }
    ]);
    setIsProcessing(false);
  };

  // Handle date response from user
  const handleDateResponse = (input) => {
    const task = {...pendingTask};
    setWaitingForDate(false);
    
    // Process the date input
    let dateValue = "";
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Handle "tomorrow"
    if (input.toLowerCase().includes("tomorrow")) {
      dateValue = tomorrow.toISOString().split('T')[0];
    } 
    // Handle other date formats
    else {
      try {
        const parsedDate = new Date(input);
        if (!isNaN(parsedDate.getTime())) {
          dateValue = parsedDate.toISOString().split('T')[0];
        } else {
          // If parsing fails, default to tomorrow
          dateValue = tomorrow.toISOString().split('T')[0];
        }
      } catch (e) {
        dateValue = tomorrow.toISOString().split('T')[0];
      }
    }
    
    task.date = dateValue;
    
    // Check if we still need time
    if (!task.time) {
      setPendingTask(task);
      askForTime(task);
    } else {
      // We have all the info, complete the task
      setPendingTask(null);
      completeTaskCreation([task]);
    }
  };

  // Handle time response from user
  const handleTimeResponse = (input) => {
    const task = {...pendingTask};
    setWaitingForTime(false);
    
    // Default time if parsing fails
    let timeValue = "12:00 PM";
    
    // Try to extract time from input
    const timeInfo = extractTimeInfo(input);
    if (timeInfo.hasTime) {
      timeValue = timeInfo.time;
    } else {
      // Simple time pattern matching for direct input
      const timePattern = /(\d{1,2})(?::(\d{2}))?\s*(am|pm)/i;
      const match = input.match(timePattern);
      
      if (match) {
        let hour = parseInt(match[1]);
        const minutes = match[2] || "00";
        const period = match[3].toUpperCase();
        
        timeValue = `${hour}:${minutes} ${period}`;
      }
    }
    
    task.time = timeValue;
    setPendingTask(null);
    
    // We have all the info, complete the task
    completeTaskCreation([task]);
  };

  // Final step to create the task with all required information
  const completeTaskCreation = (taskArray) => {
    // Format the response message
    let responseText = `I've prepared ${taskArray.length} task${taskArray.length > 1 ? 's' : ''} for you:\n`;
    taskArray.forEach((task, index) => {
      responseText += `\n${index + 1}. ${formatTaskForDisplay(task, taskType)}`;
    });
    
    // Add confirmation message
    setConversation(prevConversation => [
      ...prevConversation,
      { sender: 'bot', text: responseText }
    ]);
    
    // Send the completed task to parent component
    console.log('Task data sent to parent:', JSON.stringify(taskArray.length === 1 ? taskArray[0] : taskArray));
    onTaskGenerated(taskArray.length === 1 ? taskArray[0] : taskArray);
  };

  return (
    <div className="taskbot">
      <div className="assistant-header">
        <img src="/gemini_icon.png" alt="TaskBot" className="gemini-icon-image" />
        <span>TaskBot</span>
      </div>
      
      <div className="conversation">
        {conversation.map((msg, index) => (
          <div 
            key={index} 
            className={`message ${msg.sender} ${msg.isThinking ? 'thinking' : ''} ${msg.isError ? 'error' : ''}`}
          >
            {msg.sender === 'bot' && (
              <div className="bot-icon">
                <img src="/gemini_icon.png" alt="TaskBot" className="gemini-icon-image" />
              </div>
            )}
            <div className="message-content">
              {msg.isThinking ? (
                <div className="thinking-animation">
                  <span>•</span><span>•</span><span>•</span>
                </div>
              ) : (
                msg.text.split('\n').map((line, i) => (
                  <React.Fragment key={i}>
                    {line}
                    {i !== msg.text.split('\n').length - 1 && <br />}
                  </React.Fragment>
                ))
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      
      <form onSubmit={handleSubmit} className="message-input">
        <textarea
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          placeholder={
            waitingForDate ? "Enter the date (e.g., tomorrow, April 15)" : 
            waitingForTime ? "Enter the time (e.g., 10 AM, 3:30 PM)" :
            taskType === 'regular' 
              ? "Describe your task (e.g., 'Submit Math Assignment by 25 January at 3 PM')" 
              : "Describe your recurring task (e.g., 'Weekly team meeting every Tuesday at 10 AM')"
          }
          disabled={isProcessing}
          rows={2}
        />
        <button type="submit" disabled={isProcessing || !userInput.trim()}>
          {isProcessing ? 'Processing...' : 'Send'}
        </button>
      </form>
    </div>
  );
}

export default TaskBot;
