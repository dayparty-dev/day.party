import type {
  DayCapacityHint,
  DayPartyClient,
  DayRundownResponse,
  TagResponse,
  TaskRundownItemResponse,
  TaskTriageInput,
} from '@dayparty/api-client';
import { ERROR_CODES } from '@dayparty/core';
import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors } from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import { useTranslation } from 'react-i18next';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { ReactElement } from 'react';
import { useCallback, useEffect, useState } from 'react';
import { runwayPlacementForTask, showTriageForTask } from '../utils/rundown-task-helpers';
import { isLikelyNetworkFailure } from '../utils/network-error';
import { TaskCard } from './TaskCard';
import { TaskEditPanel } from './TaskEditPanel';
import { TaskNotesPanel } from './TaskNotesPanel';
import { TaskTriageBar } from './TaskTriageBar';
import styles from './RunwayTaskList.module.css';
import rundownStyles from '../pages/RundownPage.module.css';

type RunwayTaskListProps = {
  date: string;
  tomorrowDate: string;
  sortedTasks: TaskRundownItemResponse[];
  rundown: DayRundownResponse;
  tags: TagResponse[];
  tagColorByKey: Map<string, string>;
  capacityHints: DayCapacityHint[];
  triageBusyId: string | null;
  focusBusyId: string | null;
  client: DayPartyClient;
  onUnauthorized: () => void;
  onNetworkError: (message: string) => void;
  onOtherError: (message: string) => void;
  load: () => void | Promise<void>;
  onNotesSaved: () => void;
  toggleTask: (task: TaskRundownItemResponse) => Promise<void>;
  toggleTaskFocus: (task: TaskRundownItemResponse) => Promise<void>;
  runTriage: (taskId: string, body: TaskTriageInput) => Promise<void>;
};

type SortableRowProps = {
  task: TaskRundownItemResponse;
  index: number;
  total: number;
  rundown: DayRundownResponse;
  tagColor?: string;
  date: string;
  tomorrowDate: string;
  capacityHints: DayCapacityHint[];
  triageBusyId: string | null;
  focusBusyId: string | null;
  tags: TagResponse[];
  client: DayPartyClient;
  onUnauthorized: () => void;
  onNetworkError: (message: string) => void;
  onOtherError: (message: string) => void;
  load: () => void | Promise<void>;
  onNotesSaved: () => void;
  toggleTask: (task: TaskRundownItemResponse) => Promise<void>;
  toggleTaskFocus: (task: TaskRundownItemResponse) => Promise<void>;
  runTriage: (taskId: string, body: TaskTriageInput) => Promise<void>;
  reorderBusy: boolean;
  onMoveByKeyboard: (taskId: string, delta: number) => void;
};

function SortableTaskRow({
  task,
  index,
  total,
  rundown,
  tagColor,
  date,
  tomorrowDate,
  capacityHints,
  triageBusyId,
  focusBusyId,
  tags,
  client,
  onUnauthorized,
  onNetworkError,
  onOtherError,
  load,
  onNotesSaved,
  toggleTask,
  toggleTaskFocus,
  runTriage,
  reorderBusy,
  onMoveByKeyboard,
}: SortableRowProps): ReactElement {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    disabled: reorderBusy || total < 2,
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const canMoveUp = index > 0 && !reorderBusy;
  const canMoveDown = index < total - 1 && !reorderBusy;

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={`${rundownStyles.li} ${styles.row} ${isDragging ? styles.rowDragging : ''}`}
    >
      {total >= 2 ? (
        <div className={styles.reorderBar}>
          <button
            type="button"
            ref={setActivatorNodeRef}
            className={styles.dragHandle}
            {...listeners}
            {...attributes}
            aria-label={`Drag to reorder “${task.title}”`}
          >
            Drag
          </button>
          <button
            type="button"
            className={styles.moveBtn}
            disabled={!canMoveUp}
            aria-label={`Move “${task.title}” up in the list`}
            onClick={() => onMoveByKeyboard(task.id, -1)}
          >
            Move up
          </button>
          <button
            type="button"
            className={styles.moveBtn}
            disabled={!canMoveDown}
            aria-label={`Move “${task.title}” down in the list`}
            onClick={() => onMoveByKeyboard(task.id, 1)}
          >
            Move down
          </button>
        </div>
      ) : null}
      <TaskCard
        task={task}
        tagColor={tagColor}
        runwayPlacement={runwayPlacementForTask(task, rundown.dayFit)}
        onToggleComplete={toggleTask}
        focusBusy={focusBusyId === task.id}
        onToggleFocus={toggleTaskFocus}
      />
      <TaskEditPanel
        client={client}
        taskId={task.id}
        tags={tags}
        onUnauthorized={onUnauthorized}
        onNetworkError={onNetworkError}
        onOtherError={onOtherError}
        onSaved={load}
      />
      {showTriageForTask(task, rundown.dayFit) ? (
        <TaskTriageBar
          task={task}
          listDate={date}
          tomorrowDate={tomorrowDate}
          hints={capacityHints}
          busy={triageBusyId === task.id}
          onDeferTomorrow={() => runTriage(task.id, { action: 'defer_to_date', targetDate: tomorrowDate })}
          onDeferToDate={(targetDate) => runTriage(task.id, { action: 'defer_to_date', targetDate })}
          onDemote={() => runTriage(task.id, { action: 'demote' })}
          onMarkSkipped={() => runTriage(task.id, { action: 'mark_skipped' })}
          onClearSkipped={() => runTriage(task.id, { action: 'clear_skipped' })}
        />
      ) : null}
      <TaskNotesPanel
        client={client}
        taskId={task.id}
        taskTitle={task.title}
        notesPreview={task.notesPreview}
        onUnauthorized={onUnauthorized}
        onSaved={onNotesSaved}
      />
    </li>
  );
}

