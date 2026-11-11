import type { CellStatus } from '../StrandRow/StrandRow';
import styles from './AminoChain.module.css';

export interface AminoSlot {
  id: string;
  codon: string;
  value: string;
  status: CellStatus;
}

export interface AminoOption {
  code: string;
  name: string;
  short: string;
}

interface Props {
  startLabel: string;
  stopLabel: string;
  slots: AminoSlot[];
  options: AminoOption[];
  placeholder: string;
  slotAriaLabel: string;
  disabled?: boolean;
  onChange: (id: string, value: string) => void;
}

function Link() {
  return (
    <svg className={styles.link} width="18" height="10" viewBox="0 0 18 10" aria-hidden="true">
      <path d="M0 5 H18" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

export function AminoChain({
  startLabel,
  stopLabel,
  slots,
  options,
  placeholder,
  slotAriaLabel,
  disabled = false,
  onChange,
}: Props) {
  return (
    <div className={styles.chain}>
      <span className={`${styles.pill} ${styles.fixed}`}>{startLabel}</span>
      {slots.map((slot) => (
        <span key={slot.id} className={styles.group}>
          <Link />
          <span
            className={[
              styles.pill,
              styles.slot,
              slot.status === 'ok' ? styles.ok : '',
              slot.status === 'error' ? styles.error : '',
            ]
              .filter(Boolean)
              .join(' ')}
          >
            <select
              className={styles.select}
              value={slot.value}
              disabled={disabled}
              aria-label={`${slotAriaLabel} ${slot.codon}`}
              aria-invalid={slot.status === 'error'}
              onChange={(event) => onChange(slot.id, event.target.value)}
            >
              <option value="">{placeholder}</option>
              {options.map((option) => (
                <option key={option.code} value={option.code}>
                  {option.name}
                </option>
              ))}
            </select>
            <span className={styles.codon}>{slot.codon}</span>
          </span>
        </span>
      ))}
      <Link />
      <span className={`${styles.pill} ${styles.stop}`}>{stopLabel}</span>
    </div>
  );
}
