import { useDraggable } from '@dnd-kit/core';
import type { CSSProperties } from 'react';

import styles from './VirusSpecimen.module.css';

export interface Specimen {
  id: string;
  name: string;
  trait: string;
  shape: string;
}

export function VirusShape({ shape, size = 40 }: { shape: string; size?: number }) {
  const stroke = 'var(--lab)';
  const fill = 'var(--lab)';
  return (
    <svg width={size} height={size} viewBox="0 0 56 56" fill="none" aria-hidden="true">
      {shape === 'phage' ? (
        <>
          <path d="M28 4 L38 10 V22 L28 28 L18 22 V10 Z" fill={fill} fillOpacity="0.2" stroke={stroke} strokeWidth="2" />
          <path d="M28 28 V42" stroke={stroke} strokeWidth="4" />
          <path d="M28 42 L16 52 M28 42 L40 52 M28 42 L22 54 M28 42 L34 54" stroke={stroke} strokeWidth="2" />
        </>
      ) : null}
      {shape === 'icosa' ? (
        <>
          <path d="M28 8 L45 18 V38 L28 48 L11 38 V18 Z" fill={fill} fillOpacity="0.2" stroke={stroke} strokeWidth="2" />
          <path
            d="M28 8 L28 28 L45 38 M28 28 L11 38 M11 18 L28 28 L45 18"
            stroke={stroke}
            strokeWidth="1"
            strokeOpacity="0.6"
          />
        </>
      ) : null}
      {shape === 'rod' ? (
        <>
          <rect x="6" y="22" width="44" height="12" rx="3" fill={fill} fillOpacity="0.2" stroke={stroke} strokeWidth="2" />
          <path d="M12 22 V34 M18 22 V34 M24 22 V34 M30 22 V34 M36 22 V34 M42 22 V34" stroke={stroke} strokeWidth="1.2" />
        </>
      ) : null}
      {shape === 'enveloped' ? (
        <>
          <circle cx="28" cy="28" r="16" fill={fill} fillOpacity="0.2" stroke={stroke} strokeWidth="2" />
          {[0, 40, 80, 120, 160, 200, 240, 280, 320].map((angle) => (
            <g key={angle} transform={`rotate(${angle} 28 28)`}>
              <path d="M28 12 V6" stroke={stroke} strokeWidth="2" />
              <circle cx="28" cy="5" r="2" fill={fill} />
            </g>
          ))}
        </>
      ) : null}
    </svg>
  );
}

interface CardProps {
  specimen: Specimen;
  selected?: boolean;
  onSelect?: () => void;
  placed?: boolean;
}

export function VirusSpecimen({ specimen, selected = false, onSelect, placed = false }: CardProps) {
  const { setNodeRef, listeners, transform, isDragging } = useDraggable({
    id: specimen.id,
    disabled: placed,
  });

  const style: CSSProperties | undefined = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  const body = (
    <>
      <span className={styles.icon}>
        <VirusShape shape={specimen.shape} />
      </span>
      <span className={styles.text}>
        <b className={styles.name}>{specimen.name}</b>
        <span className={styles.trait}>{specimen.trait}</span>
      </span>
    </>
  );

  if (placed) {
    return <span className={`${styles.card} ${styles.placed}`}>{body}</span>;
  }

  return (
    <button
      ref={setNodeRef}
      type="button"
      className={[styles.card, selected ? styles.selected : '', isDragging ? styles.dragging : '']
        .filter(Boolean)
        .join(' ')}
      style={style}
      aria-pressed={selected}
      onClick={onSelect}
      {...listeners}
    >
      {body}
    </button>
  );
}
