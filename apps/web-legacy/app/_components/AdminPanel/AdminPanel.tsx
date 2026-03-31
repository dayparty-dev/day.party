'use client';
import useKeyboardShortcut from 'app/_hooks/useKeyboardShortcut';
import { useTasks } from 'app/_hooks/useTasks';
import { Task } from 'app/_models/Task';
import { useEffect, useState } from 'react';
import { FaTasks, FaTimes, FaUser } from 'react-icons/fa';
import { toast } from 'react-toastify';
import SearchBar from './SearchBar';
import Section from './Section';
import TaskManagement, { TaskFormAction } from './TaskManagement';
import UserManagement, { UserFormAction } from './UserManagement';
// Definición de tipos
// interface AdminSection {
//   id: string;
//   label: string;
//   section: string;
//   isVisible?: boolean;
// }

export interface MenuOption {
  id: string;
  label: string;
  section: string;
  form: string;
}

export default function AdminPanel() {
  const {
    currentDayTasks,
    addTask,
    updateTask,
    deleteTask,
    deleteAllDayTasks,
    getTasksForDate,
    syncTasks,
    initialize
  } = useTasks();

  const [isExpanded, setIsExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [visibleSections, setVisibleSections] = useState<string[]>([
    'users',
    'tasks',
  ]);
  const [visibleActions, setVisibleOptions] = useState<string[]>([]);
  const [selectedOption, setSelectedOption] = useState<MenuOption | null>(null);

  // Definir opciones del menú
  const menuOptions: MenuOption[] = [
    { id: 'create-user', label: 'Create User', section: 'users', form: "CREATE" },
    { id: 'edit-user', label: 'Edit User', section: 'users', form: "EDIT" },
    { id: 'delete-user', label: 'Delete User', section: 'users', form: "DELETE" },
    { id: 'switch-user', label: 'Switch User', section: 'users', form: "SWITCH" },
    { id: 'create-task', label: 'Create Task', section: 'tasks', form: "CREATE" },
    { id: 'edit-task', label: 'Edit Task', section: 'tasks', form: "EDIT" },
    { id: 'delete-task', label: 'Delete Task', section: 'tasks', form: "DELETE" },
  ];
  // { id: 'delete-today', label: "Delete Today's Tasks", section: 'tasks' },

  // Atajos de teclado
  useKeyboardShortcut('ctrl+u+c', () => {
    document.getElementById('user-name-input')?.focus();
  });

  useKeyboardShortcut('ctrl+space', () => {
    setIsExpanded((isExpanded) => !isExpanded);
  });

  const handleSectionClick = (sectionId: string) => {
    setSelectedSection(sectionId); // Actualiza el estado con la sección seleccionada
  };

  // useEffect(() => {
  //   const newTasks = getTasksForDate(selectedDay);

  //   // Comparación profunda para evitar actualizaciones innecesarias
  //   setDayTasks(prev => {
  //     const prevIds = prev.map(task => task._id).join(',');
  //     const newIds = newTasks.map(task => task._id).join(',');

  //     return prevIds === newIds ? prev : newTasks;
  //   });
  // }, [getTasksForDate, selectedDay]); // Añade selectedDay como dependencia


  // Filtrar opciones y secciones basadas en la búsqueda
  useEffect(() => {
    if (!searchQuery.trim()) {
      // Si no hay búsqueda, mostrar todas las secciones y opciones
      setVisibleSections(['users', 'tasks']);
      setVisibleOptions(menuOptions.map((option) => option.id));
      return;
    }

    const lowerCaseQuery = searchQuery.toLowerCase();

    // Filtrar opciones visibles
    const filteredOptions = menuOptions.filter(
      (option) =>
        option.label.toLowerCase().includes(lowerCaseQuery) ||
        option.section.toLowerCase().includes(lowerCaseQuery)
    );
    setVisibleOptions(filteredOptions.map((option) => option.id));

    // Determinar qué secciones deberían ser visibles
    const sections = new Set(filteredOptions.map((option) => option.section));
    setVisibleSections(Array.from(sections));
  }, [searchQuery]);

  // Manejador para añadir una nueva tarea
  const handleTaskCreated = (task: Task) => {
    addTask(task);
    // setDayTasks([...dayTasks, task]);
    toast.success(`Task "${task.title}" created successfully`);
  };

  // Manejador para añadir una nueva tarea
  const handleTaskUpdated = (task: Task) => {
    updateTask(task._id, task);
    // setDayTasks((prevTasks) => {
    //   const newTasks = prevTasks.map((t) => {
    //     return t._id === task._id ? task : t;
    //   });

    //   return newTasks;
    // });

    toast.success(`Task "${task.title}" updated successfully`);
  };

  // Manejador para eliminae una tarea
  const handleDeleteTask = (id: string) => {
    deleteTask(id);
    toast.success(`Task "${id}" deleted successfully`);
  };

  // Manejador para borrar todas las tareas de hoy
  const handleDeleteTodaysTasks = (date: Date = new Date()) => {
    deleteAllDayTasks(date);
    //setDayTasks([]);

    toast.success(`Deleted tasks from today`);
  };

  const handleOptionSelected = (option: MenuOption) => {
    setSelectedOption(option);
  };

  // Mostrar mensaje de cuántas tareas activas hay
  useEffect(() => {
    if (currentDayTasks.length > 0 && isExpanded) {
      toast.info(`You have ${currentDayTasks.length} active task(s)`);
    }
  }, [isExpanded, currentDayTasks.length]);

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div
        className={`bg-base-100 shadow-xl transition-all duration-300 ${isExpanded
          ? 'w-96 h-[600px] rounded-box'
          : 'w-10 h-10 rounded-full relative'
          }`}
      >
        {!isExpanded ? (
          <button
            className="btn btn-circle btn-sm bg-primary absolute m-auto top-0 bottom-0 left-0 right-0 z-10"
            onClick={() => setIsExpanded((isExpanded) => !isExpanded)}
            aria-label="Open admin panel"
          >
            D.
          </button>
        ) : (
          <button
            className="btn btn-circle btn-sm absolute -top-2 -right-2 z-10"
            onClick={() => setIsExpanded((isExpanded) => !isExpanded)}
            aria-label="Close admin panel"
          >
            <FaTimes />
          </button>
        )}
        {isExpanded && (
          <div className="p-4 h-full flex flex-col gap-4">
            <button onClick={() => syncTasks()}>
              🔁 Forzar sincronización
            </button>
            <button onClick={() => initialize()}>
              🔁 Initialize
            </button>
            <SearchBar
              onSearch={setSearchQuery}
              menuOptions={menuOptions}
              onOptionSelected={handleOptionSelected}
            />
            <div className="flex-1 overflow-y-auto space-y-2">
              <Section
                id="users"
                isVisible={visibleSections.includes('users')}
                title="Users"
                isExpanded={true}
                isSelected={selectedSection === 'users'}
              >
                <UserManagement
                  selectedAction={selectedOption && selectedOption.section == "users" ? selectedOption.form as UserFormAction : "NONE"}
                  visibleActions={visibleActions}
                />
              </Section>
              <Section
                id="tasks"
                isVisible={visibleSections.includes('tasks')}
                title="Tasks"
                isExpanded={true}
                isSelected={selectedSection === 'tasks'}
              >
                <TaskManagement
                  dayTasks={currentDayTasks}
                  visibleActions={visibleActions}
                  selectedAction={selectedOption && selectedOption.section == "tasks" ? selectedOption.form as TaskFormAction : "NONE"}
                  onTaskCreated={handleTaskCreated}
                  onTaskUpdated={handleTaskUpdated}
                  deleteTask={handleDeleteTask}
                  onTasksDeleted={handleDeleteTodaysTasks}
                />
              </Section>
            </div>

            <nav className="navbar bg-base-200 rounded-box mt-4">
              <div className="flex overflow-x-auto gap-2">
                <a
                  href="#users"
                  className={`btn btn-sm w-10 h-10 flex items-center justify-center rounded-full hover:border-info border ${!visibleSections.includes('users')
                    ? 'opacity-50 cursor-not-allowed pointer-events-none'
                    : ''
                    }`}
                  onClick={() => handleSectionClick('users')}
                >
                  <FaUser />
                </a>
                <a
                  href="#tasks"
                  className={`btn btn-sm w-10 h-10 flex items-center justify-center rounded-full hover:border-info border ${!visibleSections.includes('tasks')
                    ? 'opacity-50 cursor-not-allowed pointer-events-none'
                    : ''
                    }`}
                  onClick={() => handleSectionClick('tasks')}
                >
                  <FaTasks />
                </a>
              </div>
            </nav>
          </div>
        )}
      </div>
    </div>
  );
}
