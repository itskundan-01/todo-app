import React, { useState, useEffect } from 'react';
import './TimePicker.css';

function TimePicker({ time, setTime }) {
  const [hours, setHours] = useState('');
  const [minutes, setMinutes] = useState('');
  const [ampm, setAmpm] = useState('AM');
  const [showHourDrawer, setShowHourDrawer] = useState(false);
  const [showMinuteDrawer, setShowMinuteDrawer] = useState(false);

  // Define specific minute intervals
  const minuteIntervals = ['00', '10','15', '20','25', '30','35','40' , '45','50','55'];

  useEffect(() => {
    if (time) {
      const [timePart, ampmPart] = time.split(' ');
      const [hoursPart, minutesPart] = timePart.split(':');
      setHours(hoursPart);
      setMinutes(minutesPart);
      setAmpm(ampmPart);
    }
  }, [time]);

  useEffect(() => {
    if (hours && minutes) {
      const formattedTime = `${hours}:${minutes} ${ampm}`;
      if (formattedTime !== time) {
        setTime(formattedTime);
      }
    }
  }, [hours, minutes, ampm, time, setTime]);

  return (
    <div className="time-picker">
      <div className="time-picker-input" onClick={() => setShowHourDrawer(!showHourDrawer)}>
        {hours || 'HH'}
      </div>
      <span>:</span>
      <div className="time-picker-input" onClick={() => setShowMinuteDrawer(!showMinuteDrawer)}>
        {minutes || 'MM'}
      </div>
      <select 
        value={ampm} 
        onChange={(e) => setAmpm(e.target.value)}
        className="ampm-select"
      >
        <option value="AM">AM</option>
        <option value="PM">PM</option>
      </select>

      {showHourDrawer && (
        <div className="drawer hours-drawer">
          {[...Array(12)].map((_, i) => (
            <div 
              key={i + 1}
              className="time-option"
              onClick={() => {
                setHours(String(i + 1).padStart(2, '0'));
                setShowHourDrawer(false);
              }}
            >
              {String(i + 1).padStart(2, '0')}
            </div>
          ))}
        </div>
      )}

      {showMinuteDrawer && (
        <div className="drawer minutes-drawer">
          {minuteIntervals.map((minute) => (
            <div 
              key={minute}
              className="time-option"
              onClick={() => {
                setMinutes(minute);
                setShowMinuteDrawer(false);
              }}
            >
              {minute}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default TimePicker;