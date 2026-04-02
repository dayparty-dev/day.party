import { useNavigate } from 'react-router';
import { useHotkeys } from 'react-hotkeys-hook';

/**
 * Desktop shortcuts (FR-012). Disabled while focus is in editable fields (library default).
 */
export function useAppHotkeys(): void {
  const navigate = useNavigate();

  useHotkeys(
    'mod+shift+r',
    (e) => {
      e.preventDefault();
      navigate('/rundown');
    },
    { enableOnFormTags: false },
    [navigate],
  );

  useHotkeys(
    'mod+shift+o',
    (e) => {
      e.preventDefault();
      navigate('/ongoing');
    },
    { enableOnFormTags: false },
    [navigate],
  );

  useHotkeys(
    'mod+shift+w',
    (e) => {
      e.preventDefault();
      navigate('/rewards');
    },
    { enableOnFormTags: false },
    [navigate],
  );

  useHotkeys(
    'mod+shift+/',
    (e) => {
      e.preventDefault();
      navigate('/help/shortcuts');
    },
    { enableOnFormTags: false },
    [navigate],
  );
}
