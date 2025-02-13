import { Task, TaskStatus } from '../../../models/Task';

interface TaskPiPProps {
  currentTask: Task | null;
  nextTask: Task | null;
  onStatusChange?: (taskId: string, status: TaskStatus) => Promise<void>;
  onFinish?: () => Promise<void>;
}

export default function TaskPiP({
  currentTask,
  nextTask,
  onStatusChange,
  onFinish,
}: TaskPiPProps) {
  return (
    <div className="pip-container">
      {currentTask && (
        <div className="current-task">
          <h3>Current Task</h3>
          <div
            className="task-info"
            data-task-id={currentTask._id}
            data-status={currentTask.status}
          >
            <h4>{currentTask.title}</h4>
            <p>{currentTask.size * 15} mins</p>
            {onStatusChange && (
              <div className="status-controls">
                <button
                  className={`status ${currentTask.status}`}
                  onClick={() => {
                    const nextStatus: TaskStatus =
                      currentTask.status === 'ongoing' ? 'paused' : 'ongoing';
                    onStatusChange(currentTask._id, nextStatus);
                  }}
                  aria-pressed={currentTask.status === 'ongoing'}
                  aria-label={`Toggle task status: currently ${currentTask.status}`}
                >
                  {currentTask.status}
                </button>
                {currentTask.status !== 'done' && (
                  <button
                    className="finish-btn"
                    onClick={onFinish}
                    aria-label="Mark task as done"
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
      {nextTask && (
        <div className="next-task">
          <h3>Next Task</h3>
          <div className="task-info">
            <h4>{nextTask.title}</h4>
            <p>{nextTask.size * 15} mins</p>
          </div>
        </div>
      )}
    </div>
  );
}
