import { useState, useEffect } from 'react';
import { FaSearch } from 'react-icons/fa';

interface SearchBarProps {
    onSearch: (query: string) => void;
    placeholder?: string;
}

export default function SearchBar({ onSearch, placeholder = "Search actions..." }: SearchBarProps) {
    const [query, setQuery] = useState('');

    // Efecto para debounce la búsqueda
    useEffect(() => {
        const timer = setTimeout(() => {
            onSearch(query);
        }, 300);

        return () => clearTimeout(timer);
    }, [query, onSearch]);

    return (
        <div className="form-control mb-4">
            <div className="input-group">
                <input
                    type="text"
                    placeholder={placeholder}
                    className="input input-bordered input-sm w-full"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                />
                <button className="btn btn-square btn-sm" onClick={() => onSearch(query)}>
                    <FaSearch />
                </button>
            </div>
        </div>
    );
}