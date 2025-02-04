'use client';

interface DayNavigatorProps {
  currentDate: Date;
  onDateChange: (date: Date) => void;
}

export default function DayNavigator({
  currentDate,
  onDateChange,
}: DayNavigatorProps) {
  const goToDay = (offset: number) => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + offset);
    onDateChange(newDate);
  };

  return (
    <div className="day-navigator">
      <button onClick={() => goToDay(-1)}>&larr;</button>
      <h2>
        {currentDate.toLocaleDateString('en-US', {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
        })}
      </h2>
      <button onClick={() => goToDay(1)}>&rarr;</button>
    </div>
  );
}
