import { useState, useRef } from 'react';
import { FaPlus, FaEdit, FaTrash, FaCalendarTimes } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { v4 as uuidv4 } from 'uuid';

// Función para generar títulos aleatorios para tareas
const generateRandomTitle = () => {
    const adjectives = ['Project', 'Task', 'Meeting', 'Review', 'Analysis'];
    return `${adjectives[Math.floor(Math.random() * adjectives.length)]}-${uuidv4().slice(0, 4)}`;
};

interface TaskForm {
    id?: string;
    title: string;
    date: string;
    duration: number;
    description?: string;
}

type TaskFormMode = 'none' | 'create' | 'edit' | 'delete' | 'none';

interface TaskManagementProps {
    initialTaskData?: TaskForm;
    selectedOption?: TaskFormMode;
    onTaskCreated?: (task: TaskForm) => void;
    onTasksDeleted?: () => void;
}

export default function TaskManagement({ initialTaskData, selectedOption = 'none', onTaskCreated, onTasksDeleted }: TaskManagementProps) {
    const [taskData, setTaskData] = useState<TaskForm>(
        initialTaskData || {
            id: '',
            title: generateRandomTitle(),
            date: new Date().toISOString().split('T')[0],
            duration: 15,
            description: ''
        }
    );
    const [formMode, setFormMode] = useState<TaskFormMode>(selectedOption);
    const titleInputRef = useRef<HTMLInputElement>(null);

    // Función para resetear el formulario
    const resetForm = () => {
        setTaskData({
            id: '',
            title: generateRandomTitle(),
            date: new Date().toISOString().split('T')[0],
            duration: 15,
            description: ''
        });
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
            if (!taskData.id) {
                toast.error('Task ID is required');
                return false;
            }
            return true;
        }

        if (!taskData.title.trim()) {
            toast.error('Task title is required');
            return false;
        }

        if (!taskData.date) {
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
                    id: uuidv4()
                };
                toast.success('Task created successfully');
                if (onTaskCreated) {
                    onTaskCreated(newTask);
                }
                resetForm();
                break;
            case 'edit':
                toast.success('Task updated successfully');
                resetForm();
                break;
            case 'delete':
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
                            value={taskData.date}
                            onChange={(e) => setTaskData({ ...taskData, date: e.target.value })}
                        />
                        <textarea
                            placeholder="Task description"
                            className="textarea textarea-bordered textarea-sm mb-2"
                            value={taskData.description}
                            onChange={(e) => setTaskData({ ...taskData, description: e.target.value })}
                        />
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
                        value={taskData.id || ''}
                        onChange={(e) => setTaskData({ ...taskData, id: e.target.value })}
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
        <div className="form-control">
            <div className="flex flex-wrap gap-2 mb-3">
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
                <div className="card bg-base-200 p-3 mb-3">
                    <h3 className="text-sm font-bold mb-2">{getFormTitle()}</h3>
                    {renderFormFields()}
                    <button className="btn btn-sm btn-success mt-2" onClick={handleSubmit}>
                        Submit
                    </button>
                </div>
            )}
        </div>
    );
}