import { useCallback } from 'react';

import type { StrandCodon } from '../../engine';
import { normalizeNucleotide } from '../../engine';
import { NucleotideTile } from '../NucleotideTile/NucleotideTile';
import styles from './StrandRow.module.css';

export type CellStatus = 'idle' | 'ok' | 'error';

interface Props {
  label: string;
  direction: string;
  codons: StrandCodon[];
  values: Record<string, string>;
  statuses?: Record<string, CellStatus>;
  onChange: (position: number, value: string) => void;
  disabled?: boolean;
  idPrefix: string;
  blankAriaLabel: string;
  bonds?: boolean;
  stacked?: boolean;
}

export function StrandRow({
  label,
  direction,
  codons,
  values,
  statuses = {},
  onChange,
  disabled = false,
  idPrefix,
  blankAriaLabel,
  bonds = false,
  stacked = false,
}: Props) {
  const blanks = codons.flatMap((codon) =>
    codon.cells.filter((cell) => cell.blank).map((cell) => cell.position),
  );

  const focusBlank = useCallback(
    (position: number | undefined) => {
      if (position === undefined) return;
      const next = document.getElementById(`${idPrefix}-${position}`);
      if (next instanceof HTMLInputElement) {
        next.focus();
        next.select();
      }
    },
    [idPrefix],
  );

  const handleInput = (position: number, raw: string) => {
    const letter = normalizeNucleotide(raw);
    onChange(position, letter);
    if (letter) {
      const index = blanks.indexOf(position);
      focusBlank(blanks[index + 1]);
    }
  };

  const handleKeyDown = (position: number, event: React.KeyboardEvent<HTMLInputElement>) => {
    const index = blanks.indexOf(position);
    if (event.key === 'Backspace' && !values[position]) {
      event.preventDefault();
      focusBlank(blanks[index - 1]);
    }
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      focusBlank(blanks[index + 1]);
    }
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      focusBlank(blanks[index - 1]);
    }
  };

  return (
    <div className={stacked ? `${styles.row} ${styles.stacked}` : styles.row}>
      <span className={styles.legend}>
        <b className={styles.label}>{label}</b>
        <span className={styles.direction}>{direction}</span>
      </span>
      <div className={styles.codons}>
        {codons.map((codon) => (
          <div key={codon.index} className={styles.codonGroup}>
            <div className={styles.codon}>
              {codon.cells.map((cell) =>
                cell.blank ? (
                <input
                  key={cell.position}
                  id={`${idPrefix}-${cell.position}`}
                  type="text"
                  inputMode="text"
                  autoComplete="off"
                  maxLength={1}
                  disabled={disabled}
                  value={values[cell.position] ?? ''}
                  aria-label={`${blankAriaLabel} ${cell.position}`}
                  aria-invalid={statuses[cell.position] === 'error'}
                  className={[
                    styles.blank,
                    statuses[cell.position] === 'ok' ? styles.ok : '',
                    statuses[cell.position] === 'error' ? styles.error : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  onChange={(event) => handleInput(cell.position, event.target.value)}
                  onKeyDown={(event) => handleKeyDown(cell.position, event)}
                  onFocus={(event) => event.target.select()}
                />
                ) : (
                  <NucleotideTile key={cell.position} letter={cell.base ?? ''} />
                ),
              )}
            </div>
            {bonds ? (
              <div className={styles.bondRow} aria-hidden="true">
                {codon.cells.map((cell) => (
                  <span key={cell.position} className={styles.bondSlot}>
                    <span className={styles.bond} />
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
