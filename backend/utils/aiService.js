const axios = require('axios');
require('dotenv').config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

/**
 * Process natural language input to extract task information
 * @param {string} userInput - User's natural language description
 * @param {string} taskType - 'regular' or 'recurring'
 * @param {boolean} hasMultipleTasks - Whether to parse multiple tasks
 */
const processTaskDescription = async (userInput, taskType, hasMultipleTasks = false) => {
  try {
    // First, attempt direct pattern matching for simple tasks
    const directMatch = attemptDirectPatternMatch(userInput, taskType);
    if (directMatch) {
      console.log('Direct pattern match successful:', directMatch);
      return { success: true, data: directMatch };
    }

    // Create prompt based on task type
    const prompt = createPrompt(userInput, taskType, hasMultipleTasks);
    
    // Log the API key (first few characters) for debugging
    const apiKeyPrefix = GEMINI_API_KEY ? GEMINI_API_KEY.substring(0, 5) + '...' : 'undefined';
    console.log(`Sending request to Gemini API with taskType: ${taskType}, hasMultipleTasks: ${hasMultipleTasks}, API key prefix: ${apiKeyPrefix}`);
    
    // Call the Gemini API
    const response = await axios.post(
      `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
      {
        contents: [{
          parts: [{
            text: prompt
          }]
        }]
      }
    );
    
    // Extract the generated text from the response
    const generatedText = response.data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    console.log(`Gemini response received: ${generatedText?.substring(0, 100)}...`);
    
    // Parse the JSON from the response
    try {
      // Clean up the response text - remove markdown code blocks if present
      const cleanedText = generatedText.replace(/```json\s*|\s*```/g, '');
      const jsonText = cleanedText.trim();
      
      const parsedData = JSON.parse(jsonText);
      
      // Validate and fix dates to ensure they are not in the past
      const validatedData = validateAndFixDates(parsedData);
      
      // Additional validation for weekly tasks to ensure days are properly set
      if (validatedData.recurrenceType === 'weekly') {
        // Extract days from the recurrenceDetails if they exist
        if (validatedData.recurrenceDetails && Array.isArray(validatedData.recurrenceDetails.days) && 
            validatedData.recurrenceDetails.days.length > 0) {
          validatedData.weeklyDays = validatedData.recurrenceDetails.days;
        }
        
        // If no weeklyDays found in recurrenceDetails or directly, try to extract from input
        if (!validatedData.weeklyDays || validatedData.weeklyDays.length === 0) {
          validatedData.weeklyDays = extractDaysFromInput(userInput);
        }
      }
      
      // For regular tasks with "tomorrow", ensure isRecurring is false
      if (taskType === 'regular' && userInput.toLowerCase().includes('tomorrow')) {
        if (validatedData.isRecurring !== undefined) {
          validatedData.isRecurring = false;
        }
      }
      
      return {
        success: true,
        data: validatedData
      };
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError, 'Raw text:', generatedText);
      
      // Attempt a direct extraction as a fallback
      const fallbackTask = attemptDirectPatternMatch(userInput, taskType, true);
      if (fallbackTask) {
        console.log('Using fallback task creation:', fallbackTask);
        return {
          success: true,
          data: fallbackTask
        };
      }
      
      // Try adding missing brackets for arrays if needed
      try {
        // Try adding missing brackets for arrays if needed
        if (generatedText.includes('"text":') && !generatedText.startsWith('[') && !generatedText.startsWith('{')) {
          const fixedText = `[${generatedText}]`;
          return {
            success: true,
            data: JSON.parse(fixedText)
          };
        }
        
        return {
          success: false,
          error: 'Failed to understand task description - JSON parsing error'
        };
      } catch (e) {
        return {
          success: false,
          error: 'Failed to understand task description'
        };
      }
    }
  } catch (error) {
    console.error('AI processing error:', error?.response?.data || error.message);
    
    // Create emergency fallback task
    const fallbackTask = createEmergencyFallbackTask(userInput, taskType);
    if (fallbackTask) {
      return {
        success: true,
        data: fallbackTask,
        note: "Emergency fallback used due to API error"
      };
    }
    
    return {
      success: false,
      error: 'Error processing with AI: ' + (error?.response?.data?.error?.message || error.message)
    };
  }
};

/**
 * Create appropriate prompt for Gemini based on task type
 */
const createPrompt = (userInput, taskType, hasMultipleTasks) => {
  // Force multiple tasks detection for inputs that look like they contain multiple tasks
  if (!hasMultipleTasks) {
    const multiTaskIndicators = [
      /april \d+ and \d+/i,
      /and (a|an|the) \w+ (appointment|meeting|task)/i,
      /(\d+)(st|nd|rd|th)? and (\d+)(st|nd|rd|th)?/i,
      /multiple tasks/i,
      /(tomorrow|today) and/i,
      /\d+ tasks/i
    ];
    
    hasMultipleTasks = multiTaskIndicators.some(pattern => pattern.test(userInput));
  }

  // Get current date in YYYY-MM-DD format
  const currentDate = new Date().toISOString().split('T')[0];

  if (taskType === 'regular') {
    // Improved simpler prompt for regular tasks
    return `
      You are a task extraction assistant. Extract the following from this text:
      "${userInput}"
      
      - Task description (text)
      - Priority (low, medium, or high)
      - Date (YYYY-MM-DD format)
      - Time (h:mm AM/PM format)
      
      IMPORTANT: This is for a ONE-TIME TASK, not recurring. 
      If "tomorrow" is mentioned, use tomorrow's date.
      If specific time is mentioned, use that time, otherwise use 12:00 PM.
      
      Return ONLY a JSON object in this format with no explanation:
      {
        "text": "extracted task description",
        "priority": "medium",
        "date": "YYYY-MM-DD",
        "time": "h:mm AM/PM",
        "isRecurring": false
      }
    `;
  } else {
    // For recurring task
    return `
      You are a recurring task extraction assistant. 
      Extract a recurring pattern from this text: "${userInput}"
      
      Return ONLY a clean JSON object with these fields:
      {
        "title": "task description",
        "priority": "medium",
        "recurrenceType": "daily",
        "startDate": "YYYY-MM-DD",
        "dailyDays": ["Monday", "Wednesday", "Friday"],
        "startTime": "h:mm AM/PM"
      }
    `;
  }
};

/**
 * Try to extract task directly using pattern matching
 */
const attemptDirectPatternMatch = (userInput, taskType, isFallback = false) => {
  const input = userInput.toLowerCase();
  
  if (taskType === 'regular') {
    // Extract task text (keep original case)
    let taskText = userInput;
    
    // Extract priority
    let priority = "medium";
    if (input.includes("high priority") || input.includes("urgent")) {
      priority = "high";
    } else if (input.includes("low priority")) {
      priority = "low";
    }
    
    // Extract date
    let taskDate;
    const today = new Date();
    
    if (input.includes("tomorrow")) {
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      taskDate = tomorrow.toISOString().split('T')[0];
    } else if (input.includes("today")) {
      taskDate = today.toISOString().split('T')[0];
    } else {
      // Default to today
      taskDate = today.toISOString().split('T')[0];
    }
    
    // Extract time
    let taskTime = "12:00 PM"; // Default
    const timeRegex = /\b(at|by|around|from)\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm|a\.m\.|p\.m\.)/i;
    const timeMatch = userInput.match(timeRegex);
    if (timeMatch) {
      const hour = parseInt(timeMatch[2]);
      const minute = timeMatch[3] ? parseInt(timeMatch[3]) : 0;
      const period = timeMatch[4].toLowerCase().replace('.', '');
      
      taskTime = `${hour}:${minute.toString().padStart(2, '0')} ${period.substring(0, 2).toUpperCase()}`;
    }
    
    // Clean up the task text by removing time and date references
    if (isFallback) {
      // Keep the full text for fallback mode
      taskText = userInput;
    } else {
      const dateTimeRegex = /(tomorrow|today|at\s+\d{1,2}(?::\d{2})?\s*(?:am|pm|a\.m\.|p\.m\.))/i;
      taskText = userInput.replace(dateTimeRegex, '').trim();
      
      // If the cleanup made the text too short, use the main part
      if (taskText.length < 5) {
        const firstPart = userInput.split(/\b(at|tomorrow|today)\b/i)[0].trim();
        taskText = firstPart || userInput;
      }
    }

    // Create the task object
    return {
      text: taskText,
      priority,
      date: taskDate,
      time: taskTime,
      isRecurring: false
    };
  }
  
  return null; // Not handling recurring tasks with direct patterns
};

/**
 * Create emergency fallback task when everything else fails
 */
const createEmergencyFallbackTask = (userInput, taskType) => {
  const today = new Date();
  const todayFormatted = today.toISOString().split('T')[0];
  
  // Check for "tomorrow" to set date
  let taskDate = todayFormatted;
  if (userInput.toLowerCase().includes('tomorrow')) {
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    taskDate = tomorrow.toISOString().split('T')[0];
  }
  
  if (taskType === 'regular') {
    return {
      text: userInput,
      priority: "medium",
      date: taskDate,
      time: "12:00 PM",
      isRecurring: false
    };
  } else {
    return {
      title: userInput,
      priority: "medium",
      recurrenceType: "daily",
      startDate: todayFormatted,
      endDate: null,
      dailyDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      startTime: "09:00 AM"
    };
  }
};

/**
 * Validate and fix dates to ensure they're not in the past
 */
const validateAndFixDates = (data) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split('T')[0];
  
  // Process array of tasks
  if (Array.isArray(data)) {
    return data.map(task => {
      // Check and fix date
      if (task.date) {
        const taskDate = new Date(task.date);
        taskDate.setHours(0, 0, 0, 0);
        
        if (taskDate < today) {
          // If date is in the past, set it to today
          task.date = todayStr;
        }
      } else {
        task.date = todayStr;
      }
      return task;
    });
  } 
  // Process single task (regular or recurring)
  else {
    // For regular task
    if (data.date) {
      const taskDate = new Date(data.date);
      taskDate.setHours(0, 0, 0, 0);
      
      if (taskDate < today) {
        data.date = todayStr;
      }
    } else if (data.startDate) {
      // For recurring task - check start date
      const startDate = new Date(data.startDate);
      startDate.setHours(0, 0, 0, 0);
      
      if (startDate < today) {
        data.startDate = todayStr;
      }
    }
  }
  
  return data;
};

/**
 * Extract day names from input text
 */
const extractDaysFromInput = (input) => {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const foundDays = [];
  
  const lowerInput = input.toLowerCase();
  
  for (const day of days) {
    if (lowerInput.includes(day.toLowerCase())) {
      foundDays.push(day);
    }
    // Check for abbreviations (Mon, Tue, etc.)
    else if (lowerInput.includes(day.toLowerCase().substring(0, 3))) {
      foundDays.push(day);
    }
  }
  
  return foundDays.length > 0 ? foundDays : ['Monday', 'Wednesday', 'Friday'];
};

module.exports = { processTaskDescription };
