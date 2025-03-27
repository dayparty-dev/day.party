import React from 'react';

interface TaskCardProps {
  task: any; // Se usa "any" porque Task no se importa
}

const TaskCard: React.FC<TaskCardProps> = ({ task }) => {
  const scheduledAt = task.scheduledAt ? new Date(task.scheduledAt) : null;
  const now = new Date();

  if (!scheduledAt || isNaN(scheduledAt.getTime())) {
    return (
      <div className="task-card">
        <h2>{task.title}</h2>
        <p>Error: Fecha programada inválida</p>
      </div>
    );
  }

  // Calcular dueDate sumando task.size * 15 minutos
  const dueDate = new Date(scheduledAt.getTime() + task.size * 15 * 60 * 1000);

  const totalDuration = Math.floor(
    (dueDate.getTime() - scheduledAt.getTime()) / 1000
  ); // Duración total en segundos
  const timeLeft = Math.max(
    0,
    Math.floor((dueDate.getTime() - now.getTime()) / 1000)
  ); // Tiempo restante en segundos

  // Si la tarea ya ha comenzado, mostrar el tiempo restante
  if (timeLeft > 0) {
    return (
      <div className="task-card">
        <h2>{task.title}</h2>
        <p>
          Tiempo total: {Math.floor(totalDuration / 60)}m {totalDuration % 60}s
        </p>
        {/* <p>Tiempo restante: {Math.floor(timeLeft / 60)}m {timeLeft % 60}s</p> */}
      </div>
    );
  }

  // Si la tarea no ha comenzado, mostrar el tiempo total y el mensaje
  return (
    <div className="task-card">
      <h2>{task.title}</h2>
      <p>
        Tiempo total: {Math.floor(totalDuration / 60)}m {totalDuration % 60}s
      </p>
      <p>
        ¿Listo para comenzar? La tarea empieza el {scheduledAt.toLocaleString()}
      </p>
    </div>
  );
};

export default TaskCard;
