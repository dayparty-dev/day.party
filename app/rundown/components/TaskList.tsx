import React from 'react';
import {
  DndContext,
  closestCenter,
  DragEndEvent,
  MeasuringStrategy,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import SortableTask from './SortableTask';
import { TaskStatus } from '../../_models/Task';

interface TaskListProps {
  tasks: any[]; // Replace with proper Task type
  currentDayTasks: any[]; // Replace with proper Task type
  isEditMode: boolean;
  sensors: any;
  preventScaleModifier: any;
  onDragEnd: (event: DragEndEvent) => void;
  onDelete: (id: string) => void;
  onResize: (id: string, size: number) => void;
  onStatusChange: (id: string, status: TaskStatus) => void;
  onLongPress: () => void;
  setIsEditMode: (isEdit: boolean) => void;
}

const TaskList: React.FC<TaskListProps> = ({
  tasks,
  currentDayTasks,
  isEditMode,
  sensors,
  preventScaleModifier,
  onDragEnd,
  onDelete,
  onResize,
  onStatusChange,
  onLongPress,
  setIsEditMode,
}) => {
  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={onDragEnd}
      modifiers={[preventScaleModifier]}
      measuring={{
        droppable: {
          strategy: MeasuringStrategy.Always,
        },
      }}
    >
      <SortableContext
        items={tasks.map((t) => t._id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="actions-wrapper">
          {currentDayTasks.map((task) => (
            <SortableTask
              key={task._id}
              task={task}
              isEditMode={isEditMode}
              onDelete={onDelete}
              onResize={onResize}
              onStatusChange={onStatusChange}
              onLongPress={onLongPress}
            />
          ))}

          {/* Add empty state with Create Task button */}
          {currentDayTasks.length === 0 && !isEditMode && (
            <div className="empty-day">
              <p>No tasks scheduled for this day</p>
              <button
                className="create-task-btn"
                onClick={() => setIsEditMode(true)}
              >
                Create Task
              </button>
            </div>
          )}
        </div>
      </SortableContext>
    </DndContext>
  );
};

export default TaskList;
