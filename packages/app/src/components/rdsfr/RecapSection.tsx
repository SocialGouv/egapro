import { fr } from "@codegouvfr/react-dsfr";
import { type PropsWithChildren } from "react";

import styles from "./RecapSection.module.css";

export const RecapSection = ({ children, ...rest }: PropsWithChildren) => (
  <div {...rest} className={fr.cx("fr-mt-5w")}>
    {children}
  </div>
);

export const RecapSectionTitle = ({ children }: PropsWithChildren) => (
  <h3 className={fr.cx("fr-h5", "fr-mb-1w")}>{children}</h3>
);

export const RecapSectionItems = ({ children, ...rest }: PropsWithChildren) => (
  <ul className={styles.list} {...rest}>
    {children}
  </ul>
);

export const RecapSectionItem = ({ children }: PropsWithChildren) => <li>{children}</li>;

export const RecapSectionItemLegend = ({ children }: PropsWithChildren) => (
  <>
    <strong>{children}</strong>&nbsp;
  </>
);

export const RecapSectionItemContent = ({ children }: PropsWithChildren) => (
  <>
    <br />
    {children}
  </>
);
