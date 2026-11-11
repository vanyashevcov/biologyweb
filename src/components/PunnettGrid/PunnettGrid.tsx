import type { CellStatus } from '../StrandRow/StrandRow';
import styles from './PunnettGrid.module.css';

interface Props {
  title: string;
  cornerLabel: string;
  colHeaders: string[];
  rowHeaders: string[];
  values: string[];
  statuses?: CellStatus[];
  cellAriaLabel: (index: number, row: string, col: string) => string;
  disabled?: boolean;
  onChange: (index: number, value: string) => void;
  onFocusInput?: (index: number, element: HTMLInputElement) => void;
}

export function PunnettGrid({
  title,
  cornerLabel,
  colHeaders,
  rowHeaders,
  values,
  statuses = [],
  cellAriaLabel,
  disabled = false,
  onChange,
  onFocusInput,
}: Props) {
  return (
    <table className={styles.table}>
      <caption className="visually-hidden">{title}</caption>
      <thead>
        <tr>
          <th scope="col" className={styles.corner}>
            {cornerLabel}
          </th>
          {colHeaders.map((header) => (
            <th key={header} scope="col" className={styles.header}>
              {header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rowHeaders.map((rowHeader, row) => (
          <tr key={rowHeader}>
            <th scope="row" className={styles.header}>
              {rowHeader}
            </th>
            {colHeaders.map((colHeader, col) => {
              const index = row * colHeaders.length + col;
              const status = statuses[index] ?? 'idle';
              return (
                <td key={colHeader} className={styles.cell}>
                  <input
                    type="text"
                    autoComplete="off"
                    disabled={disabled}
                    value={values[index] ?? ''}
                    aria-label={cellAriaLabel(index, rowHeader, colHeader)}
                    placeholder=" "
                    spellCheck={false}
                    aria-invalid={status === 'error'}
                    className={[
                      styles.input,
                      status === 'ok' ? styles.ok : '',
                      status === 'error' ? styles.error : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    onChange={(event) => onChange(index, event.target.value)}
                    onFocus={(event) => onFocusInput?.(index, event.target)}
                  />
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
