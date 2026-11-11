import { useMemo, useState } from 'react';

import quest from '../../content/quest.uk.json';
import { AminoChain, type AminoSlot } from '../../components/AminoChain/AminoChain';
import { CodonTable } from '../../components/CodonTable/CodonTable';
import { HelixNote, Success } from '../../components/HelixNote/HelixNote';
import { LabPage } from '../../components/LabPage/LabPage';
import { Modal } from '../../components/Modal/Modal';
import { NucleotideTile } from '../../components/NucleotideTile/NucleotideTile';
import { StepCard } from '../../components/StepCard/StepCard';
import { StrandRow, type CellStatus } from '../../components/StrandRow/StrandRow';
import {
  assembleStrand,
  blankPositions,
  checkAnswer,
  fillTemplate,
  normalizeLatin,
  parseMaskedStrand,
  splitCodons,
  type StepDef,
} from '../../engine';
import { labDef, useQuest } from '../../store/questStore';
import ui from '../../styles/ui.module.css';
import styles from './Centrifuge.module.css';

const content = quest.lab1;
const answers = quest.answers as Record<string, string>;
const points = Object.fromEntries((labDef(1).steps as StepDef[]).map((step) => [step.id, step.points]));

const aminoOptions = quest.geneticCode.aminoAcids
  .filter((amino) => amino.code !== 'Stop')
  .slice()
  .sort((a, b) => a.name.localeCompare(b.name, 'uk'));

const CODON_COUNT = content.step2.rnaMasked.trim().split(/\s+/).length;
const AMINO_SLOTS = Array.from({ length: CODON_COUNT - 2 }, (_, index) => index + 2);

function scopeValues(source: Record<string, string>, prefix: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(source)) {
    if (key.startsWith(prefix)) out[key.slice(prefix.length)] = value;
  }
  return out;
}

const signature = (values: Record<string, string>, keys: string[]) => keys.map((key) => values[key] ?? '').join('');

const codonOf = (position: number) => Math.ceil(position / 3);

function Rotor() {
  return (
    <svg className={styles.rotor} width="120" height="120" viewBox="0 0 120 120" aria-hidden="true">
      <circle cx="60" cy="60" r="56" fill="#FFFFFF" stroke="var(--ink)" strokeWidth="2" />
      <circle cx="60" cy="60" r="40" fill="none" stroke="var(--lab)" strokeWidth="1.5" strokeDasharray="3 5" />
      <g className={styles.spin}>
        {[0, 60, 120, 180, 240, 300].map((angle, index) => (
          <g key={angle} transform={`rotate(${angle} 60 60)`}>
            <rect
              x="54"
              y="10"
              width="12"
              height="26"
              rx="6"
              fill={index % 2 === 0 ? 'var(--lab)' : '#FFFFFF'}
              stroke="var(--ink)"
              strokeWidth="1.5"
            />
          </g>
        ))}
      </g>
      <circle cx="60" cy="60" r="8" fill="var(--ink)" />
    </svg>
  );
}

