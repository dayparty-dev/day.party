import { useState, useEffect } from 'react';
import { FaSearch } from 'react-icons/fa';

interface SearchBarProps {
    onSearch: (query: string) => void;
    placeholder?: string;
}

export default function SearchBar({ onSearch, placeholder = "Search an option..." }: SearchBarProps) {
    const [query, setQuery] = useState('');

    // Efecto para debounce la búsqueda
    useEffect(() => {
        const timer = setTimeout(() => {
            onSearch(query);
        }, 300);

        return () => clearTimeout(timer);
    }, [query, onSearch]);

    return (
        <div className="form-control">
            <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-primary z-10" />
                <input
                    type="text"
                    placeholder={placeholder}
                    className="input input-bordered input-sm w-full pl-10"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                />
            </div>
        </div>
    );
}