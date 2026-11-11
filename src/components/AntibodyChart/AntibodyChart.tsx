import { smoothPath, type CurvePoint } from '../../engine';
import styles from './AntibodyChart.module.css';

export interface ChartData {
  aria: string;
  xLabel: string;
  yLabel: string;
  days: number;
  tick: number;
  events: Array<{ day: number; label: string }>;
  primaryLabel: string;
  secondaryLabel: string;
  primary: number[][];
  secondary: number[][];
}

const W = 800;
const H = 340;
const X0 = 60;
const X1 = 780;
const Y0 = 300;
const Y1 = 40;

export function AntibodyChart({ data }: { data: ChartData }) {
  const toX = (day: number) => X0 + (day / data.days) * (X1 - X0);
  const toY = (level: number) => Y0 - (level / 100) * (Y0 - Y1);
  const primary = data.primary as CurvePoint[];
  const secondary = data.secondary as CurvePoint[];

  const ticks: number[] = [];
  for (let day = 0; day <= data.days; day += data.tick) ticks.push(day);
  const days: number[] = [];
  for (let day = 0; day <= data.days; day += 1) days.push(day);

  const primaryPeak = primary.reduce((best, p) => (p[1] > best[1] ? p : best), primary[0]);
  const secondaryPeak = secondary.reduce((best, p) => (p[1] > best[1] ? p : best), secondary[0]);

  return (
    <svg className={styles.svg} viewBox={`0 0 ${W} ${H + 8}`} role="img" aria-label={data.aria}>
      <g className={styles.grid}>
        {ticks.slice(1).map((day) => (
          <path key={day} d={`M${toX(day)} ${Y1} V${Y0}`} />
        ))}
      </g>

      <g className={styles.dayTicks}>
        {days.map((day) => (
          <path key={day} d={`M${toX(day)} ${Y0} V${Y0 + (day % data.tick === 0 ? 8 : 4)}`} />
        ))}
      </g>

      <path d={`M${X0} ${Y0} H${X1 + 10} M${X0} ${Y0} V${Y1 - 10}`} className={styles.axis} />

      <path d={smoothPath(primary, toX, toY)} className={styles.primary} />
      <path d={smoothPath(secondary, toX, toY)} className={styles.secondary} />

      <g className={styles.tickLabels}>
        {ticks.map((day) => (
          <text key={day} x={toX(day)} y={Y0 + 24} textAnchor="middle">
            {day}
          </text>
        ))}
      </g>
      <text x={(X0 + X1) / 2} y={H + 4} textAnchor="middle" className={styles.axisLabel}>
        {data.xLabel}
      </text>
      <text
        x={22}
        y={(Y0 + Y1) / 2}
        textAnchor="middle"
        className={styles.axisLabel}
        transform={`rotate(-90 22 ${(Y0 + Y1) / 2})`}
      >
        {data.yLabel}
      </text>

      {data.events.map((event) => {
        const x = toX(event.day);
        return (
          <g key={event.day} className={styles.event}>
            <path d={`M${x} 6 V22`} />
            <path d={`M${x - 6} 14 L${x} 24 L${x + 6} 14`} fill="none" />
            <text x={x + 10} y={16}>
              {event.label}
            </text>
          </g>
        );
      })}

      <text x={toX(primaryPeak[0]) + 8} y={toY(primaryPeak[1]) - 10} className={styles.primaryLabel}>
        {data.primaryLabel}
      </text>
      <text x={toX(secondaryPeak[0]) + 14} y={toY(secondaryPeak[1]) - 6} className={styles.secondaryLabel}>
        {data.secondaryLabel}
      </text>
    </svg>
  );
}
