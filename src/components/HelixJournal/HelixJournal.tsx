import { useCallback, useEffect, useRef, useState } from 'react';

import quest from '../../content/quest.uk.json';
import { fillTemplate, formatClock, unreadCount } from '../../engine';
import { useQuest } from '../../store/questStore';
import { Icon } from '../Icon/Icon';
import styles from './HelixJournal.module.css';

const text = quest.ui.journal;

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function HelixJournal() {
  const journal = useQuest((s) => s.journal);
  const seen = useQuest((s) => s.journalSeen);
  const markSeen = useQuest((s) => s.markJournalSeen);

  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLElement>(null);
  const fabRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLOListElement>(null);
  const wasOpen = useRef(false);

  const unread = unreadCount(journal, seen);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (open) markSeen();
  }, [open, journal.length, markSeen]);

  useEffect(() => {
    if (panelRef.current) panelRef.current.inert = !open;
  }, [open]);

  useEffect(() => {
    if (open) {
      wasOpen.current = true;
      closeRef.current?.focus();
      const list = listRef.current;
      if (list) list.scrollTop = list.scrollHeight;
      return undefined;
    }
    if (wasOpen.current) {
      wasOpen.current = false;
      fabRef.current?.focus();
    }
    return undefined;
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        close();
        return;
      }
      if (event.key !== 'Tab' || !panelRef.current) return;
      const items = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, close]);

  return (
    <div className={styles.root} data-print="hide">
      <div
        className={open ? `${styles.scrim} ${styles.scrimOpen}` : styles.scrim}
        onClick={close}
        aria-hidden="true"
      />

      <aside
        ref={panelRef}
        className={open ? `${styles.panel} ${styles.panelOpen}` : styles.panel}
        aria-label={text.title}
        role="dialog"
        aria-modal={open}
      >
        <div className={styles.head}>
          <span className={styles.brand}>
            <Icon name="helix" size={32} className={styles.brandIcon} />
            <span className={styles.brandText}>
              <b className={styles.title}>{text.title}</b>
              <span className={styles.subtitle}>{text.subtitle}</span>
            </span>
          </span>
          <button ref={closeRef} type="button" className={styles.close} aria-label={text.close} onClick={close}>
            <Icon name="close" size={20} />
          </button>
        </div>

        <ol ref={listRef} className={styles.list} tabIndex={0} aria-label={text.title}>
          {journal.length === 0 ? <li className={styles.empty}>{text.empty}</li> : null}
          {journal.map((item, index) => (
            <li key={`${item.ts}-${index}`} className={styles.item}>
              <time className={styles.time} dateTime={new Date(item.ts).toISOString()}>
                {formatClock(item.ts)}
              </time>
              <span className={item.tone === 'bad' ? `${styles.text} ${styles.bad}` : styles.text}>{item.text}</span>
            </li>
          ))}
        </ol>
      </aside>

      <button
        ref={fabRef}
        type="button"
        className={open ? `${styles.fab} ${styles.fabHidden}` : styles.fab}
        aria-label={unread > 0 ? fillTemplate(text.openUnread, { count: unread }) : text.open}
        aria-expanded={open}
        onClick={() => setOpen(true)}
        tabIndex={open ? -1 : 0}
      >
        <Icon name="helix" size={34} className={styles.fabIcon} />
        {unread > 0 ? (
          <span className={styles.badge} aria-hidden="true">
            {unread > 99 ? '99+' : unread}
          </span>
        ) : null}
      </button>
    </div>
  );
}
