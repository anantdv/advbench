import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { navItems } from '../../app/nav';
import { useUiStore } from '../../store/uiStore';

const quickActions = [
  { label: 'Go to Dashboard', path: '/' },
  { label: 'Open Projects', path: '/projects' },
  { label: 'Open Tasks', path: '/tasks' },
  { label: 'Open Sprints', path: '/sprints' },
  { label: 'Open Resources', path: '/resources' },
  { label: 'Open Time Tracking', path: '/time-tracking' },
  { label: 'Open Clients', path: '/clients' },
  { label: 'Open Reports', path: '/reports' },
  { label: 'Open Administration', path: '/administration' },
] as const;

export function CommandPalette() {
  const navigate = useNavigate();
  const open = useUiStore((state) => state.commandPaletteOpen);
  const setOpen = useUiStore((state) => state.setCommandPaletteOpen);
  const searchQuery = useUiStore((state) => state.commandPaletteQuery);
  const setSearchQuery = useUiStore((state) => state.setCommandPaletteQuery);

  const filteredActions = useMemo(() => {
    const term = searchQuery.trim().toLowerCase();
    if (!term) return quickActions;
    return quickActions.filter((action) => action.label.toLowerCase().includes(term));
  }, [searchQuery]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        setSearchQuery('');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, setOpen]);

  useEffect(() => {
    if (!open) return;
    const firstInput = window.setTimeout(() => {
      const input = document.querySelector<HTMLInputElement>('.command-palette input');
      input?.focus();
      input?.select();
    }, 0);
    return () => window.clearTimeout(firstInput);
  }, [open]);

  if (!open) return null;

  return (
    <div className="command-palette-backdrop" role="presentation" onClick={() => setOpen(false)}>
      <section
        className="command-palette"
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="command-palette-header">
          <div>
            <p className="panel-kicker">Quick Switch</p>
            <h2>Command Palette</h2>
          </div>
          <button type="button" className="secondary-btn" onClick={() => setOpen(false)}>
            Close
          </button>
        </header>

        <label className="search command-palette-search">
          <span>Search commands</span>
          <input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Type a section name..."
          />
        </label>

        <div className="command-palette-list">
          <div className="command-palette-group">
            <h3>Navigation</h3>
            {navItems.map((section) => (
              <button
                key={section.key}
                type="button"
                className="command-palette-item"
                onClick={() => {
                navigate(section.path);
                setOpen(false);
                setSearchQuery('');
              }}
            >
                <strong>{section.label}</strong>
                <span>{section.path}</span>
              </button>
            ))}
          </div>

          <div className="command-palette-group">
            <h3>Quick Actions</h3>
            {filteredActions.map((action) => (
              <button
                key={action.path}
                type="button"
                className="command-palette-item"
                onClick={() => {
                navigate(action.path);
                setOpen(false);
                setSearchQuery('');
              }}
            >
                <strong>{action.label}</strong>
                <span>Open workspace section</span>
              </button>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
