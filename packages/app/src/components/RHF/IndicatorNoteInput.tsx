import { fr } from "@codegouvfr/react-dsfr";
import { cx } from "@codegouvfr/react-dsfr/tools/cx";
import { type ReactNode, useEffect } from "react";
import { useFormContext } from "react-hook-form";

import styles from "./IndicatorNote.module.css";

type BaseIndicatorNoteProps = {
  className?: string;
  classes?: Partial<Record<"content" | "description" | "legend" | "max" | "note" | "root" | "text", string>>;
  name?: string;
  noBorder?: boolean;
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

type IndicatorNoteProps = LargeIndicatorNoteProps | SmallIndicatorNoteProps;

export const IndicatorNoteInput = ({
  name = "note",
  noBorder,
  max,
  text,
  className,
  size = "large",
  classes = {},
}: IndicatorNoteProps) => {
  const { register, getValues } = useFormContext();

  useEffect(() => {
    register("note");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className={cx(
        size === "small" ? styles["tile-small"] : styles.tile,
        noBorder && styles["tile-no-border"],
        classes.root,
        className,
      )}
    >
      <div className={styles["tile-note"]}>
        <span className={cx(size === "small" ? styles["note-small"] : styles["note"], classes.note)}>
          {getValues(name)}
        </span>
        {size === "large" && typeof max === "number" && (
          <span className={cx(styles.max, classes.max)}>&nbsp;/&nbsp;{max}</span>
        )}
      </div>
      <div className={cx(styles["tile-content"], classes.content)}>
        <p className={cx(fr.cx("fr-m-0"), styles.text, classes.text)}>{text}</p>
      </div>
    </div>
  );
};
