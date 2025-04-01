// Format date as YYYY-MM-DD
const formatDate = (date) => {
  return date.toISOString().split('T')[0];
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
  
  // If no specific days are selected, assume all days
  const daysToUse = dailyDays && dailyDays.length > 0 ? dailyDays : 
    ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  
  // Convert day names to day numbers (0-6)
  const dayNumbers = daysToUse.map(day => getDayNumber(day));
  
  while (currentDate <= endDate) {
    // Check if current day is in the selected days
    const currentDayNum = currentDate.getDay();
    if (dayNumbers.includes(currentDayNum)) {
      dates.push(new Date(currentDate));
    }
    
    // Move to the next day
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return dates;
};

// Generate dates for weekly recurrence
const generateWeeklyDates = (startDate, endDate, weeklyDays) => {
  // Weekly is just like daily but with weekly frequency
  return generateDailyDates(startDate, endDate, weeklyDays);
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
      return `Every ${task.hourlyInterval} hour(s) from ${task.startTime} to ${task.endTime}`;
    case 'daily':
      return dailyDays && dailyDays.length === 7 ? 'Every day' : `Every ${dailyDays.join(', ')}`;
    case 'weekly':
      return `Weekly on ${weeklyDays.join(', ')}`;
    case 'monthly':
      return monthlyType === 'dayOfMonth' 
        ? `Monthly on day ${monthlyDate}` 
        : `Monthly on the ${monthlyWeek} ${monthlyDay}`;
    default:
      return 'Custom schedule';
  }
};

module.exports = {
  formatDate,
  generateHourlyDates,
  generateDailyDates,
  generateWeeklyDates,
  generateMonthlyDates,
  getPatternDescription
};