export function Centrifuge() {
  const lab1 = useQuest((s) => s.lab1);
  const done = useQuest((s) => s.levels[1].done);
  const component = useQuest((s) => s.components[0]);
  const setLab1 = useQuest((s) => s.setLab1);
  const fail = useQuest((s) => s.fail);
  const clearNotice = useQuest((s) => s.clearNotice);
  const complete = useQuest((s) => s.complete);

  const [tableOpen, setTableOpen] = useState(false);
  const [value, setValue] = useState('');
  const [invalid, setInvalid] = useState(false);

  const coding = useMemo(() => parseMaskedStrand(content.step1.codingMasked), []);
  const template = useMemo(() => parseMaskedStrand(content.step1.templateMasked), []);
  const rnaCodons = useMemo(() => parseMaskedStrand(content.step2.rnaMasked), []);

  const { dna, rna, amino, dnaDone, rnaDone, aminoDone, checked } = lab1;

  const dnaKeys = [
    ...blankPositions(coding).map((p) => `dna.coding.${p}`),
    ...blankPositions(template).map((p) => `dna.template.${p}`),
  ];
  const dnaFilled = dnaKeys.every((key) => dna[key]);

  const dnaStatus = (key: string): CellStatus => {
    if (!dna[key] || (!dnaFilled && !dnaDone)) return 'idle';
    return checkAnswer(answers, key, 'nucleotide', dna[key]) ? 'ok' : 'error';
  };

  const setDna = (key: string, letter: string) => {
    const next = { ...dna, [key]: letter };
    const filled = dnaKeys.every((k) => next[k]);
    if (!filled) {
      setLab1({ dna: next });
      return;
    }
    const wrong = dnaKeys.find((k) => !checkAnswer(answers, k, 'nucleotide', next[k]));
    if (!wrong) {
      setLab1({ dna: next, dnaDone: true });
      clearNotice(1);
      return;
    }
    const sig = signature(next, dnaKeys);
    setLab1({ dna: next, checked: { ...checked, dna: sig } });
    if (checked.dna !== sig) {
      const position = Number(wrong.split('.').pop());
      fail(1, 'dna', fillTemplate(content.step1.wrong, { codon: codonOf(position) }));
    }
  };

  const rnaKeys = blankPositions(rnaCodons).map((p) => `rna.${p}`);
  const rnaFilled = rnaKeys.every((key) => rna[key]);
  const hasThymine = rnaKeys.some((key) => rna[key] === 'T');

  const rnaStatus = (key: string): CellStatus => {
    if (!rna[key]) return 'idle';
    if (rna[key] === 'T') return 'error';
    if (!rnaFilled && !rnaDone) return 'idle';
    return checkAnswer(answers, key, 'nucleotide', rna[key]) ? 'ok' : 'error';
  };

  const setRna = (key: string, letter: string) => {
    const next = { ...rna, [key]: letter };
    const filled = rnaKeys.every((k) => next[k]);
    if (!filled || rnaKeys.some((k) => next[k] === 'T')) {
      setLab1({ rna: next });
      return;
    }
    const wrong = rnaKeys.find((k) => !checkAnswer(answers, k, 'nucleotide', next[k]));
    if (!wrong) {
      setLab1({ rna: next, rnaDone: true });
      clearNotice(1);
      return;
    }
    const sig = signature(next, rnaKeys);
    setLab1({ rna: next, checked: { ...checked, rna: sig } });
    if (checked.rna !== sig) {
      const position = Number(wrong.split('.').pop());
      fail(1, 'rna', fillTemplate(content.step2.wrong, { codon: codonOf(position) }));
    }
  };

  const mrna = assembleStrand(
    rnaCodons,
    Object.fromEntries(
      rnaCodons.flatMap((c) => c.cells).map((cell) => [cell.position, rna[`rna.${cell.position}`] ?? '']),
    ),
  );
  const mrnaCodons = splitCodons(mrna);

  const slots: AminoSlot[] = AMINO_SLOTS.map((index) => {
    const id = `amino.${index}`;
    const current = amino[id] ?? '';
    const status: CellStatus = !current ? 'idle' : checkAnswer(answers, id, 'option', current) ? 'ok' : 'error';
    return { id, codon: mrnaCodons[index - 1] ?? '', value: current, status };
  });

  const setAmino = (id: string, code: string) => {
    const next = { ...amino, [id]: code };
    const allCorrect = AMINO_SLOTS.every((index) =>
      checkAnswer(answers, `amino.${index}`, 'option', next[`amino.${index}`] ?? ''),
    );
    const slotWrong = code !== '' && !checkAnswer(answers, id, 'option', code);
    const key = `${id}:${code}`;
    setLab1({
      amino: next,
      aminoDone: allCorrect,
      checked: slotWrong ? { ...checked, [id]: key } : checked,
    });
    if (allCorrect) clearNotice(1);
    if (slotWrong && checked[id] !== key) {
      const slot = slots.find((item) => item.id === id);
      fail(1, 'amino', fillTemplate(content.step3.wrong, { codon: slot?.codon ?? '' }));
    }
  };

  const submitComponent = () => {
    if (checkAnswer(answers, 'lab1.component', 'latin', value)) {
      setInvalid(false);
      complete(1, normalizeLatin(value));
    } else {
      setInvalid(true);
      fail(1, 'component', content.component.wrong);
    }
  };

  const aside = (
    <>
      <HelixNote>{content.helix}</HelixNote>

      <div className={ui.card}>
        <span className={ui.strong}>{content.legendTitle}</span>
        <div className={styles.legend}>
          {content.legend.map((item) => (
            <span key={item.letter} className={styles.legendRow}>
              <NucleotideTile letter={item.letter} size="small" />
              {item.name}
            </span>
          ))}
        </div>
        <span className={ui.note}>{content.legendNote}</span>
      </div>

      <button type="button" className={ui.secondary} onClick={() => setTableOpen(true)}>
        {content.table.button}
      </button>

      <div className={aminoDone ? ui.card : `${ui.card} ${ui.locked}`}>
        <label className={ui.label} htmlFor="component-1">
          {content.component.label} ({points.component} {quest.ui.pointsSuffix})
        </label>
        {aminoDone ? (
          <>
            <input
              id="component-1"
              className={`${ui.input} ${ui.code}`}
              type="text"
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              maxLength={12}
              placeholder={content.component.placeholder}
              value={done ? component : value}
              disabled={done}
              aria-invalid={invalid}
              onChange={(event) => {
                setValue(event.target.value);
                setInvalid(false);
              }}
              onKeyDown={(event) => event.key === 'Enter' && submitComponent()}
            />
            {!done ? (
              <button type="button" className={ui.primary} onClick={submitComponent} disabled={!value.trim()}>
                {quest.ui.putInRack}
              </button>
            ) : null}
          </>
        ) : (
          <p className={ui.note}>{content.component.lockedNote}</p>
        )}
      </div>
    </>
  );

  return (
    <LabPage lab={1} aside={aside} asideWidth={360}>
      <div className={styles.intro}>
        <Rotor />
        <p className={ui.lead}>{content.intro}</p>
      </div>

      <StepCard num={1} title={content.step1.title} points={points.dna} titleId="step-dna">
        <div className={styles.strands}>
          <StrandRow
            label={content.step1.codingLabel}
            direction={content.step1.codingDirection}
            codons={coding}
            values={scopeValues(dna, 'dna.coding.')}
            statuses={Object.fromEntries(
              blankPositions(coding).map((p) => [p, dnaStatus(`dna.coding.${p}`)]),
            )}
            onChange={(position, letter) => setDna(`dna.coding.${position}`, letter)}
            disabled={dnaDone}
            idPrefix="coding"
            blankAriaLabel={`${content.step1.codingLabel}, ${content.step1.blankAriaLabel}`}
            stacked
            bonds
          />
          <StrandRow
            label={content.step1.templateLabel}
            direction={content.step1.templateDirection}
            codons={template}
            values={scopeValues(dna, 'dna.template.')}
            statuses={Object.fromEntries(
              blankPositions(template).map((p) => [p, dnaStatus(`dna.template.${p}`)]),
            )}
            onChange={(position, letter) => setDna(`dna.template.${position}`, letter)}
            disabled={dnaDone}
            idPrefix="template"
            blankAriaLabel={`${content.step1.templateLabel}, ${content.step1.blankAriaLabel}`}
            stacked
          />
        </div>
        {dnaDone ? <Success>{content.step1.done}</Success> : null}
      </StepCard>

      <StepCard
        num={2}
        title={content.step2.title}
        points={points.rna}
        locked={!dnaDone}
        lockedNote={content.step2.lockedNote}
        titleId="step-rna"
      >
        <div className={styles.strands}>
          <StrandRow
            label={content.step2.rnaLabel}
            direction={content.step2.rnaDirection}
            codons={rnaCodons}
            values={scopeValues(rna, 'rna.')}
            statuses={Object.fromEntries(rnaKeys.map((key) => [key.slice(4), rnaStatus(key)]))}
            onChange={(position, letter) => setRna(`rna.${position}`, letter)}
            disabled={rnaDone}
            idPrefix="rna"
            stacked
            blankAriaLabel={`${content.step2.rnaLabel}, ${content.step1.blankAriaLabel}`}
          />
        </div>
        {hasThymine ? (
          <p className={styles.thymine} role="status">
            {content.step2.thymineHint}
          </p>
        ) : null}
        {rnaDone ? <Success>{content.step2.done}</Success> : null}
      </StepCard>

      <StepCard
        num={3}
        title={content.step3.title}
        points={points.amino}
        locked={!rnaDone}
        lockedNote={content.step3.lockedNote}
        titleId="step-amino"
      >
        <AminoChain
          startLabel={content.step3.startLabel}
          stopLabel={content.step3.stopLabel}
          slots={slots}
          options={aminoOptions}
          placeholder={content.step3.selectPlaceholder}
          slotAriaLabel={content.step3.slotAriaLabel}
          disabled={aminoDone}
          onChange={setAmino}
        />
        {aminoDone ? <Success>{content.step3.done}</Success> : null}
      </StepCard>

      <Modal
        open={tableOpen}
        title={content.table.title}
        closeLabel={quest.ui.close}
        onClose={() => setTableOpen(false)}
        wide
      >
        <CodonTable note={content.table.note} caption={content.table.title} />
      </Modal>
    </LabPage>
  );
}
