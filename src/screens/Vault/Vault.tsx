import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { Link } from 'react-router-dom';

import quest from '../../content/quest.uk.json';
import { AppHeader } from '../../components/AppHeader/AppHeader';
import { LevelIntroVideo } from '../../components/LevelIntroVideo/LevelIntroVideo';
import { Vial } from '../../components/VialRack/VialRack';
import {
  bandFor,
  shouldShowIntro,
  type IntroData,
  fillTemplate,
  gradeFor,
  pluralUk,
  summarizeLosses,
} from '../../engine';
import {
  LAB_NUMS,
  allDone,
  elapsedMinutes,
  freezesCount,
  hintsUsed,
  labDef,
  scoreOf,
  totalScore,
  useQuest,
  type LabNum,
  type QuestState,
} from '../../store/questStore';
import ui from '../../styles/ui.module.css';
import styles from './Vault.module.css';

const content = quest.vault;
const scoring = quest.scoring;
const STEP_MS = 650;

function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function lossText(state: QuestState, lab: LabNum): string {
  const level = state.levels[lab];
  const parts = summarizeLosses(level.losses).map(
    (item) => `${scoring.reasons[item.reason]} ×${item.count} −${item.points}`,
  );
  if (level.bonus > 0) parts.push(`${scoring.reasons.bonus} +${level.bonus}`);
  return parts.length > 0 ? parts.join(', ') : scoring.noLosses;
}

