import { useEffect, useRef, useState } from 'react';

import quest from '../../content/quest.uk.json';
import styles from './SpreadGauge.module.css';

interface Props {
  value: number;
  enabled: boolean;
  cleared?: boolean;
  width?: number;
}

interface Pulse {
  id: number;
  delta: number;
}

function useGrowthPulse(percent: number) {
  const previous = useRef(percent);
  const [pulse, setPulse] = useState<Pulse | null>(null);

  useEffect(() => {
    const delta = percent - previous.current;
    previous.current = percent;
    if (delta <= 0) return undefined;
    setPulse((current) => ({ id: (current?.id ?? 0) + 1, delta }));
    const timeout = window.setTimeout(() => setPulse(null), 1400);
    return () => window.clearTimeout(timeout);
  }, [percent]);

  return pulse;
}

export function SpreadGauge({ value, enabled, cleared = false, width = 180 }: Props) {
  const percent = Math.max(0, Math.min(100, Math.round(value)));
  const pulse = useGrowthPulse(percent);
  if (!enabled) return <span className={styles.off}>{quest.ui.spreadOff}</span>;

  const big = pulse !== null && pulse.delta >= quest.spread.perWrong;
  const gaugeClass = [styles.gauge, pulse ? (big ? styles.surge : styles.tick) : ''].filter(Boolean).join(' ');
  const danger = percent >= 80 && !cleared;

  return (
    <div className={gaugeClass} key={pulse?.id ?? 0}>
      <span className={styles.label} id="spread-label">
        {quest.ui.spread}
      </span>
      <div
        className={danger ? `${styles.track} ${styles.danger}` : styles.track}
        style={{ width }}
        role="meter"
        aria-labelledby="spread-label"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        aria-valuetext={`${percent}%`}
      >
        <div className={styles.fill} style={{ width: `${percent}%` }} />
      </div>
      <span className={cleared ? `${styles.value} ${styles.cleared}` : styles.value} aria-hidden="true">
        {percent}%
        {pulse ? <span className={styles.delta}>+{pulse.delta}%</span> : null}
      </span>
    </div>
  );
}
