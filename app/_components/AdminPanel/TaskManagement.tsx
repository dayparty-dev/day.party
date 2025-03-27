import { useState, useRef } from 'react';
import { FaPlus, FaEdit, FaTrash, FaCalendarTimes } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { nanoid } from 'nanoid';
import useTasks from 'app/_hooks/useTasks';
import { Task } from 'app/_models/Task';

// Función para generar títulos aleatorios para tareas
const generateRandomTitle = (id: string) => {
    const adjectives = ['Project', 'Task', 'Meeting', 'Review', 'Analysis'];
    return `${adjectives[Math.floor(Math.random() * adjectives.length)]}-${id}`;
};

type TaskFormMode = 'create' | 'edit' | 'delete' | 'none';

interface TaskManagementProps {
    dayTasks: Task[];
    selectedOption?: TaskFormMode;
    onTaskCreated: (task: Task) => void;
    onTaskUpdated: (task: Task) => void;
    onTaskDeleted: (id: string) => void;
    onTasksDeleted: () => void;
}


const getDefaultTask = () => {
    const id = nanoid(3);
    const defaultTaskData: Task = {
        _id: id,
        title: generateRandomTitle(id),
        createdAt: new Date(),
        duration: 15,
        size: 2,
        status: "pending",
        updatedAt: new Date(),
        scheduledDate: new Date(),
        order: 0
    };
    return defaultTaskData;
};

