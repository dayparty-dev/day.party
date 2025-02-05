"use client";

import React, { useState, useEffect } from 'react';
import useTasks from '../_hooks/useTasks';
// import TaskCard, { Task } from '@/components/TaskCard';
// import TaskCard, { Task } from '../components/TaskCard';
import TaskCard from '../components/TaskCard';
import TimeSlider from '../components/TimeSlider';
import FeedbackForm from '../components/FeedbackForm';
import UpcomingTask from '../components/UpcomingTask';
import { submitFeedback } from '../_actions/feedbackActions';
//import { ToastContainer } from 'react-toastify';


import './styles.scss';

const TaskPage: React.FC = () => {
  const { tasks, getTasksForDate } =
    useTasks();

  useEffect(() => {
    if (tasks.length > 0) {
      // Actualizar currentTask con la primera tarea si existen tareas
      setCurrentTask(tasks[0]);
    }
    if (tasks.length > 1) {
      // Actualizar currentTask con la primera tarea si existen tareas
      setNextTask(tasks[1]);
    }
    console.log("current task", currentTask);
    console.log("next task", nextTask);
  }, [tasks]);

  const [currentDate, setCurrentDate] = useState(new Date());
  const currentDayTasks = getTasksForDate(currentDate);
  // const [currentTask, setCurrentTask] = useState<Task | null>(null);
  const [currentTask, setCurrentTask] = useState<{} | null>(tasks.length >= 0 ? tasks[0] : null);
  const [nextTask, setNextTask] = useState<{} | null>(tasks.length >= 1 ? tasks[1] : null); // La siguiente tarea

  const updateDueDate = (newDueDate: number) => {
    console.log('Updating currentTask dueDate:', newDueDate);
    setCurrentTask({ ...currentTask, dueDate: newDueDate });
  };

  return (
    <div className="task-page">

      {currentTask && (
        <div id='current-task'>
          <TaskCard task={currentTask} />
          <TimeSlider
            task={currentTask}
            onUpdateDueDate={updateDueDate}
          />
          {/* <FeedbackForm onSubmitFeedback={handleFeedback} /> */}
        </div>
      )}
      {nextTask
        ? (<UpcomingTask task={nextTask} />)
        : currentTask && (<p>No more task for today 😊</p>)}
      {/* <ToastContainer /> */}
    </div>
  );
};

export default TaskPage;
