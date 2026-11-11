import { useEffect, useState, type CSSProperties } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import quest from '../../content/quest.uk.json';
import { AppHeader } from '../../components/AppHeader/AppHeader';
import { Icon, type IconName } from '../../components/Icon/Icon';
import { VialRack } from '../../components/VialRack/VialRack';
import { fillTemplate } from '../../engine';
import {
  LAB_NUMS,
  allDone,
  elapsedMinutes,
  isLessonBreak,
  labDef,
  labStatus,
  nextLab,
  scoreOf,
  totalScore,
  useQuest,
  type LabNum,
  type LabStatus,
} from '../../store/questStore';
import ui from '../../styles/ui.module.css';
import styles from './FloorPlan.module.css';

const content = quest.plan;

interface Room {
  key: string;
  x: number;
  y: number;
  lab: LabNum | null;
}

const ROOMS: Room[] = [
  { key: 'lab1', x: 20, y: 20, lab: 1 },
  { key: 'lab2', x: 340, y: 20, lab: 2 },
  { key: 'lab3', x: 660, y: 20, lab: 3 },
  { key: 'lab4', x: 660, y: 350, lab: 4 },
  { key: 'lab5', x: 340, y: 350, lab: 5 },
  { key: 'vault', x: 20, y: 350, lab: null },
];

const W = 320;
const H = 250;

function RoomIcon({ name, x, y, color }: { name: IconName; x: number; y: number; color: string }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect width="44" height="44" rx="10" fill={color} />
      <g transform="translate(8 8)" color="#FFFFFF">
        <Icon name={name} size={28} />
      </g>
    </g>
  );
}

interface RoomProps {
  room: Room;
  status: LabStatus;
  label: string;
  title: string;
  color: string;
  icon: IconName;
  href: string;
  statusOverride?: string;
}

function PlanRoom({ room, status, label, title, color, icon, href, statusOverride }: RoomProps) {
  const { x, y } = room;
  const statusText = statusOverride ?? content.status[status];
  const inner = (
    <>
      {status === 'done' ? <rect x={x} y={y} width={W} height={H} fill={color} fillOpacity="0.13" /> : null}
      {status === 'open' ? (
        <rect
          x={x + 4}
          y={y + 4}
          width={W - 8}
          height={H - 8}
          fill={color}
          fillOpacity="0.2"
          stroke={color}
          strokeWidth="4"
          className={styles.openRoom}
        />
      ) : null}
      {status === 'locked' ? <rect x={x} y={y} width={W} height={H} fill="url(#hatch)" /> : null}

      <rect x={x + 20} y={y + 204} width="280" height="26" rx="3" fill="#FFFFFF" fillOpacity="0.7" stroke="var(--ink)" strokeOpacity="0.18" />
      <circle cx={x + 46} cy={y + 217} r="7" fill="none" stroke="var(--ink)" strokeOpacity="0.3" />
      <circle cx={x + 68} cy={y + 217} r="7" fill="none" stroke="var(--ink)" strokeOpacity="0.3" />
      <rect x={x + 230} y={y + 208} width="10" height="18" rx="2" fill={color} fillOpacity="0.45" />
      <rect x={x + 246} y={y + 208} width="10" height="18" rx="2" fill={color} fillOpacity="0.45" />

      <RoomIcon name={status === 'locked' && room.lab === null ? 'lock' : icon} x={x + 24} y={y + 22} color={status === 'locked' ? 'var(--locked)' : color} />
      <text x={x + 24} y={y + 92} className={styles.level} fill={status === 'locked' ? 'var(--muted)' : color}>
        {label}
      </text>
      <text x={x + 24} y={y + 116} className={styles.roomTitle}>
        {title}
      </text>
      <text x={x + 24} y={y + 138} className={styles.roomStatus}>
        {statusText}
      </text>

      {status === 'done' ? (
        <>
          <circle cx={x + 286} cy={y + 34} r="18" fill={color} />
          <path d={`M${x + 277} ${y + 34} L${x + 283} ${y + 40} L${x + 295} ${y + 28}`} fill="none" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" />
        </>
      ) : null}
      {status === 'open' ? (
        <>
          <rect x={x + 202} y={y + 18} width="100" height="30" rx="15" fill={color} />
          <text x={x + 252} y={y + 38} textAnchor="middle" className={styles.badge}>
            {content.openBadge}
          </text>
        </>
      ) : null}
      {status === 'locked' ? (
        <g transform={`translate(${x + 272} ${y + 18})`} color="var(--muted)">
          <Icon name="lock" size={28} />
        </g>
      ) : null}
    </>
  );

  const aria = `${label}: ${title}, ${statusText}`;
  if (status === 'locked') {
    return (
      <g role="img" aria-label={aria}>
        {inner}
      </g>
    );
  }
  return (
    <a href={href} aria-label={aria} className={styles.roomLink}>
      {inner}
    </a>
  );
}

