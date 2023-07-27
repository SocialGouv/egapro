import { fr } from "@codegouvfr/react-dsfr";
import { cx } from "@codegouvfr/react-dsfr/tools/cx";
import { type ReactNode } from "react";

import styles from "./BigNote.module.scss";

export type BigNoteProps = {
  className?: string;
  classes?: Partial<Record<"description" | "legend" | "max" | "note" | "root" | "text", string>>;
  legend: NonNullable<ReactNode>;
  max?: number;
  noBorder?: boolean;
  note?: number;
  text?: NonNullable<ReactNode>;
};

export const BigNote = ({ note, noBorder, max, text, className, legend, classes = {} }: BigNoteProps) => (
  <div className={cx(styles.tile, noBorder && styles["tile-no-border"], classes.root, className)}>
    <div className={cx(fr.cx("fr-m-0", "fr-text--sm"), classes.legend)}>{legend}</div>
    <div className={styles["tile-note"]}>
      {note !== undefined ? (
        <>
          <span className={cx(styles["note"], classes.note)}>{note}</span>
          {max !== undefined && <span className={cx(styles.max, classes.max)}>&nbsp;/&nbsp;{max}</span>}
        </>
      ) : (
        <span className={cx(styles["note"], classes.note)}>NC</span>
      )}
    </div>
    {text && <div className={cx(styles.text, classes.text)}>{text}</div>}
  </div>
);
