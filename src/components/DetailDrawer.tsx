import type { ReactNode } from 'react';

type Props = {
  open: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
};

export function DetailDrawer({ open, title, subtitle, onClose, children }: Props) {
  return (
    <div className={`drawer-backdrop ${open ? 'open' : ''}`} aria-hidden={!open}>
      <aside className={`drawer-panel ${open ? 'open' : ''}`} role="dialog" aria-modal="true" aria-label={title}>
        <div className="drawer-header">
          <div>
            <p className="panel-kicker">Details</p>
            <h2>{title}</h2>
            {subtitle ? <p className="drawer-subtitle">{subtitle}</p> : null}
          </div>
          <button type="button" className="secondary-btn" onClick={onClose}>
            Close
          </button>
        </div>
        <div className="drawer-body">{children}</div>
      </aside>
    </div>
  );
}
