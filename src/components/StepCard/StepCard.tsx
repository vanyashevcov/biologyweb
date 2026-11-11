import type { ReactNode } from 'react';

import quest from '../../content/quest.uk.json';
import styles from './StepCard.module.css';

interface Props {
  num?: number;
  title: string;
  points?: number;
  locked?: boolean;
  lockedNote?: string;
  children?: ReactNode;
  titleId?: string;
}

export function StepCard({ num, title, points, locked = false, lockedNote, children, titleId }: Props) {
  return (
    <section className={locked ? `${styles.card} ${styles.locked}` : styles.card} aria-labelledby={titleId}>
      <h2 className={styles.head}>
        {num !== undefined ? (
          <span className={styles.num} aria-hidden="true">
            {num}
          </span>
        ) : null}
        <span className={styles.title} id={titleId}>
          {title}
        </span>
        {points !== undefined ? (
          <span className={styles.points}>
            {points} {quest.ui.pointsSuffix}
          </span>
        ) : null}
      </h2>
      {locked ? <p className={styles.lockedNote}>{lockedNote}</p> : children}
    </section>
  );
}
