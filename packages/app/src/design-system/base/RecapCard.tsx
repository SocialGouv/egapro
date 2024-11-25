import { fr } from "@codegouvfr/react-dsfr";
import Button, { type ButtonProps } from "@codegouvfr/react-dsfr/Button";
import { cx } from "@codegouvfr/react-dsfr/tools/cx";
import { type ReactNode } from "react";

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
  <div className="fr-recap-card">
    <div className={"fr-recap-card--title"}>
      <Text text={title} variant={["md", "bold"]} />
      {editLink && (
        <Button
          className={"fr-recap-card--edit-link"}
          iconId="fr-icon-edit-line"
          priority="tertiary no outline"
          title="Modifier"
          linkProps={{
            href: editLink,
          }}
        />
      )}
      {sideButtonProps && (
        <Button {...sideButtonProps} className={cx("fr-recap-card--edit-link", sideButtonProps.className)} />
      )}
    </div>
    <hr />
    {textContent && <div className={cx("fr-recap-card--content", fr.cx("fr-text--sm"))}>{textContent}</div>}
    {stats?.map(({ text, value }, idx) => (
      <div
        key={`fr-recap-card--content--stat-${idx}`}
        className={cx("fr-recap-card--content", "fr-recap-card--content--stat")}
      >
        <div className={fr.cx("fr-text--bold")}>{value}</div>
        <hr className={"fr-hr--vertical"} />
        <div>{text}</div>
      </div>
    ))}
  </div>
);
