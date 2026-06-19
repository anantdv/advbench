import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useUiStore } from '../../store/uiStore';

type Props = {
  title: string;
  description: string;
};

export function Topbar({ title, description }: Props) {
  const navigate = useNavigate();
  const query = useUiStore((state) => state.searchQuery);
  const setSearchQuery = useUiStore((state) => state.setSearchQuery);
  const setCommandPaletteOpen = useUiStore((state) => state.setCommandPaletteOpen);
  const sidebarOpen = useUiStore((state) => state.sidebarOpen);
  const setSidebarOpen = useUiStore((state) => state.setSidebarOpen);
  const user = useAuthStore((state) => state.user);
  const clearUser = useAuthStore((state) => state.clearUser);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (!profileRef.current?.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setProfileOpen(false);
      }
    };

    window.addEventListener('click', handleClick);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('click', handleClick);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const profileName = user?.displayName || user?.username || 'Profile';

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // Local logout still proceeds even if the relay call fails.
    }
    clearUser();
    navigate('/login', { replace: true });
  };

  return (
    <header className="topbar">
      <div>
        <h1>{title}</h1>
        <p className="lead">{description}</p>
      </div>

      <div className="topbar-actions">
        <button type="button" className="secondary-btn icon-btn menu-btn" aria-expanded={sidebarOpen} onClick={() => setSidebarOpen(!sidebarOpen)}>
          <svg aria-hidden="true" viewBox="0 0 24 24" className="icon-svg">
            <path d="M4 6h16M4 12h16M4 18h16" />
          </svg>
          <span>Menu</span>
        </button>
        <label className="search">
          <span>Global search</span>
          <input
            value={query}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search tasks, projects, people..."
          />
        </label>
        <div className="topbar-actions-row">
          <button type="button" className="secondary-btn icon-btn palette-btn" onClick={() => setCommandPaletteOpen(true)}>
            <svg aria-hidden="true" viewBox="0 0 24 24" className="icon-svg">
              <circle cx="11" cy="11" r="6" />
              <path d="M20 20l-4.2-4.2" />
            </svg>
            <span>Command Palette</span>
          </button>
          <div className="profile-menu" ref={profileRef}>
            <button type="button" className="secondary-btn profile-trigger" onClick={() => setProfileOpen((open) => !open)}>
              <span className="profile-avatar">{profileName.slice(0, 1).toUpperCase()}</span>
              <span className="profile-name">{profileName}</span>
            </button>
            {profileOpen ? (
              <div className="profile-dropdown">
                <div className="profile-dropdown-item">
                  <strong>{profileName}</strong>
                  <span>{user?.username ?? 'ERPNext user'}</span>
                </div>
                <button type="button" className="profile-dropdown-item action" onClick={handleLogout}>
                  Logout
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
}
