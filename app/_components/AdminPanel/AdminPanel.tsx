"use client";
import { useState, useCallback, useEffect } from 'react';
import { FaUser, FaTasks, FaTimes } from 'react-icons/fa';
import useKeyboardShortcut from 'app/_hooks/useKeyboardShortcut';
import { toast } from 'react-toastify';

// Componentes extraídos
import SearchBar from './SearchBar';
import Section from './Section';
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
    const [selectedSection, setSelectedSection] = useState<string | null>(null); // Estado para rastrear la sección seleccionada
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
        setIsExpanded(isExpanded => !isExpanded);
    });

    const handleSectionClick = (sectionId: string) => {
        setSelectedSection(sectionId); // Actualiza el estado con la sección seleccionada
    };

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
                        onClick={() => setIsExpanded(isExpanded => !isExpanded)}
                        aria-label="Open admin panel"
                    >
                        D.
                    </button>
                )}

                {isExpanded && (
                    <>
                        <button
                            className="btn btn-circle btn-sm absolute -top-2 -right-2 z-10"
                            onClick={() => setIsExpanded(isExpanded => !isExpanded)}
                            aria-label="Close admin panel"
                        >
                            <FaTimes />
                        </button>

                        <div className="p-4 h-full flex flex-col">
                            <SearchBar onSearch={setSearchQuery} />

                            <div className="flex-1 overflow-y-auto">
                                <Section
                                    id="users"
                                    isVisible={visibleSections.includes('users')}
                                    title='Users'
                                    isExpanded={true}
                                    isSelected={selectedSection === 'users'}
                                >
                                    <UserManagement selectedOption='edit' />
                                </Section>
                                <Section
                                    id="tasks"
                                    isVisible={visibleSections.includes('tasks')}
                                    title='Tasks'
                                    isExpanded={true}
                                    isSelected={selectedSection === 'tasks'}
                                >
                                    <TaskManagement
                                        onTaskCreated={handleTaskCreated}
                                        onTasksDeleted={handleDeleteTodaysTasks}
                                    />
                                </Section>
                            </div>

                            <nav className="navbar bg-base-200 rounded-box mt-4">
                                <div className="flex overflow-x-auto gap-2">
                                    <a
                                        href="#users"
                                        className={`btn btn-sm w-10 h-10 flex items-center justify-center rounded-full hover:border-info border ${!visibleSections.includes('users') ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}`}
                                        onClick={() => handleSectionClick('users')}
                                    >
                                        <FaUser />
                                    </a>
                                    <a
                                        href="#tasks"
                                        className={`btn btn-sm w-10 h-10 flex items-center justify-center rounded-full hover:border-info border ${!visibleSections.includes('tasks') ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}`}
                                        onClick={() => handleSectionClick('tasks')}
                                    >
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