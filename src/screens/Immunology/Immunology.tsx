import { useState } from 'react';

import quest from '../../content/quest.uk.json';
import { AntibodyChart } from '../../components/AntibodyChart/AntibodyChart';
import { ChoiceQuestion } from '../../components/ChoiceQuestion/ChoiceQuestion';
import { HelixNote, Success } from '../../components/HelixNote/HelixNote';
import { LabPage } from '../../components/LabPage/LabPage';
import { StepCard } from '../../components/StepCard/StepCard';
import { checkAnswer, fillTemplate, normalizeNumber, type StepDef } from '../../engine';
import { labDef, useQuest } from '../../store/questStore';
import ui from '../../styles/ui.module.css';
import styles from './Immunology.module.css';

const content = quest.lab3;
const answers = quest.answers as Record<string, string>;
const points = Object.fromEntries((labDef(3).steps as StepDef[]).map((step) => [step.id, step.points]));

export function Immunology() {
  const lab3 = useQuest((s) => s.lab3);
  const done = useQuest((s) => s.levels[3].done);
  const component = useQuest((s) => s.components[2]);
  const setLab3 = useQuest((s) => s.setLab3);
  const fail = useQuest((s) => s.fail);
  const clearNotice = useQuest((s) => s.clearNotice);
  const complete = useQuest((s) => s.complete);

  const [value, setValue] = useState('');
  const [invalid, setInvalid] = useState(false);

  const cases = content.match.cases;
  const matchDone = cases.every((item) => lab3.matched[item.id]);
  const componentOpen = matchDone && lab3.questionDone;

  const choose = (caseId: string, remedy: string) => {
    const match = { ...lab3.match, [caseId]: remedy };
    if (!remedy) {
      setLab3({ match });
      return;
    }
    const ok = checkAnswer(answers, `immuno.${caseId}`, 'option', remedy);
    const matched = { ...lab3.matched, [caseId]: ok };
    setLab3({ match, matched });
    if (ok) {
      if (cases.every((item) => matched[item.id])) clearNotice(3);
      return;
    }
    const name = cases.find((item) => item.id === caseId)?.name ?? '';
    fail(3, 'match', fillTemplate(content.match.wrong, { name }));
  };

  const answerQuestion = (option: string) => {
    const ok = checkAnswer(answers, 'immuno.vaccine', 'option', option);
    setLab3({ question: option, questionDone: ok });
    if (ok) clearNotice(3);
    else fail(3, 'question', content.question.wrong);
  };

  const submitComponent = () => {
    if (checkAnswer(answers, 'lab3.component', 'number', value)) {
      setInvalid(false);
      complete(3, normalizeNumber(value));
    } else {
      setInvalid(true);
      fail(3, 'component', content.component.wrong);
    }
  };

  const aside = (
    <>
      <HelixNote>{content.helix}</HelixNote>

      <div className={componentOpen ? ui.card : `${ui.card} ${ui.locked}`}>
        <label className={ui.label} htmlFor="component-3">
          {content.component.label} ({points.component} {quest.ui.pointsSuffix})
        </label>
        {componentOpen ? (
          <>
            <input
              id="component-3"
              className={`${ui.input} ${ui.code}`}
              type="text"
              inputMode="numeric"
              autoComplete="off"
              maxLength={4}
              placeholder={content.component.placeholder}
              value={done ? component : value}
              disabled={done}
              aria-invalid={invalid}
              onChange={(event) => {
                setValue(event.target.value);
                setInvalid(false);
              }}
              onKeyDown={(event) => event.key === 'Enter' && value.trim() && submitComponent()}
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
    <LabPage lab={3} aside={aside}>
      <p className={ui.lead}>{content.intro}</p>

      <StepCard num={1} title={content.chart.title} points={points.question} titleId="step-chart">
        <AntibodyChart data={content.chart} />
        <ChoiceQuestion
          name="vaccine-type"
          legend={content.question.legend}
          points={points.question}
          options={content.question.options}
          value={lab3.question}
          done={lab3.questionDone}
          doneText={content.question.done}
          onChoose={answerQuestion}
        />
      </StepCard>

      <StepCard num={2} title={content.match.title} points={points.match} titleId="step-match">
        {cases.map((item) => {
          const selectId = `remedy-${item.id}`;
          const current = lab3.match[item.id] ?? '';
          const ok = lab3.matched[item.id];
          const wrong = Boolean(current) && !ok;
          return (
            <div
              key={item.id}
              className={[styles.case, ok ? styles.caseOk : '', wrong ? styles.caseBad : ''].filter(Boolean).join(' ')}
            >
              <span className={styles.caseText}>
                <b className={styles.caseName}>{item.name}</b>
                <span className={styles.caseNote}>{item.note}</span>
              </span>
              <select
                id={selectId}
                className={ui.select}
                aria-label={fillTemplate(content.match.selectAria, { name: item.name })}
                aria-invalid={wrong}
                value={current}
                disabled={ok}
                onChange={(event) => choose(item.id, event.target.value)}
              >
                <option value="">{content.match.placeholder}</option>
                {content.match.remedies.map((remedy) => (
                  <option key={remedy.id} value={remedy.id}>
                    {remedy.name}
                  </option>
                ))}
              </select>
            </div>
          );
        })}
        {matchDone ? <Success>{content.match.done}</Success> : null}
      </StepCard>
    </LabPage>
  );
}
