import { fr } from "@codegouvfr/react-dsfr";
import { type PropsWithChildren } from "react";

import styles from "./StatCard.module.scss";

export type StatCardProps = PropsWithChildren<{
  title: string;
}>;

export const StatCard = ({ children, title }: StatCardProps) => {
  return (
    <div className={styles.card}>
      <div className={styles.head}>
        <h3 className={fr.cx("fr-text--xl", "fr-mb-0")}>{title}</h3>
      </div>
      <div className={styles.body}>{children}</div>
    </div>
  );
};