function useMinutes() {
  const state = useQuest();
  const [, force] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => force((n) => n + 1), 30_000);
    return () => window.clearInterval(id);
  }, []);
  return elapsedMinutes(state);
}

export function FloorPlan() {
  const state = useQuest();
  const resume = useQuest((s) => s.resumeLessonTwo);
  const navigate = useNavigate();
  const minutes = useMinutes();

  useEffect(() => {
    if (!state.startedAt) navigate('/', { replace: true });
  }, [state.startedAt, navigate]);

  const vaultReady = allDone(state);
  const upcoming = nextLab(state);
  const lessonBreak = isLessonBreak(state);
  const components = state.components;

  const roomProps = (room: Room): RoomProps => {
    if (room.lab === null) {
      return {
        room,
        status: state.vaultOpen ? 'done' : vaultReady ? 'open' : 'locked',
        label: content.vaultLevel,
        title: content.vaultTitle,
        color: 'var(--ink)',
        icon: 'helix',
        href: '#/vault',
        statusOverride: state.vaultOpen ? content.vaultDone : undefined,
      };
    }
    const def = labDef(room.lab);
    return {
      room,
      status: labStatus(state, room.lab),
      label: fillTemplate(content.level, { num: room.lab }),
      title: def.short,
      color: def.color,
      icon: def.icon as IconName,
      href: `#${def.route}`,
    };
  };

  const subtitle = state.team
    ? `${quest.ui.teamPrefix} «${state.team}», ${fillTemplate(quest.ui.minutesInLab, { min: minutes })}`
    : fillTemplate(quest.ui.minutesInLab, { min: minutes });

  const nextDef = upcoming ? labDef(upcoming) : null;

  return (
    <div className={ui.page}>
      <AppHeader subtitle={subtitle} />
      <main id="main" tabIndex={-1} className={`${ui.main} ${styles.main}`}>
        <section className={ui.section}>
          <h1 className={ui.h1}>{content.heading}</h1>

          <div className={styles.planCard}>
            <svg className={styles.svg} viewBox="-20 0 1020 620" role="group" aria-label={content.svgAria}>
              <defs>
                <pattern id="hatch" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                  <rect width="10" height="10" fill="#E6ECEB" />
                  <path d="M0 0 V10" stroke="var(--ink)" strokeOpacity="0.08" strokeWidth="3" />
                </pattern>
              </defs>
              <rect x="20" y="270" width="960" height="80" fill="#E2EAE8" />
              {ROOMS.map((room) => (
                <PlanRoom key={room.key} {...roomProps(room)} />
              ))}
              <g stroke="var(--ink)" strokeWidth="6" fill="none" strokeLinecap="square" aria-hidden="true">
                <path d="M20 20 H980 V600 H20 V380 M20 290 V20" />
                <path d="M340 20 V270 M660 20 V270 M340 350 V600 M660 350 V600" />
                <path d="M20 270 H130 M200 270 H450 M520 270 H770 M840 270 H980" />
                <path d="M20 350 H130 M200 350 H450 M520 350 H770 M840 350 H980" />
              </g>
              <g stroke="var(--ink)" strokeWidth="1.5" fill="none" strokeOpacity="0.5" aria-hidden="true">
                <path d="M130 270 A70 70 0 0 1 200 270" />
                <path d="M450 270 A70 70 0 0 1 520 270" />
                <path d="M770 270 A70 70 0 0 1 840 270" />
                <path d="M130 350 A70 70 0 0 0 200 350" />
                <path d="M450 350 A70 70 0 0 0 520 350" />
                <path d="M770 350 A70 70 0 0 0 840 350" />
              </g>
              <path
                d="M40 310 H940"
                stroke="var(--lab1)"
                strokeWidth="3"
                strokeDasharray="2 12"
                strokeLinecap="round"
                fill="none"
                aria-hidden="true"
              />
              <text x="-4" y="300" className={styles.corridor} transform="rotate(-90 -4 300)" textAnchor="middle">
                {content.corridor}
              </text>
            </svg>
          </div>

          <ol className={styles.list}>
            {LAB_NUMS.map((lab) => {
              const def = labDef(lab);
              const status = labStatus(state, lab);
              const body = (
                <>
                  <span className={styles.itemIcon} aria-hidden="true">
                    <Icon name={def.icon as IconName} size={24} />
                  </span>
                  <span className={styles.itemText}>
                    <span className={styles.itemLevel}>{fillTemplate(content.level, { num: lab })}</span>
                    <b>{def.short}</b>
                    <span className="visually-hidden">, {content.status[status]}</span>
                  </span>
                  {status === 'done' ? <Icon name="check" size={22} className={styles.itemMark} /> : null}
                  {status === 'locked' ? <Icon name="lock" size={22} className={styles.itemLock} /> : null}
                </>
              );
              return (
                <li
                  key={lab}
                  className={[styles.item, styles[status]].join(' ')}
                  style={{ '--lab': def.color } as CSSProperties}
                >
                  {status === 'locked' ? (
                    <span className={styles.itemBody}>{body}</span>
                  ) : (
                    <Link to={def.route} className={styles.itemBody}>
                      {body}
                    </Link>
                  )}
                </li>
              );
            })}
            <li className={[styles.item, vaultReady ? styles.open : styles.locked].join(' ')} style={{ '--lab': 'var(--ink)' } as CSSProperties}>
              {vaultReady ? (
                <Link to="/vault" className={styles.itemBody}>
                  <span className={styles.itemIcon} aria-hidden="true">
                    <Icon name="helix" size={24} />
                  </span>
                  <span className={styles.itemText}>
                    <span className={styles.itemLevel}>{content.vaultLevel}</span>
                    <b>{content.vaultTitle}</b>
                  </span>
                </Link>
              ) : (
                <span className={styles.itemBody}>
                  <span className={styles.itemIcon} aria-hidden="true">
                    <Icon name="lock" size={24} />
                  </span>
                  <span className={styles.itemText}>
                    <span className={styles.itemLevel}>{content.vaultLevel}</span>
                    <b>{content.vaultTitle}</b>
                    <span className="visually-hidden">, {content.status.locked}</span>
                  </span>
                </span>
              )}
            </li>
          </ol>
        </section>

        <aside className={`${ui.aside} ${styles.aside}`}>
          {lessonBreak ? (
            <div className={`${ui.card} ${styles.break}`} role="status">
              <h2 className={ui.cardTitle}>{content.lessonBreak.title}</h2>
              <p className={styles.nextText}>{content.lessonBreak.text}</p>
              <button type="button" className={ui.primary} onClick={resume} style={{ '--lab': 'var(--lab4)' } as CSSProperties}>
                {content.lessonBreak.resume}
              </button>
            </div>
          ) : null}

          <div className={ui.card}>
            <h2 className={ui.strong}>{content.rackTitle}</h2>
            <VialRack components={components} gap={14} />
            {components.some(Boolean) ? (
              <ul className={styles.componentList}>
                {components.map((value, index) =>
                  value ? (
                    <li key={quest.labs[index].id}>
                      {fillTemplate(content.componentLine, { num: index + 1 })} <b>{value}</b>
                    </li>
                  ) : null,
                )}
              </ul>
            ) : (
              <p className={ui.note}>{content.noComponents}</p>
            )}
          </div>

          <div className={ui.card}>
            <div className={styles.scoreHead}>
              <h2 className={ui.strong}>{content.scoresTitle}</h2>
              <span className={styles.total}>
                {totalScore(state)}
                <span className={styles.totalMax}> / {quest.scoring.total}</span>
              </span>
            </div>
            {LAB_NUMS.map((lab) => {
              const def = labDef(lab);
              const touched = state.levels[lab].done || state.levels[lab].losses.length > 0;
              return (
                <div key={lab} className={styles.scoreRow}>
                  <span className={styles.dot} style={{ background: def.color }} aria-hidden="true" />
                  <span>{def.title}</span>
                  <span className={styles.scoreValue}>
                    {touched ? `${scoreOf(state, lab)}/${quest.scoring.perLevel}` : '—'}
                  </span>
                </div>
              );
            })}
          </div>

          {!lessonBreak && (nextDef || vaultReady) ? (
            <div
              className={ui.card}
              style={nextDef ? ({ '--lab': nextDef.color } as CSSProperties) : ({ '--lab': 'var(--ink)' } as CSSProperties)}
            >
              <span className={styles.nextLabel}>{content.nextTitle}</span>
              <h2 className={styles.nextTitle}>{nextDef ? nextDef.title : content.vaultTitle}</h2>
              <p className={styles.nextText}>{nextDef ? nextDef.next : content.vaultNext}</p>
              <Link to={nextDef ? nextDef.route : '/vault'} className={ui.primary}>
                {nextDef ? fillTemplate(content.enterLab, { num: upcoming ?? 1 }) : content.vaultEnter}
              </Link>
            </div>
          ) : null}
        </aside>
      </main>
    </div>
  );
}
