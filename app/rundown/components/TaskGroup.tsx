import { Task, TaskStatus } from "app/_models/Task";
import { useCallback } from "react";
import { DropIndicator } from "../hooks/useTaskIndicators";
import "./Task.scss";
import TaskItem from "./TaskItem";

interface TaskGroupProps {
    task: Task;
    subtasks: Task[];
    isEditMode: boolean;
    onDelete: (id: string) => void;
    onStatusChange: (id: string, status: TaskStatus) => void;
    onResize: (id: string, size: number) => void;
    onLongPress: () => void;

    // New props for the indicator system
    isDragging: boolean;
    draggedTask: Task | null;
    dropIndicator: DropIndicator | null;
    onStartDrag: (task: Task, e?: React.MouseEvent) => void;
    onShowIndicator: (taskId: string, position: 'before' | 'after' | 'inside') => void;
}

export default function TaskGroup({
    task,
    subtasks,
    isEditMode,
    onDelete,
    onStatusChange,
    onResize,
    onLongPress,
    isDragging,
    draggedTask,
    dropIndicator,
    onStartDrag,
    onShowIndicator
}: TaskGroupProps) {
    // Check if current group or any of its subtasks is the one being dragged
    const isGroupBeingDragged = draggedTask?._id === task._id;
    const isSubtaskBeingDragged = subtasks.some(sub => sub._id === draggedTask?._id);

    // Check if this group is a target for drop
    const showsBeforeIndicator = dropIndicator?.targetId === task._id && dropIndicator?.position === 'before';
    const showsAfterIndicator = dropIndicator?.targetId === task._id && dropIndicator?.position === 'after';
    const showsInsideIndicator = dropIndicator?.targetId === task._id && dropIndicator?.position === 'inside';

    // Handle group container hover (for dropping tasks between groups)
    const handleGroupHover = useCallback((e: React.MouseEvent) => {
        if (!isDragging || isGroupBeingDragged) return;

        // Only trigger if hovering on the outer container, not on child elements
        if (e.currentTarget === e.target) {
            onShowIndicator(task._id, 'inside');

            // Add hover effect
            e.currentTarget.classList.add('group-hover');

            // Clean up hover effect
            const handleMouseLeave = () => {
                e.currentTarget.classList.remove('group-hover');
                e.currentTarget.removeEventListener('mouseleave', handleMouseLeave);
            };

            e.currentTarget.addEventListener('mouseleave', handleMouseLeave);
        }
    }, [isDragging, isGroupBeingDragged, task._id, onShowIndicator]);

    return (
        <div
            className={`group-task-wrapper relative task-group-card ${showsInsideIndicator ? 'indicator-active' : ''}`}
            id={`group-${task._id}`}
            onMouseMove={handleGroupHover}
        >
            {/* Drop indicators for the group itself */}
            <div className={`indicator-line before ${showsBeforeIndicator ? 'visible' : ''} -translate-y-1`}></div>
            <div className={`indicator-line after ${showsAfterIndicator ? 'visible' : ''} translate-y-1`}></div>
            <div className={`indicator-inside ${showsInsideIndicator ? 'visible' : ''}`}></div>

            {/* Main group task */}
            <TaskItem
                task={task}
                isEditMode={isEditMode}
                onDelete={onDelete}
                onStatusChange={onStatusChange}
                onResize={onResize}
                onLongPress={onLongPress}
                isDragging={isDragging}
                isBeingDragged={isGroupBeingDragged}
                dropIndicator={dropIndicator}
                onStartDrag={onStartDrag}
                onShowIndicator={onShowIndicator}
            />

            {/* Subtasks container */}
            <div className="mt-1 ml-4 pl-2 border-l-2 border-base-200">
                {subtasks.length > 0 ? (
                    subtasks.map(sub => (
                        <TaskItem
                            key={sub._id}
                            task={sub}
                            isEditMode={isEditMode}
                            onDelete={onDelete}
                            onStatusChange={onStatusChange}
                            onResize={onResize}
                            onLongPress={onLongPress}
                            isDragging={isDragging}
                            isBeingDragged={draggedTask?._id === sub._id}
                            dropIndicator={dropIndicator}
                            onStartDrag={onStartDrag}
                            onShowIndicator={onShowIndicator}
                        />
                    ))
                ) : (
                    <div className="text-sm text-gray-400 italic p-2">
                        {isEditMode ? "Drag tasks here to add subtasks" : "No subtasks"}
                    </div>
                )}
            </div>
        </div>
    );
}
