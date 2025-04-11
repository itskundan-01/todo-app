const { GoogleGenerativeAI } = require('@google/generative-ai');

/**
 * Process natural language input and return structured task data
 */
const processTaskInput = async (req, res) => {
  try {
    const { userInput, taskType } = req.body;
    
    if (!userInput) {
      return res.status(400).json({ success: false, message: 'User input is required' });
    }
    
    console.log(`Processing task input: "${userInput}", type: ${taskType}`);
    
    // First try direct pattern matching - fastest and most reliable for simple cases
    const directMatch = extractTaskDirectly(userInput, taskType);
    if (directMatch) {
      console.log('Direct pattern match successful:', directMatch);
      return res.json({ success: true, taskData: directMatch });
    }
    
    // Only if direct extraction fails, try using AI
    try {
      // Configure the AI model
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
      
      // Create prompt based on task type
      const prompt = createPrompt(userInput, taskType);
      
      // Generate content with the prompt
      const result = await model.generateContent(prompt);
      const responseText = result.response.text();
      
      console.log('AI response:', responseText);
      
      // Try to parse the AI response
      try {
        // Extract JSON from the response
        const parsedResponse = parseAIResponse(responseText);
        
        // Format AI response for recurring tasks
        if (taskType === 'recurring') {
          // Force priority to low
          parsedResponse.priority = 'low';
          
          // Handle case where weekly days are in dailyDays
          if (parsedResponse.recurrenceType === 'weekly' && parsedResponse.dailyDays && !parsedResponse.weeklyDays) {
            parsedResponse.weeklyDays = parsedResponse.dailyDays;
            delete parsedResponse.dailyDays;
          }
        }
        
        return res.json({ success: true, taskData: parsedResponse });
      } catch (parseError) {
        // If AI parsing fails, fall back to direct extraction with emergency mode
        console.error('Error parsing AI response:', parseError);
        const fallback = extractTaskDirectly(userInput, taskType, true);
        
        if (fallback) {
          // Force priority to low for recurring tasks
          if (taskType === 'recurring') {
            fallback.priority = 'low';
          }
          
          return res.json({
            success: true, 
            taskData: fallback,
            note: "Used fallback parsing due to AI response error"
          });
        }
        
        throw parseError; // Re-throw to trigger the next fallback
      }
    } catch (aiError) {
      console.error('AI processing failed:', aiError);
      // Create a basic emergency task as last resort
      const emergencyTask = createEmergencyTask(userInput, taskType);
      return res.json({ 
        success: true, 
        taskData: emergencyTask,
        note: "Used emergency task creation due to AI error"
      });
    }
  } catch (error) {
    console.error('Request processing error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Error processing task request',
      error: error.message 
    });
  }
};

/**
 * Create a prompt for the AI model based on task type
 */
function createPrompt(userInput, taskType) {
  if (taskType === 'regular') {
    return `
      Extract a task from this text: "${userInput}"
      
      Return ONLY a JSON object with this exact structure:
      {
        "text": "brief task description",
        "priority": "low/medium/high",
        "date": "YYYY-MM-DD",
        "time": "h:mm AM/PM",
        "isRecurring": false
      }
      
      RULES:
      - Keep the task text short and clear
      - If "tomorrow" is mentioned, use tomorrow's date
      - If specific time is mentioned, use that time, otherwise use "12:00 PM"
      - Never set isRecurring to true unless explicitly requested with words like "every day"
      - Return ONLY the JSON with no additional text
      - Always use the current year (${new Date().getFullYear()}) for dates
    `;
  } else {
    return `
      Extract a recurring task pattern from this text: "${userInput}"
      
      Return ONLY a JSON object with this exact structure:
      {
        "title": "brief task description",
        "priority": "medium",
        "recurrenceType": "daily/weekly/monthly",
        "startDate": "YYYY-MM-DD",
        "endDate": "YYYY-MM-DD",
        "dailyDays": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
        "startTime": "h:mm AM/PM"
      }
      
      RULES:
      - Extract start and end dates if a date range is specified (like "from April 12 to April 15")
      - If "everyday" or "daily" is mentioned, include all days of the week in dailyDays array
      - Always use the current year (${new Date().getFullYear()}) for dates
      - If a specific time is mentioned, use that time, otherwise use "12:00 PM"
      - Keep the task title short and clear
    `;
  }
}

/**
 * Parse AI response and extract the JSON structure
 */
