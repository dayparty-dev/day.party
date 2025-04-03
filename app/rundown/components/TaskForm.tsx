import React from 'react';
import a from "../../i18n"; // Importa la inicialización
import { useTranslation } from 'next-i18next';


interface TaskFormProps {
  newTaskTitle: string;
  setNewTaskTitle: (title: string) => void;
  newTaskSize: number;
  setNewTaskSize: (size: number) => void;
  onSubmit: (e: React.FormEvent) => void;
}

const timeOptions = [
  { value: 1, label: '15 min' },
  { value: 2, label: '30 min' },
  { value: 3, label: '45 min' },
  { value: 4, label: '60 min' },
];

const TaskForm: React.FC<TaskFormProps> = ({
  newTaskTitle,
  setNewTaskTitle,
  newTaskSize,
  setNewTaskSize,
  onSubmit,
}) => {
  const { t } = useTranslation("", { "i18n": a });

  return (
    <>
      <form onSubmit={onSubmit} className="task-form flex flex-col max-w-sm mx-auto sm:flex-row gap-2">
        <div className="flex w-full gap-2">
          <input
            type="text"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            placeholder={t('taskForm.placeholder')}
            className="input input-bordered w-3/5 sm:w-full"
          />

          <select
            value={newTaskSize}
            onChange={(e) => setNewTaskSize(Number(e.target.value))}
            className="select select-bordered w-2/5 sm:w-auto"
          >
            {timeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <button type="submit" className="btn btn-primary w-full sm:w-auto sm:btn-md btn-sm">
          {t('taskForm.addButton')}
        </button>
      </form>

    </>
  );
};

export default TaskForm;
