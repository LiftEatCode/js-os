import type { Goal } from "@/business-state";

type GoalMetricProps = {
  metricName: Goal["metricName"];
  metricUnit: Goal["metricUnit"];
  currentValue: Goal["currentValue"];
  targetValue: Goal["targetValue"];
};

function displayValue(value: string | null, unit: string | null): string | null {
  if (value == null || value === "") {
    return null;
  }
  return unit ? `${value} ${unit}` : value;
}

export function GoalMetric({ metricName, metricUnit, currentValue, targetValue }: GoalMetricProps) {
  const hasMetric = Boolean(metricName || metricUnit || currentValue != null || targetValue != null);

  if (!hasMetric) {
    return <p className="text-sm text-zinc-600 dark:text-zinc-400">No metric defined</p>;
  }

  const current = displayValue(currentValue, metricUnit);
  const target = displayValue(targetValue, metricUnit);

  return (
    <div className="space-y-1 text-sm text-zinc-700 dark:text-zinc-300">
      {metricName ? <p className="font-medium text-zinc-950 dark:text-zinc-50">{metricName}</p> : null}
      {current ? <p>Current: {current}</p> : null}
      {target ? <p>Target: {target}</p> : null}
      {!metricName && metricUnit && current == null && target == null ? <p>Unit: {metricUnit}</p> : null}
    </div>
  );
}
