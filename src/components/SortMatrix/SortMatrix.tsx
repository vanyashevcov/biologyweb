import { useDroppable } from '@dnd-kit/core';

import { cellKey, fillTemplate } from '../../engine';
import { VirusSpecimen, type Specimen } from '../VirusSpecimen/VirusSpecimen';
import styles from './SortMatrix.module.css';

interface Axis {
  id: string;
  label: string;
}

interface Props {
  rows: Axis[];
  cols: Axis[];
  specimens: Specimen[];
  placed: Record<string, string>;
  selectedName: string | null;
  dropHere: string;
  placeHere: string;
  cellAria: string;
  onPlace: (key: string) => void;
}

interface CellProps {
  id: string;
  label: string;
  items: Specimen[];
  selectedName: string | null;
  dropHere: string;
  placeHere: string;
  onPlace: () => void;
}

function Cell({ id, label, items, selectedName, dropHere, placeHere, onPlace }: CellProps) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div
      ref={setNodeRef}
      className={[styles.cell, items.length === 0 ? styles.empty : '', isOver ? styles.over : '']
        .filter(Boolean)
        .join(' ')}
      role="group"
      aria-label={label}
    >
      <span className={styles.cellCaption} aria-hidden="true">
        {label}
      </span>
      {items.map((specimen) => (
        <VirusSpecimen key={specimen.id} specimen={specimen} placed />
      ))}
      {selectedName ? (
        <button type="button" className={styles.place} onClick={onPlace} aria-label={`${placeHere}: ${label}`}>
          {placeHere}
        </button>
      ) : items.length === 0 ? (
        <span className={styles.hint}>{dropHere}</span>
      ) : null}
    </div>
  );
}

export function SortMatrix({
  rows,
  cols,
  specimens,
  placed,
  selectedName,
  dropHere,
  placeHere,
  cellAria,
  onPlace,
}: Props) {
  return (
    <div className={styles.matrix}>
      <span className={styles.corner} aria-hidden="true" />
      {cols.map((col) => (
        <span key={col.id} className={styles.colHead} aria-hidden="true">
          {col.label}
        </span>
      ))}
      {rows.map((row) => (
        <div key={row.id} className={styles.row}>
          <span className={styles.rowHead} aria-hidden="true">
            {row.label}
          </span>
          {cols.map((col) => {
            const key = cellKey({ acid: row.id, host: col.id });
            const items = specimens.filter((specimen) => placed[specimen.id] === key);
            return (
              <Cell
                key={key}
                id={key}
                label={fillTemplate(cellAria, { row: row.label, col: col.label })}
                items={items}
                selectedName={selectedName}
                dropHere={dropHere}
                placeHere={placeHere}
                onPlace={() => onPlace(key)}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}
