import { useEffect, useState } from 'react';

import quest from '../../content/quest.uk.json';
import { HelixNote, Success } from '../../components/HelixNote/HelixNote';
import { Icon } from '../../components/Icon/Icon';
import { LabPage } from '../../components/LabPage/LabPage';
import { OrganelleCard, clock } from '../../components/OrganelleCard/OrganelleCard';
import {
  assembleKey,
  checkAnswer,
  fillTemplate,
  freezeSecondsLeft,
  isCryoComplete,
} from '../../engine';
import { useQuest } from '../../store/questStore';
import ui from '../../styles/ui.module.css';
import styles from './Cryo.module.css';

const content = quest.lab4;
const answers = quest.answers as Record<string, string>;
const order = content.cards.map((card) => card.id);

interface LastFreeze {
  cardId: string;
  points: number;
}

function useNow(active: boolean): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return undefined;
    setNow(Date.now());
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [active]);
  return now;
}

export function Cryo() {
  const lab4 = useQuest((s) => s.lab4);
  const done = useQuest((s) => s.levels[4].done);
  const seconds = useQuest((s) => s.settings.freezeSeconds);
  const setLab4 = useQuest((s) => s.setLab4);
  const fail = useQuest((s) => s.fail);
  const clearNotice = useQuest((s) => s.clearNotice);
  const addBonus = useQuest((s) => s.addBonus);
  const complete = useQuest((s) => s.complete);

  const [lastFreeze, setLastFreeze] = useState<LastFreeze | null>(null);

  const anyFrozen = Object.values(lab4.frozenUntil).some((until) => until > Date.now());
  const now = useNow(anyFrozen);
  const left = (id: string) => freezeSecondsLeft(lab4.frozenUntil[id] ?? 0, now);

  const key = assembleKey(order, lab4.solved);
  const keyText = key.join('');
  const allSolved = isCryoComplete(order, lab4.solved);

  useEffect(() => {
    if (allSolved && !done) complete(4, keyText);
  }, [allSolved, done, complete, keyText]);

  const choose = (cardId: string, value: string) => {
    if (!value) return;
    const card = content.cards.find((item) => item.id === cardId);
    if (!card) return;

    if (checkAnswer(answers, `cryo.${cardId}`, 'number', value)) {
      setLab4({ solved: { ...lab4.solved, [cardId]: Number(value) }, picks: { ...lab4.picks, [cardId]: value } });
      if (lastFreeze?.cardId === cardId) setLastFreeze(null);
      return;
    }

    const until = Date.now() + seconds * 1000;
    setLab4({
      picks: { ...lab4.picks, [cardId]: value },
      frozenUntil: { ...lab4.frozenUntil, [cardId]: until },
    });
    const points = fail(4, cardId, fillTemplate(content.freeze.banner, { letter: card.letter }), {
      reason: 'freeze',
      journal: quest.journal.freeze,
      journalVars: { letter: card.letter, seconds },
    });
    clearNotice(4);
    setLastFreeze({ cardId, points });
  };

  const answerBonus = (option: string) => {
    if (lab4.bonusAnswered) return;
    const correct = checkAnswer(answers, 'cryo.bonus', 'option', option);
    setLab4({ bonusChoice: option, bonusAnswered: true, bonusCorrect: correct });
    if (correct) addBonus(4, content.bonus.points);
  };

  const bannerCard = lastFreeze ? content.cards.find((card) => card.id === lastFreeze.cardId) : null;
  const bannerLeft = lastFreeze ? left(lastFreeze.cardId) : 0;

  const aside = (
    <>
      <HelixNote>{content.helix}</HelixNote>

      <div className={ui.card}>
        <h2 className={ui.cardTitle}>{content.functionsTitle}</h2>
        <ol className={styles.functions}>
          {content.functions.map((fn) => (
            <li key={fn.num}>{fn.text}</li>
          ))}
        </ol>
      </div>

      <div className={ui.card}>
        <h2 className={ui.cardTitle}>{content.key.title}</h2>
        <div className={styles.key} role="img" aria-label={`${content.key.aria}: ${key.map((d) => d || '_').join(' ')}`}>
          {key.map((digit, index) => (
            <span key={order[index]} className={digit ? styles.digit : styles.digitEmpty}>
              {digit}
            </span>
          ))}
        </div>
        <span className={ui.note}>{content.key.note}</span>
        {allSolved ? <Success>{content.key.done}</Success> : null}
      </div>

      <div className={ui.card}>
        <fieldset className={ui.fieldset}>
          <legend className={ui.legend}>{content.bonus.legend}</legend>
          {content.bonus.options.map((option) => (
            <label key={option.id} className={ui.radioRow}>
              <input
                type="radio"
                name="bonus"
                className={ui.radio}
                checked={lab4.bonusChoice === option.id}
                disabled={lab4.bonusAnswered}
                onChange={() => answerBonus(option.id)}
              />
              {option.text}
            </label>
          ))}
        </fieldset>
        {lab4.bonusAnswered ? (
          <p className={lab4.bonusCorrect ? styles.bonusOk : styles.bonusBad} role="status">
            {lab4.bonusCorrect ? content.bonus.correct : content.bonus.wrong}
          </p>
        ) : null}
      </div>
    </>
  );

  return (
    <LabPage lab={4} aside={aside}>
      <p className={ui.lead}>{fillTemplate(content.intro, { seconds })}</p>

      <div role="status" aria-live="polite">
        {bannerCard && bannerLeft > 0 ? (
          <div className={styles.banner}>
            <Icon name="snow" size={28} className={styles.bannerIcon} />
            <span className={styles.temp}>{content.freeze.temperature}</span>
            <span className={styles.chip}>−{lastFreeze?.points ?? 0}</span>
            <span className={styles.bannerText}>{fillTemplate(content.freeze.banner, { letter: bannerCard.letter })}</span>
            <span className={styles.timer} aria-hidden="true">
              {clock(bannerLeft)}
            </span>
          </div>
        ) : null}
      </div>

      <p className={styles.cells}>{content.cellsNote}</p>

      <div className={styles.grid}>
        {content.cards.map((card) => {
          const frozenFor = left(card.id);
          const solved = lab4.solved[card.id] != null;
          return (
            <OrganelleCard
              key={card.id}
              card={card}
              functions={content.functions}
              value={solved || frozenFor > 0 ? lab4.picks[card.id] ?? '' : ''}
              solved={solved}
              frozenSeconds={frozenFor}
              placeholder={content.selectPlaceholder}
              selectAriaLabel={fillTemplate(content.selectAria, { letter: card.letter })}
              frozenLabel={content.freeze.overlay}
              frozenAriaLabel={fillTemplate(content.freeze.aria, { letter: card.letter, seconds: frozenFor })}
              solvedLabel={content.solved}
              onChange={(value) => choose(card.id, value)}
            />
          );
        })}
      </div>
    </LabPage>
  );
}
