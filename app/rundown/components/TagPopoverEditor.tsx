import { useEffect, useRef, useState } from 'react';
import TagSelector from './TagSelector';

interface TagPopoverEditorProps {
  selectedKey: string | null;
  anchorRef: React.RefObject<HTMLElement>;
  onSelect: (key: string) => void;
  onClose: () => void;
  needEdditingStyles?: boolean;
}

const TagPopoverEditor: React.FC<TagPopoverEditorProps> = ({
  selectedKey,
  anchorRef,
  onSelect,
  onClose,
  needEdditingStyles = false,
}) => {
  const popoverRef = useRef<HTMLDivElement>(null);
  const [popoverStyles, setPopoverStyles] = useState<React.CSSProperties>({});

  // const updatePosition = () => {
  //   if (!anchorRef.current || !popoverRef.current) return;

  //   const anchorRect = anchorRef.current.getBoundingClientRect();
  //   const popoverRect = popoverRef.current.getBoundingClientRect();

  //   const spaceAbove = anchorRect.top;
  //   const spaceBelow = window.innerHeight - anchorRect.bottom;

  //   const shouldShowAbove = spaceAbove > popoverRect.height + 8;

  //   const top = shouldShowAbove
  //     ? anchorRect.top + window.scrollY - popoverRect.height - 8
  //     : anchorRect.bottom + window.scrollY + 8;

  //   const left =
  //     anchorRect.left +
  //     anchorRect.width / 2 -
  //     popoverRect.width / 2 +
  //     window.scrollX;

  //   const maxWidth = anchorRect.width;

  //   setPopoverStyles({
  //     position: 'absolute',
  //     top,
  //     left,
  //     maxWidth,
  //     zIndex: 900,
  //   });
  // };

  // // Update position on mount and on scroll/resize
  // useEffect(() => {
  //   updatePosition();

  //   const handleResizeOrScroll = () => {
  //     updatePosition();
  //   };

  //   window.addEventListener('scroll', handleResizeOrScroll, true);
  //   window.addEventListener('resize', handleResizeOrScroll);

  //   return () => {
  //     window.removeEventListener('scroll', handleResizeOrScroll, true);
  //     window.removeEventListener('resize', handleResizeOrScroll);
  //   };
  // }, [anchorRef]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node) &&
        anchorRef.current &&
        !anchorRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [popoverRef, anchorRef]);

  const handleSelect = (key: string) => {
    onSelect(key);
    onClose();
  };

  return (
    // <div ref={ref} style={style} className="bg-white border rounded shadow-lg">
    <div ref={popoverRef} className="absolute bg-white border shadow-lg rounded-2xl bottom-full max-w-[350px] md:max-w-[435px] lg:max-w-[600px]">
      <div className='relative p-4'>

        <TagSelector
          selectedKey={selectedKey}
          onSelect={handleSelect}
        />

        <button
          className="absolute top-0 right-0 h-auto text-gray-500 hover:text-black"
          onClick={onClose}
        >
          ×
        </button>
      </div>
    </div>
  );
};

export default TagPopoverEditor;
