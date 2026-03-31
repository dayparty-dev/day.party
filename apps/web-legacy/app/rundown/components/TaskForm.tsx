import { useCallback, useRef, useState } from 'react';
import { useAppTranslation } from 'app/_hooks/useAppTranslation';
import { useTasks } from 'app/_hooks/useTasks';
import TagSelector from './TagSelector';

const timeOptions = [
  { value: 1, label: '15 min' },
  { value: 2, label: '30 min' },
  { value: 3, label: '45 min' },
  { value: 4, label: '60 min' },
];

const TaskForm: React.FC = () => {
  const { t } = useAppTranslation();
  const {
    addTask,
    currentDate,
    setCurrentDate,
    dayCapacity,
    totalMinutes,
  } = useTasks();
  const [selectedTagKey, setSelectedTagKey] = useState<string | null>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const sizeRef = useRef<HTMLSelectElement>(null);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();

      const title = titleRef.current?.value.trim() || '';
      const size = Number(sizeRef.current?.value || 1);
      const newTaskMinutes = size * 15;

      if (!title) return;

      console.log("selectedTagKey", selectedTagKey);
      if (totalMinutes + newTaskMinutes > dayCapacity * 60) {
        if (
          confirm('This will exceed your daily capacity. Move to next day?')
        ) {
          const nextDay = new Date(currentDate);
          nextDay.setDate(nextDay.getDate() + 1);
          addTask({ title, size, scheduledAt: nextDay, tagKey: selectedTagKey });
          setCurrentDate(nextDay);
        }
        return;
      }

      addTask({ title, size, scheduledAt: currentDate, tagKey: selectedTagKey });
      if (titleRef.current) titleRef.current.value = '';
      if (sizeRef.current) sizeRef.current.value = '1';
      // setSelectedTagKey(null);
    },
    [addTask, currentDate, totalMinutes, dayCapacity, selectedTagKey, setCurrentDate]
  );

  const handleTagSelect = (key: string | null) => {
    console.log('selectedTagKey', key);
    setSelectedTagKey(() => key);
  };

  return (
    <form onSubmit={handleSubmit} className="task-form flex flex-col max-w-sm mx-auto gap-2">
      <div className="flex w-full gap-2">
        <input
          type="text"
          ref={titleRef}
          placeholder={t('taskForm.placeholder')}
          className="input input-bordered w-3/5 sm:w-full"
        />

        <select
          ref={sizeRef}
          defaultValue="1"
          className="select select-bordered w-2/5 sm:w-auto"
        >
          {timeOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <TagSelector onSelect={handleTagSelect} />

      <button type="submit" className="btn btn-primary w-full sm:w-auto sm:btn-md btn-sm">
        {t('taskForm.addButton')}
      </button>
    </form>
  );
};

export default TaskForm;