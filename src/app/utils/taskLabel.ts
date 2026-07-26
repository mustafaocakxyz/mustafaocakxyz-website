/**
 * Split "title | duration" task text.
 * Duration may be "(1.5 saat)" or "4 saat" / "30 dak".
 */
const DURATION_SEGMENT =
  /^\(?\s*(\d+(?:[.,]\d+)?)\s*(saat|sa|dak|dk|dakika)\s*\)?$/i;

const DURATION_VALUE =
  /^(\d+(?:[.,]\d+)?)\s*(saat|sa|dak|dk|dakika)$/i;

export function parseTaskLabel(raw: string): { label: string; durationLabel: string } {
  const trimmed = raw.trim();
  if (!trimmed) return { label: '', durationLabel: '' };

  const sep = trimmed.lastIndexOf('|');
  if (sep <= 0) return { label: trimmed, durationLabel: '' };

  const left = trimmed.slice(0, sep).trim();
  const right = trimmed.slice(sep + 1).trim();
  if (!left || !right) return { label: trimmed, durationLabel: '' };

  const match = right.match(DURATION_SEGMENT);
  if (!match) return { label: trimmed, durationLabel: '' };

  const amount = match[1];
  const unitRaw = match[2].toLocaleLowerCase('tr-TR');
  const unit =
    unitRaw === 'sa'
      ? 'saat'
      : unitRaw === 'dk' || unitRaw === 'dakika'
        ? 'dak'
        : unitRaw;

  return {
    label: left,
    durationLabel: `${amount} ${unit}`,
  };
}

/** Rebuild editable input from stored parts. */
export function composeTaskLabel(label: string, durationLabel: string): string {
  const duration = durationLabel.trim();
  if (!duration) return label;
  return `${label} | ${duration}`;
}

/** Convert "1.5 saat" / "30 dak" to minutes. Null if unparseable. */
export function durationLabelToMinutes(durationLabel: string): number | null {
  const match = durationLabel.trim().match(DURATION_VALUE);
  if (!match) return null;
  const amount = Number(match[1].replace(',', '.'));
  if (!Number.isFinite(amount) || amount < 0) return null;
  const unit = match[2].toLocaleLowerCase('tr-TR');
  if (unit === 'saat' || unit === 'sa') return amount * 60;
  return amount;
}

type DurationAwareTask = {
  completed: boolean;
  durationLabel: string;
};

/**
 * Time-weighted completion %. Falls back to task-count % when no durations.
 * Null when there are no tasks.
 */
export function computeCompletionPercent(tasks: DurationAwareTask[]): number | null {
  if (tasks.length === 0) return null;

  let totalMinutes = 0;
  let completedMinutes = 0;

  for (const task of tasks) {
    const minutes = durationLabelToMinutes(task.durationLabel);
    if (minutes === null || minutes <= 0) continue;
    totalMinutes += minutes;
    if (task.completed) completedMinutes += minutes;
  }

  if (totalMinutes > 0) {
    return Math.round((completedMinutes / totalMinutes) * 100);
  }

  const completedCount = tasks.filter((task) => task.completed).length;
  return Math.round((completedCount / tasks.length) * 100);
}