export function RunwayTaskList({
  date,
  tomorrowDate,
  sortedTasks,
  rundown,
  tags,
  tagColorByKey,
  capacityHints,
  triageBusyId,
  focusBusyId,
  client,
  onUnauthorized,
  onNetworkError,
  onOtherError,
  load,
  onNotesSaved,
  toggleTask,
  toggleTaskFocus,
  runTriage,
}: RunwayTaskListProps): ReactElement {
  const { t } = useTranslation();
  const [items, setItems] = useState<TaskRundownItemResponse[]>(sortedTasks);
  const [reorderBusy, setReorderBusy] = useState(false);

  useEffect(() => {
    setItems(sortedTasks);
  }, [sortedTasks]);

  const persistOrder = useCallback(
    async (next: TaskRundownItemResponse[]): Promise<boolean> => {
      if (next.length === 0) {
        return true;
      }
      setReorderBusy(true);
      const res = await client.reorderTasks({ date, taskIds: next.map((t) => t.id) });
      setReorderBusy(false);
      if (!res.ok) {
        if (res.error.code === ERROR_CODES.UNAUTHORIZED) {
          onUnauthorized();
          return false;
        }
        if (isLikelyNetworkFailure(res.error)) {
          onNetworkError(res.error.message);
        } else {
          onOtherError(res.error.message);
        }
        return false;
      }
      await load();
      return true;
    },
    [client, date, load, onNetworkError, onOtherError, onUnauthorized],
  );

  const onMoveByKeyboard = useCallback(
    (taskId: string, delta: number) => {
      const idx = items.findIndex((t) => t.id === taskId);
      const newIdx = idx + delta;
      if (idx < 0 || newIdx < 0 || newIdx >= items.length) {
        return;
      }
      const previous = items;
      const next = arrayMove(items, idx, newIdx);
      setItems(next);
      void (async () => {
        const ok = await persistOrder(next);
        if (!ok) {
          setItems(previous);
        }
      })();
    },
    [items, persistOrder],
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const onDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) {
        return;
      }
      const oldIndex = items.findIndex((t) => t.id === active.id);
      const newIndex = items.findIndex((t) => t.id === over.id);
      if (oldIndex < 0 || newIndex < 0) {
        return;
      }
      const previous = items;
      const next = arrayMove(items, oldIndex, newIndex);
      setItems(next);
      const ok = await persistOrder(next);
      if (!ok) {
        setItems(previous);
      }
    },
    [items, persistOrder],
  );

  return (
    <>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(e) => void onDragEnd(e)}>
        <SortableContext items={items.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          <ul className={rundownStyles.list}>
            {items.map((task, index) => (
              <SortableTaskRow
                key={task.id}
                task={task}
                index={index}
                total={items.length}
                rundown={rundown}
                tagColor={task.tagKey ? tagColorByKey.get(task.tagKey) : undefined}
                date={date}
                tomorrowDate={tomorrowDate}
                capacityHints={capacityHints}
                triageBusyId={triageBusyId}
                focusBusyId={focusBusyId}
                tags={tags}
                client={client}
                onUnauthorized={onUnauthorized}
                onNetworkError={onNetworkError}
                onOtherError={onOtherError}
                load={load}
                onNotesSaved={onNotesSaved}
                toggleTask={toggleTask}
                toggleTaskFocus={toggleTaskFocus}
                runTriage={runTriage}
                reorderBusy={reorderBusy}
                onMoveByKeyboard={onMoveByKeyboard}
              />
            ))}
          </ul>
        </SortableContext>
      </DndContext>
      {items.length === 0 ? <p className={rundownStyles.empty}>{t('rundown.emptyDay')}</p> : null}
    </>
  );
}
