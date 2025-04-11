'use client';

import { useState, useEffect } from 'react';

import DayCapacity from 'app/rundown/components/DayCapacity';
import DayNavigator from 'app/rundown/components/DayNavigator';
import TaskForm from './components/TaskForm';
import TaskList from './components/TaskList';

// import { TaskProvider } from '../_contexts/TaskContext';
import { useAuthGuard } from 'app/auth/_hooks/useAuthGuard';
import { useAppTranslation } from 'app/_hooks/useAppTranslation';
import { useTasks } from 'app/_hooks/useTasks';
import './styles.scss';

export default function Rundown() {
  const { t } = useAppTranslation();
  const { isInitialized, initialize } = useTasks();
  // UI state
  const [isEditMode, setIsEditMode] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskSize, setNewTaskSize] = useState(1);

  const { authGuard } = useAuthGuard();

  useEffect(() => {
    if (!isInitialized) {
      initialize();
    }
  }, [isInitialized]);

  return authGuard(
    // <TaskProvider>
    <div className={`rundown ${isEditMode ? 'edit-mode' : ''} min-h-screen`}>
      <div className='w-full h-full sm:w-3/5 p-4 sm:p-0 mx-auto flex flex-col gap-4'>
        {isEditMode && (
          <TaskForm
            newTaskTitle={newTaskTitle}
            setNewTaskTitle={setNewTaskTitle}
            newTaskSize={newTaskSize}
            setNewTaskSize={setNewTaskSize}
          />
        )}

        <DayNavigator />
        <DayCapacity />

        <TaskList
          isEditMode={isEditMode}
          onLongPress={() => setIsEditMode(true)}
          setIsEditMode={setIsEditMode}
        />

        {isEditMode && (
          <button className="btn btn-primary fixed bottom-2.5 left-1/2 -translate-x-1/2 rounded-2xl z-50" onClick={() => setIsEditMode(false)}>
            Done
          </button>
        )}
      </div>

    </div>
    // </TaskProvider>
  );
}