import { useCallback, useEffect, useRef, useState } from 'react';

import quest from '../../content/quest.uk.json';
import { captionAt, embedUrl, fillTemplate, parseVideoSource, type CaptionCue, type IntroData } from '../../engine';
import styles from './LevelIntroVideo.module.css';

const text = quest.ui.video;

interface Props {
  open: boolean;
  title: string;
  intro: IntroData;
  onClose: () => void;
}

function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function LevelIntroVideo({ open, title, intro, onClose }: Props) {
  const source = parseVideoSource(intro.video);
  const autoplay = !prefersReducedMotion();
  const [round, setRound] = useState(0);
  const [captionsOn, setCaptionsOn] = useState(true);
  const [time, setTime] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const frameRef = useRef<HTMLIFrameElement>(null);
  const skipRef = useRef<HTMLButtonElement>(null);
  const opener = useRef<Element | null>(null);

  const cues: CaptionCue[] = Array.isArray(intro.captions) ? intro.captions : [];
  const vtt = typeof intro.captions === 'string' ? intro.captions.replace(/^\//, '') : '';

  useEffect(() => {
    if (!open) return undefined;
    opener.current = document.activeElement;
    skipRef.current?.focus();
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
      if (opener.current instanceof HTMLElement) opener.current.focus();
    };
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open || (source.kind !== 'youtube' && source.kind !== 'vimeo')) return undefined;
    const onMessage = (event: MessageEvent) => {
      if (!/youtube|vimeo/.test(event.origin)) return;
      let data: Record<string, unknown> = {};
      try {
        data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
      } catch {
        return;
      }
      const info = data.info as Record<string, unknown> | number | undefined;
      const ytEnded =
        (data.event === 'onStateChange' && info === 0) ||
        (data.event === 'infoDelivery' && typeof info === 'object' && info?.playerState === 0);
      if (ytEnded || data.event === 'finish') onClose();
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [open, source.kind, onClose]);

  const subscribe = useCallback(() => {
    const frame = frameRef.current?.contentWindow;
    if (!frame) return;
    if (source.kind === 'youtube') {
      frame.postMessage(JSON.stringify({ event: 'listening', id: 'intro' }), '*');
    } else if (source.kind === 'vimeo') {
      frame.postMessage(JSON.stringify({ method: 'addEventListener', value: 'finish' }), '*');
    }
  }, [source.kind]);

  const replay = () => {
    const video = videoRef.current;
    if (video) {
      video.currentTime = 0;
      void video.play().catch(() => undefined);
    } else {
      setRound((n) => n + 1);
    }
  };

  if (!open || source.kind === 'none') return null;

  const caption = captionsOn ? captionAt(cues, time) : '';

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-labelledby="intro-video-title" data-print="hide">
      <div className={styles.bar}>
        <h2 id="intro-video-title" className={styles.title}>
          {fillTemplate(text.title, { title })}
        </h2>
        <div className={styles.actions}>
          {cues.length > 0 && source.kind === 'file' ? (
            <button
              type="button"
              className={styles.button}
              aria-pressed={captionsOn}
              onClick={() => setCaptionsOn((on) => !on)}
            >
              {text.captionsOn}
            </button>
          ) : null}
          <button type="button" className={styles.button} onClick={replay}>
            {text.replay}
          </button>
          <button ref={skipRef} type="button" className={`${styles.button} ${styles.primary}`} onClick={onClose}>
            {text.skip}
          </button>
        </div>
      </div>

      <div className={styles.stage}>
        <div className={styles.frame}>
          {source.kind === 'file' ? (
            <video
              ref={videoRef}
              className={styles.media}
              src={source.src}
              controls
              playsInline
              autoPlay={autoplay}
              preload="metadata"
              onEnded={onClose}
              onTimeUpdate={(event) => setTime(event.currentTarget.currentTime)}
            >
              {vtt ? <track kind="subtitles" srcLang="uk" label="Українська" src={vtt} default /> : null}
            </video>
          ) : (
            <iframe
              key={round}
              ref={frameRef}
              className={styles.media}
              src={embedUrl(source, autoplay || round > 0)}
              title={fillTemplate(text.title, { title })}
              allow="autoplay; fullscreen; picture-in-picture"
              allowFullScreen
              onLoad={subscribe}
            />
          )}
          {caption ? (
            <p className={styles.caption} aria-live="off">
              {caption}
            </p>
          ) : null}
        </div>

        {intro.text ? (
          <div className={styles.text}>
            <b className={styles.textTitle}>{text.textTitle}</b>
            <p>{intro.text}</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
