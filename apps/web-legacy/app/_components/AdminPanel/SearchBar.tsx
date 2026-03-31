import { useState, useEffect, useRef } from 'react';
import { FaSearch, FaTasks, FaUser } from 'react-icons/fa';
import { MenuOption } from './AdminPanel';

interface SearchBarProps {
    onSearch: (query: string) => void;
    menuOptions: MenuOption[];
    onOptionSelected: (option: MenuOption) => void;
    placeholder?: string;
}

export default function SearchBar({ onSearch, menuOptions, onOptionSelected, placeholder = "Search an option..." }: SearchBarProps) {
    const [query, setQuery] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);


    useEffect(() => {
        const timer = setTimeout(() => {
            onSearch(query);
        }, 300);

        return () => clearTimeout(timer);
    }, [query, onSearch]);

    const toggleDropdown = () => {
        setIsOpen(!isOpen);
    };

    const selectOption = (option: MenuOption) => {
        onOptionSelected(option);
        setIsOpen(false);
        setQuery(option.label);
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !(dropdownRef.current as any).contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [dropdownRef]);

    return (
        <div className="form-control" ref={dropdownRef}>
            <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-primary z-10" />
                <input
                    type="text"
                    placeholder={placeholder}
                    className="input input-bordered input-sm w-full pl-10"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={toggleDropdown}
                />
                {isOpen && (
                    <div className="absolute left-0 mt-1 w-full rounded-md shadow-lg bg-base-100 z-50 max-h-48 overflow-y-auto">
                        {menuOptions.map((option) => (
                            <div
                                key={option.id}
                                className="px-4 py-2 text-sm hover:bg-base-200 cursor-pointer flex items-center gap-2"
                                onClick={() => selectOption(option)}
                            >
                                {/* Icono de la sección */}
                                {option.section === 'users' ? <FaUser /> : <FaTasks />}
                                <span>{option.label}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}