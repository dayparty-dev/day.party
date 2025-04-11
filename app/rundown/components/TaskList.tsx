import React, { useEffect } from 'react';
import {
  DndContext,
  closestCenter,
  DragEndEvent,
  MeasuringStrategy,
  Modifier,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import SortableTask from './SortableTask';
// import { useTaskContext } from '../../_contexts/TaskContext';
import { useTasks } from 'app/_hooks/useTasks';
import { useAppTranslation } from 'app/_hooks/useAppTranslation';
import { useTaskUtils } from '../hooks/useTaskUtils';
import { useDndSensors } from '../hooks/useDndSensors';
import { useTaskHandlers } from '../hooks/useTaskHandlers';

interface TaskListProps {
  isEditMode: boolean;
  onLongPress: () => void;
  setIsEditMode: (isEdit: boolean) => void;
}

// Preventable scale modifier
const preventScaleModifier: Modifier = ({ transform }) => {
  if (!transform) return transform;

  const { x, y } = transform;

  return {
    x,
    y,
    scaleX: 1,
    scaleY: 1,
  };
};

const TaskList: React.FC<TaskListProps> = ({
  isEditMode,
  onLongPress,
  setIsEditMode,
}) => {
  const { t } = useAppTranslation();

  const {
    tasksByDate,
    updateTask,
    deleteTask,
    setTasks,
    currentDate,
    setCurrentDate,
    dayCapacity,
    currentDayTasks,
  } = useTasks();

  const dndSensors = useDndSensors();

  const { ensureOneOngoingTask } = useTaskUtils({ tasksByDate, setTasks, updateTask, currentDayTasks });
  // const { handleDragEnd, handleStatusChange, handleTaskResize } = useTaskHandlers({ tasksByDate, setTasks, updateTask, currentDate, setCurrentDate, currentDayTasks, dayCapacity });
  const { handleDragEnd, handleStatusChange, handleTaskResize } = useTaskHandlers();

  // Only check for multiple ongoing tasks on initial load
  useEffect(() => {
    ensureOneOngoingTask();
  }, []); // Empty dependency array means it only runs once on mount


  return (
    <DndContext
      sensors={dndSensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
      modifiers={[preventScaleModifier]}
      measuring={{
        droppable: {
          strategy: MeasuringStrategy.Always,
        },
      }}
    >
      <SortableContext
        items={currentDayTasks.map((t) => t._id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="flex flex-col gap-4">
          {currentDayTasks.map((task) => (
            <SortableTask
              key={task._id}
              task={task}
              isEditMode={isEditMode}
              onDelete={deleteTask}
              onResize={handleTaskResize}
              onStatusChange={handleStatusChange}
              onLongPress={onLongPress}
            />
          ))}

          {/* Estado vacío con botón para crear tarea */}
          {currentDayTasks.length === 0 && !isEditMode && (
            <div className="alert alert-info flex flex-col items-center text-center p-4">
              <p>{t('taskList.emptyMessage')}</p>
              <button className="btn btn-primary mt-2" onClick={() => setIsEditMode(true)}>
                {t('taskList.createTask')}
              </button>
            </div>
          )}
        </div>
      </SortableContext>
    </DndContext>
  );
};

export default TaskList;
