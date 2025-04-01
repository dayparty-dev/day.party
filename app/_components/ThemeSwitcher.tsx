import React from 'react';
import ThemeToggle from './ThemeToggle';
import { cookies } from 'next/headers';

const ThemeSwitcher = async () => {
    const cookieStore = await cookies();
    const theme = cookieStore.get('theme')?.value || 'coffee';

    return (
        <div className="absolute top-4 left-4">
            <ThemeToggle initialTheme={theme} />
        </div>
    );
};

export default ThemeSwitcher;