import quest from '../../content/quest.uk.json';
import styles from './CodonTable.module.css';

const bases = quest.geneticCode.bases;
const codons = quest.geneticCode.codons as Record<string, string>;
const byCode = Object.fromEntries(quest.geneticCode.aminoAcids.map((amino) => [amino.code, amino]));

export function CodonTable({ note, caption }: { note: string; caption: string }) {
  return (
    <div className={styles.root}>
      <div className={styles.scroll}>
        <table className={styles.table}>
          <caption className="visually-hidden">{caption}</caption>
          <thead>
            <tr>
              <th scope="col" className={styles.axis}>
                1-ша
              </th>
              {bases.map((second) => (
                <th key={second} scope="col" className={styles.axis}>
                  {second}
                </th>
              ))}
              <th scope="col" className={styles.axis}>
                3-тя
              </th>
            </tr>
          </thead>
          <tbody>
            {bases.map((first) =>
              bases.map((third, thirdIndex) => (
                <tr key={`${first}${third}`}>
                  {thirdIndex === 0 ? (
                    <th scope="rowgroup" rowSpan={4} className={styles.first}>
                      {first}
                    </th>
                  ) : null}
                  {bases.map((second) => {
                    const codon = `${first}${second}${third}`;
                    const amino = byCode[codons[codon]];
                    const stop = codons[codon] === 'Stop';
                    const start = codon === quest.geneticCode.startCodon;
                    return (
                      <td
                        key={codon}
                        className={[styles.cell, stop ? styles.stop : '', start ? styles.start : '']
                          .filter(Boolean)
                          .join(' ')}
                      >
                        <span className={styles.codon}>{codon}</span>
                        <span className={styles.amino}>
                          {amino?.short ?? ''}
                          {amino?.letter && !stop ? <span className={styles.letter}>{amino.letter}</span> : null}
                        </span>
                        <span className={styles.full}>{amino?.name ?? ''}</span>
                      </td>
                    );
                  })}
                  <th scope="row" className={styles.third}>
                    {third}
                  </th>
                </tr>
              )),
            )}
          </tbody>
        </table>
      </div>
      <p className={styles.note}>{note}</p>
    </div>
  );
}
