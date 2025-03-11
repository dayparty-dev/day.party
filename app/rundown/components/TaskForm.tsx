import React from 'react';

interface TaskFormProps {
  newTaskTitle: string;
  setNewTaskTitle: (title: string) => void;
  newTaskSize: number;
  setNewTaskSize: (size: number) => void;
  onSubmit: (e: React.FormEvent) => void;
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
  onSubmit,
}) => {
  return (
    <form onSubmit={onSubmit} className="task-form">
      <input
        type="text"
        value={newTaskTitle}
        onChange={(e) => setNewTaskTitle(e.target.value)}
        placeholder="New task title"
      />
      <select
        value={newTaskSize}
        onChange={(e) => setNewTaskSize(Number(e.target.value))}
        className="time-select"
      >
        {timeOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <button type="submit">Add Task</button>
    </form>
  );
};

export default TaskForm;
