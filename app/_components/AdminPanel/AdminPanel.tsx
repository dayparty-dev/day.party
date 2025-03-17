"use client";
import { useState, useCallback, useEffect } from 'react';
import { FaUser, FaTasks, FaTimes } from 'react-icons/fa';
import useKeyboardShortcut from 'app/_hooks/useKeyboardShortcut';
import { toast } from 'react-toastify';

// Componentes extraídos
import SearchBar from './SearchBar';
import UserManagement from './UserManagement';
import TaskManagement from './TaskManagement';

// Definición de tipos
interface AdminSection {
    id: string;
    label: string;
    section: string;
    isVisible?: boolean;
}

interface MenuOption {
    id: string;
    label: string;
    section: string;
}

interface TaskData {
    id?: string;
    title: string;
    date: string;
    duration: number;
    description?: string;
}

export default function AdminPanel() {
    const [isExpanded, setIsExpanded] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTasks, setActiveTasks] = useState<TaskData[]>([]);
    const [visibleSections, setVisibleSections] = useState<string[]>(['users', 'tasks']);
    const [visibleOptions, setVisibleOptions] = useState<string[]>([]);

    // Definir opciones del menú
    const menuOptions: MenuOption[] = [
        { id: "create-user", label: "Create User", section: "users" },
        { id: "edit-user", label: "Edit User", section: "users" },
        { id: "delete-user", label: "Delete User", section: "users" },
        { id: "switch-user", label: "Switch User", section: "users" },
        { id: "create-task", label: "Create Task", section: "tasks" },
        { id: "edit-task", label: "Edit Task", section: "tasks" },
        { id: "delete-task", label: "Delete Task", section: "tasks" },
        { id: "delete-today", label: "Delete Today's Tasks", section: "tasks" },
    ];

    // Atajos de teclado
    useKeyboardShortcut('ctrl+u+c', () => {
        document.getElementById('user-name-input')?.focus();
    });

    useKeyboardShortcut('ctrl+space', () => {
        setIsExpanded(!isExpanded);
    });

    // Filtrar opciones y secciones basadas en la búsqueda
    useEffect(() => {
        if (!searchQuery.trim()) {
            // Si no hay búsqueda, mostrar todas las secciones y opciones
            setVisibleSections(['users', 'tasks']);
            setVisibleOptions(menuOptions.map(option => option.id));
            return;
        }

        const lowerCaseQuery = searchQuery.toLowerCase();

        // Filtrar opciones visibles
        const filteredOptions = menuOptions.filter(option =>
            option.label.toLowerCase().includes(lowerCaseQuery) ||
            option.section.toLowerCase().includes(lowerCaseQuery)
        );
        setVisibleOptions(filteredOptions.map(option => option.id));

        // Determinar qué secciones deberían ser visibles
        const sections = new Set(filteredOptions.map(option => option.section));
        setVisibleSections(Array.from(sections));

    }, [searchQuery]);

    // Manejador para añadir una nueva tarea
    const handleTaskCreated = (task: TaskData) => {
        setActiveTasks([...activeTasks, task]);
        toast.success(`Task "${task.title}" created successfully`);
    };

    // Manejador para borrar todas las tareas de hoy
    const handleDeleteTodaysTasks = () => {
        const todayDate = new Date().toISOString().split('T')[0];
        const remainingTasks = activeTasks.filter(task => task.date !== todayDate);
        const deletedCount = activeTasks.length - remainingTasks.length;

        setActiveTasks(remainingTasks);
        toast.success(`Deleted ${deletedCount} tasks from today`);
    };

    // Mostrar mensaje de cuántas tareas activas hay
    useEffect(() => {
        if (activeTasks.length > 0 && isExpanded) {
            toast.info(`You have ${activeTasks.length} active task(s)`);
        }
    }, [isExpanded, activeTasks.length]);

    return (
        <div className="fixed bottom-4 right-4 z-50">
            <div className={`bg-base-100 shadow-xl transition-all duration-300 ${isExpanded ? 'w-96 h-[600px] rounded-box' : 'w-12 h-12 rounded-full'}`}>
                {!isExpanded && (
                    <button
                        className="btn btn-circle btn-sm -top-2 -right-2 z-10"
                        onClick={() => setIsExpanded(!isExpanded)}
                        aria-label="Open admin panel"
                    >
                        D.
                    </button>
                )}

                {isExpanded && (
                    <>
                        <button
                            className="btn btn-circle btn-sm absolute -top-2 -right-2 z-10"
                            onClick={() => setIsExpanded(!isExpanded)}
                            aria-label="Close admin panel"
                        >
                            <FaTimes />
                        </button>

                        <div className="p-4 h-full flex flex-col">
                            <SearchBar onSearch={setSearchQuery} />

                            <div className="flex-1 overflow-y-auto">
                                {visibleSections.includes('users') && (
                                    <div id="users" className="collapse collapse-arrow border border-base-300 mb-2">
                                        <input type="checkbox" /> {/*defaultChecked*/}
                                        <div className="collapse-title font-medium">
                                            User Management
                                        </div>
                                        <div className="collapse-content">
                                            <UserManagement selectedOption='edit' />
                                        </div>
                                    </div>
                                )}

                                {visibleSections.includes('tasks') && (
                                    <div id="tasks" className="collapse collapse-arrow border border-base-300">
                                        <input type="checkbox" />
                                        <div className="collapse-title font-medium">
                                            Task Management
                                            {activeTasks.length > 0 && (
                                                <span className="badge badge-primary ml-2">{activeTasks.length}</span>
                                            )}
                                        </div>
                                        <div className="collapse-content">
                                            <TaskManagement
                                                onTaskCreated={handleTaskCreated}
                                                onTasksDeleted={handleDeleteTodaysTasks}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            <nav className="navbar bg-base-200 rounded-box mt-4">
                                <div className="flex overflow-x-auto">
                                    <a href="#users" className={`btn btn-sm gap-2 ${!visibleSections.includes('users') ? 'hidden' : ''}`}>
                                        <FaUser />
                                    </a>
                                    <a href="#tasks" className={`btn btn-sm gap-2 ml-2 ${!visibleSections.includes('tasks') ? 'hidden' : ''}`}>
                                        <FaTasks />
                                    </a>
                                </div>
                            </nav>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}