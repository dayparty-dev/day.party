// components/TagPopoverEditor.tsx
import React, { useEffect, useRef, useState } from 'react';
import TagSelector from './TagSelector';

interface TagPopoverEditorProps {
  selectedKey: string | null;
  onSelect: (taskId: string, selectedKey: string) => void;
  onClose: () => void;
  anchorRef: React.RefObject<HTMLElement>;
}

const TagPopoverEditor: React.FC<TagPopoverEditorProps> = ({
  selectedKey,
  onSelect,
  onClose,
  anchorRef,
}) => {
  const popoverRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<'top' | 'bottom'>('bottom');

  useEffect(() => {
    const anchor = anchorRef.current;
    const popover = popoverRef.current;

    if (anchor && popover) {
      const rect = anchor.getBoundingClientRect();
      const screenHeight = window.innerHeight;

      const fitsBelow = rect.bottom + popover.offsetHeight < screenHeight;
      setPosition(fitsBelow ? 'bottom' : 'top');
    }
  }, []);

  // Cerrar si haces click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node) &&
        !anchorRef.current?.contains(event.target as Node)
      ) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  return (
    <div
      ref={popoverRef}
      className="absolute z-50 bg-white border rounded shadow-md"
      style={{
        top: position === 'bottom'
          ? anchorRef.current?.getBoundingClientRect().bottom! + window.scrollY + 8
          : anchorRef.current?.getBoundingClientRect().top! + window.scrollY - 120,
        left: anchorRef.current?.getBoundingClientRect().left! + window.scrollX,
      }}
    >
      <TagSelector
        selectedKey={selectedKey}
      />
    </div>
  );
};

export default TagPopoverEditor;
