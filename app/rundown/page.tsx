'use client';

import { Resizable } from 're-resizable';
import { useState } from 'react';

export default function Rundown() {
  const [actions, setActions] = useState([
    {
      id: 1,
      name: 'Action 1',
      description: 'Description 1',
      size: 2,
      status: 'ongoing',
    },
    {
      id: 2,
      name: 'Action 2',
      description: 'Description 2',
      size: 2,
      status: 'pending',
    },
    {
      id: 3,
      name: 'Action 3',
      description: 'Description 3',
      size: 1,
      status: 'pending',
    },
  ]);

  const sizeToHeight = (size: number) => size * 60;

  const snapToGrid = (height: number) => {
    const increment = 60;
    const snapped = Math.round(height / increment) * increment;
    return Math.max(60, snapped);
  };

  const handleResize = (index: number, height: number) => {
    const newSize = Math.round(height / 60);
    setActions((prevActions) =>
      prevActions.map((action, i) =>
        i === index ? { ...action, size: newSize } : action
      )
    );
  };

  return (
    <div className="p-4">
      {actions.map((action, index) => (
        <Resizable
          key={action.id}
          size={{ width: '100%', height: sizeToHeight(action.size) }}
          enable={{ top: false, right: false, bottom: true, left: false }}
          grid={[1, 60]}
          onResizeStop={(e, direction, ref, d) => {
            const newHeight = snapToGrid(sizeToHeight(action.size) + d.height);
            handleResize(index, newHeight);
          }}
        >
          <div
            className="border rounded p-4 mb-2 bg-white"
            style={{ height: '100%' }}
          >
            <h3>{action.name}</h3>
            <p>{action.description}</p>
            <p>Duration: {action.size * 15} minutes</p>
            <p>Status: {action.status}</p>
          </div>
        </Resizable>
      ))}
    </div>
  );
}
