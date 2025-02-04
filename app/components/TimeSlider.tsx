import React, { useState, useCallback, useEffect } from 'react';

interface TimeSliderProps {
    task: { dueDate: number; createdAt: Date }; // Task con dueDate como timestamp
    onUpdateDueDate: (newDueDate: number) => void; // Callback para actualizar el dueDate
}

const TimeSlider: React.FC<TimeSliderProps> = ({ task, onUpdateDueDate }) => {
    const [sliderValue, setSliderValue] = useState<number>(0); // Valor inicial del slider
    const [isAdjusting, setIsAdjusting] = useState<boolean>(false); // Modo de ajuste
    const [timeLeft, setTimeLeft] = useState<number>(task.dueDate - Date.now()); // Tiempo restante

    // Función para calcular el tiempo restante
    const calculateRemainingTime = useCallback(() => {
        const now = Date.now();
        return Math.max(0, task.dueDate - now);
    }, [task.dueDate]);

    // Finalizar tarea
    const completeTask = useCallback(() => {
        setIsAdjusting(false);
        onUpdateDueDate(0); // Actualizamos el dueDate a 0
        alert('¡Tarea finalizada!');
    }, [onUpdateDueDate]);

    // Actualización automática del tiempo restante cada segundo
    useEffect(() => {
        if (timeLeft <= 0) return; // Detenemos la actualización si el tiempo restante es 0

        const interval = setInterval(() => {
            const remaining = calculateRemainingTime();
            if (remaining <= 0) {
                setTimeLeft(0);
                completeTask();
            } else {
                setTimeLeft(remaining);
                setSliderValue(100 - ((remaining / (task.dueDate - task.createdAt.getTime())) * 100));
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [timeLeft, calculateRemainingTime, completeTask, task.dueDate, task.createdAt]);

    // Modo de ajuste: comenzar a mover el slider
    const handleSliderStart = useCallback(() => {
        setIsAdjusting(true);
    }, []);

    // Mover el slider: recalcular el tiempo restante
    const handleSliderChange = useCallback(
        (value: number) => {
            setSliderValue(value);

            const totalDuration = task.dueDate - task.createdAt.getTime();
            const newRemainingTime = (value / 100) * totalDuration;
            setTimeLeft(newRemainingTime);
        }, [task.dueDate, task.createdAt]);

    // Finalizar ajuste: guardar o revertir cambios
    const handleSliderEnd = useCallback(() => {
        setIsAdjusting(false);

        if (timeLeft <= 5000) {
            setTimeLeft(0);
            completeTask();
            return;
        }

        const newDueDate = Date.now() + timeLeft;
        const userConfirmed = window.confirm('¿Guardar cambios en la fecha de finalización?');
        if (userConfirmed) {
            onUpdateDueDate(newDueDate);
        } else {
            setTimeLeft(task.dueDate - Date.now());
            setSliderValue(100 - ((timeLeft / (task.dueDate - task.createdAt.getTime())) * 100));
        }
    }, [timeLeft, task.createdAt, task.dueDate, completeTask, onUpdateDueDate]);

    // Mostrar tiempo restante en formato legible
    const formatTimeLeft = (time: number) => {
        const minutes = Math.floor(time / 60000);
        const seconds = Math.floor((time % 60000) / 1000);
        return `${minutes}m ${seconds}s`;
    };

    return (
        <div className="time-slider">
            <div className="time-left">Tiempo restante: {formatTimeLeft(timeLeft)}</div>

            <input
                type="range"
                min="0"
                max="100"
                value={sliderValue}
                onMouseDown={handleSliderStart}
                onChange={(e) => handleSliderChange(Number(e.target.value))}
                onMouseUp={handleSliderEnd}
            />
        </div>
    );
};

export default TimeSlider;

// import React, { useState, useCallback, useEffect } from 'react';
// //import ReactSlider from 'react-slider';
// //import { toast } from 'react-toastify';

// interface TimeSliderProps {
//   task: { dueDate: number }; // Timestamp en vez de Date
//   onUpdateDueDate: (newDueDate: number) => void;
// }

// interface SliderState {
//   timestamp: number;
//   remainingTime: number;
//   percentageElapsed: number;
// }

// const TimeSlider: React.FC<TimeSliderProps> = ({ task, onUpdateDueDate }) => {
//   const [initialDueDate, setInitialDueDate] = useState<number>(task.dueDate);
//   const [initialElapsedTime, setInitialElapsedTime] = useState<number>(0);
//   // const [sliderValue, setSliderValue] = useState<number>(0);
//   const [timeLeft, setTimeLeft] = useState<number>(task.dueDate - Date.now());

//   const [sliderValue, setSliderValue] = useState<number>(0);
//   const [originalState, setOriginalState] = useState<SliderState | null>(null);
//   const [isAdjusting, setIsAdjusting] = useState<boolean>(false);

//   // Función para calcular el tiempo restante
//   const calculateRemainingTime = useCallback(() => {
//     const now = new Date();
//     return Math.max(0, task.dueDate.getTime() - now.getTime());
//   }, [task.dueDate]);

//   // Actualizar el tiempo restante cada segundo
//   // useEffect(() => {
//   //   const interval = setInterval(() => {
//   //     const newTimeLeft = task.dueDate - Date.now();
//   //     setTimeLeft(task.dueDate - Date.now());
//   //   }, 1000);

//   // Efecto para actualizar el tiempo restante cada segundo
//   useEffect(() => {
//     if (!isAdjusting) {
//       const timer = setInterval(() => {
//         const remaining = calculateRemainingTime();
//         setSliderValue((remaining / (task.duration * 60000)) * 100);
//       }, 1000);
//       return () => clearInterval(timer);
//     }
//   }, [isAdjusting, calculateRemainingTime, task.duration]);

//   //   return () => clearInterval(interval); // Limpieza al desmontar
//   // }, [task.dueDate]);
//   // Calcular el porcentaje del slider basado en el tiempo restante inicial
//   // const calculateInitialSliderValue = (): void => {
//   //   const elapsed = Date.now() - (initialDueDate - timeLeft); // Tiempo transcurrido
//   //   console.log("Elapsed:", elapsed, "Initial Due Date:", initialDueDate, "Time Left:", timeLeft);
//   //   const duration = initialDueDate - (initialDueDate - timeLeft); // Duración inicial
//   //   console.log("Duration:", duration, "Should match Time Left:", timeLeft);

//   //   const percentage = Math.min(100, Math.max(0, (elapsed / duration) * 100));
//   //   console.log("Percentage:", percentage, "Elapsed:", elapsed, "Duration:", duration);

//   //   setInitialElapsedTime(elapsed);
//   //   console.log("Setting Initial Elapsed Time:", elapsed);

//   //   setSliderValue(percentage);
//   //   console.log("Setting Slider Value:", percentage);

//   //   //return Math.min(100, Math.max(0, (elapsed / duration) * 100)); // Retorna el porcentaje
//   // };
//   const handleSliderStart = useCallback(() => {
//     setIsAdjusting(true);
//     const now = Date.now();
//     const elapsedTime = now - task.startDate.getTime();
//     // const percentageElapsed = (elapsedTime / (task.duration * 60000)) * 100;
//     setOriginalState({
//       timestamp: now,
//       elapsedTime,
//       //   percentageElapsed,
//     });
//   }, [task.startDate, task.duration]);

//   const handleSliderChange = useCallback((value: number) => {
//     setSliderValue(value);

//     if (originalState) {
//       // Calcular la nueva duración total de la tarea
//       const newTotalDuration = (originalState.elapsedTime * 100) / value;
//       // Calcular el nuevo tiempo restante
//       const newRemainingTime = newTotalDuration - originalState.elapsedTime;

//       // Actualizar la interfaz
//       //   updateDisplayedTime(formatTime(newRemainingTime));
//       //   updateEstimatedTotalTime(formatTime(newTotalDuration));
//     }
//   }, [originalState]);

//   const handleSliderEnd = useCallback(() => {
//     setIsAdjusting(false);

//     if (originalState) {
//       // Calcular la nueva duración total de la tarea
//       const newTotalDuration = (originalState.elapsedTime * 100) / sliderValue;

//       // Calcular la nueva fecha de finalización
//       const newDueDate = new Date(task.startDate.getTime() + newTotalDuration);

//       // Guardar el estado actual antes de actualizarlo
//       const previousState = {
//         dueDate: task.dueDate,
//         sliderValue: originalState.percentageElapsed
//       };
//     }
//   }, [originalState, sliderValue, task.id, task.startDate, task.dueDate]);

//   // Función para revertir los cambios
//   // const revertChanges = () => {
//   //   setInitialDueDate(task.dueDate);
//   //   //setSliderValue(calculateInitialSliderValue());
//   //   setTimeLeft(task.dueDate - Date.now());
//   // };
//   // Función para revertir los cambios
//   const revertChanges = useCallback(() => {
//     if (originalState) {
//       setSliderValue(100 - originalState.percentageElapsed);
//       // Aquí iría la lógica para revertir los cambios en el backend
//       //toast('Cambios revertidos', { /* ... */ });
//     }
//   }, [originalState]);

//   // Mostrar tiempo restante en minutos o segundos
//   const formatTimeLeft = (time: number) => {
//     const minutes = Math.floor(time / 60000);
//     const seconds = Math.floor((time % 60000) / 1000);
//     return `${minutes}m ${seconds}s`;
//   };

//   // const formatTimeLeft = (time: number) => {
//   //   const minutes = Math.floor(time / 60000);
//   //   const seconds = Math.floor((time % 60000) / 1000);
//   //   if (minutes <= 1) {
//   //     return `${seconds} ${seconds === 1 ? 'segundo' : 'segundos'}`;
//   //   }
//   //   return `${minutes} ${minutes === 1 ? 'minuto' : 'minutos'}`;
//   // };

//   // Función auxiliar para formatear el tiempo
//   const formatTime = (ms: number): string => {
//     const seconds = Math.floor(ms / 1000);
//     const minutes = Math.floor(seconds / 60);
//     const hours = Math.floor(minutes / 60);
//     return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
//   };

//   // Versión en segundos (comentada)
//   const formatTimeLeftInSeconds = (time: number) => {
//     const seconds = Math.floor(time / 1000);
//     return `${seconds} ${seconds === 1 ? 'segundo' : 'segundos'}`;
//   };

//   return (
//     <div className="time-slider">
//       <div className="time-left">Tiempo restante: {formatTimeLeft(timeLeft)}</div>

//       {/* <div className="time-left">{formatTimeLeftInSeconds(timeLeft)}</div>
//     <div className="time-left">{formatTimeLeft(timeLeft)}</div> */}

//       {/* <ReactSlider
//           value={sliderValue}
//           onChange={handleSliderChange}
//           onBeforeChange={handleSliderStart}
//           onAfterChange={handleSliderEnd}
//         /> */}
//       <input
//         type="range"
//         min="0"
//         max="100"
//         value={sliderValue}
//         // onMouseDown={calculateInitialSliderValue}
//         onMouseDown={handleSliderStart}
//         onChange={(e) => handleSliderChange(Number(e.target.value))}
//         // onChange={handleSliderChange}
//         onMouseUp={handleSliderEnd}
//       />
//     </div>
//   );
// };
// export default TimeSlider;
