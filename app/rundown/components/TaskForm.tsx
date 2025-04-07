import React, { useCallback } from 'react';
import { useAppTranslation } from 'app/_hooks/useAppTranslation';
import { useTaskContext } from '../../_contexts/TaskContext';

interface TaskFormProps {
  newTaskTitle: string;
  setNewTaskTitle: (title: string) => void;
  newTaskSize: number;
  setNewTaskSize: (size: number) => void;
}

const timeOptions = [
  { value: 1, label: '15 min' },
  { value: 2, label: '30 min' },
  { value: 3, label: '45 min' },
  { value: 4, label: '60 min' },
];

const TaskForm: React.FC<TaskFormProps> = ({
  newTaskTitle,
  setNewTaskTitle,
  newTaskSize,
  setNewTaskSize,
}) => {
  const { t } = useAppTranslation();
  const {
    addTask,
    currentDate,
    setCurrentDate,
    dayCapacity,
    totalMinutes,
  } = useTaskContext();

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (newTaskTitle.trim()) {
        const newTaskMinutes = newTaskSize * 15;
        if (totalMinutes + newTaskMinutes > dayCapacity * 60) {
          if (
            confirm('This will exceed your daily capacity. Move to next day?')
          ) {
            const nextDay = new Date(currentDate);
            nextDay.setDate(nextDay.getDate() + 1);
            addTask({
              title: newTaskTitle,
              size: newTaskSize,
              scheduledAt: nextDay,
            });
            setCurrentDate(nextDay);
          }
          return;
        }
        addTask({
          title: newTaskTitle,
          size: newTaskSize,
          scheduledAt: currentDate,
        });
        setNewTaskTitle('');
        setNewTaskSize(1);
      }
    },
    [newTaskTitle, newTaskSize, addTask, currentDate, totalMinutes, dayCapacity]
  );

  return (
    <>
      <form onSubmit={handleSubmit} className="task-form flex flex-col max-w-sm mx-auto sm:flex-row gap-2">
        <div className="flex w-full gap-2">
          <input
            type="text"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            placeholder={t('taskForm.placeholder')}
            className="input input-bordered w-3/5 sm:w-full"
          />

          <select
            value={newTaskSize}
            onChange={(e) => setNewTaskSize(Number(e.target.value))}
            className="select select-bordered w-2/5 sm:w-auto"
          >
            {timeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <button type="submit" className="btn btn-primary w-full sm:w-auto sm:btn-md btn-sm">
          {t('taskForm.addButton')}
        </button>
      </form>

    </>
  );
};

export default TaskForm;
