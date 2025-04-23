import React from 'react';
import ThemeToggle from './ThemeToggle';
import { cookies } from 'next/headers';

const getDefaultTheme = () => {
    const hour = new Date().getHours();
    return (hour >= 6 && hour < 18) ? 'latte' : 'coffee';
};

const ThemeSwitcher = async () => {
    const cookieStore = cookies();
    const savedTheme = (await cookieStore).get('theme')?.value || 'coffee';
    const theme = savedTheme || getDefaultTheme();
    // const theme = getDefaultTheme();

    return (
        <div className="absolute top-4 left-4">
            <ThemeToggle initialTheme={theme} />
        </div>
    );
};

export default ThemeSwitcher;