'use client';

import React, { useState, useEffect } from 'react';
import { useAppTranslation } from 'app/_hooks/useAppTranslation';
const ThemeToggle = ({ initialTheme }: { initialTheme: string }) => {
    const { t } = useAppTranslation();
    const [theme, setTheme] = useState(initialTheme);
    const [autoTheme, setAutoTheme] = useState(true);
    const [isDropdownVisible, setIsDropdownVisible] = useState(false);

    // Efecto para el tema automático basado en la ubicación
    useEffect(() => {
        if (autoTheme) {
            // Función para solicitar ubicación y establecer el tema
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

            // Intenta obtener la posición del usuario
            setThemeByLocation();

            // Actualizar cada hora para mantener el tema actualizado
            const interval = setInterval(setThemeByLocation, 3600000); // 1 hora

            return () => clearInterval(interval);
        }
    }, [autoTheme]);

    // Promisificar getCurrentPosition
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

    // Obtener datos de sunrise/sunset usando la API
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

    // Determinar si es de día o de noche basado en los datos de la API
    const isCurrentlyDaytime = (sunData) => {
        const now = new Date();
        const sunrise = parseTimeString(sunData.sunrise);
        const sunset = parseTimeString(sunData.sunset);

        // Crear objetos Date para comparar
        const sunriseTime = new Date(now);
        sunriseTime.setHours(sunrise.hours, sunrise.minutes, 0);

        const sunsetTime = new Date(now);
        sunsetTime.setHours(sunset.hours, sunset.minutes, 0);

        return now >= sunriseTime && now < sunsetTime;
    };

    // Convertir string de tiempo "HH:MM:SS AM/PM" a un objeto { hours, minutes }
    const parseTimeString = (timeString) => {
        const [time, period] = timeString.split(' ');
        let [hours, minutes] = time.split(':').map(Number);

        // Convertir a formato 24 horas
        if (period === 'PM' && hours < 12) {
            hours += 12;
        } else if (period === 'AM' && hours === 12) {
            hours = 0;
        }

        return { hours, minutes };
    };

    // Fallback si no se tienen permisos de ubicación precisos
    const useTimezoneFallback = () => {
        // Obtener la zona horaria y fecha actual
        const now = new Date();
        const hour = now.getHours();
        const month = now.getMonth(); // 0-11

        // Estimación simple basada en la hora local y posiblemente la temporada
        // Esto se puede mejorar con datos más precisos según la ubicación estimada
        let isDaytime;

        // Hemisferio norte (asumir por defecto)
        if (month >= 2 && month <= 8) {
            // Primavera/verano: días más largos (6AM-9PM)
            isDaytime = hour >= 6 && hour < 21;
        } else {
            // Otoño/invierno: días más cortos (7AM-6PM)
            isDaytime = hour >= 7 && hour < 18;
        }

        // Aplicar el tema basado en la estimación
        const newTheme = isDaytime ? 'latte' : 'coffee';
        setTheme(newTheme);
        document.documentElement.setAttribute('data-theme', newTheme);
    };

    // Efecto para persistencia del tema
    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        document.cookie = `theme=${theme}; path=/; max-age=${365 * 24 * 60 * 60}`;
    }, [theme]);

    const toggleTheme = () => {
        setAutoTheme(false);
        setTheme(prev => {
            const newTheme = prev === 'latte' ? 'coffee' : 'latte';
            document.documentElement.setAttribute('data-theme', newTheme);
            return newTheme;
        });
    };

    // Modificamos la lógica para manejar un select en lugar de toggles separados
    const handleThemeChange = (e) => {
        const selectedTheme = e.target.value;

        if (selectedTheme === 'auto') {
            setAutoTheme(true);
            // El tema actual se actualizará por el efecto useEffect
        } else {
            setAutoTheme(false);
            setTheme(selectedTheme);
            document.documentElement.setAttribute('data-theme', selectedTheme);
        }

        // Ocultamos el dropdown después de seleccionar
        setIsDropdownVisible(false);
    };

    // Determinamos qué valor debería estar seleccionado en el dropdown
    const getCurrentSelection = () => {
        if (autoTheme) return 'auto';
        return theme;
    };

    // Cerrar el dropdown cuando se hace clic en cualquier lugar fuera de él
    useEffect(() => {
        const handleOutsideClick = (event) => {
            if (isDropdownVisible && !event.target.closest('.theme-selector-container')) {
                setIsDropdownVisible(false);
            }
        };

        document.addEventListener('click', handleOutsideClick);
        return () => document.removeEventListener('click', handleOutsideClick);
    }, [isDropdownVisible]);

    // return (
    //     <div className="flex items-center gap-2">
    //         <div className="indicator">
    //             <div className="bg-primary rounded-full h-10 w-10 flex items-center justify-center">
    //                 {/* Icono que representa el modo actual */}
    //                 {getCurrentSelection() === 'auto' && (
    //                     <svg
    //                         xmlns="http://www.w3.org/2000/svg"
    //                         className="h-5 w-5 fill-primary-content"
    //                         viewBox="0 0 24 24"
    //                     >
    //                         <circle cx="12" cy="12" r="3" />
    //                         <path d="M20 4h-3.17A8 8 0 0 0 4.17 4H4a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h.17a8 8 0 0 0 0 8H4a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h3.17a8 8 0 0 0 12.66 0H20a2 2 0 0 0 2-2v-2a2 2 0 0 0-2-2h-.17a8 8 0 0 0 0-8H20a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zM12 18a6 6 0 1 1 6-6 6 6 0 0 1-6 6z" />
    //                     </svg>
    //                 )}
    //                 {getCurrentSelection() === 'latte' && (
    //                     <svg className="h-5 w-5 fill-primary-content" viewBox="0 0 24 24">
    //                         <path d="M5.64,17l-.71.71a1,1,0,0,0,0,1.41,1,1,0,0,0,1.41,0l.71-.71A1,1,0,0,0,5.64,17ZM5,12a1,1,0,0,0-1-1H3a1,1,0,0,0,0,2H4A1,1,0,0,0,5,12Zm7-7a1,1,0,0,0,1-1V3a1,1,0,0,0-2,0V4A1,1,0,0,0,12,5ZM5.64,7.05a1,1,0,0,0,.7.29,1,1,0,0,0,.71-.29,1,1,0,0,0,0-1.41l-.71-.71A1,1,0,0,0,4.93,6.34Zm12,.29a1,1,0,0,0,.7-.29l.71-.71a1,1,0,1,0-1.41-1.41L17,5.64a1,1,0,0,0,0,1.41A1,1,0,0,0,17.66,7.34ZM21,11H20a1,1,0,0,0,0,2h1a1,1,0,0,0,0-2Zm-9,8a1,1,0,0,0-1,1v1a1,1,0,0,0,2,0V20A1,1,0,0,0,12,19ZM18.36,17A1,1,0,0,0,17,18.36l.71.71a1,1,0,0,0,1.41,0,1,1,0,0,0,0-1.41ZM12,6.5A5.5,5.5,0,1,0,17.5,12,5.51,5.51,0,0,0,12,6.5Zm0,9A3.5,3.5,0,1,1,15.5,12,3.5,3.5,0,0,1,12,15.5Z" />
    //                     </svg>
    //                 )}
    //                 {getCurrentSelection() === 'coffee' && (
    //                     <svg className="h-5 w-5 fill-primary-content" viewBox="0 0 24 24">
    //                         <path d="M21.64,13a1,1,0,0,0-1.05-.14,8.05,8.05,0,0,1-3.37.73A8.15,8.15,0,0,1,9.08,5.49a8.59,8.59,0,0,1,.25-2A1,1,0,0,0,8,2.36,10.14,10.14,0,1,0,22,14.05,1,1,0,0,0,21.64,13Zm-9.5,6.69A8.14,8.14,0,0,1,7.08,5.22v.27A10.15,10.15,0,0,0,17.22,15.63a9.79,9.79,0,0,0,2.1-.22A8.11,8.11,0,0,1,12.14,19.73Z" />
    //                     </svg>
    //                 )}
    //             </div>
    //         </div>

    //         {/* Select para elegir el tema */}
    //         <select
    //             className="select select-bordered select-sm w-32"
    //             value={getCurrentSelection()}
    //             onChange={handleThemeChange}
    //         >
    //             <option value="latte">Claro</option>
    //             <option value="coffee">Oscuro</option>
    //             <option value="auto">Automático</option>
    //         </select>
    //     </div>
    // );

    return (
        <div className="theme-selector-container relative">
            {/* Botón con ícono para mostrar/ocultar el select */}
            <button
                onClick={() => setIsDropdownVisible(!isDropdownVisible)}
                className="bg-primary hover:bg-primary-focus transition-colors duration-200 rounded-full h-7 w-7 flex items-center justify-center shadow-md"
                aria-label="Cambiar tema"
            >
                {getCurrentSelection() === 'auto' && (
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4 fill-primary-content"
                        viewBox="0 0 24 24"
                    >
                        <circle cx="12" cy="12" r="3" />
                        <path d="M20 4h-3.17A8 8 0 0 0 4.17 4H4a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h.17a8 8 0 0 0 0 8H4a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h3.17a8 8 0 0 0 12.66 0H20a2 2 0 0 0 2-2v-2a2 2 0 0 0-2-2h-.17a8 8 0 0 0 0-8H20a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zM12 18a6 6 0 1 1 6-6 6 6 0 0 1-6 6z" />
                    </svg>
                )}
                {getCurrentSelection() === 'latte' && (
                    <svg className="h-4 w-4 fill-primary-content" viewBox="0 0 24 24">
                        <path d="M5.64,17l-.71.71a1,1,0,0,0,0,1.41,1,1,0,0,0,1.41,0l.71-.71A1,1,0,0,0,5.64,17ZM5,12a1,1,0,0,0-1-1H3a1,1,0,0,0,0,2H4A1,1,0,0,0,5,12Zm7-7a1,1,0,0,0,1-1V3a1,1,0,0,0-2,0V4A1,1,0,0,0,12,5ZM5.64,7.05a1,1,0,0,0,.7.29,1,1,0,0,0,.71-.29,1,1,0,0,0,0-1.41l-.71-.71A1,1,0,0,0,4.93,6.34Zm12,.29a1,1,0,0,0,.7-.29l.71-.71a1,1,0,1,0-1.41-1.41L17,5.64a1,1,0,0,0,0,1.41A1,1,0,0,0,17.66,7.34ZM21,11H20a1,1,0,0,0,0,2h1a1,1,0,0,0,0-2Zm-9,8a1,1,0,0,0-1,1v1a1,1,0,0,0,2,0V20A1,1,0,0,0,12,19ZM18.36,17A1,1,0,0,0,17,18.36l.71.71a1,1,0,0,0,1.41,0,1,1,0,0,0,0-1.41ZM12,6.5A5.5,5.5,0,1,0,17.5,12,5.51,5.51,0,0,0,12,6.5Zm0,9A3.5,3.5,0,1,1,15.5,12,3.5,3.5,0,0,1,12,15.5Z" />
                    </svg>
                )}
                {getCurrentSelection() === 'coffee' && (
                    <svg className="h-4 w-4 fill-primary-content" viewBox="0 0 24 24">
                        <path d="M21.64,13a1,1,0,0,0-1.05-.14,8.05,8.05,0,0,1-3.37.73A8.15,8.15,0,0,1,9.08,5.49a8.59,8.59,0,0,1,.25-2A1,1,0,0,0,8,2.36,10.14,10.14,0,1,0,22,14.05,1,1,0,0,0,21.64,13Zm-9.5,6.69A8.14,8.14,0,0,1,7.08,5.22v.27A10.15,10.15,0,0,0,17.22,15.63a9.79,9.79,0,0,0,2.1-.22A8.11,8.11,0,0,1,12.14,19.73Z" />
                    </svg>
                )}
            </button>

            {/* Dropdown para seleccionar el tema */}
            {isDropdownVisible && (
                <div className="absolute left-0 mt-2 z-50 min-w-40 bg-base-100 border border-base-300 rounded-lg shadow-lg">
                    <div
                        className={`theme-options flex flex-col text-base-content`}
                    >
                        {/* Opción Claro */}
                        <button
                            onClick={() => handleThemeChange({ target: { value: 'latte' } })}
                            className={`flex items-center gap-2 p-2 rounded-md hover:bg-base-200 ${getCurrentSelection() === 'latte' ? 'bg-base-200 font-medium' : ''}`}
                        >
                            <div className="bg-primary rounded-full h-6 w-6 flex items-center justify-center">
                                <svg className="h-4 w-4 fill-primary-content" viewBox="0 0 24 24">
                                    <path d="M5.64,17l-.71.71a1,1,0,0,0,0,1.41,1,1,0,0,0,1.41,0l.71-.71A1,1,0,0,0,5.64,17ZM5,12a1,1,0,0,0-1-1H3a1,1,0,0,0,0,2H4A1,1,0,0,0,5,12Zm7-7a1,1,0,0,0,1-1V3a1,1,0,0,0-2,0V4A1,1,0,0,0,12,5ZM5.64,7.05a1,1,0,0,0,.7.29,1,1,0,0,0,.71-.29,1,1,0,0,0,0-1.41l-.71-.71A1,1,0,0,0,4.93,6.34Zm12,.29a1,1,0,0,0,.7-.29l.71-.71a1,1,0,1,0-1.41-1.41L17,5.64a1,1,0,0,0,0,1.41A1,1,0,0,0,17.66,7.34ZM21,11H20a1,1,0,0,0,0,2h1a1,1,0,0,0,0-2Zm-9,8a1,1,0,0,0-1,1v1a1,1,0,0,0,2,0V20A1,1,0,0,0,12,19ZM18.36,17A1,1,0,0,0,17,18.36l.71.71a1,1,0,0,0,1.41,0,1,1,0,0,0,0-1.41ZM12,6.5A5.5,5.5,0,1,0,17.5,12,5.51,5.51,0,0,0,12,6.5Zm0,9A3.5,3.5,0,1,1,15.5,12,3.5,3.5,0,0,1,12,15.5Z" />
                                </svg>
                            </div>
                            <span>{t("theme.light")}</span>
                        </button>

                        {/* Opción Oscuro */}
                        <button
                            onClick={() => handleThemeChange({ target: { value: 'coffee' } })}
                            className={`flex items-center gap-2 p-2 rounded-md hover:bg-base-200 ${getCurrentSelection() === 'coffee' ? 'bg-base-200 font-medium' : ''}`}
                        >
                            <div className="bg-primary rounded-full h-6 w-6 flex items-center justify-center">
                                <svg className="h-4 w-4 fill-primary-content" viewBox="0 0 24 24">
                                    <path d="M21.64,13a1,1,0,0,0-1.05-.14,8.05,8.05,0,0,1-3.37.73A8.15,8.15,0,0,1,9.08,5.49a8.59,8.59,0,0,1,.25-2A1,1,0,0,0,8,2.36,10.14,10.14,0,1,0,22,14.05,1,1,0,0,0,21.64,13Zm-9.5,6.69A8.14,8.14,0,0,1,7.08,5.22v.27A10.15,10.15,0,0,0,17.22,15.63a9.79,9.79,0,0,0,2.1-.22A8.11,8.11,0,0,1,12.14,19.73Z" />
                                </svg>
                            </div>
                            <span>{t("theme.dark")}</span>
                        </button>

                        {/* Opción Automático */}
                        <button
                            onClick={() => handleThemeChange({ target: { value: 'auto' } })}
                            className={`flex items-center gap-2 p-2 rounded-md hover:bg-base-200 ${getCurrentSelection() === 'auto' ? 'bg-base-200 font-medium' : ''}`}
                        >
                            <div className="bg-primary rounded-full h-6 w-6 flex items-center justify-center">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-4 w-4 fill-primary-content"
                                    viewBox="0 0 24 24"
                                >
                                    <circle cx="12" cy="12" r="3" />
                                    <path d="M20 4h-3.17A8 8 0 0 0 4.17 4H4a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h.17a8 8 0 0 0 0 8H4a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h3.17a8 8 0 0 0 12.66 0H20a2 2 0 0 0 2-2v-2a2 2 0 0 0-2-2h-.17a8 8 0 0 0 0-8H20a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zM12 18a6 6 0 1 1 6-6 6 6 0 0 1-6 6z" />
                                </svg>
                            </div>
                            <span>{t("theme.auto")}</span>
                        </button>
                    </div>
                </div>
            )}

            {/* Tooltip opcional que muestra el estado actual */}
            <div className="tooltip tooltip-left absolute -left-2"
                data-tip={
                    getCurrentSelection() === 'auto' ? 'Tema automático' :
                        getCurrentSelection() === 'latte' ? 'Tema claro' : 'Tema oscuro'
                }>
            </div>
        </div>
    );
}

export default ThemeToggle;