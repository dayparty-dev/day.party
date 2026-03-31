interface PictureInPictureButtonProps {
  onActivate: () => void;
  isActive: boolean;
  isPiPSupported: boolean;
  isEditMode: boolean;
}

const PictureInPictureButton: React.FC<PictureInPictureButtonProps> = ({
  onActivate,
  isActive,
  isPiPSupported,
  isEditMode,
}) => {
  if (isEditMode || !isPiPSupported) {
    return null;
  }

  return (
    <button
      className="pip-button"
      onClick={onActivate}
      disabled={isActive}
      aria-label="Open Picture-in-Picture"
    >
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
        <rect x="12" y="12" width="6" height="6" rx="1" ry="1" />
      </svg>
    </button>
  );
};

export default PictureInPictureButton;
