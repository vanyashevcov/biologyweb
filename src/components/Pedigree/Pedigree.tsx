import styles from './Pedigree.module.css';

export interface PedigreeIndividual {
  id: string;
  shape: string;
  affected: boolean;
  x: number;
  y: number;
  title: string;
  highlight?: boolean;
  label?: string;
}

export interface PedigreeData {
  caption: string;
  width: number;
  height: number;
  generations: Array<{ label: string; y: number }>;
  links: string[];
  individuals: PedigreeIndividual[];
  legendTitle: string;
  legend: Array<{ shape: string; affected: boolean; text: string }>;
  note?: string;
}

interface SymbolProps {
  shape: string;
  affected: boolean;
  x: number;
  y: number;
  r?: number;
  highlight?: boolean;
}

function PersonSymbol({ shape, affected, x, y, r = 20, highlight = false }: SymbolProps) {
  const fill = affected ? 'var(--ink)' : highlight ? 'var(--lab-tint)' : 'var(--panel)';
  const stroke = Math.max(1.5, r / 10) * (highlight ? 1.5 : 1);
  const line = highlight ? 'var(--lab)' : 'var(--ink)';

  if (shape === 'circle') {
    return <circle cx={x} cy={y} r={r - stroke / 2} fill={fill} stroke={line} strokeWidth={stroke} />;
  }
  if (shape === 'diamond') {
    const d = r * 1.3;
    return (
      <path
        d={`M${x} ${y - d} L${x + d} ${y} L${x} ${y + d} L${x - d} ${y} Z`}
        fill="var(--panel)"
        stroke="var(--spread)"
        strokeWidth={stroke * 1.25}
      />
    );
  }
  return (
    <rect
      x={x - r + stroke / 2}
      y={y - r + stroke / 2}
      width={r * 2 - stroke}
      height={r * 2 - stroke}
      fill={fill}
      stroke={line}
      strokeWidth={stroke}
    />
  );
}

export function Pedigree({ data }: { data: PedigreeData }) {
  return (
    <svg
      className={styles.svg}
      viewBox={`0 0 ${data.width} ${data.height}`}
      role="img"
      aria-labelledby="pedigree-title pedigree-desc"
      preserveAspectRatio="xMidYMid meet"
    >
      <title id="pedigree-title">{data.caption}</title>
      <desc id="pedigree-desc">{data.individuals.map((person) => person.title).join('. ')}.</desc>

      <g fill="none" stroke="var(--ink)" strokeWidth="2">
        {data.links.map((d) => (
          <path key={d} d={d} />
        ))}
      </g>

      {data.individuals.map((person) => (
        <PersonSymbol
          key={person.id}
          shape={person.shape}
          affected={person.affected}
          x={person.x}
          y={person.y}
          highlight={person.highlight}
        />
      ))}

      {data.individuals
        .filter((person) => person.shape === 'diamond')
        .map((person) => (
          <text key={`q-${person.id}`} x={person.x} y={person.y + 7} textAnchor="middle" className={styles.question}>
            ?
          </text>
        ))}

      {data.individuals.map((person) => (
        <text
          key={`label-${person.id}`}
          x={person.x}
          y={person.y + (person.shape === 'diamond' ? 48 : 40)}
          textAnchor="middle"
          className={person.highlight ? `${styles.personLabel} ${styles.highlight}` : styles.personLabel}
        >
          {person.label ?? person.id}
        </text>
      ))}

      {data.generations.map((generation) => (
        <text key={generation.label} x={18} y={generation.y} className={styles.generation}>
          {generation.label}
        </text>
      ))}
    </svg>
  );
}

export function PedigreeLegend({ data }: { data: PedigreeData }) {
  return (
    <div className={styles.legend}>
      <b className={styles.legendTitle}>{data.legendTitle}</b>
      {data.legend.map((item) => (
        <span key={item.text} className={styles.legendRow}>
          <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true" className={styles.legendIcon}>
            <PersonSymbol shape={item.shape} affected={item.affected} x={12} y={12} r={10} />
          </svg>
          {item.text}
        </span>
      ))}
      {data.note ? <span className={styles.note}>{data.note}</span> : null}
    </div>
  );
}
