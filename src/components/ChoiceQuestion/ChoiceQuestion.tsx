import quest from '../../content/quest.uk.json';
import ui from '../../styles/ui.module.css';
import { Success } from '../HelixNote/HelixNote';
import styles from './ChoiceQuestion.module.css';

interface Props {
  name: string;
  legend: string;
  points?: number;
  options: Array<{ id: string; text: string }>;
  value: string;
  done: boolean;
  doneText?: string;
  onChoose: (id: string) => void;
}

export function ChoiceQuestion({ name, legend, points, options, value, done, doneText, onChoose }: Props) {
  return (
    <div className={styles.question}>
      <fieldset className={ui.fieldset}>
        <legend className={ui.legend}>
          {legend}
          {points !== undefined ? ` (${points} ${quest.ui.pointsSuffix})` : ''}
        </legend>
        {options.map((option) => {
          const checked = value === option.id;
          return (
            <label
              key={option.id}
              className={[
                styles.option,
                checked && done ? styles.ok : '',
                checked && !done ? styles.bad : '',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              <input
                type="radio"
                name={name}
                className={ui.radio}
                checked={checked}
                disabled={done}
                onChange={() => onChoose(option.id)}
              />
              <span>{option.text}</span>
            </label>
          );
        })}
      </fieldset>
      {done && doneText ? <Success>{doneText}</Success> : null}
    </div>
  );
}
