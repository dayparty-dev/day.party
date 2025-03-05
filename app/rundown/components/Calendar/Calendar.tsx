import { useState, useEffect } from "react";
import { DayPicker, DayProps } from "react-day-picker";
import useTasks from "app/_hooks/useTasks";
import "react-day-picker/style.css";
import './calendar.scss';

interface CalendarProps {
    selectedDate: Date;
    onSelectDate: (date: Date) => void;
}

function CustomDayCell(props: DayProps) {
    const { getTasksForDate } = useTasks();
    const { day, modifiers } = props;
    const tasksForDay = getTasksForDate(day.date);

    // Si es el día 3, añade un log específico
    if (day.date.getDate() === 3) {
        console.log("Day 3 details:", {
            date: day.date,
            tasks: tasksForDay,
            modifiers: modifiers
        });
    }

    let cellClass = "p-2 text-center rounded-xl";

    if (modifiers.selected || modifiers.focused) {
        cellClass += " bg-primary text-primary-content";
    }

    if (modifiers.outside) {
        cellClass += " text-gray-400";
    }

    if (!modifiers.outside) {
        return <td className={cellClass}>{props.children}</td>;
    }



    if (tasksForDay.length === 0) {
        return (
            <td className={cellClass}>
                {props.children}
            </td>
        );
    }

    return (
        <td className={cellClass}>
            <div className="flex flex-col h-full">
                <div className="text-left text-xs">{props.children}</div>
                {tasksForDay.length > 0 && (
                    <div className="flex-grow flex flex-wrap content-start gap-1 mt-1">
                        {tasksForDay.map((task, index) => (
                            <div key={index} className="w-2 h-2 bg-secondary" title={task.title}></div>
                        ))}
                    </div>
                )}
            </div>
        </td>
    );
}


export default function Calendar({ selectedDate, onSelectDate }: CalendarProps) {
    return (
        <div className="day-pîcker">
            <DayPicker
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && onSelectDate(date)}
                weekStartsOn={1}
                showOutsideDays={true}
                components={{
                    Day: CustomDayCell
                }}
            />
        </div>
    );
}