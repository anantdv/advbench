import { NavLink } from 'react-router-dom';
import { navGroups, navItems } from '../../app/nav';
import { useUiStore } from '../../store/uiStore';
import logo from '../../../cropped-ADV-Logo-300x115.png';

export function Sidebar() {
  const setSidebarOpen = useUiStore((state) => state.setSidebarOpen);

  return (
    <aside className="sidebar">
      <div className="brand">
        <img className="brand-logo" src={logo} alt="anantdv logo" />
        <div className="brand-copy">
          <div className="brand-name">ADVBench</div>
          <div className="brand-tagline">Advanced Delivery & Visibility Bench</div>
        </div>
      </div>

      <nav className="nav">
        {navItems.map((section) => (
          <NavLink
            key={section.key}
            to={section.path}
            end={section.path === '/'}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            onClick={() => setSidebarOpen(false)}
          >
            {section.label}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-groups">
        {navGroups.map((group) => (
          <section key={group.title} className="sidebar-group">
            {group.path ? (
              <NavLink to={group.path} className="sidebar-group-link" onClick={() => setSidebarOpen(false)}>
                <h3>{group.title}</h3>
              </NavLink>
            ) : (
              <h3>{group.title}</h3>
            )}
            <ul>
              {group.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </aside>
  );
}
