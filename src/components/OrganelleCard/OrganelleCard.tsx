import { useState } from 'react';

import { Icon } from '../Icon/Icon';
import styles from './OrganelleCard.module.css';

export interface OrganelleCardData {
  id: string;
  letter: string;
  src: string;
  mag: string;
  alt: string;
  credit: string;
  creditUrl: string;
}

interface Props {
  card: OrganelleCardData;
  functions: Array<{ num: number; text: string }>;
  value: string;
  solved: boolean;
  frozenSeconds: number;
  placeholder: string;
  selectAriaLabel: string;
  frozenLabel: string;
  frozenAriaLabel: string;
  solvedLabel: string;
  onChange: (value: string) => void;
}

export const clock = (seconds: number) =>
  `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;

export function OrganelleCard({
  card,
  functions,
  value,
  solved,
  frozenSeconds,
  placeholder,
  selectAriaLabel,
  frozenLabel,
  frozenAriaLabel,
  solvedLabel,
  onChange,
}: Props) {
  const [imageFailed, setImageFailed] = useState(false);
  const frozen = frozenSeconds > 0;
  const selectId = `organelle-${card.id}`;

  return (
    <figure className={[styles.card, solved ? styles.solved : ''].filter(Boolean).join(' ')}>
      <div className={styles.frame}>
        <span className={styles.mag} aria-hidden="true">
          {card.mag}
        </span>
        {imageFailed ? (
          <span className={styles.fallback}>[Мікрофотографія {card.letter}]</span>
        ) : (
          <img
            className={styles.photo}
            src={card.src}
            alt={card.alt}
            loading="lazy"
            width={640}
            height={480}
            onError={() => setImageFailed(true)}
          />
        )}
      </div>

      <div className={styles.control}>
        <label className={styles.letter} htmlFor={selectId}>
          {card.letter}
        </label>
        <select
          id={selectId}
          className={styles.select}
          value={value}
          aria-label={selectAriaLabel}
          disabled={frozen || solved}
          onChange={(event) => onChange(event.target.value)}
        >
          <option value="">{placeholder}</option>
          {functions.map((fn) => (
            <option key={fn.num} value={String(fn.num)}>
              {fn.num}
            </option>
          ))}
        </select>
        {solved ? (
          <span className={styles.ok}>
            <Icon name="check" size={22} />
            <span className="visually-hidden">{solvedLabel}</span>
          </span>
        ) : null}
      </div>

      <figcaption className={styles.credit}>
        <a href={card.creditUrl} target="_blank" rel="noreferrer noopener">
          {card.credit}
        </a>
      </figcaption>

      {frozen ? (
        <span className={styles.ice} role="img" aria-label={frozenAriaLabel}>
          <Icon name="snow" size={40} className={styles.iceIcon} />
          <span aria-hidden="true">
            {frozenLabel} {clock(frozenSeconds)}
          </span>
        </span>
      ) : null}
    </figure>
  );
}
