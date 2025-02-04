"use client";

import React, { useState } from 'react';
// import TaskCard, { Task } from '@/components/TaskCard';
import TaskCard, { Task } from '../components/TaskCard';
import TimeSlider from '../components/TimeSlider';
import FeedbackForm from '../components/FeedbackForm';
import UpcomingTask from '../components/UpcomingTask';
import { submitFeedback } from '../_actions/feedbackActions';
//import { ToastContainer } from 'react-toastify';


import './styles.scss';


const tasks: Task[] = [
  {
    title: 'Current Task',
    createdAt: Date.now(),
    dueDate: (Date.now() + 2400 * 1000), // 40 mins
    _id: '1',
  },
  {
    title: 'Next Task',
    createdAt: Date.now(),
    dueDate: (Date.now() + 7200 * 1000), // 2 hours
    _id: '2',
  },
];

const TaskPage: React.FC = () => {
  const [currentTask, setCurrentTask] = useState<Task>(tasks[0]);
  const [nextTask] = useState<Task>(tasks[1]);

  const updateDueDate = (newDueDate: number) => {
    console.log('Updating currentTask dueDate:', newDueDate);
    setCurrentTask({ ...currentTask, dueDate: newDueDate });
  };

  const handleFeedback = (feedback: 'good' | 'bad') => {
    submitFeedback(feedback, currentTask._id);
  };

  return (
    <div className="task-page">
      <TaskCard task={currentTask} />
      <TimeSlider
        task={{
          dueDate: currentTask.dueDate,
          createdAt: new Date(currentTask.createdAt), // Conversión explícita
        }}
        onUpdateDueDate={updateDueDate}
      />
      {/* <TimeSlider task={currentTask} onUpdateDueDate={updateDueDate} /> */}
      {/* <TimeSlider task={{ dueDate: currentTask.dueDate }} onUpdateDueDate={updateDueDate} /> */}
      <FeedbackForm onSubmitFeedback={handleFeedback} />
      <UpcomingTask task={nextTask} />
      {/* <ToastContainer /> */}
    </div>
  );
};

export default TaskPage;