export function Vault() {
  const state = useQuest();
  const synthesize = useQuest((s) => s.synthesize);
  const setReflection = useQuest((s) => s.setReflection);

  const ready = allDone(state);
  const markVideoSeen = useQuest((s) => s.markVideoSeen);
  const intro = content.intro as IntroData;
  const [videoOpen, setVideoOpen] = useState(() => ready && shouldShowIntro(intro, state.videosSeen, 'vault'));
  const [filled, setFilled] = useState(state.vaultOpen ? 5 : 0);
  const [report, setReport] = useState<'idle' | 'copied' | 'failed'>('idle');
  const timers = useRef<number[]>([]);

  useEffect(() => {
    if (!ready || state.vaultOpen || videoOpen) return undefined;
    if (prefersReducedMotion()) {
      setFilled(5);
      synthesize();
      return undefined;
    }
    LAB_NUMS.forEach((lab) => {
      timers.current.push(window.setTimeout(() => setFilled(lab), STEP_MS * lab));
    });
    timers.current.push(window.setTimeout(() => synthesize(), STEP_MS * 6));
    const pending = timers.current;
    return () => {
      pending.forEach((id) => window.clearTimeout(id));
      timers.current = [];
    };
  }, [ready, videoOpen]);

  const total = totalScore(state);
  const grade = gradeFor(total, scoring.scale);
  const band = bandFor(grade.grade, scoring.bands);
  const minutes = elapsedMinutes(state);
  const stats = {
    time: minutes,
    hints: hintsUsed(state),
    freezes: freezesCount(state),
    peak: Math.round(state.peakSpread),
  };

  const reportText = useMemo(
    () =>
      [
        content.reportTitle,
        `${quest.ui.teamPrefix}: ${state.team || '—'}`,
        `${content.codeLabel}: ${state.components.join('-')}`,
        ...LAB_NUMS.map((lab) => `${labDef(lab).title}: ${scoreOf(state, lab)}/20 (${lossText(state, lab)})`),
        `Разом: ${total}/100 → ${grade.grade} з 12`,
        `${content.stats.time}: ${stats.time}`,
        `${content.stats.hints}: ${stats.hints}`,
        `${content.stats.freezes}: ${stats.freezes}`,
        `${content.stats.peak}: ${stats.peak}%`,
        content.reflection,
        state.reflection || '—',
      ].join('\n'),
    [state, total, grade.grade, stats.time, stats.hints, stats.freezes, stats.peak],
  );

  const sendReport = async () => {
    if (content.formUrl) {
      const url = new URL(content.formUrl);
      const f = content.formFields;
      url.searchParams.set(f.team, state.team);
      url.searchParams.set(f.score, String(total));
      url.searchParams.set(f.grade, String(grade.grade));
      url.searchParams.set(f.time, String(stats.time));
      url.searchParams.set(f.hints, String(stats.hints));
      url.searchParams.set(f.freezes, String(stats.freezes));
      url.searchParams.set(f.peak, String(stats.peak));
      url.searchParams.set(f.reflection, state.reflection);
      window.open(url.toString(), '_blank', 'noopener');
      return;
    }
    try {
      await navigator.clipboard.writeText(reportText);
      setReport('copied');
    } catch {
      setReport('failed');
    }
  };

  if (!ready) {
    return (
      <div className={ui.page}>
        <AppHeader backTo="/plan" title={content.title} />
        <main id="main" tabIndex={-1} className={`${ui.main} ${ui.single}`}>
          <section className={`${ui.card} ${styles.locked}`}>
            <h1 className={ui.h1}>{content.lockedTitle}</h1>
            <p className={ui.lead}>{content.lockedText}</p>
            <Link to="/plan" className={`${ui.secondary} ${styles.lockedLink}`}>
              {quest.ui.backToPlan}
            </Link>
          </section>
        </main>
      </div>
    );
  }

  const percent = Math.round((filled / 5) * 100);
  const synthDone = state.vaultOpen && filled === 5;

  return (
    <div className={ui.page} style={{ '--lab': 'var(--lab1)', '--lab-tint': 'var(--lab1-tint)' } as CSSProperties}>
      <div className={ui.stripe} aria-hidden="true" />
      <AppHeader backTo="/plan" title={content.title} />

      <section className={styles.synth} data-print="hide" aria-labelledby="vault-heading">
        <div className={styles.synthLeft}>
          <p className={styles.synthLine} role="status">
            {synthDone ? content.synthDone : fillTemplate(content.synthLine, { percent })}
          </p>
          <div
            className={styles.vials}
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={percent}
            aria-label={fillTemplate(content.synthAria, { percent })}
          >
            {quest.labs.map((lab, index) => (
              <div key={lab.id} className={styles.vial}>
                <span className={index < filled ? `${styles.vialSvg} ${styles.vialFilled}` : styles.vialSvg}>
                  <Vial size="large" color={lab.color} fill={index < filled ? 1 : 0} onDark />
                </span>
                <span className={styles.vialValue}>{state.components[index]}</span>
                <span className={styles.vialNote}>{lab.componentNote}</span>
              </div>
            ))}
          </div>
        </div>
        <div className={styles.synthRight}>
          <h1 id="vault-heading" className={styles.heading}>
            {content.heading}
          </h1>
          <p className={styles.code}>
            <span className={styles.codeLabel}>{content.codeLabel}</span>
            <span className={styles.codeValue}>{state.components.join('-')}</span>
          </p>
          <p className={styles.lead}>{content.lead}</p>
        </div>
      </section>

      <main id="main" tabIndex={-1} className={`${ui.main} ${styles.main}`}>
        <section className={styles.report} data-print="area">
          <h1 className={styles.printTitle}>{content.reportTitle}</h1>
          <p className={styles.printMeta}>
            {quest.ui.teamPrefix}: {state.team || '—'} · {stats.time} {content.stats.time}
          </p>

          <h2 className={styles.h2}>{content.linkTitle}</h2>
          {content.link.map((paragraph) => (
            <p key={paragraph} className={styles.p}>
              {paragraph}
            </p>
          ))}

          <h2 className={styles.h2}>{content.resultsTitle}</h2>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th scope="col">{content.table.lab}</th>
                  <th scope="col">{content.table.losses}</th>
                  <th scope="col" className={styles.num}>
                    {content.table.score}
                  </th>
                </tr>
              </thead>
              <tbody>
                {LAB_NUMS.map((lab) => (
                  <tr key={lab}>
                    <td>
                      <span className={styles.labCell}>
                        <span className={styles.dot} style={{ background: labDef(lab).color }} aria-hidden="true" />
                        {labDef(lab).title}
                      </span>
                    </td>
                    <td className={styles.losses}>{lossText(state, lab)}</td>
                    <td className={styles.num}>
                      {scoreOf(state, lab)}/{scoring.perLevel}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <th scope="row" colSpan={2}>
                    {content.table.total}
                  </th>
                  <td className={`${styles.num} ${styles.totalCell}`}>
                    {total}/{scoring.total}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          <h2 className={styles.h2}>{content.scaleTitle}</h2>
          <div className={styles.conversion}>
            <span className={styles.pill}>
              {total} / {scoring.total}
            </span>
            <svg width="28" height="14" viewBox="0 0 28 14" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M1 7 H25 M19 1 L25 7 L19 13" />
            </svg>
            <span>
              {content.range}{' '}
              <b className={styles.mono}>
                {grade.min}–{grade.max}
              </b>
            </span>
            <svg width="28" height="14" viewBox="0 0 28 14" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M1 7 H25 M19 1 L25 7 L19 13" />
            </svg>
            <span className={styles.gradePill}>
              {grade.grade} {pluralUk(grade.grade, quest.ui.pointsForms)}
            </span>
          </div>

          <div
            className={styles.scale}
            role="img"
            aria-label={fillTemplate(content.scaleAria, { grade: grade.grade, min: grade.min, max: grade.max })}
          >
            {scoring.scale.map((row) => (
              <div key={row.grade} className={row.grade === grade.grade ? `${styles.step} ${styles.stepOn}` : styles.step}>
                <span className={styles.stepGrade}>{row.grade}</span>
                <span className={styles.stepRange}>
                  {row.min === 0 ? 1 : row.min}–{row.max}
                </span>
              </div>
            ))}
            {scoring.bands.map((item) => (
              <div
                key={item.name}
                className={styles.band}
                style={{ gridColumn: `span ${item.to - item.from + 1}`, background: item.color }}
              >
                {item.name}
              </div>
            ))}
          </div>

          <h2 className={styles.h2}>{content.statsTitle}</h2>
          <ul className={styles.stats}>
            <li>
              <b>{stats.time}</b> {content.stats.time}
            </li>
            <li>
              <b>{stats.hints}</b> {content.stats.hints}
            </li>
            <li>
              <b>{stats.freezes}</b> {content.stats.freezes}
            </li>
            <li>
              <b>{stats.peak}%</b> {content.stats.peak}
            </li>
          </ul>

          <div className={styles.printOnly}>
            <h2 className={styles.h2}>{content.reflection}</h2>
            <p data-print="framed">{state.reflection || ' '}</p>
          </div>
        </section>

        <aside className={ui.aside} data-print="hide">
          <div className={ui.card}>
            <div className={styles.gradeCard}>
              <span className={styles.gradeCircle}>
                <span className={styles.gradeValue}>{grade.grade}</span>
                <span className={styles.gradeUnit}>{content.gradeUnit}</span>
              </span>
              <span className={styles.gradeText}>
                <span className={styles.gradeTotal}>
                  {total} {pluralUk(total, quest.ui.pointsForms)} з {scoring.total}
                </span>
                {band ? (
                  <span className={styles.gradeBand}>
                    {band.name} {content.levelSuffix}
                  </span>
                ) : null}
                <span className={styles.gradeTime}>
                  {stats.time} {content.stats.time}
                </span>
              </span>
            </div>
          </div>

          <label className={`${ui.card} ${styles.reflection}`}>
            {content.reflection}
            <textarea
              className={ui.textarea}
              rows={3}
              placeholder={content.reflectionPlaceholder}
              value={state.reflection}
              onChange={(event) => setReflection(event.target.value)}
            />
          </label>

          <div className={styles.actions}>
            <button type="button" className={ui.primary} onClick={sendReport}>
              {content.report}
            </button>
            <Link to="/summary" className={`${ui.secondary} ${styles.summaryLink}`}>
              {content.summary}
            </Link>
          </div>
          <button type="button" className={ui.secondary} onClick={() => window.print()}>
            {content.print}
          </button>

          {report === 'copied' ? (
            <p className={styles.copied} role="status">
              {content.reportCopied}
            </p>
          ) : null}
          {report === 'failed' ? (
            <>
              <p className={styles.failed} role="status">
                {content.reportFailed}
              </p>
              <textarea className={ui.textarea} rows={10} readOnly value={reportText} aria-label={content.reportTitle} />
            </>
          ) : null}
        </aside>
      </main>
      <LevelIntroVideo
        open={videoOpen}
        title={quest.ui.video.vaultTitle}
        intro={intro}
        onClose={() => {
          setVideoOpen(false);
          markVideoSeen('vault');
        }}
      />
    </div>
  );
}
