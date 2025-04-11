// Format date as YYYY-MM-DD while preserving local date
const formatDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Get days of the week as numbers (0-6, where 0 is Sunday)
const getDayNumber = (day) => {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days.findIndex(d => d === day);
};

// Generate hourly task occurrences within each day
const generateHourlyDates = (startDate, endDate, startTime, endTime, hourlyInterval) => {
  const dates = [];
  const currentDate = new Date(startDate);
  
  // Extract start and end hours
  const startHour = parseInt(startTime.split(':')[0]);
  const startMinutes = parseInt(startTime.split(':')[1].split(' ')[0]);
  const startAmPm = startTime.split(' ')[1];
  
  const endHour = parseInt(endTime.split(':')[0]);
  const endMinutes = parseInt(endTime.split(':')[1].split(' ')[0]);
  const endAmPm = endTime.split(' ')[1];
  
  // Convert to 24-hour format
  let start24Hour = startHour;
  if (startAmPm === 'PM' && startHour !== 12) start24Hour += 12;
  if (startAmPm === 'AM' && startHour === 12) start24Hour = 0;
  
  let end24Hour = endHour;
  if (endAmPm === 'PM' && endHour !== 12) end24Hour += 12;
  if (endAmPm === 'AM' && endHour === 12) end24Hour = 0;

  // Generate for each day between start and end dates
  while (currentDate <= endDate) {
    // For each day, create hourly occurrences
    const day = new Date(currentDate);
    
    // Start from the specified hour
    day.setHours(start24Hour, startMinutes, 0);
    
    while (day.getHours() < end24Hour || (day.getHours() === end24Hour && day.getMinutes() <= endMinutes)) {
      dates.push(new Date(day));
      // Add the hourly interval
      day.setHours(day.getHours() + hourlyInterval);
    }
    
    // Move to the next day
    currentDate.setDate(currentDate.getDate() + 1);
    currentDate.setHours(0, 0, 0, 0);
  }
  
  return dates;
};

// Generate dates for daily recurrence
const generateDailyDates = (startDate, endDate, dailyDays) => {
  const dates = [];
  const currentDate = new Date(startDate);
  currentDate.setHours(0, 0, 0, 0);
  
  // Loop until we reach or exceed the end date
  while (currentDate <= endDate) {
    const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][currentDate.getDay()];
    
    // Check if this day of week is included in our recurrence pattern
    if (!dailyDays || dailyDays.includes(dayName)) {
      dates.push(new Date(currentDate));
    }
    
    // Move to the next day
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return dates;
};

// Generate dates for weekly recurrence
const generateWeeklyDates = (startDate, endDate, weeklyDays) => {
  console.log(`Generating weekly dates from ${startDate.toISOString()} to ${endDate.toISOString()} for days: ${weeklyDays}`);
  
  if (!weeklyDays || !Array.isArray(weeklyDays) || weeklyDays.length === 0) {
    console.warn("No weekly days specified, defaulting to all days");
    weeklyDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  }
  
  const dates = [];
  const currentDate = new Date(startDate);
  currentDate.setHours(0, 0, 0, 0);
  
  // Get day numbers for the specified days
  const dayNumbers = weeklyDays.map(day => getDayNumber(day));
  console.log(`Day numbers for specified days: ${dayNumbers}`);

  // Special handling for short date ranges (less than 7 days)
  const dateRangeInDays = Math.floor((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
  const isShortDateRange = dateRangeInDays <= 7;
  
  // Log additional information for debugging short date ranges
  if (isShortDateRange) {
    console.log(`Short date range detected: ${dateRangeInDays} days. Ensuring we don't miss any weekdays.`);
    
    // Check if any of the specified days actually fall within this range
    const daysInRange = [];
    for (let i = 0; i < dateRangeInDays; i++) {
      const checkDate = new Date(startDate);
      checkDate.setDate(startDate.getDate() + i);
      const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][checkDate.getDay()];
      if (weeklyDays.includes(dayName)) {
        daysInRange.push(dayName);
      }
    }
    console.log(`Days that fall within this range: ${daysInRange.join(', ') || 'None'}`);
  }
  
  // Loop until we reach or exceed the end date
  while (currentDate <= endDate) {
    const currentDayNumber = currentDate.getDay();
    const currentDayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][currentDayNumber];
    
    // Check if this day of week is included in our recurrence pattern
    if (dayNumbers.includes(currentDayNumber)) {
      dates.push(new Date(currentDate));
      console.log(`Adding date: ${currentDate.toISOString()} (${currentDayName})`);
    }
    
    // Move to the next day
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  // For short date ranges with no matches, try to find the next occurrence after the end date
  if (dates.length === 0 && isShortDateRange) {
    console.log("No dates found within short range, looking for the next occurrence of specified days");
    
    // Find the next occurrence of each specified day after the end date
    let nextDate = new Date(endDate);
    nextDate.setDate(nextDate.getDate() + 1);
    
    // Look up to 7 days beyond the end date to find the next occurrence
    for (let i = 0; i < 7; i++) {
      const checkDayNumber = nextDate.getDay();
      const checkDayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][checkDayNumber];
      
      if (dayNumbers.includes(checkDayNumber)) {
        console.log(`Found next occurrence on ${nextDate.toISOString()} (${checkDayName})`);
        dates.push(new Date(nextDate));
        break;
      }
      
      nextDate.setDate(nextDate.getDate() + 1);
    }
  }
  
  console.log(`Generated ${dates.length} dates for weekly recurrence`);
  return dates;
};

