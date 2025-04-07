import { useState, useRef, useEffect } from 'react';
import { FaPlus, FaEdit, FaTrash, FaCalendarTimes, FaCheckCircle } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { nanoid } from 'nanoid';
import useTasks from 'app/_hooks/useTasks';
import { Task } from 'app/_models/Task';
import DayNavigator from 'app/rundown/components/DayNavigator';
import navTo from 'app/_utils/navTo';
// import { MenuOption } from './AdminPanel';
// Función para generar títulos aleatorios para tareas
const generateRandomTitle = (id: string) => {
  const adjectives = ['Project', 'Task', 'Meeting', 'Review', 'Analysis'];
  return `${adjectives[Math.floor(Math.random() * adjectives.length)]}-${id}`;
};

// type TaskFormMode = 'create' | 'edit' | 'delete' | 'none';
export type TaskFormAction = 'CREATE' | 'EDIT' | 'DELETE' | 'NONE';

interface TaskManagementProps {
  dayTasks: Task[];
  visibleActions: string[]; // Opciones visibles
  selectedAction?: TaskFormAction;
  onTaskCreated: (task: Task) => void;
  onTaskUpdated: (task: Task) => void;
  deleteTask: (id: string) => void;
  onTasksDeleted: (date?: Date) => void;
  onDateChanged: (date: Date) => void;
}

const getDefaultTask = (date) => {
  const id = nanoid(3);
  const defaultTaskData: Task = {
    _id: id,
    title: generateRandomTitle(id),
    createdAt: new Date(),
    duration: 15,
    size: 2,
    status: 'pending',
    userId: '', // The userId is handled by the server actions
    updatedAt: new Date(),
    scheduledAt: date,
    order: 0,
  };
  return defaultTaskData;
};

