import React, { useRef, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import TaskPiP from './TaskPiP';
import { TaskStatus } from '../../_models/Task';

interface PiPManagerProps {
  isPiPActive: boolean;
  currentTask: any; // Replace with proper Task type
  nextTask: any; // Replace with proper Task type
  onStatusChange: (id: string, status: TaskStatus) => Promise<void>;
  onFinish: () => Promise<void>;
}

const PiPManager: React.FC<PiPManagerProps> = ({
  isPiPActive,
  currentTask,
  nextTask,
  onStatusChange,
  onFinish,
}) => {
  const pipContainerRef = useRef<HTMLDivElement>(null);

  if (isPiPActive) {
    return null;
  }

  return (
    <div ref={pipContainerRef} className="pip-source-container">
      <TaskPiP
        currentTask={currentTask}
        nextTask={nextTask}
        onStatusChange={onStatusChange}
        onFinish={onFinish}
      />
    </div>
  );
};

export function setupPiPStyles(pipWindow: Window): void {
  // Add base styles to PiP window
  const baseStyles = pipWindow.document.createElement('style');
  baseStyles.textContent = `
    body {
      margin: 0;
      padding: 0;
      background: white;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', 
        Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
    }

    .pip-container {
      background: none;
      box-shadow: none;
      border-radius: 0;
      padding: 16px;
      width: 280px;
    }

    .task-info {
      background: #f5f5f5;
      border-radius: 6px;
      padding: 12px;
      margin-bottom: 12px;
    }

    .current-task .task-info {
      background: #f5f5f5;
      border: 1px solid #ddd;
    }

    .current-task .task-info[data-status="ongoing"] {
      background: rgba(76, 175, 80, 0.1);
      border: 1px solid #4caf50;
    }

    .current-task .task-info[data-status="paused"] {
      background: rgba(255, 193, 7, 0.1);
      border: 1px solid #ffc107;
    }

    .current-task .task-info[data-status="pending"] {
      background: rgba(255, 243, 205, 0.1);
      border: 1px solid #856404;
    }

    .status {
      position: static;
      font-size: 12px;
      padding: 4px 8px;
      border-radius: 3px;
      cursor: pointer;
      border: none;
      transition: all 0.2s ease;
    }

    .status.pending {
      background: #fff3cd;
      color: #856404;
    }

    .status.ongoing {
      background: #4caf50;
      color: white;
    }

    .status.paused {
      background: #ffc107;
      color: black;
    }

    .status.done {
      background: #9e9e9e;
      color: white;
    }

    .status-controls {
      margin-top: auto;
      display: flex;
      gap: 8px;
      align-items: center;
      justify-content: flex-end;
    }

    .finish-btn {
      background: #4caf50;
      color: white;
      border: none;
      border-radius: 50%;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s ease;
      padding: 0;
      box-shadow: 0 2px 4px rgba(76, 175, 80, 0.2);
    }

    .finish-btn:hover {
      background: #45a049;
      transform: scale(1.1);
      box-shadow: 0 3px 6px rgba(76, 175, 80, 0.3);
    }

    .finish-btn:active {
      transform: scale(0.95);
    }

    .finish-btn svg {
      transform: translateY(1px);
    }

    h3 {
      font-size: 12px;
      text-transform: uppercase;
      color: #666;
      margin: 0 0 8px;
    }

    h4 {
      margin: 0 0 4px;
      font-size: 14px;
      color: #333;
    }

    p {
      margin: 0;
      font-size: 12px;
      color: #666;
    }
  `;
  pipWindow.document.head.appendChild(baseStyles);
}

export function copyStylesheets(pipWindow: Window): void {
  // Copy all stylesheets from the main window
  const styles = Array.from(document.styleSheets);
  styles.forEach((styleSheet) => {
    try {
      if (styleSheet.href) {
        const linkElem = pipWindow.document.createElement('link');
        linkElem.rel = 'stylesheet';
        linkElem.href = styleSheet.href;
        pipWindow.document.head.appendChild(linkElem);
      } else if (styleSheet.cssRules) {
        const styleElem = pipWindow.document.createElement('style');
        Array.from(styleSheet.cssRules).forEach((rule) => {
          styleElem.textContent += rule.cssText;
        });
        pipWindow.document.head.appendChild(styleElem);
      }
    } catch (e) {
      console.warn('Could not copy stylesheet:', e);
    }
  });
}

export default PiPManager;
