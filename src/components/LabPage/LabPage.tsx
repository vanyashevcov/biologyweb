import { useCallback, useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import { Link, Navigate } from 'react-router-dom';

import quest from '../../content/quest.uk.json';
import { fillTemplate, shouldShowIntro, type IntroData } from '../../engine';
import { labDef, labStatus, useQuest, type LabNum } from '../../store/questStore';
import ui from '../../styles/ui.module.css';
import { HelixNote, Notice } from '../HelixNote/HelixNote';
import { LabHeader } from '../LabHeader/LabHeader';
import { LevelIntroVideo } from '../LevelIntroVideo/LevelIntroVideo';
import styles from './LabPage.module.css';

interface Props {
  lab: LabNum;
  children: ReactNode;
  aside: ReactNode;
  asideWidth?: number;
  doneLink?: { to: string; label: string };
}

export function labStyle(lab: LabNum): CSSProperties {
  const def = labDef(lab);
  return { '--lab': def.color, '--lab-tint': def.tint } as CSSProperties;
}

export function LabPage({ lab, children, aside, asideWidth = 380, doneLink }: Props) {
  const state = useQuest();
  const enterLab = useQuest((s) => s.enterLab);
  const clearNotice = useQuest((s) => s.clearNotice);
  const status = labStatus(state, lab);
  const level = state.levels[lab];
  const markVideoSeen = useQuest((s) => s.markVideoSeen);
  const intro = labDef(lab).intro as IntroData;
  const videoKey = `lab${lab}`;
  const [videoOpen, setVideoOpen] = useState(() => shouldShowIntro(intro, state.videosSeen, videoKey));
  const closeVideo = useCallback(() => {
    setVideoOpen(false);
    markVideoSeen(videoKey);
  }, [markVideoSeen, videoKey]);

  useEffect(() => {
    enterLab(lab);
    return () => enterLab(null);
  }, [lab, enterLab]);

  if (status === 'locked') return <Navigate to="/plan" replace />;

  return (
    <div className={ui.page} style={labStyle(lab)}>
      <LabHeader lab={lab} onVideo={() => setVideoOpen(true)} />
      <main id="main" tabIndex={-1} className={ui.main} style={{ '--aside': `${asideWidth}px` } as CSSProperties}>
        <div className={ui.section}>{children}</div>
        <aside className={ui.aside} aria-label="Інструменти рівня">
          {level.done ? (
            <div className={styles.done} role="status">
              <span className={styles.doneLabel}>
                {fillTemplate(quest.ui.componentReceived, { num: lab, value: state.components[lab - 1] })}
              </span>
              <Link to={doneLink?.to ?? '/plan'} className={ui.primary}>
                {doneLink?.label ?? quest.ui.toPlan}
              </Link>
            </div>
          ) : null}
          {level.notice ? (
            <div className={styles.noticeSlot}>
              <Notice text={level.notice.text} points={level.notice.points} tone={level.notice.tone} onDismiss={() => clearNotice(lab)} />
            </div>
          ) : null}
          {level.lastHint && !level.done ? <HelixNote hint>{level.lastHint}</HelixNote> : null}
          {aside}
        </aside>
      </main>
      <LevelIntroVideo open={videoOpen} title={labDef(lab).title} intro={intro} onClose={closeVideo} />
    </div>
  );
}
