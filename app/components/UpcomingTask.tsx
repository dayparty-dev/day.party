import React from 'react';
import { Task } from './TaskCard';

interface UpcomingTaskProps {
  task: Task;
}

const UpcomingTask: React.FC<UpcomingTaskProps> = ({ task }) => {
  return (
    <div className="upcoming-task">
      <h3>Upcoming</h3>
      <p>{task.title}</p>
      <small>Due: {new Date(task.dueDate).toLocaleDateString()}</small>
    </div>
  );
};

export default UpcomingTask;