function parseAIResponse(responseText) {
  // First look for JSON structure in the response
  try {
    // Try to find content within code blocks (```json ... ```)
    const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (jsonMatch && jsonMatch[1]) {
      return JSON.parse(jsonMatch[1].trim());
    }
    
    // Try to find content within curly braces (complete JSON objects)
    const curlyMatch = responseText.match(/{[\s\S]*}/);
    if (curlyMatch) {
      return JSON.parse(curlyMatch[0]);
    }
    
    // If all else fails, try parsing the whole response
    return JSON.parse(responseText);
  } catch (parseError) {
    console.error('Failed to parse AI response:', parseError);
    throw new Error('Could not extract valid JSON from AI response');
  }
}

/**
 * Extract task directly using pattern matching - very reliable for simple cases
 */
function extractTaskDirectly(userInput, taskType, isEmergency = false) {
  try {
    const input = userInput.toLowerCase();
    
    // Skip direct extraction for complex instructions
    if (input.startsWith('create a') && input.includes('following description') && !isEmergency) {
      return null;
    }
    
    // Extract task text (keep original case)
    let taskText = userInput;
    let cleanedText = taskText;
    
    // Extract priority
    let priority = "medium";
    if (input.includes("high priority") || input.includes("urgent") || input.includes("important")) {
      priority = "high";
    } else if (input.includes("low priority") || input.includes("not urgent")) {
      priority = "low";
    }
    
    // Extract date
    let taskDate;
    const today = new Date();
    const currentYear = today.getFullYear();
    
    // Extract date range (for recurring tasks)
    let endDate = null;
    const dateRangeRegex = /from\s+(\d{1,2})\s*(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|january|february|march|april|may|june|july|august|september|october|november|december)(?:\s*\d{4})?\s+to\s+(\d{1,2})\s*(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|january|february|march|april|may|june|july|august|september|october|november|december)(?:\s*\d{4})?/i;
    const dateRangeMatch = input.match(dateRangeRegex);
    
    if (dateRangeMatch) {
      const months = {
        jan: 0, january: 0, feb: 1, february: 1, mar: 2, march: 2,
        apr: 3, april: 3, may: 4, jun: 5, june: 5, jul: 6, july: 6,
        aug: 7, august: 7, sep: 8, september: 8, oct: 9, october: 9,
        nov: 10, november: 10, dec: 11, december: 11
      };
      
      const startDay = parseInt(dateRangeMatch[1]);
      const startMonth = months[dateRangeMatch[2].toLowerCase()];
      const endDay = parseInt(dateRangeMatch[3]);
      const endMonth = months[dateRangeMatch[4].toLowerCase()];
      
      if (startDay && startMonth !== undefined && endDay && endMonth !== undefined) {
        // Create proper date objects with current year
        const startDateObj = new Date(currentYear, startMonth, startDay);
        const endDateObj = new Date(currentYear, endMonth, endDay);
        
        // If the dates are in the past, add a year
        if (startDateObj < today) {
          startDateObj.setFullYear(startDateObj.getFullYear() + 1);
          endDateObj.setFullYear(endDateObj.getFullYear() + 1);
        }
        
        taskDate = startDateObj.toISOString().split('T')[0];
        endDate = endDateObj.toISOString().split('T')[0];
      }
    } else if (input.includes("tomorrow")) {
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      taskDate = tomorrow.toISOString().split('T')[0];
    } else if (input.includes("today")) {
      taskDate = today.toISOString().split('T')[0];
    } else {
      // Check for explicit date patterns (e.g., 10 April, April 10)
      const dateRegex = /(\d{1,2})[\s-]*(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|january|february|march|april|may|june|july|august|september|october|november|december)|(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|january|february|march|april|may|june|july|august|september|october|november|december)[\s-]*(\d{1,2})/i;
      const dateMatch = input.match(dateRegex);
      
      if (dateMatch) {
        // Try to parse the date
        const months = {
          jan: 0, january: 0, feb: 1, february: 1, mar: 2, march: 2,
          apr: 3, april: 3, may: 4, jun: 5, june: 5, jul: 6, july: 6,
          aug: 7, august: 7, sep: 8, september: 8, oct: 9, october: 9,
          nov: 10, november: 10, dec: 11, december: 11
        };
        
        let day, month;
        
        if (dateMatch[1] && dateMatch[2]) {
          // Format: 10 April
          day = parseInt(dateMatch[1]);
          month = months[dateMatch[2].toLowerCase()];
        } else {
          // Format: April 10
          day = parseInt(dateMatch[3]);
          month = months[dateMatch[0].toLowerCase().replace(/\d+/g, '').trim()];
        }
        
        if (day && month !== undefined) {
          const dateObj = new Date(currentYear, month, day);
          
          // If the date is in the past, add a year
          if (dateObj < today) {
            dateObj.setFullYear(dateObj.getFullYear() + 1);
          }
          
          taskDate = dateObj.toISOString().split('T')[0];
        }
      } else {
        // Default to today
        taskDate = today.toISOString().split('T')[0];
      }
    }
    
    // Extract time
    let taskTime = "12:00 PM"; // Default
    const timeRegex = /\b(at|by|around|from)?\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm|a\.m\.|p\.m\.)/i;
    const timeMatch = userInput.match(timeRegex);
    
    if (timeMatch) {
      const hour = parseInt(timeMatch[2]);
      const minute = timeMatch[3] ? parseInt(timeMatch[3]) : 0;
      const period = timeMatch[4].toLowerCase().replace('.', '');
      
      taskTime = `${hour}:${minute.toString().padStart(2, '0')} ${period.substring(0, 2).toUpperCase()}`;
    }
    
    // Clean up the task text
    if (!isEmergency) {
      // Remove time references
      cleanedText = cleanedText.replace(/\b(at|by|around|from)\s+\d{1,2}(?::\d{2})?\s*(?:am|pm|a\.m\.|p\.m\.)/i, '');
      
      // Remove date references
      cleanedText = cleanedText.replace(/\b(tomorrow|today|on|next)\b/i, '');
      cleanedText = cleanedText.replace(/\bfrom\s+\d{1,2}\s*[a-z]+\s+to\s+\d{1,2}\s*[a-z]+\b/i, '');
      cleanedText = cleanedText.replace(/\b\d{1,2}[\s-]*(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|january|february|march|april|may|june|july|august|september|october|november|december)\b/i, '');
      
      // Remove task creation phrases
      cleanedText = cleanedText.replace(/\b(add|create)( a)? task( for| to)?\b/i, '');
      
      // Clean up double spaces and trim
      cleanedText = cleanedText.replace(/\s+/g, ' ').trim();
    }
    
    // Check for recurring task keywords
    const isRecurring = input.includes("every day") || 
                        input.includes("everyday") || 
                        input.includes("daily") || 
                        input.includes("weekly") || 
                        input.includes("monthly") ||
                        input.includes("each day");
                        
    // Handle based on task type
    if (taskType === 'recurring' || (isRecurring && taskType !== 'regular')) {
      // Determine recurrence type
      let recurrenceType = "daily"; // Default
      if (input.includes("weekly") || input.includes("every week")) {
        recurrenceType = "weekly";
      } else if (input.includes("monthly") || input.includes("every month")) {
        recurrenceType = "monthly";
      }
      
      // Determine days for daily/weekly recurrence
      let dailyDays = [];
      if (input.includes("everyday") || input.includes("every day") || input.includes("daily") || input.includes("each day")) {
        // If it's an everyday task, include all days of the week
        dailyDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
      } else {
        // Default to weekdays if no specific days mentioned
        dailyDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
        
        // Check for specific days
        const dayMap = {
          'monday': 'Monday', 'tuesday': 'Tuesday', 'wednesday': 'Wednesday', 'thursday': 'Thursday',
          'friday': 'Friday', 'saturday': 'Saturday', 'sunday': 'Sunday'
        };
        
        for (const [dayKey, dayValue] of Object.entries(dayMap)) {
          if (input.includes(dayKey)) {
            dailyDays = [dayValue];
            break;
          }
        }
      }
      
      return {
        title: cleanedText || "New recurring task",
        priority,
        recurrenceType,
        startDate: taskDate,
        endDate: endDate,
        dailyDays,
        startTime: taskTime
      };
    } else {
      // Regular (one-time) task
      return {
        text: cleanedText || "New task",
        priority,
        date: taskDate,
        time: taskTime,
        isRecurring: false
      };
    }
  } catch (error) {
    console.error('Error in direct task extraction:', error);
    return null;
  }
}

