import { useState, useMemo } from 'react';
import { addMonths, isSameMonth, isSameDay } from 'date-fns';
import { DayPicker, DayProps } from 'react-day-picker';

import { useTasks } from 'app/_hooks/useTasks';
import 'react-day-picker/style.css';
import './calendar.scss';

interface CalendarProps {
  onSelectDate: (date: Date) => void;
}

function CustomDayCell(props: DayProps) {
  const {
    getTasksForDate,
  } = useTasks();
  const { day, modifiers } = props;

  // Only fetch tasks if the day has the 'withTasks' modifier
  // This avoids unnecessary calls to getTasksForDate for days without tasks
  const tasksForDay = modifiers.withTasks ? getTasksForDate(day.date) : [];

  let cellClass = 'p-2 text-center rounded-xl';

  if (modifiers.selected || modifiers.focused) {
    cellClass += ' bg-primary text-primary-content';
  }

  if (modifiers.outside) {
    cellClass += ' text-gray-400';
  }

  if (modifiers.withTasks) {
    cellClass += ' has-tasks';
  }

  // Prepare title attribute for days with tasks
  let titleAttr = '';
  if (tasksForDay.length > 0) {
    titleAttr = `${tasksForDay.length} task${tasksForDay.length > 1 ? 's' : ''
      }`;
  }

  // Simplified rendering - just show the day number with the CSS dot indicator if there are tasks
  return (
    <td className={cellClass} title={titleAttr}>
      {props.children}
    </td>
  );
}

export default function Calendar({
  onSelectDate,
}: CalendarProps) {
  const today = new Date();
  const {
    getDaysWithTasksInMonth,
    currentDate,
  } = useTasks();

  const [month, setMonth] = useState(today);

  // Get the days with tasks for the current month range (including prev/next month days)
  // This is memoized internally in the useTasks hook for better performance
  console.log("daysWithTasks called for", month);
  const daysWithTasks = getDaysWithTasksInMonth(month);
  console.log("DAYS WITH TASKS", daysWithTasks);
  // Create a memoized modifiers object that includes days with tasks
  const modifiers = useMemo(() => {
    const modifiersObj: Record<string, Date[]> = {
      today: [today],
      withTasks: daysWithTasks,
    };
    console.log("MODIFIERS", modifiersObj);
    return modifiersObj;
  }, [today, daysWithTasks]);

  // Check if the displayed month is the current month
  const isCurrentMonth = isSameMonth(month, today);

  // Check if the selected date is today
  const isTodaySelected = isSameDay(new Date(currentDate), today);

  // Show the Today button if either:
  // 1. We're not in the current month, OR
  // 2. Today's date is not selected
  const shouldShowTodayButton = !isCurrentMonth || !isTodaySelected;

  // Handle going to today (both month and day selection)
  const handleGoToToday = () => {
    setMonth(today);
    onSelectDate(today);
  };

  return (
    <div className="day-picker">
      <DayPicker
        mode="single"
        month={month}
        selected={new Date(currentDate)}
        onSelect={(date) => date && onSelectDate(date)}
        onMonthChange={setMonth}
        weekStartsOn={1}
        showOutsideDays={true}
        components={{
          Day: CustomDayCell,
        }}
        modifiers={modifiers}
        className="custom-day-picker"
      />
      {shouldShowTodayButton && (
        <button
          className="today-button"
          onClick={handleGoToToday}
          aria-label="Go to today's date"
        >
          Today
        </button>
      )}
    </div>
  );
}