// Generate dates for monthly recurrence
const generateMonthlyDates = (startDate, endDate, monthlyType, monthlyDate, monthlyDay, monthlyWeek) => {
  const dates = [];
  const currentDate = new Date(startDate);
  currentDate.setDate(1); // Start from the first day of the month
  
  while (currentDate <= endDate) {
    let targetDate;
    
    if (monthlyType === 'dayOfMonth') {
      // Simple day of month (e.g., 15th of each month)
      targetDate = new Date(currentDate);
      targetDate.setDate(monthlyDate);
      
      // Skip if the day doesn't exist in this month
      const month = targetDate.getMonth();
      if (month !== currentDate.getMonth()) continue;
      
    } else {
      // Day of week in specific week (e.g., "first Monday")
      targetDate = findDayOfWeekInMonth(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        monthlyDay,
        monthlyWeek
      );
    }
    
    // Add the date if it falls within our range
    if (targetDate >= startDate && targetDate <= endDate) {
      dates.push(targetDate);
    }
    
    // Move to the next month
    currentDate.setMonth(currentDate.getMonth() + 1);
  }
  
  return dates;
};

// Find a specific occurrence of a day in a month (e.g., "first Monday")
const findDayOfWeekInMonth = (year, month, dayName, weekOccurrence) => {
  const dayNum = getDayNumber(dayName);
  const date = new Date(year, month, 1);
  
  // Find the first occurrence of the day
  while (date.getDay() !== dayNum) {
    date.setDate(date.getDate() + 1);
  }
  
  // Now find the proper occurrence
  if (weekOccurrence === 'first') {
    return date;
  } else if (weekOccurrence === 'second') {
    date.setDate(date.getDate() + 7);
    return date;
  } else if (weekOccurrence === 'third') {
    date.setDate(date.getDate() + 14);
    return date;
  } else if (weekOccurrence === 'fourth') {
    date.setDate(date.getDate() + 21);
    return date;
  } else if (weekOccurrence === 'last') {
    // Find last occurrence by starting from the end of the month
    const lastDay = new Date(year, month + 1, 0);
    const lastDayNum = lastDay.getDay();
    
    // Calculate days to subtract to find the last occurrence of the target day
    let daysToSubtract = (lastDayNum - dayNum + 7) % 7;
    lastDay.setDate(lastDay.getDate() - daysToSubtract);
    return lastDay;
  }
  
  return date;
};

// Get a human-readable description of the recurrence pattern
const getPatternDescription = (task) => {
  const { recurrenceType, dailyDays, weeklyDays, monthlyType, monthlyDate, monthlyWeek, monthlyDay } = task;
  
  switch (recurrenceType) {
    case 'hourly':
      return `Every ${task.hourlyInterval || 1} hour(s) from ${task.startTime || 'start'} to ${task.endTime || 'end'}`;
    case 'daily':
      return (dailyDays && Array.isArray(dailyDays) && dailyDays.length === 7) 
        ? 'Every day' 
        : `Every ${Array.isArray(dailyDays) ? dailyDays.join(', ') : 'day'}`;
    case 'weekly':
      return `Weekly on ${Array.isArray(weeklyDays) ? weeklyDays.join(', ') : 'selected days'}`;
    case 'monthly':
      return monthlyType === 'dayOfMonth' 
        ? `Monthly on day ${monthlyDate || ''}` 
        : `Monthly on the ${monthlyWeek || ''} ${monthlyDay || ''}`;
    default:
      return 'Custom schedule';
  }
};

module.exports = {
  formatDate,
  getDayNumber,
  generateHourlyDates,
  generateDailyDates,
  generateWeeklyDates,
  generateMonthlyDates,
  findDayOfWeekInMonth,
  getPatternDescription
};
