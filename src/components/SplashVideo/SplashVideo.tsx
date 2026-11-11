import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import quest from '../../content/quest.uk.json';
import { useQuest } from '../../store/questStore';
import styles from './SplashVideo.module.css';

const text = quest.ui.splash;
const SRC = `${import.meta.env.BASE_URL}video/video.mp4`;
const LEAVE_MS = 1100;
const SEEN_KEY = 'splash';

type Phase = 'playing' | 'leaving' | 'done';

export function SplashVideo() {
  const markVideoSeen = useQuest((s) => s.markVideoSeen);
  const [phase, setPhase] = useState<Phase>(() => (useQuest.getState().videosSeen[SEEN_KEY] ? 'done' : 'playing'));
  const [needsTap, setNeedsTap] = useState(false);
  const [progress, setProgress] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const startRef = useRef<HTMLButtonElement>(null);

  const finish = () => {
    markVideoSeen(SEEN_KEY);
    setPhase((p) => (p === 'playing' ? 'leaving' : p));
  };

  const locked = phase !== 'done';

  useEffect(() => {
    if (!locked) return undefined;
    const root = document.getElementById('root');
    const html = document.documentElement;
    const prevBody = document.body.style.overflow;
    const prevHtml = html.style.overflow;
    document.body.style.overflow = 'hidden';
    html.style.overflow = 'hidden';
    if (root) root.inert = true;

    const block = (event: Event) => event.preventDefault();
    const onKey = (event: KeyboardEvent) => {
      const onStart = document.activeElement === startRef.current;
      if (onStart && (event.key === 'Enter' || event.key === ' ' || event.key === 'Tab')) return;
      event.preventDefault();
      event.stopPropagation();
    };
    window.addEventListener('wheel', block, { passive: false });
    window.addEventListener('touchmove', block, { passive: false });
    window.addEventListener('keydown', onKey, true);
    return () => {
      document.body.style.overflow = prevBody;
      html.style.overflow = prevHtml;
      if (root) root.inert = false;
      window.removeEventListener('wheel', block);
      window.removeEventListener('touchmove', block);
      window.removeEventListener('keydown', onKey, true);
    };
  }, [locked]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.play().catch(() => setNeedsTap(true));
  }, []);

  useEffect(() => {
    if (needsTap) startRef.current?.focus();
  }, [needsTap]);

  useEffect(() => {
    if (phase !== 'leaving') return undefined;
    const id = window.setTimeout(() => setPhase('done'), LEAVE_MS);
    return () => window.clearTimeout(id);
  }, [phase]);

  const start = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = false;
    video
      .play()
      .then(() => setNeedsTap(false))
      .catch(() => {
        video.muted = true;
        void video.play().then(() => setNeedsTap(false)).catch(finish);
      });
  };

  if (phase === 'done') return null;

  return createPortal(
    <div
      className={`${styles.overlay} ${phase === 'leaving' ? styles.leaving : ''}`}
      role="dialog"
      aria-modal="true"
      aria-label={text.label}
      data-print="hide"
    >
      <div className={styles.grid} aria-hidden="true" />
      <div className={styles.frame}>
        <video
          ref={videoRef}
          className={styles.media}
          src={SRC}
          playsInline
          preload="auto"
          disablePictureInPicture
          disableRemotePlayback
          controls={false}
          onEnded={finish}
          onError={finish}
          onContextMenu={(event) => event.preventDefault()}
          onTimeUpdate={(event) => {
            const { currentTime, duration } = event.currentTarget;
            if (duration > 0) setProgress(currentTime / duration);
          }}
        />
        <span className={styles.scan} aria-hidden="true" />
        <div className={styles.progress} aria-hidden="true">
          <span style={{ transform: `scaleX(${progress})` }} />
        </div>

        {needsTap ? (
          <div className={styles.gate}>
            <button ref={startRef} type="button" className={styles.start} onClick={start}>
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M8 5.5v13l11-6.5z" />
              </svg>
              {text.start}
            </button>
            <p className={styles.hint}>{text.hint}</p>
          </div>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}
