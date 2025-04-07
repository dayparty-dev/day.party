'use client';

import a from "../../i18n"; // Importa la inicialización
import { useTranslation } from 'next-i18next';
import { useTaskContext } from '../../_contexts/TaskContext';

export default function DayCapacity() {
  const { t } = useTranslation("", { "i18n": a });
  const { tasks,
    dayCapacity,
    setDayCapacity,
    totalMinutes,
  } = useTaskContext();

  const percentageUsed = (totalMinutes / (dayCapacity * 60)) * 100;
  const isOverCapacity = totalMinutes > dayCapacity * 60;

  return (
    <>
      <div className="max-w-sm mx-auto mb-5">
        <div className="flex justify-between items-center mb-2 gap-2">
          <label className="flex items-center gap-2">
            {t('dayCapacity.label')}:
            <select
              value={dayCapacity}
              onChange={(e) => setDayCapacity(Number(e.target.value))}
              className="select select-bordered select-sm w-fit"
            >
              {[4, 6, 8, 10].map((value) => (
                <option key={value} value={value}>
                  {t('dayCapacity.hours', { hours: value })}
                </option>
              ))}
            </select>
          </label>

          <span className={`font-semibold ${isOverCapacity ? 'text-error' : ''}`}>
            {Math.floor(totalMinutes / 60)}h {totalMinutes % 60}m / {dayCapacity}h
          </span>
        </div>

        <div className="h-2 bg-base-300 rounded-lg overflow-hidden">
          <div
            className={`h-full transition-all ${isOverCapacity ? 'bg-error' : 'bg-primary'}`}
            style={{ width: `${Math.min(percentageUsed, 100)}%` }}
          />
        </div>
      </div>
    </>

  );
}
