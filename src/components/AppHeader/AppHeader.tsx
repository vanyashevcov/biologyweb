import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

import quest from '../../content/quest.uk.json';
import { useQuest } from '../../store/questStore';
import { Icon } from '../Icon/Icon';
import { SpreadGauge } from '../SpreadGauge/SpreadGauge';
import styles from './AppHeader.module.css';

interface Props {
  subtitle?: string;
  backTo?: string;
  title?: string;
  children?: ReactNode;
}

export function AppHeader({ subtitle = quest.meta.subtitle, backTo, title, children }: Props) {
  const spread = useQuest((s) => s.spread);
  const enabled = useQuest((s) => s.settings.spreadEnabled);
  const cleared = useQuest((s) => s.vaultOpen);

  return (
    <header className={styles.header} data-print="hide">
      {backTo ? (
        <div className={styles.brand}>
          <Link to={backTo} className={styles.back} aria-label={quest.ui.backToPlan}>
            <Icon name="back" size={22} />
          </Link>
          <span className={styles.title}>{title}</span>
        </div>
      ) : (
        <Link to="/" className={styles.brand}>
          <span className={styles.mark} aria-hidden="true">
            <Icon name="helix" size={28} />
          </span>
          <span className={styles.text}>
            <span className={styles.title}>{quest.meta.title}</span>
            <span className={styles.subtitle}>{subtitle}</span>
          </span>
        </Link>
      )}
      <div className={styles.tools}>
        {children}
        <SpreadGauge value={spread} enabled={enabled} cleared={cleared} width={220} />
      </div>
    </header>
  );
}
