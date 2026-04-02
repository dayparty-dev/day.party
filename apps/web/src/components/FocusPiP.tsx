import type { TaskRundownItemResponse } from '@dayparty/api-client';
import type { TaskStatus } from '@dayparty/core';
import type { ReactElement } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import styles from './FocusPiP.module.css';

type DocumentPictureInPictureApi = {
  requestWindow: (options?: { width?: number; height?: number }) => Promise<Window>;
};

function getDocumentPictureInPicture(): DocumentPictureInPictureApi | undefined {
  return (window as unknown as { documentPictureInPicture?: DocumentPictureInPictureApi }).documentPictureInPicture;
}

export function isDocumentPiPSupported(): boolean {
  return typeof getDocumentPictureInPicture()?.requestWindow === 'function';
}

type PiPInnerProps = {
  title: string;
  tagColor?: string;
  elapsedLabel: string;
  progressPct: number;
  targetMinutes: number;
  focusStatus: TaskStatus;
  nextTitle: string | null;
  focusBusy: boolean;
  onToggleFocus: () => void;
  onComplete: () => void;
  onRequestClose: () => void;
};

function PiPChrome(props: PiPInnerProps): ReactElement {
  const {
    title,
    tagColor,
    elapsedLabel,
    progressPct,
    targetMinutes,
    focusStatus,
    nextTitle,
    focusBusy,
    onToggleFocus,
    onComplete,
    onRequestClose,
  } = props;
  const canToggle = focusStatus === 'planned' || focusStatus === 'in_progress';

  return (
    <div
      style={{
        boxSizing: 'border-box',
        minHeight: '100vh',
        margin: 0,
        padding: 16,
        fontFamily: 'system-ui, sans-serif',
        background: '#0f1419',
        color: '#e7ecf3',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <span style={{ fontSize: 12, opacity: 0.75 }}>Focus</span>
        <button
          type="button"
          onClick={onRequestClose}
          style={{
            border: 'none',
            background: 'rgba(255,255,255,0.12)',
            color: '#e7ecf3',
            borderRadius: 6,
            padding: '6px 10px',
            cursor: 'pointer',
            fontSize: 12,
          }}
        >
          Close
        </button>
      </div>
      <div
        style={{
          height: 4,
          borderRadius: 2,
          background: 'rgba(255,255,255,0.12)',
          marginBottom: 12,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${progressPct}%`,
            background: tagColor ?? '#5b8cff',
            transition: 'width 0.3s linear',
          }}
        />
      </div>
      <p
        style={{ margin: '0 0 4px', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', opacity: 0.65 }}
      >
        Now
      </p>
      <h1 style={{ margin: '0 0 8px', fontSize: 18, lineHeight: 1.25, fontWeight: 600 }}>{title}</h1>
      <p style={{ margin: '0 0 16px', fontSize: 13, opacity: 0.8 }}>
        {elapsedLabel} elapsed · ~{targetMinutes} min target
      </p>
      {canToggle ? (
        <button
          type="button"
          disabled={focusBusy}
          onClick={onToggleFocus}
          style={{
            width: '100%',
            marginBottom: 10,
            padding: '10px 12px',
            borderRadius: 8,
            border: 'none',
            background: '#2a3444',
            color: '#e7ecf3',
            fontWeight: 600,
            cursor: focusBusy ? 'wait' : 'pointer',
          }}
        >
          {focusBusy ? 'Updating…' : focusStatus === 'in_progress' ? 'Pause' : 'Start'}
        </button>
      ) : null}
      <button
        type="button"
        onClick={onComplete}
        style={{
          width: '100%',
          padding: '10px 12px',
          borderRadius: 8,
          border: 'none',
          background: '#3d6b4f',
          color: '#fff',
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        Mark complete
      </button>
      {nextTitle ? (
        <section style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.12)' }}>
          <p style={{ margin: '0 0 4px', fontSize: 11, opacity: 0.65 }}>Next up</p>
          <p style={{ margin: 0, fontSize: 14 }}>{nextTitle}</p>
        </section>
      ) : (
        <p style={{ marginTop: 20, fontSize: 13, opacity: 0.7 }}>Last open task for today.</p>
      )}
    </div>
  );
}

export type FocusPiPProps = {
  focusTask: TaskRundownItemResponse;
  nextTask: TaskRundownItemResponse | null;
  tagColor?: string;
  elapsedLabel: string;
  progressPct: number;
  targetMinutes: number;
  focusBusy: boolean;
  onToggleFocus: () => void | Promise<void>;
  onMarkComplete: () => void | Promise<void>;
};

/**
 * Document Picture-in-Picture shell for compact focus (FR-006). Hidden when unsupported.
 */
export function FocusPiPControl(props: FocusPiPProps): ReactElement | null {
  const {
    focusTask,
    nextTask,
    tagColor,
    elapsedLabel,
    progressPct,
    targetMinutes,
    focusBusy,
    onToggleFocus,
    onMarkComplete,
  } = props;

  const [pipActive, setPipActive] = useState(false);
  const pipWindowRef = useRef<Window | null>(null);
  const rootRef = useRef<Root | null>(null);
  const closePipRef = useRef<() => void>(() => {});

  const closePip = useCallback(() => {
    const win = pipWindowRef.current;
    pipWindowRef.current = null;
    rootRef.current?.unmount();
    rootRef.current = null;
    setPipActive(false);
    try {
      win?.close();
    } catch {
      /* ignore */
    }
  }, []);
  closePipRef.current = closePip;

  const renderIntoPip = useCallback(() => {
    const win = pipWindowRef.current;
    if (!win?.document.body) {
      return;
    }
    const innerProps: PiPInnerProps = {
      title: focusTask.title,
      tagColor,
      elapsedLabel,
      progressPct,
      targetMinutes,
      focusStatus: focusTask.status,
      nextTitle: nextTask?.title ?? null,
      focusBusy,
      onToggleFocus: () => void onToggleFocus(),
      onComplete: () => void onMarkComplete(),
      onRequestClose: closePip,
    };
    if (!rootRef.current) {
      rootRef.current = createRoot(win.document.body);
    }
    rootRef.current.render(<PiPChrome {...innerProps} />);
  }, [
    closePip,
    elapsedLabel,
    focusBusy,
    focusTask.status,
    focusTask.title,
    nextTask?.title,
    onMarkComplete,
    onToggleFocus,
    progressPct,
    tagColor,
    targetMinutes,
  ]);

  useEffect(() => {
    if (pipActive) {
      renderIntoPip();
    }
  }, [pipActive, renderIntoPip]);

  useEffect(() => {
    return () => {
      closePip();
    };
  }, [closePip]);

  async function openPip(): Promise<void> {
    const api = getDocumentPictureInPicture();
    if (!api) {
      return;
    }
    try {
      const pipWindow = await api.requestWindow({ width: 360, height: 420 });
      pipWindowRef.current = pipWindow;
      pipWindow.addEventListener('pagehide', () => closePipRef.current());
      setPipActive(true);
    } catch {
      setPipActive(false);
    }
  }

  if (!isDocumentPiPSupported()) {
    return null;
  }

  return (
    <button type="button" className={styles.pipTrigger} onClick={() => void openPip()} disabled={pipActive}>
      {pipActive ? 'Compact window open' : 'Open compact focus window'}
    </button>
  );
}
