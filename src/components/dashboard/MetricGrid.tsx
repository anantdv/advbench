import type { Metric } from '../../types';

type Props = {
  metrics: Metric[];
};

export function MetricGrid({ metrics }: Props) {
  return (
    <section className="metrics-grid">
      {metrics.map((metric) => (
        <article key={metric.label} className={`metric-card tone-${metric.tone}`}>
          <span>{metric.label}</span>
          <strong>{metric.value}</strong>
          <small>{metric.delta}</small>
        </article>
      ))}
    </section>
  );
}
