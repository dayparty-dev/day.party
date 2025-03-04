'use client';

interface DayCapacityProps {
  capacity: number;
  used: number;
  onCapacityChange: (newCapacity: number) => void;
}

export default function DayCapacity({
  capacity,
  used,
  onCapacityChange,
}: DayCapacityProps) {
  const percentageUsed = (used / (capacity * 60)) * 100;
  const isOverCapacity = used > capacity * 60;

  return (
    <div className="day-capacity">
      <div className="capacity-header">
        <label>
          Daily Capacity:
          <select
            value={capacity}
            onChange={(e) => onCapacityChange(Number(e.target.value))}
          >
            <option value={4}>4 hours</option>
            <option value={6}>6 hours</option>
            <option value={8}>8 hours</option>
            <option value={10}>10 hours</option>
          </select>
        </label>
        <span
          className={`capacity-used ${isOverCapacity ? 'over-capacity' : ''}`}
        >
          {Math.floor(used / 60)}h {used % 60}m / {capacity}h
        </span>
      </div>
      <div className="capacity-bar">
        <div
          className={`capacity-fill ${isOverCapacity ? 'over-capacity' : ''}`}
          style={{ width: `${Math.min(percentageUsed, 100)}%` }}
        />
      </div>
    </div>
  );
}
