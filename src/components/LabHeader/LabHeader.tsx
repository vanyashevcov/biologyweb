import { Link } from 'react-router-dom';

import quest from '../../content/quest.uk.json';
import { fillTemplate, parseVideoSource } from '../../engine';
import { hintsLeft, labDef, scoreOf, useQuest, type LabNum } from '../../store/questStore';
import { Icon, type IconName } from '../Icon/Icon';
import { SpreadGauge } from '../SpreadGauge/SpreadGauge';
import { VialRack } from '../VialRack/VialRack';
import styles from './LabHeader.module.css';

interface Props {
  lab: LabNum;
  onVideo?: () => void;
}

export function LabHeader({ lab, onVideo }: Props) {
  const state = useQuest();
  const takeHint = useQuest((s) => s.takeHint);
  const def = labDef(lab);
  const left = hintsLeft(state, lab);
  const done = state.levels[lab].done;
  const score = scoreOf(state, lab);

  return (
    <>
      <div className={styles.stripe} aria-hidden="true" />
      <header className={styles.header} data-print="hide">
        <div className={styles.room}>
          <Link to="/plan" className={styles.back} aria-label={quest.ui.backToPlan}>
            <Icon name="back" size={22} />
          </Link>
          <span className={styles.plate} aria-hidden="true">
            <Icon name={def.icon as IconName} size={32} />
          </span>
          <span className={styles.titles}>
            <span className={styles.level}>{fillTemplate(quest.ui.levelPlate, { num: lab, bsl: def.bsl })}</span>
            <span className={styles.title}>{def.title}</span>
          </span>
        </div>

        <div className={styles.tools}>
          <span className={styles.score} role="group" aria-label={quest.ui.scoreAria}>
            <span className={styles.scoreValue}>
              {score}
              <span className={styles.scoreMax}> / {quest.scoring.perLevel}</span>
            </span>
            <span className={styles.scoreUnit}>{quest.ui.scoreUnit}</span>
          </span>
          <SpreadGauge value={state.spread} enabled={state.settings.spreadEnabled} cleared={state.vaultOpen} />
          <VialRack components={state.components} framed />
          {onVideo && parseVideoSource(def.intro?.video).kind !== 'none' ? (
            <button type="button" className={styles.hint} onClick={onVideo}>
              {quest.ui.levelVideo}
            </button>
          ) : null}
          <button
            type="button"
            className={styles.hint}
            disabled={left === 0 || done}
            onClick={() => takeHint(lab)}
          >
            {left > 0 && !done ? fillTemplate(quest.ui.hint, { left }) : quest.ui.hintNone}
          </button>
        </div>
      </header>
    </>
  );
}
