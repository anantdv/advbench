import type { ReactNode } from 'react';

type Props = {
  kicker: string;
  title: string;
  children: ReactNode;
  badge?: string;
  className?: string;
};

export function SectionFrame({ kicker, title, children, badge, className = '' }: Props) {
  return (
    <article className={`panel ${className}`.trim()}>
      <div className="panel-header">
        <div>
          <p className="panel-kicker">{kicker}</p>
          <h2>{title}</h2>
        </div>
        {badge ? <span className="badge">{badge}</span> : null}
      </div>
      {children}
    </article>
  );
}