export default function TaskManagement({ dayTasks, selectedOption = 'none', onTaskCreated, onTaskUpdated, onTaskDeleted, onTasksDeleted }: TaskManagementProps) {
    // const { addTask, updateTask, deleteTask, getTasksForDate } = useTasks();
    const [taskData, setTaskDataReal] = useState<Task>(
        getDefaultTask()
    );

    function setTaskData(task: Task) {
        setTaskDataReal(() => task);
    }

    const [date, setDate] = useState(new Date());
    // const [tasks, setTasks] = useState(getTasksForDate(date));

    const [formMode, setFormMode] = useState<TaskFormMode>(selectedOption);
    const titleInputRef = useRef<HTMLInputElement>(null);

    // Función para resetear el formulario
    const resetForm = () => {
        const id = nanoid(3);
        setTaskData(getDefaultTask());
    };

    // Función para cambiar el modo del formulario
    const switchFormMode = (mode: TaskFormMode) => {
        setFormMode(mode);
        if (mode !== 'none') {
            resetForm();
        }
    };

    // Validación del formulario de tarea
    const validateTaskForm = () => {
        if (formMode === 'delete') {
            if (!taskData._id) {
                toast.error('Task ID is required');
                return false;
            }
            return true;
        }

        if (!taskData.title.trim()) {
            toast.error('Task title is required');
            return false;
        }

        if (!taskData.createdAt) {
            toast.error('Date is required');
            return false;
        }

        return true;
    };

    // Manejador para submit del formulario
    const handleSubmit = () => {
        if (!validateTaskForm()) return;

        switch (formMode) {
            case 'create':
                const newTask = {
                    ...taskData,
                    id: nanoid(3)
                };
                toast.success('Task created successfully');
                if (onTaskCreated) {
                    onTaskCreated(newTask);
                }
                resetForm();
                break;
            case 'edit':
                toast.success('Task updated successfully');
                if (onTaskUpdated) {
                    onTaskUpdated(taskData);
                }
                resetForm();
                break;
            case 'delete':
                if (onTaskDeleted) {
                    onTaskDeleted(taskData._id)
                }
                toast.success('Task deleted successfully');
                resetForm();
                break;
        }
    };

    // Manejador para borrar todas las tareas de hoy
    const handleDeleteTodaysTasks = () => {
        toast.success("All of today's tasks have been deleted");
        if (onTasksDeleted) {
            onTasksDeleted();
        }
    };

    // Renderizado condicional del formulario basado en el modo
    const renderFormFields = () => {
        switch (formMode) {
            case 'create':
            case 'edit':
                return (
                    <>
                        <input
                            ref={titleInputRef}
                            type="text"
                            placeholder="Task title"
                            className="input input-bordered input-sm mb-2"
                            value={taskData.title}
                            onChange={(e) => setTaskData({ ...taskData, title: e.target.value })}
                        />
                        <input
                            type="date"
                            className="input input-bordered input-sm mb-2"
                            value={taskData.scheduledDate.toISOString().split('T')[0]}
                            onChange={(e) => setTaskData({ ...taskData, scheduledDate: new Date(e.target.value) })}
                        />
                        {/* <textarea
                            placeholder="Task description"
                            className="textarea textarea-bordered textarea-sm mb-2"
                            value={taskData.description}
                            onChange={(e) => setTaskData({ ...taskData, description: e.target.value })}
                        /> */}
                        <div className="flex items-center gap-2 mb-2">
                            <input
                                type="range"
                                min="5"
                                max="60"
                                step="5"
                                className="range range-xs"
                                value={taskData.duration}
                                onChange={(e) => setTaskData({ ...taskData, duration: parseInt(e.target.value) })}
                            />
                            <span className="badge badge-neutral">
                                {taskData.duration} mins
                            </span>
                        </div>
                    </>
                );
            case 'delete':
                return (
                    <input
                        type="text"
                        placeholder="Task ID"
                        className="input input-bordered input-sm mb-2"
                        value={taskData._id || ''}
                        onChange={(e) => setTaskData({ ...taskData, _id: e.target.value })}
                    />
                );
            case 'none':
                return null;
        }
    };

    // Obtener título del formulario basado en el modo
    const getFormTitle = () => {
        switch (formMode) {
            case 'create': return 'Create Task';
            case 'edit': return 'Edit Task';
            case 'delete': return 'Delete Task';
            case 'none': return '';
        }
    };

    return (
        <>
            <div className="form-control flex flex-col gap-2">
                <div className="flex flex-wrap gap-2">
                    <button
                        className={`btn btn-sm ${formMode === 'create' ? 'btn-primary' : ''}`}
                        onClick={() => switchFormMode('create')}
                    >
                        <FaPlus /> Create
                    </button>
                    <button
                        className={`btn btn-sm ${formMode === 'edit' ? 'btn-primary' : ''}`}
                        onClick={() => switchFormMode('edit')}
                    >
                        <FaEdit /> Edit
                    </button>
                    <button
                        className={`btn btn-sm ${formMode === 'delete' ? 'btn-primary' : ''}`}
                        onClick={() => switchFormMode('delete')}
                    >
                        <FaTrash /> Delete
                    </button>
                    <button
                        className="btn btn-sm btn-error"
                        onClick={handleDeleteTodaysTasks}
                    >
                        <FaCalendarTimes /> Delete Today's Tasks
                    </button>
                </div>

                {formMode !== 'none' && (
                    <div className="card bg-base-200 p-3">
                        <h3 className="text-sm font-bold mb-2">{getFormTitle()}</h3>
                        {renderFormFields()}
                        <button className="btn btn-sm btn-success mt-2" onClick={handleSubmit}>
                            Submit
                        </button>
                    </div>
                )}
            </div>
            <div className="flex flex-col gap-2">
                {dayTasks.map((task) => (
                    <div key={task._id} className="flex items-center justify-between p-2 border rounded-lg shadow-sm">
                        <span className="text-lg font-medium">{task.title}</span>
                        <div className="flex gap-2">
                            <button
                                onClick={() => {
                                    switchFormMode('edit');
                                    setTaskData(task);
                                }}
                                className="p-2 text-blue-500 hover:text-blue-700"
                            >
                                <FaEdit />
                            </button>
                            <button
                                onClick={() => {
                                    switchFormMode('delete');
                                    setTaskData(task);
                                }}
                                className="p-2 text-red-500 hover:text-red-700"
                            >
                                <FaTrash />
                            </button>
                        </div>
                    </div>
                ))}
            </div >
        </>
    );
}