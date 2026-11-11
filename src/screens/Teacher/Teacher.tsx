import { useEffect, useState, type CSSProperties } from 'react';
import { Link } from 'react-router-dom';

import quest from '../../content/quest.uk.json';
import { checkAnswer } from '../../engine';
import { useQuest } from '../../store/questStore';
import ui from '../../styles/ui.module.css';
import styles from './Teacher.module.css';

const content = quest.teacher;
const answers = quest.answers as Record<string, string>;

interface Solution {
  location: string;
  color?: string;
  blocks: Array<{ label: string; mono: string }>;
  notes: string[];
}

const loadSolutions = (): Promise<Solution[]> =>
  import('../../content/solutions.uk.json').then((module) => module.default.solutions as Solution[]);

export function Teacher() {
  const unlocked = useQuest((s) => s.teacherUnlocked);
  const setUnlocked = useQuest((s) => s.setTeacherUnlocked);
  const settings = useQuest((s) => s.settings);
  const setSettings = useQuest((s) => s.setSettings);
  const resetProgress = useQuest((s) => s.resetProgress);

  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState(false);
  const [resetDone, setResetDone] = useState(false);
  const [solutions, setSolutions] = useState<Solution[] | null>(null);

  useEffect(() => {
    if (!unlocked || solutions) return;
    let alive = true;
    loadSolutions().then((data) => {
      if (alive) setSolutions(data);
    });
    return () => {
      alive = false;
    };
  }, [unlocked, solutions]);

  const submitPin = () => {
    if (checkAnswer(answers, 'teacher.pin', 'number', pin)) {
      setUnlocked(true);
      setPinError(false);
    } else {
      setPinError(true);
    }
  };

  if (!unlocked) {
    return (
      <div className={ui.page}>
        <main id="main" tabIndex={-1} className={styles.gate}>
          <form
            className={`${ui.card} ${styles.gateForm}`}
            onSubmit={(event) => {
              event.preventDefault();
              submitPin();
            }}
          >
            <h1 className={ui.h1}>{content.heading}</h1>
            <div className={ui.field}>
              <label className={ui.label} htmlFor="pin">
                {content.pinLabel}
              </label>
              <input
                id="pin"
                className={`${ui.input} ${ui.mono}`}
                type="password"
                inputMode="numeric"
                autoComplete="off"
                maxLength={8}
                placeholder={content.pinPlaceholder}
                value={pin}
                aria-invalid={pinError}
                onChange={(event) => {
                  setPin(event.target.value);
                  setPinError(false);
                }}
              />
            </div>
            <button type="submit" className={ui.primary} style={{ '--lab': 'var(--lab1)' } as CSSProperties}>
              {content.pinSubmit}
            </button>
            {pinError ? (
              <p className={`${ui.feedback} ${ui.bad}`} role="status">
                {content.pinWrong}
              </p>
            ) : null}
            <Link className={ui.secondary} to="/">
              {quest.meta.title}
            </Link>
          </form>
        </main>
      </div>
    );
  }

  return (
    <div className={ui.page} style={{ '--lab': 'var(--lab1)' } as CSSProperties}>
      <header className={styles.bar}>
        <h1 className={styles.barTitle}>{content.heading}</h1>
        <Link className={ui.secondary} to="/plan">
          {content.toPlan}
        </Link>
        <button type="button" className={ui.secondary} onClick={() => setUnlocked(false)}>
          {content.exit}
        </button>
      </header>

      <main id="main" tabIndex={-1} className={`${ui.main} ${styles.main}`}>
        <section className={ui.section}>
          <h2 className={styles.h2}>{content.solutionsTitle}</h2>
          {solutions === null ? <p className={ui.note}>{content.loading}</p> : null}
          {(solutions ?? []).map((solution) => (
            <article
              key={solution.location}
              className={`${ui.card} ${styles.solution}`}
              style={solution.color ? ({ '--lab': solution.color } as CSSProperties) : undefined}
            >
              <h3 className={ui.cardTitle}>{solution.location}</h3>
              <dl className={styles.blocks}>
                {solution.blocks.map((block) => (
                  <div key={block.label} className={styles.block}>
                    <dt className={styles.blockLabel}>{block.label}</dt>
                    <dd className={styles.blockValue}>{block.mono}</dd>
                  </div>
                ))}
              </dl>
              <ul className={styles.notes}>
                {solution.notes.map((note) => (
                  <li key={note}>{note}</li>
                ))}
              </ul>
            </article>
          ))}
        </section>

        <aside className={ui.aside}>
          <div className={ui.card}>
            <h2 className={ui.cardTitle}>{content.settingsTitle}</h2>

            <label className={styles.toggle}>
              <input
                type="checkbox"
                checked={settings.spreadEnabled}
                onChange={(event) => setSettings({ spreadEnabled: event.target.checked })}
              />
              <span>
                <b>{content.settings.spreadEnabled}</b>
                <span className={ui.note}>{content.settings.spreadEnabledNote}</span>
              </span>
            </label>

            <label className={styles.toggle}>
              <input
                type="checkbox"
                checked={settings.soundEnabled}
                onChange={(event) => setSettings({ soundEnabled: event.target.checked })}
              />
              <span>
                <b>{content.settings.soundEnabled}</b>
                <span className={ui.note}>{content.settings.soundEnabledNote}</span>
              </span>
            </label>

            <label className={styles.toggle}>
              <input
                type="checkbox"
                checked={settings.twoLessons}
                onChange={(event) => setSettings({ twoLessons: event.target.checked })}
              />
              <span>
                <b>{content.settings.twoLessons}</b>
                <span className={ui.note}>{content.settings.twoLessonsNote}</span>
              </span>
            </label>

            <label className={ui.field}>
              <span className={ui.label}>{content.settings.hintsPerLevel}</span>
              <input
                className={ui.input}
                type="number"
                min={0}
                max={3}
                value={settings.hintsPerLevel}
                onChange={(event) =>
                  setSettings({ hintsPerLevel: Math.max(0, Math.min(3, Number(event.target.value) || 0)) })
                }
              />
            </label>

            <label className={ui.field}>
              <span className={ui.label}>{content.settings.freezeSeconds}</span>
              <input
                className={ui.input}
                type="number"
                min={5}
                max={120}
                step={5}
                value={settings.freezeSeconds}
                onChange={(event) =>
                  setSettings({ freezeSeconds: Math.max(5, Math.min(120, Number(event.target.value) || 30)) })
                }
              />
            </label>
          </div>

          <div className={ui.card}>
            <button
              type="button"
              className={styles.reset}
              onClick={() => {
                if (window.confirm(content.settings.resetConfirm)) {
                  resetProgress();
                  setResetDone(true);
                }
              }}
            >
              {content.settings.reset}
            </button>
            {resetDone ? (
              <p className={`${ui.feedback} ${ui.ok}`} role="status">
                {content.settings.resetDone}
              </p>
            ) : null}
          </div>
        </aside>
      </main>
    </div>
  );
}