/**
 * Create an emergency task as last resort
 */
function createEmergencyTask(userInput, taskType) {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const currentYear = today.getFullYear();
  
  // Extract some basic time if possible
  let timeStr = "12:00 PM";
  const timeMatch = userInput.match(/\b(\d{1,2})(?::(\d{2}))?\s*(am|pm|a\.m\.|p\.m\.)/i);
  if (timeMatch) {
    const hour = parseInt(timeMatch[1]);
    const minute = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
    const period = timeMatch[3].toLowerCase().replace('.', '');
    timeStr = `${hour}:${minute.toString().padStart(2, '0')} ${period.substring(0, 2).toUpperCase()}`;
  }
  
  // Extract date range
  let startDate = null;
  let endDate = null;
  const dateRangeRegex = /from\s+(\d{1,2})\s*(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|january|february|march|april|may|june|july|august|september|october|november|december)(?:\s*\d{4})?\s+to\s+(\d{1,2})\s*(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|january|february|march|april|may|june|july|august|september|october|november|december)(?:\s*\d{4})?/i;
  const dateRangeMatch = userInput.toLowerCase().match(dateRangeRegex);
  
  if (dateRangeMatch) {
    const months = {
      jan: 0, january: 0, feb: 1, february: 1, mar: 2, march: 2,
      apr: 3, april: 3, may: 4, jun: 5, june: 5, jul: 6, july: 6,
      aug: 7, august: 7, sep: 8, september: 8, oct: 9, october: 9,
      nov: 10, november: 10, dec: 11, december: 11
    };
    
    const startDay = parseInt(dateRangeMatch[1]);
    const startMonth = months[dateRangeMatch[2].toLowerCase()];
    const endDay = parseInt(dateRangeMatch[3]);
    const endMonth = months[dateRangeMatch[4].toLowerCase()];
    
    if (startDay && startMonth !== undefined && endDay && endMonth !== undefined) {
      // Create proper date objects with current year
      const startDateObj = new Date(currentYear, startMonth, startDay);
      const endDateObj = new Date(currentYear, endMonth, endDay);
      
      // If the dates are in the past, add a year
      if (startDateObj < today) {
        startDateObj.setFullYear(startDateObj.getFullYear() + 1);
        endDateObj.setFullYear(endDateObj.getFullYear() + 1);
      }
      
      startDate = startDateObj.toISOString().split('T')[0];
      endDate = endDateObj.toISOString().split('T')[0];
    }
  }
  
  // Choose date based on input or use the extracted range's start
  const dateStr = startDate || (userInput.toLowerCase().includes('tomorrow') ? 
    tomorrow.toISOString().split('T')[0] : 
    today.toISOString().split('T')[0]);
  
  // Clean up task text - remove any command-like prefixes
  let text = userInput.replace(/\b(add|create)( a)? task( for| to)?\b/i, '').trim();
  if (text.length < 5) text = userInput;
  
  // Remove date range from text
  text = text.replace(/\bfrom\s+\d{1,2}\s*[a-z]+\s+to\s+\d{1,2}\s*[a-z]+\b/i, '');
  
  // Remove time references
  text = text.replace(/\b(at|by|around|from)\s+\d{1,2}(?::\d{2})?\s*(?:am|pm|a\.m\.|p\.m\.)/i, '');
  
  // Clean up double spaces and trim
  text = text.replace(/\s+/g, ' ').trim();
  
  // Check for recurring task keywords
  const isRecurring = userInput.toLowerCase().includes("every day") || 
                      userInput.toLowerCase().includes("everyday") || 
                      userInput.toLowerCase().includes("daily") || 
                      userInput.toLowerCase().includes("weekly") || 
                      userInput.toLowerCase().includes("monthly") ||
                      userInput.toLowerCase().includes("each day");
  
  if (taskType === 'recurring' || isRecurring) {
    // Set up recurring daily task
    let dailyDays = [];
    if (userInput.toLowerCase().includes("everyday") || 
        userInput.toLowerCase().includes("every day") || 
        userInput.toLowerCase().includes("daily") || 
        userInput.toLowerCase().includes("each day")) {
      // If it's an everyday task, include all days of the week
      dailyDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    } else {
      // Default to weekdays if no specific days mentioned
      dailyDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
    }
    
    return {
      title: text || "New recurring task",
      priority: "medium", 
      recurrenceType: "daily",
      startDate: dateStr,
      endDate: endDate,
      dailyDays: dailyDays,
      startTime: timeStr
    };
  } else {
    // Regular (one-time) task
    return {
      text: text || "New task",
      priority: "medium",
      date: dateStr,
      time: timeStr,
      isRecurring: false
    };
  }
}

module.exports = { 
  processTaskInput,
  // Export both names to maintain backward compatibility
  processAiTaskInput: processTaskInput 
};
