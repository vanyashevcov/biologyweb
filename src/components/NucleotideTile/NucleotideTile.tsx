import styles from './NucleotideTile.module.css';

type Size = 'normal' | 'small';

interface Props {
  letter: string;
  size?: Size;
}

const CLASS_BY_LETTER: Record<string, string> = {
  A: styles.a,
  T: styles.t,
  U: styles.t,
  G: styles.g,
  C: styles.c,
};

export function NucleotideTile({ letter, size = 'normal' }: Props) {
  const upper = (letter || '').toUpperCase();
  return (
    <span
      className={[
        styles.tile,
        CLASS_BY_LETTER[upper] ?? styles.unknown,
        size === 'small' ? styles.small : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {upper}
    </span>
  );
}
