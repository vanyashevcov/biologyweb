import { useEffect, useState } from 'react';
import type { CSSProperties } from 'react';
import { createPortal } from 'react-dom';

import quest from '../../content/quest.uk.json';
import { playSiren, stopAlarm } from '../../lib/alarm';
import { useQuest } from '../../store/questStore';
import { Modal } from '../Modal/Modal';
import styles from './OutbreakAlert.module.css';

const BURST_MS = 1500;

const reducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const PARTICLES = Array.from({ length: 18 }, (_, index) => {
  const angle = (index / 18) * Math.PI * 2 + (index % 3) * 0.35;
  const reach = 30 + ((index * 37) % 28);
  return {
    fromX: Math.round(Math.cos(angle) * 75),
    fromY: Math.round(Math.sin(angle) * 75),
    toX: Math.round(Math.cos(angle) * reach * 0.6),
    toY: Math.round(Math.sin(angle) * reach * 0.6),
    size: 26 + ((index * 13) % 34),
    delay: (index % 6) * 70,
    spin: index % 2 ? 220 : -260,
  };
});

const BLOTS = [
  { x: '0%', y: '0%', delay: 0 },
  { x: '100%', y: '0%', delay: 120 },
  { x: '0%', y: '100%', delay: 220 },
  { x: '100%', y: '100%', delay: 80 },
];

function VirusShape() {
  return (
    <svg viewBox="0 0 40 40" aria-hidden="true">
      {Array.from({ length: 8 }, (_, i) => {
        const a = (i / 8) * Math.PI * 2;
        const x1 = 20 + Math.cos(a) * 11;
        const y1 = 20 + Math.sin(a) * 11;
        const x2 = 20 + Math.cos(a) * 17;
        const y2 = 20 + Math.sin(a) * 17;
        return (
          <g key={i}>
            <line x1={x1} y1={y1} x2={x2} y2={y2} />
            <circle cx={x2} cy={y2} r="2.2" />
          </g>
        );
      })}
      <circle cx="20" cy="20" r="11" className={styles.core} />
      <circle cx="17" cy="17" r="2.4" className={styles.dot} />
      <circle cx="23.5" cy="22" r="1.8" className={styles.dot} />
    </svg>
  );
}

function ResetGauge() {
  const { criticalAt, resetTo } = quest.spread;
  const [value, setValue] = useState(criticalAt);

  useEffect(() => {
    if (reducedMotion()) {
      setValue(resetTo);
      return undefined;
    }
    const timeout = window.setTimeout(() => setValue(resetTo), 900);
    return () => window.clearTimeout(timeout);
  }, [criticalAt, resetTo]);

  return (
    <div className={styles.gauge}>
      <div className={styles.gaugeHead}>
        <span>{quest.ui.spread}</span>
        <span className={styles.gaugeValue}>{value}%</span>
      </div>
      <div className={styles.track}>
        <div className={styles.fill} style={{ width: `${value}%` }} />
        <div className={styles.mark} style={{ left: `${resetTo}%` }} />
      </div>
      <span className={styles.gaugeNote}>{quest.ui.criticalReset}</span>
    </div>
  );
}

export function OutbreakAlert() {
  const critical = useQuest((s) => s.critical);
  const dismiss = useQuest((s) => s.dismissCritical);
  const sound = useQuest((s) => s.settings.soundEnabled);
  const [phase, setPhase] = useState<'idle' | 'burst' | 'dialog'>('idle');

  useEffect(() => {
    if (!critical) {
      stopAlarm();
      setPhase('idle');
      return undefined;
    }
    if (sound) playSiren();
    if (reducedMotion()) {
      setPhase('dialog');
      return undefined;
    }
    setPhase('burst');
    const root = document.documentElement;
    root.classList.add('outbreak-shake');
    const stopShake = window.setTimeout(() => root.classList.remove('outbreak-shake'), 700);
    const toDialog = window.setTimeout(() => setPhase('dialog'), BURST_MS);
    return () => {
      window.clearTimeout(stopShake);
      window.clearTimeout(toDialog);
      root.classList.remove('outbreak-shake');
    };
  }, [critical]);

  return (
    <>
      {phase === 'burst'
        ? createPortal(
            <div className={styles.burst} aria-hidden="true">
              <div className={styles.flash} />
              {BLOTS.map((blot, index) => (
                <div
                  key={index}
                  className={styles.blot}
                  style={{ '--x': blot.x, '--y': blot.y, animationDelay: `${blot.delay}ms` } as CSSProperties}
                />
              ))}
              {PARTICLES.map((p, index) => (
                <div
                  key={index}
                  className={styles.particle}
                  style={
                    {
                      '--from-x': `${p.fromX}vw`,
                      '--from-y': `${p.fromY}vh`,
                      '--to-x': `${p.toX}vw`,
                      '--to-y': `${p.toY}vh`,
                      '--spin': `${p.spin}deg`,
                      width: p.size,
                      height: p.size,
                      animationDelay: `${p.delay}ms`,
                    } as CSSProperties
                  }
                >
                  <VirusShape />
                </div>
              ))}
              <div className={styles.banner}>
                <span className={styles.bannerPercent}>{quest.spread.criticalAt}%</span>
                <span className={styles.bannerText}>{quest.ui.criticalTitle}</span>
              </div>
            </div>,
            document.body,
          )
        : null}

      <Modal
        open={phase === 'dialog' && critical !== null}
        title={quest.ui.criticalTitle}
        closeLabel={quest.ui.criticalDismiss}
        onClose={dismiss}
        tone="alarm"
      >
        <div className={styles.content}>
          <ResetGauge />
          <p className={styles.message}>{critical?.message}</p>
          {critical?.hint ? (
            <div className={styles.hint}>
              <span className={styles.hintLabel}>{quest.ui.criticalHint}</span>
              <p>{critical.hint}</p>
            </div>
          ) : null}
        </div>
      </Modal>
    </>
  );
}
