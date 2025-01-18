export const getTimerClass = (hours, minutes) => {
    if (hours > 6) {
      return 'timer-green';
    } else if (hours >= 2 && hours <= 6) {
      return 'timer-yellow';
    } else if (hours < 2) {
      if (hours === 0 && minutes < 30) {
        return 'timer-blink timer-red';
      }
      return 'timer-red';
    }
    return '';
  };