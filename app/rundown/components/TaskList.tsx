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

import a from "../../i18n"; // Importa la inicialización
import { useTranslation } from 'next-i18next';

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
  const { t } = useTranslation("", { "i18n": a });

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
        <div className="flex flex-col gap-4">
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
