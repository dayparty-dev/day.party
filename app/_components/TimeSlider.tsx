import React, { useState, useCallback, useEffect } from 'react';
import { Task } from 'app/_models/Task';
interface TimeSliderProps {
  task: any; // Se usa "any" porque Task no se importa
  onTaskResized: (newDuration: number) => void;
  onTaskCompleted: () => void;
}

const TimeSlider: React.FC<TimeSliderProps> = ({
  task,
  onTaskResized,
  onTaskCompleted,
}) => {
  const now = new Date();
  const dueDate = new Date(
    new Date(task.scheduledDate).getTime() + task.size * 15 * 60 * 1000
  );
  const duration = task.size * 15 * 60 * 1000; // Duración en ms (35 min por defecto)

  const [sliderValue, setSliderValue] = useState<number>(0);
  const [isAdjusting, setIsAdjusting] = useState<boolean>(false);
  const [timeLeft, setTimeLeft] = useState<number>(
    Math.max(0, Math.floor((dueDate.getTime() - now.getTime()) / 1000))
  );

  // Función para calcular el tiempo restante
  const calculateRemainingTime = useCallback(() => {
    return Math.max(0, dueDate.getTime() - now.getTime());
  }, [dueDate, now]);

  const completeTask = useCallback(() => {
    setIsAdjusting(false);
    onTaskResized(0);

    onTaskCompleted();
    alert('¡Tarea finalizada!');
  }, [setIsAdjusting, onTaskResized, onTaskCompleted]);

  // Actualización automática del tiempo restante cada segundo
  useEffect(() => {
    if (timeLeft <= 0) return;

    const interval = setInterval(() => {
      const remaining = calculateRemainingTime();
      if (remaining <= 0) {
        setTimeLeft(0);
        completeTask();
      } else {
        setTimeLeft(remaining);
        setSliderValue(100 - (remaining / duration) * 100);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [timeLeft, calculateRemainingTime, completeTask, duration]);

  // Modo de ajuste: comenzar a mover el slider
  const handleSliderStart = useCallback(() => {
    setIsAdjusting(true);
  }, []);

  // Mover el slider: recalcular el tiempo restante
  const handleSliderChange = useCallback(
    (value: number) => {
      setSliderValue(value);
      const newRemainingTime = (value / 100) * duration;
      setTimeLeft(newRemainingTime);
    },
    [duration]
  );

  // Finalizar ajuste: guardar o revertir cambios
  const handleSliderEnd = useCallback(() => {
    setIsAdjusting(false);

    if (timeLeft <= 5000) {
      setTimeLeft(0);
      completeTask();
      return;
    }

    const newDuration = Date.now() + timeLeft;
    const userConfirmed = window.confirm(
      '¿Guardar cambios en la fecha de finalización?'
    );
    if (userConfirmed) {
      onTaskResized(newDuration);
    } else {
      setTimeLeft(dueDate.getTime() - Date.now());
      setSliderValue(100 - (timeLeft / duration) * 100);
    }
  }, [timeLeft, dueDate, duration, completeTask, onTaskResized]);

  // Mostrar tiempo restante en formato legible
  const formatTimeLeft = (time: number) => {
    const minutes = Math.floor(time / 60000);
    const seconds = Math.floor((time % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  };

  const totalDuration = duration;

  return (
    <div className="time-slider">
      {timeLeft > 0 ? (
        <>
          <div className="time-left">
            Tiempo restante: {formatTimeLeft(timeLeft)}
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={sliderValue}
            onMouseDown={handleSliderStart}
            onChange={(e) => handleSliderChange(Number(e.target.value))}
            onMouseUp={handleSliderEnd}
          />
        </>
      ) : (
        <>
          <div className="time-left">
            Tiempo total: {formatTimeLeft(totalDuration)}
          </div>
          <input type="range" min="0" max="100" value={0} disabled />
        </>
      )}
    </div>
  );
};

export default TimeSlider;

// import React, { useState, useCallback, useEffect } from 'react';

// interface TimeSliderProps {
//     task: any; // Se usa "any" porque Task no se importa
//     onTaskResized: (newDuration: number) => void;
// }

// const TimeSlider: React.FC<TimeSliderProps> = ({ task, onTaskResized }) => {
//     const scheduledTime = new Date(task.scheduledTime).getTime(); // Convertir a timestamp
//     const duration = task.duration ? task.duration * 60 * 1000 : 35 * 60 * 1000; // Duración en ms (35 min por defecto)
//     const dueDate = scheduledTime + duration; // Fecha de vencimiento real

//     const [sliderValue, setSliderValue] = useState<number>(0);
//     const [isAdjusting, setIsAdjusting] = useState<boolean>(false);
//     const [timeLeft, setTimeLeft] = useState<number>(dueDate - Date.now());

//     // Función para calcular el tiempo restante
//     const calculateRemainingTime = useCallback(() => {
//         const now = Date.now();
//         return Math.max(0, dueDate - now);
//     }, [dueDate]);

//     // Finalizar tarea
//     const completeTask = useCallback(() => {
//         setIsAdjusting(false);
//         onTaskResized(0);
//         alert('¡Tarea finalizada!');
//     }, [onTaskResized]);

//     // Actualización automática del tiempo restante cada segundo
//     useEffect(() => {
//         if (timeLeft <= 0) return;

//         const interval = setInterval(() => {
//             const remaining = calculateRemainingTime();
//             if (remaining <= 0) {
//                 setTimeLeft(0);
//                 completeTask();
//             } else {
//                 setTimeLeft(remaining);
//                 setSliderValue(100 - ((remaining / duration) * 100));
//             }
//         }, 1000);

//         return () => clearInterval(interval);
//     }, [timeLeft, calculateRemainingTime, completeTask, duration]);

//     // Modo de ajuste: comenzar a mover el slider
//     const handleSliderStart = useCallback(() => {
//         setIsAdjusting(true);
//     }, []);

//     // Mover el slider: recalcular el tiempo restante
//     const handleSliderChange = useCallback((value: number) => {
//         setSliderValue(value);
//         const newRemainingTime = (value / 100) * duration;
//         setTimeLeft(newRemainingTime);
//     }, [duration]);

//     // Finalizar ajuste: guardar o revertir cambios
//     const handleSliderEnd = useCallback(() => {
//         setIsAdjusting(false);

//         if (timeLeft <= 5000) {
//             setTimeLeft(0);
//             completeTask();
//             return;
//         }

//         const newDuration = Date.now() + timeLeft;
//         const userConfirmed = window.confirm('¿Guardar cambios en la fecha de finalización?');
//         if (userConfirmed) {
//             onTaskResized(newDuration);
//         } else {
//             setTimeLeft(dueDate - Date.now());
//             setSliderValue(100 - ((timeLeft / duration) * 100));
//         }
//     }, [timeLeft, dueDate, duration, completeTask, onTaskResized]);

//     // Mostrar tiempo restante en formato legible
//     const formatTimeLeft = (time: number) => {
//         const minutes = Math.floor(time / 60000);
//         const seconds = Math.floor((time % 60000) / 1000);
//         return `${minutes}m ${seconds}s`;
//     };

//     return (
//         <div className="time-slider">
//             <div className="time-left">Tiempo restante: {formatTimeLeft(timeLeft)}</div>
//             <input
//                 type="range"
//                 min="0"
//                 max="100"
//                 value={sliderValue}
//                 onMouseDown={handleSliderStart}
//                 onChange={(e) => handleSliderChange(Number(e.target.value))}
//                 onMouseUp={handleSliderEnd}
//             />
//         </div>
//     );
// };

// export default TimeSlider;
