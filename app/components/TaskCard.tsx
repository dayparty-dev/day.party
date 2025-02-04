import React from 'react';

export interface Task {
  title: string;
  createdAt: number;
  dueDate: number;
  _id: string;
}

interface TaskCardProps {
  task: Task;
}

const TaskCard: React.FC<TaskCardProps> = ({ task }) => {
  const timeLeft = Math.max(
    0,
    Math.floor((new Date(task.dueDate).getTime() - new Date().getTime()) / 1000)
  );

  return (
    <div className="task-card">
      <h2>{task.title}</h2>
      <p>Time left: {timeLeft}s</p>
    </div>
  );
};

export default TaskCard;
