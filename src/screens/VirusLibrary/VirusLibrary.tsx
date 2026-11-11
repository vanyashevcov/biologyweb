import { DndContext, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { useState } from 'react';

import quest from '../../content/quest.uk.json';
import { ChoiceQuestion } from '../../components/ChoiceQuestion/ChoiceQuestion';
import { HelixNote, Success } from '../../components/HelixNote/HelixNote';
import { LabPage } from '../../components/LabPage/LabPage';
import { SortMatrix } from '../../components/SortMatrix/SortMatrix';
import { StepCard } from '../../components/StepCard/StepCard';
import { VirusSpecimen } from '../../components/VirusSpecimen/VirusSpecimen';
import {
  checkAnswer,
  checkPlacement,
  fillTemplate,
  isSortComplete,
  normalizeText,
  otherOption,
  parseCellKey,
  trayItems,
  type StepDef,
} from '../../engine';
import { labDef, useQuest } from '../../store/questStore';
import ui from '../../styles/ui.module.css';
import styles from './VirusLibrary.module.css';

const content = quest.lab2;
const sort = content.sort;
const answers = quest.answers as Record<string, string>;
const points = Object.fromEntries((labDef(2).steps as StepDef[]).map((step) => [step.id, step.points]));
const specimenIds = sort.specimens.map((specimen) => specimen.id);
const acidIds = sort.rows.map((row) => row.id);

export function VirusLibrary() {
  const lab2 = useQuest((s) => s.lab2);
  const done = useQuest((s) => s.levels[2].done);
  const setLab2 = useQuest((s) => s.setLab2);
  const fail = useQuest((s) => s.fail);
  const notify = useQuest((s) => s.notify);
  const clearNotice = useQuest((s) => s.clearNotice);
  const complete = useQuest((s) => s.complete);

  const component = useQuest((s) => s.components[1]);
  const [selected, setSelected] = useState<string | null>(null);
  const [value, setValue] = useState('');
  const [invalid, setInvalid] = useState(false);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const tray = trayItems(sort.specimens, lab2.placed);
  const selectedSpecimen = sort.specimens.find((specimen) => specimen.id === selected) ?? null;

  const place = (specimenId: string, key: string) => {
    const specimen = sort.specimens.find((item) => item.id === specimenId);
    if (!specimen || lab2.placed[specimenId]) return;
    setSelected(null);

    const cell = parseCellKey(key);
    const result = checkPlacement(answers, specimenId, cell);
    if (result.ok) {
      const placed = { ...lab2.placed, [specimenId]: key };
      const sortDone = isSortComplete(specimenIds, placed);
      setLab2({ placed, sortDone });
      if (sortDone) clearNotice(2);
      else notify(2, fillTemplate(sort.placed, { name: specimen.name }));
      return;
    }

    const rowLabel = (id: string) => sort.rows.find((row) => row.id === id)?.label ?? id;
    const message = !result.acidOk
      ? fillTemplate(sort.wrongAcid, {
          name: specimen.name,
          right: rowLabel(otherOption(acidIds, cell.acid)),
          chosen: rowLabel(cell.acid),
        })
      : fillTemplate(sort.wrongHost, {
          name: specimen.name,
          object: sort.cols.find((col) => col.id === cell.host)?.object ?? '',
        });
    fail(2, 'sort', message);
  };

  const onDragEnd = (event: DragEndEvent) => {
    if (event.over) place(String(event.active.id), String(event.over.id));
  };

  const questions = content.questions;
  const componentOpen = lab2.groupDone && lab2.relativeDone;

  const answerGroup = (id: string) => {
    const ok = checkAnswer(answers, 'virus.group', 'option', id);
    setLab2({ group: id, groupDone: ok });
    if (ok) clearNotice(2);
    else fail(2, 'group', questions.group.wrong);
  };

  const answerRelative = (id: string) => {
    const ok = checkAnswer(answers, 'virus.relative', 'option', id);
    setLab2({ relative: id, relativeDone: ok });
    if (ok) clearNotice(2);
    else fail(2, 'relative', questions.relative.wrong);
  };

  const submitComponent = () => {
    if (checkAnswer(answers, 'lab2.component', 'text', value)) {
      setInvalid(false);
      complete(2, normalizeText(value));
    } else {
      setInvalid(true);
      fail(2, 'component', content.component.wrong);
    }
  };

  const aside = (
    <>
      <HelixNote>{content.helix}</HelixNote>

      <StepCard num={2} title={content.passport.title} titleId="step-passport">
        <dl className={styles.passport}>
          {content.passport.rows.map((row) => (
            <div key={row.key} className={styles.passportRow}>
              <dt>{row.key}</dt>
              <dd>{row.value}</dd>
            </div>
          ))}
        </dl>
      </StepCard>

      <StepCard
        num={3}
        title={questions.title}
        points={points.group + points.relative}
        locked={!lab2.sortDone}
        lockedNote={questions.lockedNote}
        titleId="step-target"
      >
        <ChoiceQuestion
          name="virus-group"
          legend={questions.group.legend}
          points={points.group}
          options={questions.group.options}
          value={lab2.group}
          done={lab2.groupDone}
          doneText={questions.group.done}
          onChoose={answerGroup}
        />
        <ChoiceQuestion
          name="virus-relative"
          legend={questions.relative.legend}
          points={points.relative}
          options={questions.relative.options}
          value={lab2.relative}
          done={lab2.relativeDone}
          doneText={questions.relative.done}
          onChoose={answerRelative}
        />
      </StepCard>

      <div className={componentOpen ? ui.card : `${ui.card} ${ui.locked}`}>
        <label className={ui.label} htmlFor="component-2">
          {content.component.label}
        </label>
        {componentOpen ? (
          <>
            <input
              id="component-2"
              className={`${ui.input} ${ui.code}`}
              type="text"
              autoComplete="off"
              maxLength={12}
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
    <LabPage lab={2} aside={aside} asideWidth={400}>
      <p className={ui.lead}>{content.intro}</p>

      <DndContext sensors={sensors} onDragEnd={onDragEnd}>
        <StepCard num={1} title={sort.title} points={points.sort} titleId="step-sort">
          <p className={ui.note}>{sort.instructions}</p>
          <SortMatrix
            rows={sort.rows}
            cols={sort.cols}
            specimens={sort.specimens}
            placed={lab2.placed}
            selectedName={selectedSpecimen?.name ?? null}
            dropHere={sort.dropHere}
            placeHere={sort.placeHere}
            cellAria={sort.cellAria}
            onPlace={(key) => selected && place(selected, key)}
          />
          {lab2.sortDone ? <Success>{sort.done}</Success> : null}
        </StepCard>

        <section className={ui.card} aria-labelledby="tray-title">
          <h2 className={ui.strong} id="tray-title">
            {sort.tray}
          </h2>
          {selectedSpecimen ? (
            <p className={styles.selectedNote} role="status">
              {fillTemplate(sort.selected, { name: selectedSpecimen.name })}
            </p>
          ) : null}
          {tray.length === 0 ? (
            <p className={ui.note}>{sort.trayEmpty}</p>
          ) : (
            <div className={styles.tray}>
              {tray.map((specimen) => (
                <VirusSpecimen
                  key={specimen.id}
                  specimen={specimen}
                  selected={selected === specimen.id}
                  onSelect={() => setSelected(selected === specimen.id ? null : specimen.id)}
                />
              ))}
            </div>
          )}
        </section>
      </DndContext>
    </LabPage>
  );
}
