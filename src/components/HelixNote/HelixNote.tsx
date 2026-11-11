import type { ReactNode } from 'react';

import quest from '../../content/quest.uk.json';
import { Icon } from '../Icon/Icon';
import styles from './HelixNote.module.css';

interface Props {
  children: ReactNode;
  hint?: boolean;
}

export function HelixNote({ children, hint = false }: Props) {
  return (
    <div className={styles.note} role={hint ? 'status' : undefined}>
      <Icon name="helix" size={28} className={styles.icon} />
      <span className={styles.body}>
        {hint ? <b className={styles.label}>{quest.ui.hintTitle}</b> : null}
        <span className={styles.text}>{children}</span>
      </span>
    </div>
  );
}

interface NoticeProps {
  text: string;
  points: number;
  tone?: 'bad' | 'info';
  onDismiss?: () => void;
}

export function Notice({ text, points, tone = 'bad', onDismiss }: NoticeProps) {
  return (
    <div className={tone === 'bad' ? styles.bad : styles.info} role="status">
      {tone === 'bad' ? (
        <span className={styles.chip} aria-label={`мінус ${points} ${quest.ui.pointsSuffix}`}>
          −{points}
        </span>
      ) : null}
      <span className={styles.noticeText}>{text}</span>
      {onDismiss ? (
        <button type="button" className={styles.dismiss} aria-label={quest.ui.close} onClick={onDismiss}>
          <Icon name="close" size={18} />
        </button>
      ) : null}
    </div>
  );
}

export function Success({ children }: { children: ReactNode }) {
  return (
    <p className={styles.ok} role="status">
      <Icon name="check" size={22} className={styles.okIcon} />
      <span>{children}</span>
    </p>
  );
}
