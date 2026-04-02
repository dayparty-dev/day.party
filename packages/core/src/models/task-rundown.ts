import type { Task } from './task';

const NOTES_PREVIEW_MAX = 120;

/** Task row in `DayRundown` — no full notes body; optional short preview (contract P3). */
export type TaskRundownItem = Omit<Task, 'notesMarkdown'> & {
  notesPreview?: string;
};

export function taskToRundownItem(task: Task): TaskRundownItem {
  const { notesMarkdown, ...rest } = task;
  const item: TaskRundownItem = { ...rest };
  if (notesMarkdown && notesMarkdown.trim()) {
    const firstLine = notesMarkdown.trim().split(/\r?\n/)[0] ?? '';
    item.notesPreview = firstLine.length > NOTES_PREVIEW_MAX ? `${firstLine.slice(0, NOTES_PREVIEW_MAX)}…` : firstLine;
  }
  return item;
}
