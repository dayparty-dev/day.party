import { Task, TaskStatus } from "app/_models/Task";
import SortableTask from "./SortableTask";
import "./Task.scss";
interface SortableTaskGroupProps {
    task: Task;
    subtasks: Task[];
    isEditMode: boolean;
    onDelete: (id: string) => void;
    onStatusChange: (id: string, status: TaskStatus) => void;
    onResize: (id: string, size: number) => void;
    onLongPress: () => void;
}


export default function SortableTaskGroup({
    task,
    subtasks,
    isEditMode,
    onDelete,
    onStatusChange,
    onResize,
    onLongPress
}: SortableTaskGroupProps) {
    return (
        <div className="group-task-wrapper" id={`group-${task._id}`}>
            <SortableTask
                task={task}
                isEditMode={isEditMode}
                onDelete={onDelete}
                onStatusChange={onStatusChange}
                onResize={onResize}
                onLongPress={onLongPress}
            />
            <div className="mt-1 ml-4 pl-2 border-l-2 border-base-200">
                {subtasks.map(sub => (
                    <SortableTask
                        key={sub._id}
                        task={sub}
                        isEditMode={isEditMode}
                        onDelete={onDelete}
                        onStatusChange={onStatusChange}
                        onResize={onResize}
                        onLongPress={onLongPress}
                    />
                ))}
            </div>
        </div>
    );
}
