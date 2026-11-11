import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';

import quest from '../../content/quest.uk.json';
import { HelixNote, Success } from '../../components/HelixNote/HelixNote';
import { LabPage } from '../../components/LabPage/LabPage';
import { Pedigree, PedigreeLegend, type PedigreeData } from '../../components/Pedigree/Pedigree';
import { PunnettGrid } from '../../components/PunnettGrid/PunnettGrid';
import { StepCard } from '../../components/StepCard/StepCard';
import type { CellStatus } from '../../components/StrandRow/StrandRow';
import { checkAnswer, fillTemplate, formatGenotype, normalizeGenotype, normalizeNumber, type StepDef } from '../../engine';
import { labDef, useQuest } from '../../store/questStore';
import ui from '../../styles/ui.module.css';
import styles from './Mendel.module.css';

const content = quest.lab5;
const answers = quest.answers as Record<string, string>;
const pedigree = content.pedigree as PedigreeData;
const steps = labDef(5).steps as StepDef[];
const points = Object.fromEntries(steps.map((step) => [step.id, step.points]));
const MAX_ATTEMPTS = steps.find((step) => step.id === 'probability')?.attemptPenalties?.length ?? 3;

type FieldKey = 'mother' | 'father' | `punnett-${number}`;

export function Mendel() {
  const lab5 = useQuest((s) => s.lab5);
  const done = useQuest((s) => s.levels[5].done);
  const component = useQuest((s) => s.components[4]);
  const setLab5 = useQuest((s) => s.setLab5);
  const fail = useQuest((s) => s.fail);
  const clearNotice = useQuest((s) => s.clearNotice);
  const complete = useQuest((s) => s.complete);

  const [punnettChecked, setPunnettChecked] = useState(false);
  const [probability, setProbability] = useState('');
  const [invalid, setInvalid] = useState(false);
  const lastField = useRef<{ key: FieldKey; el: HTMLInputElement } | null>(null);

  const { mother, father, genotypesDone, punnett, punnettDone, attempts, checked } = lab5;

  const writeField = (key: FieldKey, next: string) => {
    if (key === 'mother') setLab5({ mother: next });
    else if (key === 'father') setLab5({ father: next });
    else {
      const cells = [...punnett];
      cells[Number(key.split('-')[1])] = next;
      setLab5({ punnett: cells });
    }
  };

  const insert = (symbol: string) => {
    const field = lastField.current ?? { key: genotypesDone ? 'punnett-0' : 'mother', el: null };
    const el = field.el ?? (document.getElementById(`field-${field.key}`) as HTMLInputElement | null);
    if (!el) return;
    const start = el.selectionStart ?? el.value.length;
    const end = el.selectionEnd ?? start;
    const next = `${el.value.slice(0, start)}${symbol}${el.value.slice(end)}`;
    writeField(field.key, next);
    window.requestAnimationFrame(() => {
      el.focus();
      const caret = start + symbol.length;
      el.setSelectionRange(caret, caret);
    });
  };

  const remember = (key: FieldKey) => (el: HTMLInputElement) => {
    lastField.current = { key, el };
  };

  const insertBar = (fieldName: string) => (
    <div className={styles.inserts} role="group" aria-label="Символи алелів">
      {content.genotypes.inserts.map((symbol) => (
        <button
          key={symbol}
          type="button"
          className={styles.insert}
          aria-label={fillTemplate(content.genotypes.insertAria, { symbol, field: fieldName })}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => insert(symbol)}
        >
          {symbol}
        </button>
      ))}
    </div>
  );

  const checkGenotypes = () => {
    const ok =
      checkAnswer(answers, 'mendel.mother', 'genotype', mother) &&
      checkAnswer(answers, 'mendel.father', 'genotype', father);
    if (ok) {
      setLab5({ genotypesDone: true });
      clearNotice(5);
      lastField.current = null;
      return;
    }
    const sig = `${normalizeGenotype(mother)}|${normalizeGenotype(father)}`;
    if (checked.genotypes === sig) return;
    setLab5({ checked: { ...checked, genotypes: sig } });
    fail(5, 'genotypes', content.genotypes.wrong);
  };

  const punnettStatus = (index: number): CellStatus => {
    if ((!punnettChecked && !punnettDone) || !punnett[index]) return 'idle';
    return checkAnswer(answers, `punnett.${index}`, 'genotype', punnett[index]) ? 'ok' : 'error';
  };

  const checkPunnett = () => {
    setPunnettChecked(true);
    const ok = punnett.every((cell, index) => checkAnswer(answers, `punnett.${index}`, 'genotype', cell));
    if (ok) {
      setLab5({ punnettDone: true });
      clearNotice(5);
      return;
    }
    const sig = punnett.map((cell) => normalizeGenotype(cell)).join('|');
    if (checked.punnett === sig) return;
    setLab5({ checked: { ...checked, punnett: sig } });
    fail(5, 'punnett', content.punnett.wrong);
  };

  const submitProbability = () => {
    if (checkAnswer(answers, 'mendel.probability', 'number', probability)) {
      setInvalid(false);
      complete(5, normalizeNumber(probability));
      return;
    }
    setInvalid(true);
    const messages = content.probability.wrongMessages;
    setLab5({ attempts: attempts + 1 });
    fail(5, 'probability', messages[Math.min(attempts, messages.length - 1)], { reason: 'attempt' });
  };

  const attemptsLeft = Math.max(0, MAX_ATTEMPTS - attempts);

  const aside = (
    <>
      <HelixNote>{content.helix}</HelixNote>

      <StepCard num={1} title={content.genotypes.title} points={points.genotypes} titleId="step-genotypes">
        <div className={styles.pair}>
          <label className={styles.field}>
            {content.genotypes.motherLabel}
            <input
              id="field-mother"
              className={[styles.geno, genotypesDone ? styles.genoOk : ''].join(' ')}
              type="text"
              autoComplete="off"
              spellCheck={false}
              placeholder="?"
              aria-label={content.genotypes.motherAria}
              value={genotypesDone ? formatGenotype(mother) : mother}
              disabled={genotypesDone}
              onFocus={(event) => remember('mother')(event.currentTarget)}
              onChange={(event) => setLab5({ mother: event.target.value })}
            />
          </label>
          <label className={styles.field}>
            {content.genotypes.fatherLabel}
            <input
              id="field-father"
              className={[styles.geno, genotypesDone ? styles.genoOk : ''].join(' ')}
              type="text"
              autoComplete="off"
              spellCheck={false}
              placeholder="?"
              aria-label={content.genotypes.fatherAria}
              value={genotypesDone ? formatGenotype(father) : father}
              disabled={genotypesDone}
              onFocus={(event) => remember('father')(event.currentTarget)}
              onChange={(event) => setLab5({ father: event.target.value })}
            />
          </label>
        </div>
        {genotypesDone ? (
          <Success>{content.genotypes.done}</Success>
        ) : (
          <>
            {insertBar(lastField.current?.key === 'father' ? content.genotypes.fatherLabel : content.genotypes.motherLabel)}
            <span className={ui.note}>{content.genotypes.note}</span>
            <button
              type="button"
              className={ui.primary}
              onClick={checkGenotypes}
              disabled={!mother.trim() || !father.trim()}
            >
              {quest.ui.check}
            </button>
          </>
        )}
      </StepCard>

      <StepCard
        num={2}
        title={content.punnett.title}
        points={points.punnett}
        locked={!genotypesDone}
        lockedNote={content.punnett.lockedNote}
        titleId="step-punnett"
      >
        <PunnettGrid
          title={content.punnett.title}
          cornerLabel={content.punnett.corner}
          colHeaders={content.punnett.colHeaders}
          rowHeaders={content.punnett.rowHeaders}
          values={punnettDone ? punnett.map(formatGenotype) : punnett}
          statuses={punnett.map((_, index) => punnettStatus(index))}
          cellAriaLabel={(index, row, col) => fillTemplate(content.punnett.cellAria, { n: index + 1, row, col })}
          disabled={punnettDone}
          onChange={(index, value) => {
            writeField(`punnett-${index}`, value);
            setPunnettChecked(false);
          }}
          onFocusInput={(index, el) => remember(`punnett-${index}`)(el)}
        />
        {punnettDone ? (
          <Success>{content.punnett.done}</Success>
        ) : (
          <>
            {insertBar(content.punnett.title)}
            <button
              type="button"
              className={ui.primary}
              onClick={checkPunnett}
              disabled={punnett.some((cell) => !cell.trim())}
            >
              {quest.ui.check}
            </button>
          </>
        )}
      </StepCard>

      <div className={punnettDone ? ui.card : `${ui.card} ${ui.locked}`}>
        <label className={ui.label} htmlFor="probability">
          {content.probability.label}
        </label>
        <input
          id="probability"
          className={`${ui.input} ${ui.code}`}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          maxLength={5}
          placeholder={content.probability.placeholder}
          value={done ? component : probability}
          disabled={!punnettDone || done}
          aria-invalid={invalid}
          aria-describedby="probability-note"
          onChange={(event) => {
            setProbability(event.target.value);
            setInvalid(false);
          }}
          onKeyDown={(event) => event.key === 'Enter' && probability.trim() && submitProbability()}
        />
        <span className={ui.note} id="probability-note">
          {content.probability.note}
          {punnettDone && !done ? ` ${fillTemplate(content.probability.attempts, { left: attemptsLeft })}` : ''}
        </span>
        {done ? (
          <Link to="/vault" className={ui.primary}>
            {content.probability.submit}
          </Link>
        ) : (
          <button
            type="button"
            className={ui.primary}
            onClick={submitProbability}
            disabled={!punnettDone || !probability.trim()}
          >
            {content.probability.submit}
          </button>
        )}
      </div>
    </>
  );

  return (
    <LabPage lab={5} aside={aside} asideWidth={420} doneLink={{ to: '/vault', label: content.probability.submit }}>
      <p className={ui.lead}>{content.intro}</p>
      <div className={ui.card}>
        <div className={styles.pedigree}>
          <Pedigree data={pedigree} />
          <PedigreeLegend data={pedigree} />
        </div>
      </div>
    </LabPage>
  );
}