export default function TaskManagement({
  dayTasks,
  selectedAction = 'NONE',
  visibleActions,
  onTaskCreated,
  onTaskUpdated,
  deleteTask,
  onTasksDeleted,
  onDateChanged
}: TaskManagementProps) {
  const [date, setDate] = useState(new Date());
  const [taskData, setTaskData] = useState<Task>(getDefaultTask(date));

  const [selectedTaskId, setSelectedTaskId] = useState(null);
  // const [tasks, setTasks] = useState(getTasksForDate(date));

  const [formMode, setFormMode] = useState<TaskFormAction>(selectedAction);
  const titleInputRef = useRef<HTMLInputElement>(null);

  const changeDate = (date: Date) => {
    onDateChanged(date);
    setDate(date);
    setTaskData((prevTask) => ({
      ...prevTask, // Mantén las demás propiedades de la tarea
      scheduledAt: date, // Actualiza "scheduledAt" con la nueva fecha
    }));
  }

  // Función para resetear el formulario
  const resetForm = () => {
    const id = nanoid(3);
    setTaskData(getDefaultTask(date));
  };

  useEffect(() => {
    console.log("ACTION", selectedAction);
    setFormMode(() => selectedAction);
    console.log("FORM MODE", formMode);
  }, [selectedAction]);

  // Función para cambiar el modo del formulario
  const switchFormMode = (mode: TaskFormAction) => {
    if (formMode === mode)
      mode = "NONE";
    else
      navTo("task-options");
    setFormMode(mode);
  };

  // Validación del formulario de tarea
  const validateTaskForm = () => {
    if (formMode === 'DELETE') {
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
      case 'CREATE':
        const newTask = {
          ...taskData,
          id: nanoid(3),
        };
        // toast.success('Task created successfully');
        if (onTaskCreated) {
          onTaskCreated(newTask);
        }
        resetForm();
        break;
      case 'EDIT':
        // toast.success('Task updated successfully');
        if (onTaskUpdated) {
          onTaskUpdated(taskData);
        }
        //resetForm();
        break;
      case 'DELETE':
        if (deleteTask) {
          deleteTask(taskData._id);
        }
        // toast.success('Task deleted successfully');
        resetForm();
        break;
    }
  };

  // Manejador para borrar todas las tareas de hoy
  // const handleDeleteTodaysTasks = () => {
  //   toast.success("All of today's tasks have been deleted");
  //   if (onTasksDeleted) {
  //     onTasksDeleted();
  //   }
  // };

  const handleDeleteSelectedDayTasks = () => {
    console.log("OK");
    toast.success(`All of ${date.toISOString().split('T')[0]} tasks have been deleted`);
    if (onTasksDeleted) {
      onTasksDeleted(date);
    }
  };

  // Renderizado condicional del formulario basado en el modo
  const renderFormFields = () => {
    switch (formMode) {
      case 'CREATE':
      case 'EDIT':
        return (
          <>
            <input
              ref={titleInputRef}
              type="text"
              placeholder="Task title"
              className="input input-bordered input-sm mb-2"
              value={taskData.title}
              onChange={(e) =>
                setTaskData({ ...taskData, title: e.target.value })
              }
            />
            <input
              type="date"
              className="input input-bordered input-sm mb-2"
              value={date.toISOString().split('T')[0]}
              onChange={(e) => {
                setTaskData({
                  ...taskData,
                  scheduledAt: new Date(e.target.value),
                });
                setDate(new Date(e.target.value));
              }
              }
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
                onChange={(e) =>
                  setTaskData({
                    ...taskData,
                    duration: parseInt(e.target.value),
                  })
                }
              />
              <span className="badge badge-neutral">
                {taskData.duration} mins
              </span>
            </div>
          </>
        );
      case 'DELETE':
        return (
          <input
            type="text"
            placeholder="Task ID"
            className="input input-bordered input-sm mb-2"
            value={taskData._id || ''}
            onChange={(e) => setTaskData({ ...taskData, _id: e.target.value })}
          />
        );
      case 'NONE':
        return null;
    }
  };

  // Obtener título del formulario basado en el modo
  const getFormTitle = () => {
    switch (formMode) {
      case 'CREATE': return 'Create Task';
      case 'EDIT': return 'Edit Task';
      case 'DELETE': return 'Delete Task';
      case 'NONE': return '';
    }
  };

  return (
    <div className="form-control flex flex-col gap-2">
      <div id="task-options" className="flex flex-wrap gap-2">
        {visibleActions.includes('create-task') && (
          <button
            className={`btn btn-sm ${formMode === 'CREATE' ? 'btn-primary' : ''}`}
            onClick={() => switchFormMode('CREATE')}
          >
            <FaPlus /> Create
          </button>
        )}
        {visibleActions.includes('edit-task') && (
          <button
            className={`btn btn-sm ${formMode === 'EDIT' ? 'btn-primary' : ''}`}
            onClick={() => switchFormMode('EDIT')}
          >
            <FaEdit /> Edit
          </button>
        )}
        {visibleActions.includes('delete-task') && (
          <button
            className={`btn btn-sm ${formMode === 'DELETE' ? 'btn-primary' : ''}`}
            onClick={() => switchFormMode('DELETE')}
          >
            <FaTrash /> Delete
          </button>
        )}
      </div>
      {formMode !== 'NONE' && (
        <div className="card bg-base-200 p-3">
          <h3 className="text-sm font-bold mb-2">{getFormTitle()}</h3>
          {renderFormFields()}
          <button
            className="btn btn-sm btn-success mt-2"
            onClick={handleSubmit}
          >
            Submit
          </button>
        </div>
      )}
      <section className={`collapse collapse-arrow border border-base-300`}>
        <input type="checkbox" defaultChecked={dayTasks.length > 0} />

        <div className="collapse-title font-medium">
          Tasks by Day
        </div>
        <div className="collapse-content flex flex-col gap-2 card bg-base-200 p-3">
          <DayNavigator />
          {dayTasks.length > 0 &&
            (<><button
              className={`btn btn-sm btn-error`}
              onClick={handleDeleteSelectedDayTasks}
            >
              <FaTrash /> Delete All Tasks
            </button>
              {dayTasks.map((task) => {
                const isSelected = taskData && task._id === taskData._id; // Verifica si la tarea está seleccionada

                return (
                  <div
                    key={task._id}
                    className={`card p-4 shadow-md border ${isSelected ? 'bg-blue-100 border-blue-500' : 'bg-white'
                      }`}
                    onClick={() => setTaskData(task)} // Establece la tarea seleccionada
                  >
                    {/* Título y botones */}
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-black">{task.title}</h3>
                      <div className="flex gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation(); // Evita que el evento haga clic en el contenedor
                            switchFormMode('EDIT');
                            setTaskData(task);
                          }}
                          className="btn btn-sm btn-outline btn-primary"
                        >
                          <FaEdit />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation(); // Evita que el evento haga clic en el contenedor
                            // switchFormMode('delete');
                            // setTaskData(task);
                            if (deleteTask) {
                              deleteTask(task._id);
                            }
                            toast.success('Task deleted successfully');
                          }}
                          className="btn btn-sm btn-outline btn-error"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </div>

                    {/* Información adicional (solo si está seleccionada) */}
                    {isSelected && (
                      <div className="mt-2">
                        <p className="text-sm text-black">
                          Scheduled for: {new Date(task.scheduledAt).toLocaleDateString()}
                        </p>
                        <div className="mt-2 flex items-center gap-2">
                          <span className="badge badge-info">{task.duration} mins</span>
                          <span className="badge badge-success flex items-center gap-1">
                            <FaCheckCircle /> Selected
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </>)}
        </div>
      </section>

    </div>
  );
};