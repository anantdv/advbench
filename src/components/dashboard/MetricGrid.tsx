import type { Metric } from '../../types';

type Props = {
  metrics: Metric[];
  onMetricClick?: (metric: Metric) => void;
};

export function MetricGrid({ metrics, onMetricClick }: Props) {
  return (
    <section className="metrics-grid">
      {metrics.map((metric) => (
        <button
          key={metric.label}
          type="button"
          className={`metric-card metric-card-button tone-${metric.tone}`}
          onClick={() => onMetricClick?.(metric)}
        >
          <span>{metric.label}</span>
          <strong>{metric.value}</strong>
          <small>{metric.delta}</small>
        </button>
      ))}
    </section>
  );
}
