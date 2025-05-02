'use client';

import React, { useState, useEffect } from 'react';
import { useAppTranslation } from 'app/_hooks/useAppTranslation';
import { get } from 'http';

const ThemeToggle = ({ initialTheme }: { initialTheme: string }) => {
    const { t } = useAppTranslation();
    const [theme, setTheme] = useState(initialTheme);
    const [autoTheme, setAutoTheme] = useState(true);
    const [isDropdownVisible, setIsDropdownVisible] = useState(false);

    // AutoTheme detection based on location
    useEffect(() => {
        if (autoTheme) {
            // Get user's location and set theme based on sunrise/sunset
            const setThemeByLocation = async () => {
                try {
                    // Intenta obtener la ubicación precisa
                    const position = await getCurrentPosition();
                    const { latitude, longitude } = position.coords;

                    // Obtiene los datos de amanecer/atardecer de la API
                    const sunData = await getSunriseSunsetData(latitude, longitude);

                    // Establece el tema basado en si es de día o de noche
                    const isDaytime = isCurrentlyDaytime(sunData);
                    const newTheme = isDaytime ? 'latte' : 'coffee';

                    setTheme(newTheme);
                    document.documentElement.setAttribute('data-theme', newTheme);
                } catch (error) {
                    console.error('Error obteniendo ubicación precisa:', error);

                    // Fallback: usar zona horaria o país si no hay permisos precisos
                    useTimezoneFallback();
                }
            };

            // Try to get the user's location and set the theme accordingly
            setThemeByLocation();

            // Refresh the theme every hour
            const interval = setInterval(setThemeByLocation, 3600000); // 1 hora

            return () => clearInterval(interval);
        }
    }, [autoTheme]);

    // Promisify getCurrentPosition
    const getCurrentPosition = (): Promise<GeolocationPosition> => {
        return new Promise<GeolocationPosition>((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error('Geolocation no está disponible'));
                return;
            }

            navigator.geolocation.getCurrentPosition(resolve, reject, {
                enableHighAccuracy: true,
                timeout: 5000,
                maximumAge: 0
            });
        });
    };

    // Get sunrise/sunset data from API
    const getSunriseSunsetData = async (latitude, longitude) => {
        try {
            const response = await fetch(
                `https://api.sunrisesunset.io/json?lat=${latitude}&lng=${longitude}&date=today`
            );
            const data = await response.json();

            if (data.status === 'OK') {
                return data.results;
            } else {
                throw new Error('Error en la respuesta de la API');
            }
        } catch (error) {
            console.error('Error obteniendo datos de sunrise/sunset:', error);
            throw error;
        }
    };

    // Detect if it's currently daytime based on sunrise/sunset data
    const isCurrentlyDaytime = (sunData) => {
        const now = new Date();
        const sunrise = parseTimeString(sunData.sunrise);
        const sunset = parseTimeString(sunData.sunset);

        // Convert sunrise/sunset times to Date objects to compare with current time
        const sunriseTime = new Date(now);
        sunriseTime.setHours(sunrise.hours, sunrise.minutes, 0);

        const sunsetTime = new Date(now);
        sunsetTime.setHours(sunset.hours, sunset.minutes, 0);

        return now >= sunriseTime && now < sunsetTime;
    };

    // Parse "HH:MM:SS AM/PM" to Object { hours, minutes }
    const parseTimeString = (timeString) => {
        const [time, period] = timeString.split(' ');
        let [hours, minutes] = time.split(':').map(Number);

        // Convert to 24-hour format
        if (period === 'PM' && hours < 12) {
            hours += 12;
        } else if (period === 'AM' && hours === 12) {
            hours = 0;
        }

        return { hours, minutes };
    };

    // Timezone fallback
    const useTimezoneFallback = () => {
        // Get user's timezone and current date/time
        const now = new Date();
        const hour = now.getHours();
        const month = now.getMonth(); // 0-11


        // Simple estimation based on local time and possibly the season
        // That can be improved with more precise data based on estimated location
        let isDaytime;

        // Northern hemisphere (assumed by default)
        if (month >= 2 && month <= 8) {
            // Adjusted to 6AM-9PM for summer
            isDaytime = hour >= 6 && hour < 21;
        } else {
            // Adjusted to 7AM-6PM for winter
            isDaytime = hour >= 7 && hour < 18;
        }

        // Apply the theme based on the estimation
        const newTheme = isDaytime ? 'latte' : 'coffee';
        setTheme(newTheme);
        document.documentElement.setAttribute('data-theme', newTheme);
    };

    // Theme cookie management
    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        document.cookie = `theme=${theme}; path=/; max-age=${365 * 24 * 60 * 60}`;
    }, [theme]);

    // System theme detection
    useEffect(() => {
        if (theme === 'system') {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

            const applySystemTheme = () => {
                const systemPref = mediaQuery.matches ? 'dark' : 'light';
                document.documentElement.setAttribute('data-theme', systemPref);
            };

            applySystemTheme();

            mediaQuery.addEventListener('change', applySystemTheme);

            return () => mediaQuery.removeEventListener('change', applySystemTheme);
        }
    }, [theme]);

    // Modify the logic to handle a select instead of separate toggles
    const handleThemeChange = (e) => {
        const selectedTheme = e.target.value;

        if (selectedTheme === 'auto') {
            setAutoTheme(true);
        } else {
            setAutoTheme(false);
            setTheme(selectedTheme);

            if (selectedTheme === 'system') {
                // Don't set the data-theme here, it will be handled by the effect above
            } else {
                document.documentElement.setAttribute('data-theme', selectedTheme);
            }
        }

        document.cookie = `theme=${selectedTheme}; path=/; max-age=${365 * 24 * 60 * 60}`;
        // Hide the dropdown after selection
        setIsDropdownVisible(false);
    };

    // Determines what value should be selected in the dropdown
    const getCurrentSelection = () => {
        if (autoTheme) return 'auto';
        return theme;
    };

    // Close the dropdown when clicking outside of it
    useEffect(() => {
        const handleOutsideClick = (event) => {
            if (isDropdownVisible && !event.target.closest('.theme-selector-container')) {
                setIsDropdownVisible(false);
            }
        };

        document.addEventListener('click', handleOutsideClick);
        return () => document.removeEventListener('click', handleOutsideClick);
    }, [isDropdownVisible]);

    const getThemeIcon = (theme: string) => {
        switch (theme) {
            case 'auto':
                return (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 fill-primary-content" viewBox="0 0 24 24">
                        <path d="M11 20.5q-3.12 0-5.31-2.19T3.5 13q0-2.966 1.979-5.108t4.925-2.354q.029 0 .058.003t.057.003q-.552.742-.785 1.633Q9.5 8.067 9.5 9q0 2.712 1.894 4.606T16 15.5q.564 0 1.109-.101t1.06-.303q-.68 2.431-2.671 3.917Q13.508 20.5 11 20.5m3.512-9.75l2.854-8.5h1.269l2.854 8.5h-.997l-.68-2h-3.623l-.662 2zm1.953-2.85h3.07L18 3.192z" />
                    </svg>
                );
            case 'latte':
                return (
                    <svg className="h-4 w-4 fill-primary-content" viewBox="0 0 24 24">
                        <path d="M5.64,17l-.71.71a1,1,0,0,0,0,1.41,1,1,0,0,0,1.41,0l.71-.71A1,1,0,0,0,5.64,17ZM5,12a1,1,0,0,0-1-1H3a1,1,0,0,0,0,2H4A1,1,0,0,0,5,12Zm7-7a1,1,0,0,0,1-1V3a1,1,0,0,0-2,0V4A1,1,0,0,0,12,5ZM5.64,7.05a1,1,0,0,0,.7.29,1,1,0,0,0,.71-.29,1,1,0,0,0,0-1.41l-.71-.71A1,1,0,0,0,4.93,6.34Zm12,.29a1,1,0,0,0,.7-.29l.71-.71a1,1,0,1,0-1.41-1.41L17,5.64a1,1,0,0,0,0,1.41A1,1,0,0,0,17.66,7.34ZM21,11H20a1,1,0,0,0,0,2h1a1,1,0,0,0,0-2Zm-9,8a1,1,0,0,0-1,1v1a1,1,0,0,0,2,0V20A1,1,0,0,0,12,19ZM18.36,17A1,1,0,0,0,17,18.36l.71.71a1,1,0,0,0,1.41,0,1,1,0,0,0,0-1.41ZM12,6.5A5.5,5.5,0,1,0,17.5,12,5.51,5.51,0,0,0,12,6.5Zm0,9A3.5,3.5,0,1,1,15.5,12,3.5,3.5,0,0,1,12,15.5Z" />
                    </svg>
                );
            case 'coffee':
                return (
                    <svg className="h-4 w-4 fill-primary-content" viewBox="0 0 24 24">
                        <path d="M21.64,13a1,1,0,0,0-1.05-.14,8.05,8.05,0,0,1-3.37.73A8.15,8.15,0,0,1,9.08,5.49a8.59,8.59,0,0,1,.25-2A1,1,0,0,0,8,2.36,10.14,10.14,0,1,0,22,14.05,1,1,0,0,0,21.64,13Zm-9.5,6.69A8.14,8.14,0,0,1,7.08,5.22v.27A10.15,10.15,0,0,0,17.22,15.63a9.79,9.79,0,0,0,2.1-.22A8.11,8.11,0,0,1,12.14,19.73Z" />
                    </svg>
                );
            case 'system':
                return (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 fill-primary-content" viewBox="0 0 24 24">
                        <path d="M23 2H1v16h10.768a6.7 6.7 0 0 1 .96-4.002H3v-10h18v7.23a6.8 6.8 0 0 1 2 1.24zM3 20h9.228a6.8 6.8 0 0 0 1.24 2H3z" />
                        <path d="M19.5 13.376V12h-2v1.376a4 4 0 0 0-1.854 1.072l-1.193-.689l-1 1.732l1.192.688a4 4 0 0 0 0 2.142l-1.192.688l1 1.732l1.193-.689a4 4 0 0 0 1.854 1.072V22.5h2v-1.376a4 4 0 0 0 1.854-1.072l1.192.689l1-1.732l-1.191-.688a4 4 0 0 0 0-2.142l1.191-.688l-1-1.732l-1.192.688a4 4 0 0 0-1.854-1.071m-2.715 2.844a2 2 0 0 1 3.43 0l.036.063c.159.287.249.616.249.967c0 .35-.09.68-.249.967l-.037.063a2 2 0 0 1-3.429 0l-.037-.063a2 2 0 0 1-.248-.967a2 2 0 0 1 .248-.967z" />
                    </svg>
                );
            default:
                return null;
        }
    };

    return (
        <div className="theme-selector-container relative">
            <button
                onClick={() => setIsDropdownVisible(!isDropdownVisible)}
                className="bg-primary hover:bg-primary-focus transition-colors duration-200 rounded-full h-7 w-7 flex items-center justify-center shadow-md"
                aria-label="Cambiar tema"
            >
                {getThemeIcon(getCurrentSelection())}
            </button>

            {/* Theme Dropdown */}
            {isDropdownVisible && (
                <div className="absolute left-0 mt-2 z-50 min-w-40 bg-base-100 border border-base-300 rounded-lg shadow-lg">
                    <div
                        className={`theme-options flex flex-col text-base-content`}
                    >
                        {/* Light Option */}
                        <button
                            onClick={() => handleThemeChange({ target: { value: 'latte' } })}
                            className={`flex items-center gap-2 p-2 rounded-md hover:bg-base-200 ${getCurrentSelection() === 'latte' ? 'bg-base-200 font-medium' : ''}`}
                        >
                            <div className="bg-primary rounded-full h-6 w-6 flex items-center justify-center">
                                {getThemeIcon('latte')}
                            </div>
                            <span>{t("theme.light")}</span>
                        </button>

                        {/* Dark Option */}
                        <button
                            onClick={() => handleThemeChange({ target: { value: 'coffee' } })}
                            className={`flex items-center gap-2 p-2 rounded-md hover:bg-base-200 ${getCurrentSelection() === 'coffee' ? 'bg-base-200 font-medium' : ''}`}
                        >
                            <div className="bg-primary rounded-full h-6 w-6 flex items-center justify-center">
                                {getThemeIcon('coffee')}
                            </div>
                            <span>{t("theme.dark")}</span>
                        </button>

                        {/* Auto Option */}
                        <button
                            onClick={() => handleThemeChange({ target: { value: 'auto' } })}
                            className={`flex items-center gap-2 p-2 rounded-md hover:bg-base-200 ${getCurrentSelection() === 'auto' ? 'bg-base-200 font-medium' : ''}`}
                        >
                            <div className="bg-primary rounded-full h-6 w-6 flex items-center justify-center">
                                {getThemeIcon('auto')}
                            </div>
                            <span>{t("theme.auto")}</span>
                        </button>

                        {/* System Option */}
                        <button
                            onClick={() => handleThemeChange({ target: { value: 'system' } })}
                            className={`flex items-center gap-2 p-2 rounded-md hover:bg-base-200 ${getCurrentSelection() === 'system' ? 'bg-base-200 font-medium' : ''}`}
                        >
                            <div className="bg-primary rounded-full h-6 w-6 flex items-center justify-center">
                                {getThemeIcon('system')}
                            </div>
                            <span>{t("theme.system")}</span>
                        </button>
                    </div>
                </div>
            )}

            {/* Optional tooltip that shows the current state */}
            {/* <div className="tooltip tooltip-left absolute -left-2"
                data-tip={
                    getCurrentSelection() === 'auto' ? 'Tema automático' :
                        getCurrentSelection() === 'latte' ? 'Tema claro' : 'Tema oscuro'
                }>
            </div> */}
        </div>
    );
}

export default ThemeToggle;