import { fr } from "@codegouvfr/react-dsfr";
import Button, { type ButtonProps } from "@codegouvfr/react-dsfr/Button";
import { cx } from "@codegouvfr/react-dsfr/tools/cx";
import { type ReactNode } from "react";

import styles from "./RecapCard.module.css";
import { Text } from "./Typography";

type RecapCardProps = {
  title: ReactNode;
} & (RecapCardProps.WithEditLink | RecapCardProps.WithSideButton) &
  (RecapCardProps.WithStats | RecapCardProps.WithTextContent);

export namespace RecapCardProps {
  export interface WithTextContent {
    content: ReactNode;
    stats?: never;
  }

  export interface WithStats {
    content?: never;
    stats: Array<{ text: ReactNode; value: ReactNode }>;
  }

  export interface WithEditLink {
    editLink?: string;
    sideButtonProps?: never;
  }

  export interface WithSideButton {
    editLink?: never;
    sideButtonProps?: ButtonProps;
  }
}

export const RecapCard = ({ content: textContent, title, editLink, sideButtonProps, stats }: RecapCardProps) => (
  <div className={styles["fr-recap-card"]}>
    <div className={styles["fr-recap-card__title"]}>
      <Text text={title} variant={["md", "bold"]} />
      {editLink && (
        <Button
          className={styles["fr-recap-card__edit-link"]}
          iconId="fr-icon-edit-line"
          priority="tertiary no outline"
          title="Modifier"
          linkProps={{
            href: editLink,
          }}
        />
      )}
      {sideButtonProps && (
        <Button {...sideButtonProps} className={cx(styles["fr-recap-card__edit-link"], sideButtonProps.className)} />
      )}
    </div>
    <hr />
    {textContent && <div className={cx(styles["fr-recap-card__content"], fr.cx("fr-text--sm"))}>{textContent}</div>}
    {stats?.map(({ text, value }, idx) => (
      <div
        key={`fr-recap-card__content--stat-${idx}`}
        className={cx(styles["fr-recap-card__content"], styles["fr-recap-card__content--stat"])}
      >
        <div className={fr.cx("fr-text--bold")}>{value}</div>
        <hr className={styles["fr-hr--vertical"]} />
        <div>{text}</div>
      </div>
    ))}
  </div>
);
