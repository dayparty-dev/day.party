'use client';

import Calendar from './Calendar/Calendar';
import { useState } from 'react';

interface DayNavigatorProps {
  currentDate: Date;
  onDateChange: (date: Date) => void;
}

export default function DayNavigator({
  currentDate,
  onDateChange,
}: DayNavigatorProps) {
  const [showCalendar, setShowCalendar] = useState(false);

  // Modificado para aceptar tanto número como Date
  const goToDay = (offsetOrDate: number | Date) => {
    if (offsetOrDate instanceof Date) {
      onDateChange(offsetOrDate);
    } else {
      const newDate = new Date(currentDate);
      newDate.setDate(newDate.getDate() + offsetOrDate);
      onDateChange(newDate);
    }
  };

  // Función para manejar la selección de fecha en el calendario
  const handleCalendarSelect = (date: Date) => {
    goToDay(date);

    // Only close the calendar on mobile/narrow viewports
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setShowCalendar(false);
    }
  };

  return (
    <div className="flex flex-col place-items-center mb-4 gap-4">
      <div className="flex flex-row content-between justify-items-center place-items-center gap-8">
        <button className="btn btn-neutral" onClick={() => goToDay(-1)}>
          &larr;
        </button>
        <h2
          onClick={() => setShowCalendar(!showCalendar)}
          style={{ cursor: 'pointer' }}
        >
          {currentDate.toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
          })}
        </h2>
        <button className="btn btn-neutral" onClick={() => goToDay(1)}>
          &rarr;
        </button>
      </div>
      {showCalendar && (
        <Calendar
          selectedDate={currentDate}
          onSelectDate={handleCalendarSelect}
        />
      )}
    </div>
  );
}
