import { fr } from "@codegouvfr/react-dsfr";
import { cx } from "@codegouvfr/react-dsfr/tools/cx";
import { type ReactNode } from "react";

import styles from "./IndicatorNote.module.css";

type BaseIndicatorNoteProps = {
  className?: string;
  classes?: Partial<Record<"description" | "legend" | "max" | "note" | "root" | "text", string>>;
  legend?: NonNullable<ReactNode>;
  noBorder?: boolean;
  note: number | string;
  /**
   * @default "large"
   */
  size?: "large" | "small";
  text: NonNullable<ReactNode>;
};

type LargeIndicatorNoteProps = BaseIndicatorNoteProps & {
  max?: number;
  size?: "large";
};

type SmallIndicatorNoteProps = BaseIndicatorNoteProps & {
  max?: never;
  size?: "small";
};

export type IndicatorNoteProps = LargeIndicatorNoteProps | SmallIndicatorNoteProps;

export const IndicatorNote = ({
  note,
  noBorder,
  max,
  text,
  className,
  size = "large",
  legend,
  classes = {},
}: IndicatorNoteProps) => (
  <div
    className={cx(
      size === "small" ? styles["tile-small"] : styles.tile,
      noBorder && styles["tile-no-border"],
      classes.root,
      className,
    )}
  >
    <div className={styles["tile-note"]}>
      <span className={cx(size === "small" ? styles["note-small"] : styles["note"], classes.note)}>{note}</span>
      {size === "large" && typeof max === "number" && (
        <span className={cx(styles.max, classes.max)}>&nbsp;/&nbsp;{max}</span>
      )}
    </div>
    <div className={styles["tile-content"]}>
      <p className={cx(fr.cx("fr-m-0"), styles.text, classes.text)}>{text}</p>
      {legend && (
        <p className={cx(fr.cx("fr-m-0", "fr-text--sm"), classes.legend)}>
          <i>{legend}</i>
        </p>
      )}
    </div>
  </div>
);
