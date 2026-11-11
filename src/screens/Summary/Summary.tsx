import type { CSSProperties } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import quest from '../../content/quest.uk.json';
import ui from '../../styles/ui.module.css';
import styles from './Summary.module.css';

const content = quest.summary;

export function Summary() {
  const navigate = useNavigate();

  return (
    <div className={ui.page} style={{ '--lab': 'var(--lab1)' } as CSSProperties}>
      <header className={styles.bar} data-print="chrome">
        <button type="button" className={ui.secondary} onClick={() => navigate(-1)}>
          {content.back}
        </button>
        <Link className={ui.secondary} to="/plan">
          {quest.ui.backToPlan}
        </Link>
        <button type="button" className={`${ui.primary} ${ui.inline}`} onClick={() => window.print()}>
          {content.print}
        </button>
      </header>

      <main id="main" tabIndex={-1} className={styles.sheet} data-print="area">
        <h1 className={styles.h1}>
          {content.heading}. {quest.meta.title}
        </h1>
        <p className={styles.intro} data-print="hide">
          {content.intro}
        </p>

        <div className={styles.columns}>
          {content.sections.map((section) => (
            <section key={section.title} className={styles.section}>
              <h2 className={styles.h2}>{section.title}</h2>
              <ul className={styles.list}>
                {section.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </main>
    </div>
  );
}
