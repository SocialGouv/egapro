import { fr } from "@codegouvfr/react-dsfr";
import { type PropsWithChildren } from "react";

import { ChartDescription } from "./ChartDescription";
import styles from "./StatCard.module.scss";

export type StatCardProps = PropsWithChildren<{
  chartDescription?: string;
  title: string;
}>;

export const StatCard = ({ children, title, chartDescription }: StatCardProps) => {
  return (
    <div className={styles.card}>
      <div className={styles.head}>
        <h3 className={fr.cx("fr-text--xl", "fr-mb-0")}>{title}</h3>
      </div>
      <div className={styles.body}>
        {children}
        {chartDescription && <ChartDescription chartTitle={title} description={chartDescription} />}
      </div>
    </div>
  );
};
