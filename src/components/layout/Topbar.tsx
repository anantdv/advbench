import { useUiStore } from '../../store/uiStore';

type Props = {
  title: string;
  description: string;
};

export function Topbar({ title, description }: Props) {
  const query = useUiStore((state) => state.searchQuery);
  const setSearchQuery = useUiStore((state) => state.setSearchQuery);
  const setCommandPaletteOpen = useUiStore((state) => state.setCommandPaletteOpen);
  const sidebarOpen = useUiStore((state) => state.sidebarOpen);
  const setSidebarOpen = useUiStore((state) => state.setSidebarOpen);

  return (
    <header className="topbar">
      <div>
        <h1>{title}</h1>
        <p className="lead">{description}</p>
      </div>

      <div className="topbar-actions">
        <button type="button" className="secondary-btn menu-btn" aria-expanded={sidebarOpen} onClick={() => setSidebarOpen(!sidebarOpen)}>
          {sidebarOpen ? 'Close Menu' : 'Menu'}
        </button>
        <label className="search">
          <span>Global search</span>
          <input
            value={query}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search tasks, projects, people..."
          />
        </label>
        <button type="button" className="primary-btn" onClick={() => setCommandPaletteOpen(true)}>
          Command Palette
        </button>
      </div>
    </header>
  );
}
