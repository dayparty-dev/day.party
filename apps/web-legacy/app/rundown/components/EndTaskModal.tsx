import { useAppTranslation } from "app/_hooks/useAppTranslation";
import { useTasks } from "app/_hooks/useTasks";
import { Task } from "app/_models/Task";
import { useTaskStore } from "app/_stores/useTaskStore";
import { useState } from "react";

interface EndTaskModalProps {
    task: Task;
    setShowEndModal: (show: boolean) => void;
    setElapsed: (elapsed: number) => void;
    elapsed: number;
}

export default function EndTaskModal({
    task,
    setShowEndModal,
}: EndTaskModalProps) {
    const [customMinutes, setCustomMinutes] = useState<string>('');
    const { t } = useAppTranslation();
    // const { updateTask } = useTaskStore((state) => ({
    //     updateTask: state.updateTask,
    // }));
    // const updateTask = useTaskStore((state) => state.updateTask);
    const { updateTask } = useTasks();

    function onStatusChange(id: string, status: string) {
        updateTask(task._id, {
            status: 'done',
        });
    }

    function handleAddMinutes(mins: number) {
        if (!mins || isNaN(mins)) return;

        const extra = mins;
        const newDuration = task.duration + extra;
        updateTask(task._id, {
            duration: newDuration,
        });
        setShowEndModal(false);
        setCustomMinutes('');
    }

    return (
        <dialog className="modal modal-open">
            <div className="modal-box">
                <h3 className="font-bold text-lg">{t('task.endTaskModal.finishedConfirm')}</h3>
                <div className="py-4 flex flex-col gap-2">
                    <button
                        className="btn btn-outline"
                        onClick={() => handleAddMinutes(5)}
                    >
                        +5 {t('task.minutes')}
                    </button>
                    <button
                        className="btn btn-outline"
                        onClick={() => handleAddMinutes(10)}
                    >
                        +10 {t('task.minutes')}
                    </button>
                    <input
                        type="number"
                        className="input input-bordered w-full"
                        placeholder={t('task.endTaskModal.customMinutes')}
                        value={customMinutes}
                        onChange={(e) => setCustomMinutes(e.target.value)}
                    />
                    <button
                        className="btn btn-primary"
                        onClick={() => handleAddMinutes(Number(customMinutes))}
                        disabled={!customMinutes}
                    >
                        {t('task.endTaskModal.addMinutes', { count: Number(customMinutes) })}
                    </button>
                    <div className="divider" />
                    <button
                        className="btn btn-success"
                        onClick={() => {
                            onStatusChange(task._id, 'done');
                            setShowEndModal(false);
                        }}
                    >
                        {t('task.endTaskModal.markDone')}
                    </button>
                </div>
            </div>
            <form method="dialog" className="modal-backdrop">
                <button onClick={() => {
                    onStatusChange(task._id, 'done');
                    setShowEndModal(false);
                }}>✕</button>
            </form>
        </dialog>
    )
};