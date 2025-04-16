'use client';

import React, { useState, useEffect } from 'react';
import { useTasks } from '../_hooks/useTasks';
// import TaskCard, { Task } from '@/components/TaskCard';
// import TaskCard, { Task } from '../components/TaskCard';
import TaskCard from '../_components/TaskCard';
import TimeSlider from '../_components/TimeSlider';
import FeedbackForm from '../_components/FeedbackForm';
import UpcomingTask from '../_components/UpcomingTask';
import { submitFeedback } from '../_actions/feedbackActions';
//import { ToastContainer } from 'react-toastify';

import './styles.scss';
import { Task } from 'app/_models/Task';

const TaskPage: React.FC = () => {
  const { currentDayTasks, updateTask, getTasksForDate } = useTasks();

  useEffect(() => {
    if (currentDayTasks.length > 0) {
      // Actualizar currentTask con la primera tarea si existen tareas
      setCurrentTask(currentDayTasks[0]);
    }
    if (currentDayTasks.length > 1) {
      // Actualizar currentTask con la primera tarea si existen tareas
      setNextTask(currentDayTasks[1]);
    }
    console.log('current task', currentTask);
    console.log('next task', nextTask);
  }, [currentDayTasks]);

  const [currentDate, setCurrentDate] = useState(new Date());
  // const currentDayTasks = getTasksForDate(currentDate);
  // const [currentTask, setCurrentTask] = useState<Task | null>(null);
  const [currentTask, setCurrentTask] = useState<Task | null>(
    currentDayTasks.length >= 0 ? currentDayTasks[0] : null
  );
  const [nextTask, setNextTask] = useState<Task | null>(
    currentDayTasks.length >= 1 ? currentDayTasks[1] : null
  ); // La siguiente tarea

  return (
    <div className="task-page">
      {currentTask && (
        <div id="current-task">
          <TaskCard task={currentTask} />
          <TimeSlider
            task={currentTask}
            onTaskResized={(value) =>
              updateTask(currentTask._id, { duration: value })
            }
            onTaskCompleted={() =>
              updateTask(currentTask._id, { status: 'done' })
            }
          />
          {/* <FeedbackForm onSubmitFeedback={handleFeedback} /> */}
        </div>
      )}
      {nextTask ? (
        <UpcomingTask task={nextTask} />
      ) : (
        currentTask && <p>No more task for today 😊</p>
      )}
      {/* <ToastContainer /> */}
    </div>
  );
};

export default TaskPage;
