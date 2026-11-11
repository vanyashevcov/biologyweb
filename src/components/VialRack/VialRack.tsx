import quest from '../../content/quest.uk.json';
import { fillTemplate } from '../../engine';
import styles from './VialRack.module.css';

interface VialProps {
  color: string | null;
  size?: 'small' | 'large';
  fill?: number;
  onDark?: boolean;
}

export function Vial({ color, size = 'small', fill = 1, onDark = false }: VialProps) {
  if (size === 'large') {
    const top = 46 + (1 - fill) * 88;
    return (
      <svg className={styles.large} width="56" height="150" viewBox="0 0 56 150" aria-hidden="true">
        {color ? (
          <>
            <path d={`M16.5 ${top} H39.5 V122 a11.5 11.5 0 0 1 -23 0 Z`} fill={color} />
            {fill > 0 ? <path d={`M16.5 ${top} H39.5`} stroke="#FFFFFF" strokeOpacity="0.6" strokeWidth="2" /> : null}
          </>
        ) : null}
        <path
          d="M8 4 H48 M14 4 V122 a14 14 0 0 0 28 0 V4"
          fill="none"
          stroke={onDark ? 'var(--on-dark)' : 'var(--ink)'}
          strokeWidth="3"
        />
      </svg>
    );
  }
  return (
    <svg width="18" height="44" viewBox="0 0 18 44" aria-hidden="true">
      {color ? <path d="M5.3 16 H12.7 V35 a3.7 3.7 0 0 1 -7.4 0 Z" fill={color} /> : null}
      <path
        d="M3 2 H15 M4.5 2 V35 a4.5 4.5 0 0 0 9 0 V2"
        fill="none"
        stroke={onDark ? 'var(--on-dark)' : 'var(--ink)'}
        strokeWidth="1.6"
      />
    </svg>
  );
}

interface Props {
  components: string[];
  framed?: boolean;
  gap?: number;
}

export function VialRack({ components, framed = false, gap = 6 }: Props) {
  const count = components.filter(Boolean).length;
  return (
    <div
      className={framed ? `${styles.rack} ${styles.framed}` : styles.rack}
      style={{ gap }}
      role="img"
      aria-label={fillTemplate(quest.ui.rackAria, { count })}
    >
      {quest.labs.map((lab, index) => (
        <Vial key={lab.id} color={components[index] ? lab.color : null} />
      ))}
    </div>
  );
}
