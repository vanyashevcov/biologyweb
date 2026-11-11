import { useState, type CSSProperties } from 'react';
import { useNavigate } from 'react-router-dom';

import quest from '../../content/quest.uk.json';
import { AppHeader } from '../../components/AppHeader/AppHeader';
import { Icon, type IconName } from '../../components/Icon/Icon';
import { LevelIntroVideo } from '../../components/LevelIntroVideo/LevelIntroVideo';
import { Vial } from '../../components/VialRack/VialRack';
import { shouldShowIntro, type IntroData } from '../../engine';
import { useQuest } from '../../store/questStore';
import ui from '../../styles/ui.module.css';
import styles from './Briefing.module.css';

const content = quest.briefing;

function PassMark() {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" aria-hidden="true">
      <rect x="2" y="2" width="36" height="36" rx="6" fill="none" stroke="var(--on-dark-accent)" strokeWidth="2" />
      <path
        d="M9 9 H16 V16 H9 Z M24 9 H31 V16 H24 Z M9 24 H16 V31 H9 Z M22 22 H26 V26 H22 Z M28 28 H31 V31 H28 Z"
        fill="var(--on-dark-accent)"
      />
    </svg>
  );
}

export function Briefing() {
  const team = useQuest((s) => s.team);
  const started = useQuest((s) => s.startedAt !== null);
  const setTeam = useQuest((s) => s.setTeam);
  const startQuest = useQuest((s) => s.startQuest);
  const navigate = useNavigate();

  const markVideoSeen = useQuest((s) => s.markVideoSeen);
  const [videoOpen, setVideoOpen] = useState(false);
  const intro = content.intro as IntroData;

  const enter = () => {
    startQuest();
    if (shouldShowIntro(intro, useQuest.getState().videosSeen, 'briefing')) {
      setVideoOpen(true);
      return;
    }
    navigate('/plan');
  };

  const closeVideo = () => {
    setVideoOpen(false);
    markVideoSeen('briefing');
    navigate('/plan');
  };

  return (
    <div className={ui.page}>
      <AppHeader />
      <main id="main" tabIndex={-1} className={styles.main}>
        <section className={styles.story}>
          <p className={styles.warning}>
            <Icon name="warning" size={22} strokeWidth={2} />
            {content.warning}
          </p>
          <h1 className={styles.heading}>{content.heading}</h1>
          <div className={styles.text}>
            {content.story.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
          <div className={styles.vials}>
            {quest.labs.map((lab) => (
              <Vial key={lab.id} color={null} />
            ))}
            <span className={styles.vialsLabel}>{content.vials}</span>
          </div>
        </section>

        <form
          className={styles.pass}
          onSubmit={(event) => {
            event.preventDefault();
            enter();
          }}
        >
          <div className={styles.passHead}>
            <span className={styles.passTitles}>
              <b className={styles.passTitle}>{content.pass.title}</b>
              <span className={styles.passSub}>{content.pass.subtitle}</span>
            </span>
            <PassMark />
          </div>

          <div className={styles.passBody}>
            <label className={ui.label} htmlFor="team">
              {content.pass.teamLabel}
            </label>
            <input
              id="team"
              className={ui.input}
              type="text"
              autoComplete="off"
              maxLength={40}
              placeholder={content.pass.teamPlaceholder}
              value={team}
              onChange={(event) => setTeam(event.target.value)}
            />

            <h2 className={styles.specTitle}>{content.pass.specialists}</h2>
            <ul className={styles.specs}>
              {quest.labs.map((lab) => (
                <li key={lab.id} className={styles.spec} style={{ '--lab': lab.color } as CSSProperties}>
                  <span className={styles.specIcon} aria-hidden="true">
                    <Icon name={lab.icon as IconName} size={20} />
                  </span>
                  <span className={styles.specText}>
                    <b>{lab.specialist.name}</b>
                    <span>{lab.specialist.duty}</span>
                  </span>
                </li>
              ))}
            </ul>

            <p className={styles.points}>
              <span className={styles.pointsValue}>{content.pass.pointsValue}</span>
              <span>{content.pass.points}</span>
            </p>

            <button type="submit" className={`${ui.primary} ${styles.enter}`}>
              {started ? content.pass.continue : content.pass.enter}
            </button>
          </div>
        </form>
      </main>
      <LevelIntroVideo open={videoOpen} title={quest.ui.video.briefingTitle} intro={intro} onClose={closeVideo} />
    </div>
  );
}
